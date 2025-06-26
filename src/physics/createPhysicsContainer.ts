import {Bodies, Body, Engine, Events, Render, Runner, World} from 'matter-js';

import pandaImage from '../assets/pandaWithCape.png';
import {DEFAULT_PANDA_CONFIG, DEFAULT_WALL_CONFIG} from './config';
import usePhysicsStore from './physicsStore';

// Public types -------------------------------------------------------------
export interface PhysicsContainerOptions {
  gravity: number;
  /**
   * Element into which the Matter.js canvas should be mounted.
   * Defaults to `document.body`.
   */
  parent?: HTMLElement;
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
  engine.gravity.y = options.gravity;

  const render = Render.create({
    element: sceneElement,
    engine,
    options: {
      background: 'transparent',
      height: window.innerHeight,
      // showAngleIndicator: true,
      // showAxes: true,
      showBounds: options.showBounds ?? false,
      // showCollisions: true,
      // showConvexHulls: true,
      showDebug: true,
      width: window.innerWidth,
      wireframeBackground: 'transparent',
      wireframes: options.showBounds ?? false,
    },
  });

  const runner = Runner.create();

  // Create walls -----------------------------------------------------------
  // Debug mode: move walls into viewport for visibility and testing
  const DEBUG_WALL_OFFSET = 200; // px to move walls inward
  const debugWalls = usePhysicsStore.getState().debugWalls;

  const wallOptions = {
    collisionFilter: {
      category: COLLISION_CATEGORIES.WALL,
      mask: COLLISION_CATEGORIES.PANDA_INSIDE, // Only collide with inside pandas
    },
    isStatic: DEFAULT_WALL_CONFIG.isStatic,
    render: {
      ...DEFAULT_WALL_CONFIG.render,
      visible: debugWalls, // Make walls visible in debug mode
    },
    restitution: DEFAULT_WALL_CONFIG.restitution,
  };
  const wallThickness = DEFAULT_WALL_CONFIG.thickness;

  const walls = [
    // Floor
    Bodies.rectangle(
      window.innerWidth / 2,
      debugWalls
        ? window.innerHeight - DEBUG_WALL_OFFSET + wallThickness / 2
        : window.innerHeight + wallThickness / 2,
      window.innerWidth,
      wallThickness,
      {...wallOptions, label: 'floor'},
    ),
    // Left wall
    Bodies.rectangle(
      debugWalls ? DEBUG_WALL_OFFSET - wallThickness / 2 : -wallThickness / 2,
      window.innerHeight / 2,
      wallThickness,
      window.innerHeight,
      {...wallOptions, label: 'wall-left'},
    ),
    // Right wall
    Bodies.rectangle(
      debugWalls
        ? window.innerWidth - DEBUG_WALL_OFFSET + wallThickness / 2
        : window.innerWidth + wallThickness / 2,
      window.innerHeight / 2,
      wallThickness,
      window.innerHeight,
      {...wallOptions, label: 'wall-right'},
    ),
  ];
  World.add(engine.world, walls);

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
        const wallOffset = debugWalls ? DEBUG_WALL_OFFSET : 0;
        const leftBoundary = wallOffset;
        const rightBoundary = window.innerWidth - wallOffset;

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
      // From left
      initialPos = {
        x: debugWalls ? DEBUG_WALL_OFFSET - PANDA_WIDTH / 2 : -PANDA_WIDTH / 2,
        y: random(window.innerHeight * 0.2, window.innerHeight * 0.8),
      };
      initialVelocity.x = Math.abs(initialVelocity.x);
    } else {
      // From right
      initialPos = {
        x: debugWalls
          ? window.innerWidth - DEBUG_WALL_OFFSET + PANDA_WIDTH / 2
          : window.innerWidth + PANDA_WIDTH / 2,
        y: random(window.innerHeight * 0.2, window.innerHeight * 0.8),
      };
      initialVelocity.x = -Math.abs(initialVelocity.x);
    }

    // For debugging: center the panda in the middle of the screen
    // initialPos.x = window.innerWidth / 2;
    // initialPos.y = window.innerHeight / 2;
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

  // ---------------- Handle Window Resize ---------------------------------
  function rebuildWalls() {
    World.remove(engine.world, walls);
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const wallHeight = windowHeight;
    const newWalls = [
      // Floor
      Bodies.rectangle(
        windowWidth / 2,
        debugWalls
          ? windowHeight - DEBUG_WALL_OFFSET + wallThickness / 2
          : windowHeight + wallThickness / 2,
        windowWidth,
        wallThickness,
        {
          ...wallOptions,
          label: 'floor',
        },
      ),
      // Left wall
      Bodies.rectangle(
        debugWalls ? DEBUG_WALL_OFFSET - wallThickness / 2 : -wallThickness / 2,
        windowHeight / 2,
        wallThickness,
        wallHeight,
        {
          ...wallOptions,
          label: 'wall-left',
        },
      ),
      // Right wall
      Bodies.rectangle(
        debugWalls
          ? windowWidth - DEBUG_WALL_OFFSET + wallThickness / 2
          : windowWidth + wallThickness / 2,
        windowHeight / 2,
        wallThickness,
        wallHeight,
        {
          ...wallOptions,
          label: 'wall-right',
        },
      ),
    ];
    walls.splice(0, walls.length, ...newWalls);
    World.add(engine.world, newWalls);

    // resize canvas
    render.canvas.width = windowWidth;
    render.canvas.height = windowHeight;
    render.options.width = windowWidth;
    render.options.height = windowHeight;
  }

  const resizeObserver = () => rebuildWalls();
  window.addEventListener('resize', resizeObserver);

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

    // Remove scene element
    sceneElement.remove();

    if (resizeObserver) {
      window.removeEventListener('resize', resizeObserver);
    }
  }

  return {
    launchPanda,
    unload,
    updateConfig,
  };
}
