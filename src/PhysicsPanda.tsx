import Box from '@mui/joy/Box';
import React, {useCallback, useEffect, useRef, useState} from 'react';

import pandaImage from './assets/pandaWithCape.png';

export interface PhysicsPandaConfig {
  bounceDamping: number;
  durationOnScreen: {max: number; min: number};
  entranceAngle: {max: number; min: number};
  entranceSpeed: {max: number; min: number};
  gravity: number;
  rollingFriction: number;
  rollingSpeed: number;
  rollingThreshold: number;
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
  const [transform, setTransform] = useState('translateX(-200px)'); // Start off-screen
  const animationFrameId = useRef<number | null>(null);
  const exitTimeoutId = useRef<number | null>(null);

  const pandaState = useRef({
    animationPhase: 'entering' as 'entering' | 'bouncing' | 'exiting',
    isRolling: false,
    position: {x: -PANDA_WIDTH, y: -PANDA_HEIGHT},
    rotation: 0,
    velocity: {vx: 0, vy: 0},
  });

  const animate = useCallback(() => {
    const state = pandaState.current;
    const {
      gravity,
      bounceDamping,
      rollingThreshold,
      rollingFriction,
      rollingSpeed,
    } = config;

    // --- Physics Calculations ---
    if (state.animationPhase === 'exiting') {
      // Upward force to suck the panda up
      state.velocity.vy -= gravity * 1.5;
      // Dampen horizontal movement
      state.velocity.vx *= 0.98;
      state.isRolling = false; // Stop rolling when exiting
    } else {
      // Apply gravity
      state.velocity.vy += gravity;
    }

    // Update position
    state.position.x += state.velocity.vx;
    state.position.y += state.velocity.vy;

    // --- Collision Detection & Response ---
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Check if panda is on the ground
    const isOnGround = state.position.y + PANDA_HEIGHT >= screenHeight;

    // Bounce off floor
    if (state.position.y + PANDA_HEIGHT > screenHeight) {
      state.position.y = screenHeight - PANDA_HEIGHT;
      state.velocity.vy *= -bounceDamping;
    }

    // Bounce off walls
    if (state.position.x + PANDA_WIDTH > screenWidth) {
      state.position.x = screenWidth - PANDA_WIDTH;
      state.velocity.vx *= -bounceDamping;
    } else if (state.position.x < 0) {
      state.position.x = 0;
      state.velocity.vx *= -bounceDamping;
    }

    // --- Rolling Logic ---
    if (
      state.animationPhase === 'bouncing' &&
      isOnGround &&
      Math.abs(state.velocity.vy) < rollingThreshold
    ) {
      // Switch to rolling mode
      state.isRolling = true;
      state.velocity.vy = 0; // Stop vertical movement completely

      // Apply rolling friction to horizontal movement
      state.velocity.vx *= 1 - rollingFriction;
    }

    // --- Update Rotation ---
    if (state.isRolling) {
      // Continuous rolling rotation based on horizontal movement
      state.rotation += state.velocity.vx * rollingSpeed;
    } else {
      // Dynamic rotation to match velocity direction (original behavior)
      state.rotation =
        Math.atan2(state.velocity.vy, state.velocity.vx) * (180 / Math.PI) + 90; // +90 to align image
    }

    // --- Update Style ---
    setTransform(
      `translate(${state.position.x}px, ${state.position.y}px) rotate(${state.rotation}deg)`,
    );

    // --- Check for Exit Condition ---
    if (
      state.animationPhase === 'exiting' &&
      state.position.y < -PANDA_HEIGHT
    ) {
      onAnimationComplete(id);
      return; // Stop the loop
    }

    // Request next frame
    animationFrameId.current = requestAnimationFrame(animate);
  }, [config, onAnimationComplete, id]);

  useEffect(() => {
    // --- Initialize Panda State ---
    const {entranceSpeed, entranceAngle, durationOnScreen} = config;

    const speed = getRandomNumber(entranceSpeed.min, entranceSpeed.max);
    const angleDeg = getRandomNumber(entranceAngle.min, entranceAngle.max);
    const angleRad = degreesToRadians(angleDeg);
    const duration = getRandomNumber(
      durationOnScreen.min,
      durationOnScreen.max,
    );

    // Reset state
    const state = pandaState.current;
    state.animationPhase = 'bouncing';
    state.velocity.vx = Math.cos(angleRad) * speed;
    state.velocity.vy = -Math.sin(angleRad) * speed; // Negative for upward initial velocity

    // Set initial position (randomly from left or right)
    if (Math.random() > 0.5) {
      // From left
      state.position.x = -PANDA_WIDTH;
      state.position.y = getRandomNumber(
        window.innerHeight * 0.2,
        window.innerHeight * 0.8,
      );
    } else {
      // From right
      state.position.x = window.innerWidth;
      state.position.y = getRandomNumber(
        window.innerHeight * 0.2,
        window.innerHeight * 0.8,
      );
      // Ensure velocity is pointing inwards
      state.velocity.vx = -Math.abs(state.velocity.vx);
    }

    // --- Start Animation ---
    animationFrameId.current = requestAnimationFrame(animate);

    // --- Schedule Exit ---
    exitTimeoutId.current = window.setTimeout(() => {
      pandaState.current.animationPhase = 'exiting';
    }, duration);

    // --- Cleanup ---
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (exitTimeoutId.current) {
        clearTimeout(exitTimeoutId.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount

  return (
    <Box
      sx={{
        height: `${PANDA_HEIGHT}px`,
        left: 0,
        pointerEvents: 'none',
        position: 'fixed',
        top: 0,
        transform,
        transition: 'transform 0s linear', // Let JS handle the position
        width: `${PANDA_WIDTH}px`,
        zIndex: 2000,
      }}>
      <img
        alt="Bouncing panda"
        src={pandaImage}
        style={{height: '100%', width: '100%'}}
      />
    </Box>
  );
};

export default PhysicsPanda;
