# Physics Container Refactor (2025-06-23)

## Goal

Move Matter.js setup out of React components and into a reusable physics container so that multiple pandas can share the same physics world and interact with each other.

## Desired API

```ts
interface PhysicsContainerOptions {
  gravity: number;
  parent?: HTMLElement; // The element to mount the Matter.js canvas into (defaults to document.body)
}

interface PandaLaunchConfig {
  bounceDamping: number;
  durationOnScreen: {min: number; max: number};
  entranceAngle: {min: number; max: number};
  entranceSpeed: {min: number; max: number};
}

interface PhysicsContainer {
  /** Launch a new panda and receive its id. onComplete is called when the panda exits. */
  launchPanda: (
    config: PandaLaunchConfig,
    onComplete: (id: number) => void,
  ) => number;

  /** Completely tear down the physics world and remove DOM nodes. */
  unload: () => void;
}
```

## High-Level Design

1. `createPhysicsContainer(options)`
   - Creates a single Matter.js `Engine`, `Render`, `Runner`, and the world walls.
   - Maintains an internal `Map<number, PandaMeta>` where `PandaMeta` holds the Matter body, phase (bouncing | exiting), and timeout id.
   - Returns the `PhysicsContainer` object.
2. `launchPanda(config, onComplete)`
   - Creates the panda body with a random entrance velocity & position based on `config`.
   - Sets an exit timer that transitions the panda to the "exiting" phase, applying an upward force each tick.
   - Registers a callback for when the panda moves above the viewport, then calls `onComplete(id)` and cleans up that panda's bodies & timers.
3. `unload()`
   - Clears all timers, stops the runner & renderer, clears the world, removes the canvas.

## Implementation Steps

- [ ] Step 1 – Scaffold new file `src/physics/createPhysicsContainer.ts` and copy over helper functions/constants from `PhysicsPanda.tsx`.
- [ ] Step 2 – Implement container setup (engine, runner, render, walls).
- [ ] Step 3 – Implement `launchPanda` and panda life-cycle management.
- [ ] Step 4 – Implement `unload`.
- [x] Step 5 – Add Zustand store and `PhysicsContainerComponent` for React integration.
- [x] Step 6 – Refactor React side (`App.tsx`) to use the shared container and launch pandas via store.

## Open Questions / To-Do

- Should we expose a way to change gravity at runtime?
- Handle window resize – rebuild walls & resize renderer?
- Consider pooling panda bodies to avoid GC churn if many pandas are launched.

---

Feel free to jot additional notes, todos, or dead-ends below as we work.
