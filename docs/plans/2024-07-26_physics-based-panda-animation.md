# Physics-Based Panda Animation

**Date:** 2024-07-26

## Overview

This document outlines the plan for implementing a new feature: a physics-based panda animation. An image of a panda with a cape will appear on screen at random intervals, bounce around according to basic physics simulation, and then exit by being "sucked" upwards off the screen. This feature will be entirely separate from the existing `PandaWaveAnimation`.

## Requirements

- [ ] Create a new planning document (`YYYY-MM-DD_name-of-work-stream.md`).
- [ ] Implement a new, separate physics-based panda animation.
- [ ] Use the `pandaWithCape.png` image, scaled to 70px height.
- [ ] Use `requestAnimationFrame` for the physics simulation and rendering loop.
- [ ] The panda should bounce off the edges of the screen.
- [ ] The animation should be triggered at random intervals.
- [ ] After a configurable duration, the panda should animate flying off the top of the screen.
- [ ] Add configurable "knobs" to the `DebugInfo` component for tuning the physics.
  - [ ] `gravity`
  - [ ] `entranceSpeed` (min/max range)
  - [ ] `entranceAngle` (min/max range)
  - [ ] `durationOnScreen` (min/max range)
- [ ] Keep this implementation entirely separate from `PandaWaveAnimation.tsx`.
- [ ] Check work with `npm run signal`.
- [ ] Commit changes regularly with the specified format.

## Technical Plan

### 1. Component Structure

- **`PhysicsPanda.tsx`**: A new component to encapsulate the panda's rendering and animation logic.
  - Receives physics parameters and a trigger state as props.
  - Manages its own state for position, velocity, etc.
  - Contains the `requestAnimationFrame` loop.
  - Calls an `onAnimationComplete` callback when finished.
- **`usePhysicsPanda.ts`** (optional): A custom hook to contain the core physics logic, keeping the `PhysicsPanda.tsx` component clean and focused on rendering.
- **`App.tsx`**: The main application component will be updated to:
  - Manage state for the physics parameters (`gravity`, etc.).
  - Include a boolean state, `isPhysicsPandaVisible`, to control the animation's visibility.
  - Implement a separate `setTimeout` loop for randomly triggering the animation.
- **`DebugInfo.tsx`**: This component will be updated to include new UI controls (e.g., `Input` from MUI Joy) to modify the physics parameters stored in `App.tsx`.

### 2. Physics & Animation Logic (`PhysicsPanda.tsx`)

- **State**:
  - `position: { x: number, y: number }`
  - `velocity: { vx: number, vy: number }`
  - `rotation: number`
  - `animationPhase: 'entering' | 'bouncing' | 'exiting'`
- **Initialization (on mount/trigger)**:
  - The panda will start just off-screen.
  - An initial velocity and position will be calculated based on the `entranceSpeed` and `entranceAngle` props. A random value within the min/max range for each will be used.
- **Animation Loop (`requestAnimationFrame`)**:
  - **Apply Gravity**: `velocity.vy += gravity`.
  - **Update Position**: `position.x += velocity.vx`, `position.y += velocity.vy`.
  - **Collision Detection**: Check if the panda hits the screen boundaries (left, right, bottom). The top boundary is for the exit condition.
  - **Bounce**: If a wall is hit, reverse the corresponding velocity (`vx` or `vy`) and apply a damping factor to simulate energy loss (e.g., `velocity.vy *= -0.85`).
  - **Rotation**: The panda's rotation should be updated to align with its movement direction, giving it a more dynamic feel. `rotation = Math.atan2(velocity.vy, velocity.vx) * (180 / Math.PI)`.
- **Exit Animation**:
  - After the `durationOnScreen` timeout, the `animationPhase` changes to `'exiting'`.
  - In this phase, gravity is replaced by a strong upward acceleration.
  - Horizontal velocity is gradually dampened.
  - Once the panda is fully off-screen at the top, the `onAnimationComplete` callback is fired.

### 3. State and Props Flow

1.  **`DebugInfo.tsx`**: User modifies a parameter (e.g., `gravity`).
2.  An `onChange` handler calls a function passed from `App.tsx` (e.g., `handlePhysicsConfigChange`).
3.  **`App.tsx`**: Updates its `physicsConfig` state.
4.  The `physicsConfig` object is passed as props to the `PhysicsPanda` component.
5.  **`PhysicsPanda.tsx`**: Uses the new props in its next animation frame calculation.

## Progress Notes

- **2024-07-26**:
  - Created this planning document.
  - Next step: Create the initial `PhysicsPanda.tsx` component and add the necessary state management to `App.tsx`.
