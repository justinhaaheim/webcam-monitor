import Box from '@mui/joy/Box';
import {Bodies, Body, Engine, Events, Render, Runner, World} from 'matter-js';
import React, {useEffect, useRef} from 'react';

import pandaImage from './assets/pandaWithCape.png';

export interface PhysicsPandaConfig {
  bounceDamping: number;
  durationOnScreen: {max: number; min: number};
  entranceAngle: {max: number; min: number};
  entranceSpeed: {max: number; min: number};
  gravity: number;
}

interface PhysicsPandaProps {
  config: PhysicsPandaConfig;
  id: number;
  onAnimationComplete: (id: number) => void;
}

const PANDA_HEIGHT = 70; // pixels
const PANDA_WIDTH = (PANDA_HEIGHT / 512) * 458; // Maintain aspect ratio

// Helper function to get a random number in a range
const getRandomNumber = (min: number, max: number) =>
  Math.random() * (max - min) + min;

// Helper function to convert degrees to radians
const degreesToRadians = (degrees: number) => degrees * (Math.PI / 180);

const PhysicsPanda: React.FC<PhysicsPandaProps> = ({
  onAnimationComplete,
  config,
  id,
}) => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Engine>();
  const runnerRef = useRef<Runner>();
  const renderRef = useRef<Render>();

  const animationPhase = useRef<'bouncing' | 'exiting'>('bouncing');
  const isCompleted = useRef(false);

  useEffect(() => {
    if (!sceneRef.current) {
      return;
    }

    // --- Matter.js setup ---
    const engine = Engine.create();
    engine.world.gravity.y = config.gravity;
    engineRef.current = engine;

    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        // Show textures
        background: 'transparent',

        height: window.innerHeight,

        width: window.innerWidth,
        wireframes: false,
      },
    });
    renderRef.current = render;

    const runner = Runner.create();
    runnerRef.current = runner;

    // --- Create Panda Body ---
    const {entranceSpeed, entranceAngle, bounceDamping} = config;
    const speed = getRandomNumber(entranceSpeed.min, entranceSpeed.max);
    const angleDeg = getRandomNumber(entranceAngle.min, entranceAngle.max);
    const angleRad = degreesToRadians(angleDeg);

    const initialVelocity = {
      x: Math.cos(angleRad) * speed,
      y: -Math.sin(angleRad) * speed, // Negative for upward initial velocity
    };

    let initialPosition: {x: number; y: number};
    if (Math.random() > 0.5) {
      // From left
      initialPosition = {
        x: -PANDA_WIDTH / 2,
        y: getRandomNumber(window.innerHeight * 0.2, window.innerHeight * 0.8),
      };
    } else {
      // From right
      initialPosition = {
        x: window.innerWidth + PANDA_WIDTH / 2,
        y: getRandomNumber(window.innerHeight * 0.2, window.innerHeight * 0.8),
      };
      // Ensure velocity is pointing inwards
      initialVelocity.x = -Math.abs(initialVelocity.x);
    }

    const pandaBody = Bodies.rectangle(
      initialPosition.x,
      initialPosition.y,
      PANDA_WIDTH,
      PANDA_HEIGHT,
      {
        // Bounciness
        angle: Math.atan2(initialVelocity.y, initialVelocity.x),
        render: {
          sprite: {
            texture: pandaImage,
            xScale: PANDA_WIDTH / 458,
            yScale: PANDA_HEIGHT / 512,
          },
        },
        restitution: bounceDamping,
      },
    );

    Body.setVelocity(pandaBody, initialVelocity);
    Body.setAngularVelocity(pandaBody, getRandomNumber(-0.05, 0.05));

    // --- Create Walls ---
    const wallOptions = {
      isStatic: true,
      render: {visible: false}, // Walls are invisible
    };
    const wallThickness = 100;
    const walls = [
      // Floor
      Bodies.rectangle(
        window.innerWidth / 2,
        window.innerHeight + wallThickness / 2,
        window.innerWidth,
        wallThickness,
        wallOptions,
      ),
      // Left wall
      Bodies.rectangle(
        -wallThickness / 2,
        window.innerHeight / 2,
        wallThickness,
        window.innerHeight,
        wallOptions,
      ),
      // Right wall
      Bodies.rectangle(
        window.innerWidth + wallThickness / 2,
        window.innerHeight / 2,
        wallThickness,
        window.innerHeight,
        wallOptions,
      ),
    ];

    World.add(engine.world, [pandaBody, ...walls]);

    // --- Animation Loop & Exit Condition ---
    const exitTimeoutId = window.setTimeout(
      () => {
        animationPhase.current = 'exiting';
      },
      getRandomNumber(config.durationOnScreen.min, config.durationOnScreen.max),
    );

    Events.on(engine, 'beforeUpdate', () => {
      if (animationPhase.current === 'exiting') {
        // Apply an upward force to suck the panda up
        Body.applyForce(pandaBody, pandaBody.position, {
          x: 0,
          y: -engine.world.gravity.y * pandaBody.mass * 1.5,
        });
      }
    });

    Events.on(engine, 'afterUpdate', () => {
      if (
        !isCompleted.current &&
        animationPhase.current === 'exiting' &&
        pandaBody.position.y < -PANDA_HEIGHT
      ) {
        isCompleted.current = true;
        onAnimationComplete(id);
      }
    });

    // --- Start simulation ---
    Render.run(render);
    Runner.run(runner, engine);

    // --- Cleanup ---
    return () => {
      clearTimeout(exitTimeoutId);
      if (runnerRef.current) Runner.stop(runnerRef.current);
      if (renderRef.current) Render.stop(renderRef.current);
      if (engineRef.current) World.clear(engineRef.current.world, false);
      if (engineRef.current) Engine.clear(engineRef.current);
      if (renderRef.current) {
        renderRef.current.canvas.remove();
        // @ts-expect-error -- private properties
        renderRef.current.canvas = null;
        // @ts-expect-error -- private properties
        renderRef.current.context = null;
        renderRef.current.textures = {};
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount

  return (
    <Box
      ref={sceneRef}
      sx={{
        height: '100%',
        left: 0,
        pointerEvents: 'none',
        position: 'fixed',
        top: 0,
        width: '100%',
        zIndex: 2000,
      }}
    />
  );
};

export default PhysicsPanda;
