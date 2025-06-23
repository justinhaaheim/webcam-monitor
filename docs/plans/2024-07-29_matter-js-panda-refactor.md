# Matter.js Panda Refactor

**Date:** 2024-07-29

## Overview

This document outlines the plan to refactor the existing DOM-based `PhysicsPanda.tsx` component to use the `matter-js` physics engine and its built-in canvas renderer. The goal is to improve animation performance, especially when multiple pandas are on screen, while retaining the core animation behavior and configurability.

## Requirements

- [ ] Replace the current `requestAnimationFrame` and manual physics calculations in `PhysicsPanda.tsx` with `matter-js`.
- [ ] Use the `matter-js` canvas renderer instead of DOM element manipulation for the animation.
- [ ] The renderer's canvas should be transparent and overlay the entire application.
- [ ] The panda animation behavior should remain the same:
  - Enters from off-screen with a random initial velocity.
  - Bounces off the edges of the screen.
  - After a configurable duration, animates flying off the top of the screen.
- [ ] Reuse the existing `PhysicsPandaConfig` and the UI controls in `DebugInfo.tsx` to configure the `matter-js` physics world (e.g., gravity).
- [ ] Ensure the implementation is robust enough to handle multiple simultaneous panda animations without significant performance degradation.
- [ ] Check work with `npm run signal`.
- [ ] Commit changes regularly.

## Technical Plan

### 1. Setup

- [ ] Install `matter-js` and its TypeScript definitions (`@types/matter-js`).

### 2. `PhysicsPanda.tsx` Refactor

- **Component Structure**:

  - The component will now be responsible for managing a single `matter-js` engine, world, and renderer. It will render a `<canvas>` element that `matter-js` will draw on.
  - A `ref` will be used to give the `matter-js` renderer a DOM element to attach to.

- **`useEffect` for Initialization and Cleanup**:

  - **Initialization**: On component mount, a `useEffect` hook will:
    1.  Create a `matter-js` `Engine` and `Runner`.
    2.  Create a `Render` instance, configured to draw on our `<canvas>` ref. The renderer will have a transparent background and be sized to the window.
    3.  Create static "wall" bodies for the screen boundaries (top, bottom, left, right). The top wall will be placed off-screen to allow the panda to exit.
    4.  Create a dynamic `Body` for the panda using `Bodies.rectangle`.
        - The body's `render.sprite` property will be set to use the `pandaWithCape.png` image, correctly scaled.
    5.  Add the panda body and walls to the world.
    6.  Run the `Runner`.
  - **Cleanup**: The `useEffect`'s return function will be crucial for stopping the simulation and preventing memory leaks:
    1.  Stop the `Runner` (`Runner.stop`).
    2.  Clear the `Engine` (`Engine.clear`).
    3.  Destroy the `Render` instance.

- **Physics and Animation Logic**:
  - **Configuration**: The `config` prop will be used to set the `engine.world.gravity.y` and other physics properties like bounciness (`restitution`).
  - **Entrance**: The panda body will be given an initial position and velocity based on the `entranceSpeed` and `entranceAngle` props, similar to the original implementation.
  - **Exit**: A `setTimeout` will be used to trigger the "exiting" phase. When it fires, we'll apply a strong upward force to the panda body on each frame update to make it fly off-screen.
  - **Completion**: We'll listen to the engine's `afterUpdate` event. In the event handler, we will check if the panda is in the "exiting" phase and if its position is now off-screen. If so, we'll call the `onAnimationComplete` prop and perform the necessary cleanup.

### 3. State and Props Flow

- The `PhysicsPanda` component's props interface (`PhysicsPandaProps` and `PhysicsPandaConfig`) will remain unchanged.
- This ensures that parent components like `App.tsx` and `DebugInfo.tsx` will not require any modifications. The `config` object they pass down will simply be interpreted by the new `matter-js` implementation instead of the old manual physics logic.

## Progress Notes

- **2024-07-29**:
  - Created this planning document.
  - Next step: Install `matter-js` and begin the refactor of `PhysicsPanda.tsx`.
