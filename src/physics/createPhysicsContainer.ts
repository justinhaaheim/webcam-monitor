import type {Material} from 'three';

import {
  Bodies,
  Body,
  Engine,
  Events,
  Mouse,
  MouseConstraint,
  Runner,
  World,
} from 'matter-js';
import {type RefObject} from 'react';
import {
  Mesh,
  MeshBasicMaterial,
  NoToneMapping,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
  TextureLoader,
  WebGLRenderer,
} from 'three';

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

// Will hold the mouse instance so we can update its pixelRatio on resize
let mouse: Mouse | null = null;
let mouseConstraint: MouseConstraint | null = null;

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
  mesh: Mesh;
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

  // Three.js setup ---------------------------------------------------------
  const scene = new Scene();
  const threeRenderer = new WebGLRenderer({
    alpha: true,
    antialias: true,
    premultipliedAlpha: false,
  });
  threeRenderer.outputColorSpace = SRGBColorSpace;
  threeRenderer.toneMapping = NoToneMapping;
  threeRenderer.setPixelRatio(window.devicePixelRatio);
  containerElement.appendChild(threeRenderer.domElement);

  // Camera will be created once we know initial dimensions
  let camera: OrthographicCamera | null = null;

  // Load panda texture once
  const pandaTexture = new TextureLoader().load(pandaImage);
  pandaTexture.colorSpace = SRGBColorSpace;

  const runner = Runner.create();

  // ---------------------------- Mouse control -----------------------------
  // Enable grabbing/throwing of pandas
  mouse = Mouse.create(threeRenderer.domElement);
  mouseConstraint = MouseConstraint.create(engine, {
    // Soft constraint so the body follows the mouse a bit behind (more natural throw)
    constraint: {
      // damping: 0.1,
      render: {visible: false},
      stiffness: 0.3,
    },

    mouse,
  });
  World.add(engine.world, mouseConstraint);

  // ---------------------------- Drag handling -----------------------------
  Events.on(mouseConstraint, 'startdrag', (event) => {
    const body = (event as unknown as {body?: Body}).body;
    if (body && body.label === 'panda') {
      if (containerElement) {
        containerElement.style.cursor = 'grabbing';
      }
    }
  });

  Events.on(mouseConstraint, 'enddrag', (event) => {
    const body = (event as unknown as {body?: Body}).body;
    if (body && body.label === 'panda') {
      if (containerElement) {
        containerElement.style.cursor = 'grab';
      }
    }
  });

  // Set default cursor
  if (containerElement) {
    containerElement.style.cursor = 'grab';
  }

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

    // Set Three.js renderer size
    threeRenderer.setSize(effectiveWidth, effectiveHeight);

    // Create or update orthographic camera
    if (!camera) {
      camera = new OrthographicCamera(
        /* left */ 0,
        /* right */ effectiveWidth,
        /* top */ 0,
        /* bottom */ effectiveHeight,
        /* near */ 0.1,
        /* far */ 1000,
      );
      camera.position.z = 1;
      scene.add(camera);
    } else {
      camera.right = effectiveWidth;
      camera.top = 0;
      camera.bottom = effectiveHeight;
      camera.updateProjectionMatrix();
    }

    // Apply CSS scaling to fit in container
    if (containerElement) {
      Object.assign(containerElement.style, {
        transform: `scale(${scaleFactor})`,
        transformOrigin: 'center center',
      });
    }

    // Adjust mouse pixel ratio to account for CSS scaling so dragging is accurate
    if (mouse) {
      mouse.pixelRatio = 1 / scaleFactor;
    }
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

    // Make walls "infinitely" tall - extend well beyond the visible area
    const wallHeight = effectiveHeight * 10; // 10x taller than canvas
    const wallCenterY = effectiveHeight / 2 - wallHeight / 2 + effectiveHeight; // Position so they extend from well above to well below

    // Update left wall - positioned at left edge
    Body.setPosition(walls.left, {
      x: -wallThickness / 2,
      y: wallCenterY,
    });
    Body.scale(
      walls.left,
      1,
      wallHeight / (walls.left.bounds.max.y - walls.left.bounds.min.y),
    );

    // Update right wall - positioned at right edge
    Body.setPosition(walls.right, {
      x: effectiveWidth + wallThickness / 2,
      y: wallCenterY,
    });
    Body.scale(
      walls.right,
      1,
      wallHeight / (walls.right.bounds.max.y - walls.right.bounds.min.y),
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

  // ---------------------------- Keyboard control -------------------------
  function freezePandas() {
    console.log('🐼 Freezing all pandas');

    // Pause the runner to stop physics simulation
    // runner.enabled = false;

    // Store current velocities and freeze each panda
    pandas.forEach((meta) => {
      // frozenPandaStates.set(id, {
      //   angularVelocity: meta.body.angularVelocity,
      //   velocity: {...meta.body.velocity},
      // });

      // Stop all movement
      // Body.setVelocity(meta.body, {x: 0, y: 0});
      // Body.setAngularVelocity(meta.body, 0);
      Body.setStatic(meta.body, true);
    });
  }

  function unfreezePandas() {
    console.log('🐼 Unfreezing all pandas');

    // Resume the runner
    // runner.enabled = true;

    // Restore velocities and unfreeze each panda
    pandas.forEach((meta) => {
      Body.setStatic(meta.body, false);
      // const frozenState = frozenPandaStates.get(id);
      // if (frozenState) {
      //   Body.setStatic(meta.body, false);
      //   Body.setVelocity(meta.body, frozenState.velocity);
      //   Body.setAngularVelocity(meta.body, frozenState.angularVelocity);
      // }
    });

    // Clear stored states
    // frozenPandaStates.clear();
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.code === 'Space' && !event.repeat) {
      event.preventDefault();
      freezePandas();
    }
  }

  function handleKeyUp(event: KeyboardEvent) {
    if (event.code === 'Space') {
      event.preventDefault();
      unfreezePandas();
    }
  }

  // Add keyboard event listeners
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);

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

      // Dampen rotation while grabbed by mouse to bring it gradually to rest
      if (mouseConstraint?.body === meta.body) {
        const damping = 0.9; // 0 => snap stop, 1 => no damping
        Body.setAngularVelocity(meta.body, meta.body.angularVelocity * damping);
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
    scene.remove(meta.mesh);
    meta.mesh.geometry.dispose();
    const materials: Material[] = Array.isArray(meta.mesh.material)
      ? meta.mesh.material
      : [meta.mesh.material];
    materials.forEach((mat) => mat.dispose());
  }

  // Update hooks (already handled in the beforeUpdate above) -----------

  Events.on(engine, 'afterUpdate', () => {
    pandas.forEach((meta, id) => {
      // Update mesh to match physics body
      meta.mesh.position.set(meta.body.position.x, meta.body.position.y, 0);
      meta.mesh.rotation.z = -meta.body.angle;

      if (meta.phase === 'exiting' && meta.body.position.y < -PANDA_HEIGHT) {
        // Panda has left the screen
        meta.onComplete(id);
        destroyPanda(id);
      }
    });

    if (camera) {
      threeRenderer.render(scene, camera);
    }
  });

  // Start engine ----------------------------------------------------------
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

    // const durationOnScreen = random(
    //   config.durationOnScreen.min,
    //   config.durationOnScreen.max,
    // );

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

    // Three.js mesh for this panda
    const pandaGeometry = new PlaneGeometry(PANDA_WIDTH, PANDA_HEIGHT);
    const pandaMaterial = new MeshBasicMaterial({
      map: pandaTexture,
      transparent: true,
    });
    const pandaMesh = new Mesh(pandaGeometry, pandaMaterial);
    pandaMesh.position.set(initialPos.x, initialPos.y, 0);
    pandaMesh.rotation.z = -pandaBody.angle;
    scene.add(pandaMesh);

    pandas.set(id, {
      body: pandaBody,
      exitTimeout: 0,
      mesh: pandaMesh,
      onComplete,
      phase: 'bouncing',
    });

    return id;
  }

  function updateConfig(partial: Partial<PhysicsContainerOptions>): void {
    if (partial.gravity !== undefined) {
      engine.gravity.y = partial.gravity;
    }
    // showBounds currently not implemented for Three.js renderer
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
    threeRenderer.dispose();
    threeRenderer.domElement.remove();
    World.clear(engine.world, false);
    Engine.clear(engine);

    // Remove keyboard event listeners
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);

    // Reset cursor style
    if (containerElement) {
      containerElement.style.cursor = '';
    }

    // Stop observing container resize
    resizeObserver.disconnect();
  }

  return {
    launchPanda,
    unload,
    updateConfig,
  };
}
