import {
  Bodies,
  Body,
  Composite,
  Engine,
  Events,
  Render,
  Runner,
  World,
} from 'matter-js';
import {type RefObject} from 'react';

import pandaImage from '../assets/pandaWithCape.png';
import {DEFAULT_PANDA_CONFIG, DEFAULT_WALL_CONFIG} from './config';
import usePhysicsStore from './physicsStore';

// Public types -------------------------------------------------------------
export interface PhysicsContainerOptions {
  /**
   * React ref to the container element where the Matter.js canvas should be mounted.
   */
  containerRef: RefObject<HTMLElement> | null;
  gravity: number;
  /** Render Matter.js debug bounding boxes around bodies */
  showBounds?: boolean;
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
  /**
   * Imperatively update container-level config like gravity.
   * Only provided keys are updated.
   */
  updateConfig: (partial: Partial<PhysicsContainerOptions>) => void;
}

// Internal constants -------------------------------------------------------
/** Helper to get a random number in a range. */
function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// Canvas sizing constants
const MIN_CANVAS_WIDTH = 400;
const MIN_CANVAS_HEIGHT = 400;

// Collision categories (powers of 2 for bitwise operations)
const COLLISION_CATEGORIES = {
  PANDA_ENTERING: 0x0002,
  PANDA_INSIDE: 0x0004,
  WALL: 0x0001,
} as const;

/** Degrees to radians */
function degToRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/** Helper to load an image and return its dimensions. */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (event: Event | string) => {
      const error =
        event instanceof Error
          ? event
          : new Error(
              typeof event === 'string' ? event : 'Failed to load image',
            );
      reject(error);
    };
    img.src = src;
  });
}

/** Helper to calculate effective canvas dimensions and scale factor */
function calculateCanvasDimensions(
  containerWidth: number,
  containerHeight: number,
) {
  // Calculate effective canvas size (minimum dimensions)
  const effectiveWidth = Math.max(containerWidth, MIN_CANVAS_WIDTH);
  const effectiveHeight = Math.max(containerHeight, MIN_CANVAS_HEIGHT);

  // Calculate scale factor to fit effective canvas in container
  const scaleX = containerWidth / effectiveWidth;
  const scaleY = containerHeight / effectiveHeight;
  const scaleFactor = Math.min(scaleX, scaleY);

  return {
    effectiveHeight,
    effectiveWidth,
    scaleFactor,
  };
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
export async function createPhysicsContainer(
  options: PhysicsContainerOptions,
): Promise<PhysicsContainer> {
  const pandaImg = await loadImage(pandaImage);
  const PANDA_HEIGHT = DEFAULT_PANDA_CONFIG.height;
  const PANDA_WIDTH =
    (PANDA_HEIGHT / pandaImg.naturalHeight) * pandaImg.naturalWidth;

  const containerElement = options.containerRef?.current;
  if (!containerElement) {
    throw new Error('Container element not available');
  }

  // Matter.js setup --------------------------------------------------------
  const engine = Engine.create();
  engine.gravity.y = options.gravity;

  const render = Render.create({
    element: containerElement,
    engine,
    options: {
      background: 'transparent',
      hasBounds: true,
      // height: window.innerHeight,
      // showAngleIndicator: true,
      // showAxes: true,
      showBounds: options.showBounds ?? false,
      // showCollisions: true,
      // showConvexHulls: true,
      // showDebug: usePhysicsStore.getState().debugMode,
      showDebug: false,
      // width: window.innerWidth,
      wireframeBackground: 'transparent',
      wireframes: options.showBounds ?? false,
    },
  });

  const runner = Runner.create();

  // Create walls -----------------------------------------------------------
  const debugWalls = usePhysicsStore.getState().debugWalls;

  const wallOptions = {
    collisionFilter: {
      category: COLLISION_CATEGORIES.WALL,
      mask: COLLISION_CATEGORIES.PANDA_INSIDE, // Only collide with inside pandas
    },
    isStatic: DEFAULT_WALL_CONFIG.isStatic,
    render: {
      ...DEFAULT_WALL_CONFIG.render,
      visible: debugWalls, // Make walls visible only in debug mode
    },
    restitution: DEFAULT_WALL_CONFIG.restitution,
  };
  const wallThickness = DEFAULT_WALL_CONFIG.thickness;

  // Create walls as object for better organization
  const walls = {
    floor: Bodies.rectangle(0, 0, 100, wallThickness, {
      ...wallOptions,
      label: 'floor',
    }),
    left: Bodies.rectangle(0, 0, wallThickness, 100, {
      ...wallOptions,
      label: 'wall-left',
    }),
    right: Bodies.rectangle(0, 0, wallThickness, 100, {
      ...wallOptions,
      label: 'wall-right',
    }),
  };

  // Helper functions for canvas and wall management
  function updateCanvasSize(containerWidth: number, containerHeight: number) {
    const {effectiveWidth, effectiveHeight, scaleFactor} =
      calculateCanvasDimensions(containerWidth, containerHeight);

    // Set Matter.js canvas to effective dimensions
    Render.setSize(render, effectiveWidth, effectiveHeight);

    // Apply CSS scaling to fit in container
    if (containerElement) {
      Object.assign(containerElement.style, {
        transform: `scale(${scaleFactor})`,
        transformOrigin: 'center center',
      });
    }

    // Update render bounds to fit the scene
    Render.lookAt(render, Composite.allBodies(engine.world));
  }

  function updateWallPositions(
    containerWidth: number,
    containerHeight: number,
  ) {
    const {effectiveWidth, effectiveHeight} = calculateCanvasDimensions(
      containerWidth,
      containerHeight,
    );

    console.log('🐼 updateWallPositions', {
      containerHeight,
      containerWidth,
      effectiveHeight,
      effectiveWidth,
    });

    // Update floor - positioned at bottom edge
    Body.setPosition(walls.floor, {
      x: effectiveWidth / 2,
      y: effectiveHeight + wallThickness / 2,
    });
    Body.scale(
      walls.floor,
      effectiveWidth / (walls.floor.bounds.max.x - walls.floor.bounds.min.x),
      1,
    );

    // Update left wall - positioned at left edge
    Body.setPosition(walls.left, {
      x: -wallThickness / 2,
      y: effectiveHeight / 2,
    });
    Body.scale(
      walls.left,
      1,
      effectiveHeight / (walls.left.bounds.max.y - walls.left.bounds.min.y),
    );

    // Update right wall - positioned at right edge
    Body.setPosition(walls.right, {
      x: effectiveWidth + wallThickness / 2,
      y: effectiveHeight / 2,
    });
    Body.scale(
      walls.right,
      1,
      effectiveHeight / (walls.right.bounds.max.y - walls.right.bounds.min.y),
    );
  }

  // Initialize walls with proper positions and sizes
  World.add(engine.world, [walls.floor, walls.left, walls.right]);

  // Helper to get current container dimensions
  function getCurrentContainerDimensions() {
    if (!containerElement) {
      throw new Error('Container element not available');
    }
    const rect = containerElement.getBoundingClientRect();
    return {height: rect.height, width: rect.width};
  }

  // Initialize with current dimensions
  const {width: initialWidth, height: initialHeight} =
    getCurrentContainerDimensions();
  updateWallPositions(initialWidth, initialHeight);
  updateCanvasSize(initialWidth, initialHeight);

  // Panda management -------------------------------------------------------
  let nextId = 1;
  const pandas = new Map<number, PandaMeta>();

  // Update pandas collision group when they enter the main area
  Events.on(engine, 'beforeUpdate', () => {
    pandas.forEach((meta) => {
      // Check if panda is in entering state and has moved into the main area
      if (
        meta.body.collisionFilter.category ===
        COLLISION_CATEGORIES.PANDA_ENTERING
      ) {
        const {width: containerWidth} = getCurrentContainerDimensions();
        const leftBoundary = 0;
        const rightBoundary = containerWidth;

        // If panda has moved fully inside the boundaries, switch to inside group
        if (
          meta.body.position.x > leftBoundary + PANDA_WIDTH / 2 &&
          meta.body.position.x < rightBoundary - PANDA_WIDTH / 2
        ) {
          console.log('🐼 Panda entered main area, enabling wall collisions');
          meta.body.collisionFilter.category =
            COLLISION_CATEGORIES.PANDA_INSIDE;
          meta.body.collisionFilter.mask =
            COLLISION_CATEGORIES.WALL | COLLISION_CATEGORIES.PANDA_INSIDE;
        }
      }

      // Apply exit forces for pandas in exiting phase
      if (meta.phase === 'exiting') {
        // Apply upward force proportional to gravity
        Body.applyForce(meta.body, meta.body.position, {
          x: 0,
          y: -engine.world.gravity.y * meta.body.mass * 1.5,
        });
      }
    });
  });

  // Helper to remove panda
  function destroyPanda(id: number) {
    const meta = pandas.get(id);
    if (!meta) return;
    pandas.delete(id);
    clearTimeout(meta.exitTimeout);
    World.remove(engine.world, meta.body);
  }

  // Update hooks (already handled in the beforeUpdate above) -----------

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
    const {width: containerWidth, height: containerHeight} =
      getCurrentContainerDimensions();

    const {entranceSpeed, entranceAngle, bounceDamping} = config;
    const speed = random(entranceSpeed.min, entranceSpeed.max);
    // const speed = 10;

    // 0deg is to the right
    // 90deg is down
    // 180deg is to the left
    // 270deg is up
    const angleDeg = random(entranceAngle.min, entranceAngle.max);
    // const angleDeg = 320;

    const angleRad = degToRad(angleDeg);

    const enterFromLeft = Math.random() > 0.5;
    // const enterFromLeft = true;

    const durationOnScreen = random(
      config.durationOnScreen.min,
      config.durationOnScreen.max,
    );

    const initialVelocity = {
      x: Math.cos(angleRad) * speed,
      y: Math.sin(angleRad) * speed,
    };

    let initialPos: {x: number; y: number};
    if (enterFromLeft) {
      // From left edge
      initialPos = {
        x: -PANDA_WIDTH / 2,
        y: random(containerHeight * 0.2, containerHeight * 0.8),
      };
      initialVelocity.x = Math.abs(initialVelocity.x);
    } else {
      // From right edge
      initialPos = {
        x: containerWidth + PANDA_WIDTH / 2,
        y: random(containerHeight * 0.2, containerHeight * 0.8),
      };
      initialVelocity.x = -Math.abs(initialVelocity.x);
    }

    // For debugging: center the panda in the middle of the screen
    // initialPos.x = containerWidth / 2;
    // initialPos.y = containerHeight / 2;
    // initialVelocity.x = 10;
    // initialVelocity.y = 0;

    console.log('[launchPanda] Launching bear with config', {
      angleDeg,
      angleRad,
      bounceDamping,
      durationOnScreen: config.durationOnScreen,
      entranceAngle: config.entranceAngle,
      entranceSpeed: config.entranceSpeed,
      initialPos,
      initialVelocity,
      speed,
    });

    const pandaBody = Bodies.rectangle(
      initialPos.x,
      initialPos.y,
      PANDA_WIDTH,
      PANDA_HEIGHT,
      {
        chamfer: {radius: 20},
        collisionFilter: {
          category: COLLISION_CATEGORIES.PANDA_ENTERING,
          mask: 0, // Don't collide with anything while entering
        },
        frictionAir: 0,
        label: 'panda',
        render: {
          sprite: {
            texture: pandaImage,
            xScale: PANDA_WIDTH / pandaImg.naturalWidth,
            yScale: PANDA_HEIGHT / pandaImg.naturalHeight,
          },
        },
        restitution: bounceDamping,
      },
    );

    Body.setVelocity(pandaBody, initialVelocity);
    Body.setAngularVelocity(pandaBody, random(-0.05, 0.05));

    World.add(engine.world, pandaBody);

    const exitTimeout = window.setTimeout(() => {
      const meta = pandas.get(id);
      if (meta) meta.phase = 'exiting';
    }, durationOnScreen);

    pandas.set(id, {
      body: pandaBody,
      exitTimeout,
      onComplete,
      phase: 'bouncing',
    });

    return id;
  }

  function updateConfig(partial: Partial<PhysicsContainerOptions>): void {
    if (partial.gravity !== undefined) {
      engine.gravity.y = partial.gravity;
    }
    if (partial.showBounds !== undefined) {
      render.options.showBounds = partial.showBounds;
    }
    // Nothing else yet, but other options could be handled here.
  }

  // ---------------- Handle Container Resize ------------------------------
  const resizeObserver = new ResizeObserver(() => {
    const {width, height} = getCurrentContainerDimensions();
    updateCanvasSize(width, height);
    updateWallPositions(width, height);
  });
  if (containerElement) {
    resizeObserver.observe(containerElement);
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
    // Clean internal refs (optional for GC)
    // @ts-expect-error accessing private fields for cleanup
    render.canvas = null;
    // @ts-expect-error accessing private fields for cleanup
    render.context = null;
    render.textures = {};

    // Stop observing container resize
    resizeObserver.disconnect();
  }

  return {
    launchPanda,
    unload,
    updateConfig,
  };
}
