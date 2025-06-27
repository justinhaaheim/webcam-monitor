// CONSOLIDATED PHYSICS CONFIGURATION =================================
// All physics-related configuration values in one place for easy tuning

/** Default configuration for the physics container (engine, gravity, rendering) */
export const DEFAULT_CONTAINER_CONFIG = {
  gravity: 0.5,
  showBounds: false,
};

/** Default configuration for launching pandas */
export const DEFAULT_PANDA_LAUNCH_CONFIG = {
  bounceDamping: 0.95,
  durationOnScreen: {max: 8000, min: 5000},
  entranceAngle: {max: 320, min: 320},
  entranceSpeed: {max: 10, min: 10},
};

/** Wall physics configuration */
export const DEFAULT_WALL_CONFIG = {
  isStatic: true,
  render: {visible: false},
  restitution: 0.55,
  thickness: 100,
} as const;

/** Panda sprite configuration */
export const DEFAULT_PANDA_CONFIG = {
  height: 70, // px
  // Width calculated to maintain aspect ratio
} as const;
