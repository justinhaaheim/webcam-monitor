# Physics-Based Panda Animation

**Date:** 2024-07-26

## Overview

This document outlines the plan for implementing a new feature: a physics-based panda animation. An image of a panda with a cape will appear on screen at random intervals, bounce around according to basic physics simulation, and then exit by being "sucked" upwards off the screen. This feature will be entirely separate from the existing `PandaWaveAnimation`.

## Requirements

- [x] Create a new planning document (`YYYY-MM-DD_name-of-work-stream.md`).
- [x] Implement a new, separate physics-based panda animation.
- [x] Use the `pandaWithCape.png` image, scaled to 70px height.
- [x] Use `requestAnimationFrame` for the physics simulation and rendering loop.
- [x] The panda should bounce off the edges of the screen.
- [x] The animation should be triggered at random intervals.
- [x] After a configurable duration, the panda should animate flying off the top of the screen.
- [x] Add configurable "knobs" to the `DebugInfo` component for tuning the physics.
  - [x] `gravity`
  - [x] `entranceSpeed` (min/max range)
  - [x] `entranceAngle` (min/max range)
  - [x] `durationOnScreen` (min/max range)
- [x] Keep this implementation entirely separate from `PandaWaveAnimation.tsx`.
- [x] Check work with `npm run signal`.
- [x] Commit changes regularly with the specified format.
- [x] Add trigger button to Controls component with rocket icon.
- [x] Support multiple overlapping animations.

## Technical Plan

### 1. Component Structure

- **`PhysicsPanda.tsx`**: ✅ A new component to encapsulate the panda's rendering and animation logic.
  - Receives physics parameters and a trigger state as props.
  - Manages its own state for position, velocity, etc.
  - Contains the `requestAnimationFrame` loop.
  - Calls an `onAnimationComplete` callback when finished.
- **`App.tsx`**: ✅ The main application component updated to:
  - Manage state for the physics parameters (`gravity`, etc.).
  - Include an array state for multiple pandas to support overlapping animations.
  - Implement a separate `setTimeout` loop for randomly triggering the animation.
- **`DebugInfo.tsx`**: ✅ This component updated to include new UI controls (e.g., `Input` from MUI Joy) to modify the physics parameters stored in `App.tsx`.
- **`Controls.tsx`**: ✅ Added new rocket button for manual triggering.

### 2. Physics & Animation Logic (`PhysicsPanda.tsx`)

- **State**: ✅
  - `position: { x: number, y: number }`
  - `velocity: { vx: number, vy: number }`
  - `rotation: number`
  - `animationPhase: 'entering' | 'bouncing' | 'exiting'`
- **Initialization (on mount/trigger)**: ✅
  - The panda starts just off-screen.
  - An initial velocity and position are calculated based on the `entranceSpeed` and `entranceAngle` props. A random value within the min/max range for each is used.
- **Animation Loop (`requestAnimationFrame`)**: ✅
  - **Apply Gravity**: `velocity.vy += gravity`.
  - **Update Position**: `position.x += velocity.vx`, `position.y += velocity.vy`.
  - **Collision Detection**: Check if the panda hits the screen boundaries (left, right, bottom). The top boundary is for the exit condition.
  - **Bounce**: If a wall is hit, reverse the corresponding velocity (`vx` or `vy`) and apply a damping factor to simulate energy loss (e.g., `velocity.vy *= -0.85`).
  - **Rotation**: The panda's rotation is updated to align with its movement direction, giving it a more dynamic feel. `rotation = Math.atan2(velocity.vy, velocity.vx) * (180 / Math.PI)`.
- **Exit Animation**: ✅
  - After the `durationOnScreen` timeout, the `animationPhase` changes to `'exiting'`.
  - In this phase, gravity is replaced by a strong upward acceleration.
  - Horizontal velocity is gradually dampened.
  - Once the panda is fully off-screen at the top, the `onAnimationComplete` callback is fired.

### 3. State and Props Flow

1.  **`DebugInfo.tsx`**: ✅ User modifies a parameter (e.g., `gravity`).
2.  An `onChange` handler calls a function passed from `App.tsx` (e.g., `handlePhysicsConfigChange`). ✅
3.  **`App.tsx`**: ✅ Updates its `physicsConfig` state.
4.  The `physicsConfig` object is passed as props to the `PhysicsPanda` component. ✅
5.  **`PhysicsPanda.tsx`**: ✅ Uses the new props in its next animation frame calculation.

## Progress Notes

- **2024-07-26**:
  - ✅ Created this planning document.
  - ✅ Created the initial `PhysicsPanda.tsx` component with basic structure.
  - ✅ Added necessary state management to `App.tsx` for physics config and panda array.
  - ✅ Updated `DebugInfo.tsx` with physics parameter controls and countdown timers.
  - ✅ Implemented full physics simulation with gravity, bouncing, and exit animation.
  - ✅ Added auto-trigger system with random intervals (5-20 minutes).
  - ✅ Refactored to support multiple overlapping animations using array state.
  - ✅ Added rocket button trigger in `Controls.tsx` component.
  - ✅ Fixed undefined icon references that were causing runtime errors.
  - ✅ All TypeScript, lint, and formatting checks passing.
  - ✅ Feature fully implemented and working!

## Implementation Details

- **Multiple Animation Support**: Uses an array of panda objects in `App.tsx`, each with unique IDs.
- **Physics Parameters**: All configurable via debug panel with real-time updates.
- **Auto-Trigger**: Separate from wave panda, runs every 5-20 minutes randomly.
- **Manual Triggers**: Available in both Controls (rocket button) and Debug Info (clickable header).
- **Performance**: Uses `requestAnimationFrame` for smooth 60fps animation.
- **Cleanup**: Proper cleanup of animation frames and timeouts on unmount.

The physics-based panda animation feature is now complete and fully functional! 🚀🐼

## Rolling Enhancement (Phase 2)

**Date:** 2024-07-26

### Issue Identified

- Pandas slide awkwardly across the ground when bouncing stops
- Horizontal velocity continues even with minimal vertical bouncing

### Solution: Rolling Physics

- [x] Add "rolling mode" when vertical bouncing gets very small
- [x] Implement continuous rotation based on horizontal movement
- [x] Add rolling friction to gradually slow horizontal movement
- [x] Add new debug parameters:
  - [x] `rollingThreshold`: Bounce speed threshold to start rolling (default: 2)
  - [x] `rollingFriction`: How quickly rolling slows down (default: 0.02)
  - [x] `rollingSpeed`: Visual rotation speed during rolling (default: 0.3)

### Physics Progression

**Bouncing** → **Rolling** → **Exit**

This will create a much more natural and playful physics experience! 🎯

### Implementation Details

- **Rolling Trigger**: When `Math.abs(velocity.vy) < rollingThreshold` and panda is on ground
- **Rolling Physics**: Stops vertical movement, applies friction to horizontal movement
- **Rolling Animation**: Continuous rotation based on `velocity.vx * rollingSpeed`
- **Tunable Parameters**: All rolling behavior is configurable via debug panel
- **Smooth Transition**: Seamlessly switches between bouncing and rolling modes

✅ **Rolling enhancement complete!** Pandas now transition naturally from bouncing to rolling, eliminating the awkward sliding behavior. The physics feel much more realistic and fun! 🐼🎢
