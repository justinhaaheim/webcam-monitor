import type {
  PandaLaunchConfig,
  PhysicsContainer,
  PhysicsContainerOptions,
} from './createPhysicsContainer';

import {create} from 'zustand';

import {DEFAULT_CONTAINER_CONFIG} from './createPhysicsContainer';

// Read URL parameters once on module load
const urlParams = new URLSearchParams(window.location.search);
const debugMode = urlParams.has('debug');
const debugWalls = urlParams.has('debugWalls');

if (debugMode) {
  console.log('🐛 Debug mode enabled via URL parameter');
}
if (debugWalls) {
  console.log('🧱 Debug walls enabled via URL parameter');
}

interface PhysicsState {
  container: PhysicsContainer | null;
  /** Current container-level config */
  containerConfig: PhysicsContainerOptions;
  /** Debug mode from URL param 'debug' */
  debugMode: boolean;
  /** Debug walls from URL param 'debugWalls' */
  debugWalls: boolean;
  launchPanda: (
    config: PandaLaunchConfig,
    onComplete?: (id: number) => void,
  ) => void;
  setContainer: (container: PhysicsContainer | null) => void;
  /** Imperatively update container config (e.g., gravity) */
  updateContainerConfig: (partial: Partial<PhysicsContainerOptions>) => void;
}

/**
 * Global store exposing the shared Matter.js physics container.
 * Allows any component to launch new pandas without prop-drilling.
 */
const usePhysicsStore = create<PhysicsState>((set, get) => ({
  container: null,
  containerConfig: {
    ...DEFAULT_CONTAINER_CONFIG,
    debugMode: debugWalls, // Use debugWalls for physics debug mode
  },
  debugMode,
  debugWalls,
  launchPanda: (config, onComplete?: (id: number) => void) => {
    const container = get().container;
    if (!container) {
      console.warn('Physics container not ready');
      return;
    }
    container.launchPanda(config, onComplete ?? (() => undefined));
  },
  setContainer: (container) => set({container}),
  updateContainerConfig: (partial) => {
    set((state) => {
      const newConfig = {...state.containerConfig, ...partial};
      // Apply to running container if exists
      state.container?.updateConfig(partial);
      return {containerConfig: newConfig};
    });
  },
}));

export default usePhysicsStore;
