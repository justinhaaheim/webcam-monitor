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
  const PANDA_HEIGHT = 70; // px
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
  const wallOptions = {
    isStatic: true,
    render: {visible: false},
    restitution: 0.55,
  } as const;
  const wallThickness = 100;
  const walls = [
    // Floor
    Bodies.rectangle(
      window.innerWidth / 2,
      window.innerHeight + wallThickness / 2,
      window.innerWidth,
      wallThickness,
      {...wallOptions, label: 'floor'},
    ),
    // Left wall
    Bodies.rectangle(
      -wallThickness / 2,
      window.innerHeight / 2,
      wallThickness,
      window.innerHeight,
      {...wallOptions, label: 'wall-left'},
    ),
    // Right wall
    Bodies.rectangle(
      window.innerWidth + wallThickness / 2,
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

  Events.on(engine, 'collisionStart', ({pairs}) => {
    pairs.forEach((pair) => {
      // Check for panda-wall collisions
      const isPandaWallCollision =
        (pair.bodyA.label === 'panda' && pair.bodyB.label.startsWith('wall')) ||
        (pair.bodyA.label.startsWith('wall') && pair.bodyB.label === 'panda');

      if (isPandaWallCollision) {
        const pandaBody =
          pair.bodyA.label === 'panda' ? pair.bodyA : pair.bodyB;
        const wallBody = pair.bodyA.label.startsWith('wall')
          ? pair.bodyA
          : pair.bodyB;

        // Identify which wall it is by its position
        const isLeftWall = wallBody.position.x < window.innerWidth / 2;
        const isRightWall = wallBody.position.x > window.innerWidth / 2;

        console.debug(
          `Panda collided with ${wallBody.label}. Panda velocity x=${pandaBody.velocity.x} y=${pandaBody.velocity.y}`,
          {
            pandaBody,
            wallBody,
          },
        );

        // Allow panda to pass through walls from the outside, but not from inside
        if (isLeftWall && pandaBody.velocity.x >= 0) {
          console.log('⭐️ Panda entering from left: Passing through wall.');
          pair.isActive = false; // Panda moving right, entering from left
          return;
        }
        if (isRightWall && pandaBody.velocity.x <= 0) {
          console.log('⭐️ Panda entering from right: Passing through wall.');
          pair.isActive = false; // Panda moving left, entering from right
          return;
        }

        // // For debugging collisions that *do* happen (from the inside)
        // console.log(
        //   `Panda collided with wall. Panda velocity:`,
        //   {x: pandaBody.velocity.x, y: pandaBody.velocity.y},
        //   'Panda position:',
        //   {x: pandaBody.position.x, y: pandaBody.position.y},
        // );
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
        x: -PANDA_WIDTH / 2,
        y: random(window.innerHeight * 0.2, window.innerHeight * 0.8),
      };
      initialVelocity.x = Math.abs(initialVelocity.x);
    } else {
      // From right
      initialPos = {
        x: window.innerWidth + PANDA_WIDTH / 2,
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
    const width = window.innerWidth;
    const height = window.innerHeight;
    const newWalls = [
      Bodies.rectangle(
        width / 2,
        height + wallThickness / 2,
        width,
        wallThickness,
        wallOptions,
      ),
      Bodies.rectangle(
        -wallThickness / 2,
        height / 2,
        wallThickness,
        height,
        wallOptions,
      ),
      Bodies.rectangle(
        width + wallThickness / 2,
        height / 2,
        wallThickness,
        height,
        wallOptions,
      ),
    ];
    walls.splice(0, walls.length, ...newWalls);
    World.add(engine.world, newWalls);

    // resize canvas
    render.canvas.width = width;
    render.canvas.height = height;
    render.options.width = width;
    render.options.height = height;
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
