import {Bodies, Body, Engine, Events, Render, Runner, World} from 'matter-js';

import pandaImage from '../assets/pandaWithCape.png';

// Public types -------------------------------------------------------------
export interface PhysicsContainerOptions {
  gravity: number;
  /**
   * Element into which the Matter.js canvas should be mounted.
   * Defaults to `document.body`.
   */
  parent?: HTMLElement;
}

export interface PandaLaunchConfig {
  bounceDamping: number;
  durationOnScreen: {max: number; min: number};
  entranceAngle: {max: number; min: number};
  entranceSpeed: {max: number; min: number};
}

export interface PhysicsContainer {
  /**
   * Launch a new panda into the physics world.
   * Returns the panda's id.
   */
  launchPanda: (
    config: PandaLaunchConfig,
    onComplete: (id: number) => void,
  ) => number;
  /**
   * Tear down the physics world and remove associated DOM nodes.
   */
  unload: () => void;
}

// Internal constants -------------------------------------------------------
const PANDA_HEIGHT = 70; // px
const PANDA_WIDTH = (PANDA_HEIGHT / 512) * 458; // Maintain aspect ratio

/** Helper to get a random number in a range. */
function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/** Degrees to radians */
function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// Internal types -----------------------------------------------------------
interface PandaMeta {
  body: Body;
  exitTimeout: number;
  // id from setTimeout
  onComplete: (id: number) => void;
  phase: 'bouncing' | 'exiting';
}

// Factory ------------------------------------------------------------------
export function createPhysicsContainer(
  options: PhysicsContainerOptions,
): PhysicsContainer {
  const parent = options.parent ?? document.body;

  // Create a container element for the renderer so we control styling easily.
  const sceneElement = document.createElement('div');
  Object.assign(sceneElement.style, {
    height: '100%',
    left: '0px',
    pointerEvents: 'none',
    position: 'fixed',
    top: '0px',
    width: '100%',
    zIndex: '2000',
  });
  parent.appendChild(sceneElement);

  // Matter.js setup --------------------------------------------------------
  const engine = Engine.create();
  engine.world.gravity.y = options.gravity;

  const render = Render.create({
    element: sceneElement,
    engine,
    options: {
      background: 'transparent',
      height: window.innerHeight,
      width: window.innerWidth,
      wireframes: false,
    },
  });

  const runner = Runner.create();

  // Create walls -----------------------------------------------------------
  const wallOptions = {isStatic: true, render: {visible: false}} as const;
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
  World.add(engine.world, walls);

  // Panda management -------------------------------------------------------
  let nextId = 1;
  const pandas = new Map<number, PandaMeta>();

  // Helper to remove panda
  function destroyPanda(id: number) {
    const meta = pandas.get(id);
    if (!meta) return;
    pandas.delete(id);
    clearTimeout(meta.exitTimeout);
    World.remove(engine.world, meta.body);
  }

  // Update hooks -----------------------------------------------------------
  Events.on(engine, 'beforeUpdate', () => {
    pandas.forEach((meta) => {
      if (meta.phase === 'exiting') {
        // Apply upward force proportional to gravity
        Body.applyForce(meta.body, meta.body.position, {
          x: 0,
          y: -engine.world.gravity.y * meta.body.mass * 1.5,
        });
      }
    });
  });

  Events.on(engine, 'afterUpdate', () => {
    pandas.forEach((meta, id) => {
      if (meta.phase === 'exiting' && meta.body.position.y < -PANDA_HEIGHT) {
        // Panda has left the screen
        meta.onComplete(id);
        destroyPanda(id);
      }
    });
  });

  // Start engine / renderer ------------------------------------------------
  Render.run(render);
  Runner.run(runner, engine);

  // API --------------------------------------------------------------------
  function launchPanda(
    config: PandaLaunchConfig,
    onComplete: (id: number) => void,
  ): number {
    const id = nextId++;

    const {entranceSpeed, entranceAngle, bounceDamping} = config;
    const speed = random(entranceSpeed.min, entranceSpeed.max);
    const angleDeg = random(entranceAngle.min, entranceAngle.max);
    const angleRad = degToRad(angleDeg);

    const initialVelocity = {
      x: Math.cos(angleRad) * speed,
      y: Math.sin(angleRad) * speed,
    };

    let initialPos: {x: number; y: number};
    if (Math.random() > 0.5) {
      // From left
      initialPos = {
        x: -PANDA_WIDTH / 2,
        y: random(window.innerHeight * 0.2, window.innerHeight * 0.8),
      };
    } else {
      // From right
      initialPos = {
        x: window.innerWidth + PANDA_WIDTH / 2,
        y: random(window.innerHeight * 0.2, window.innerHeight * 0.8),
      };
      initialVelocity.x = -Math.abs(initialVelocity.x);
    }

    const pandaBody = Bodies.rectangle(
      initialPos.x,
      initialPos.y,
      PANDA_WIDTH,
      PANDA_HEIGHT,
      {
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
    Body.setAngularVelocity(pandaBody, random(-0.05, 0.05));

    World.add(engine.world, pandaBody);

    const exitTimeout = window.setTimeout(
      () => {
        const meta = pandas.get(id);
        if (meta) meta.phase = 'exiting';
      },
      random(config.durationOnScreen.min, config.durationOnScreen.max),
    );

    pandas.set(id, {
      body: pandaBody,
      exitTimeout,
      onComplete,
      phase: 'bouncing',
    });

    return id;
  }

  function unload(): void {
    // Clear all pandas & timers
    pandas.forEach((_, id) => destroyPanda(id));
    pandas.clear();

    // Stop Matter.js
    Runner.stop(runner);
    Render.stop(render);
    World.clear(engine.world, false);
    Engine.clear(engine);

    // Remove canvas
    render.canvas.remove();
    // @ts-expect-error private prop cleanup
    render.canvas = null;
    // @ts-expect-error private prop cleanup
    render.context = null;
    render.textures = {};

    // Remove scene element
    sceneElement.remove();
  }

  return {
    launchPanda,
    unload,
  };
}
