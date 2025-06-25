import type {
  PandaLaunchConfig,
  PhysicsContainer,
  PhysicsContainerOptions,
} from './createPhysicsContainer';

import {create} from 'zustand';

interface PhysicsState {
  container: PhysicsContainer | null;
  /** Current container-level config */
  containerConfig: PhysicsContainerOptions;
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
const DEFAULT_CONTAINER_CONFIG: PhysicsContainerOptions = {
  gravity: 0.5,
  showBounds: false,
};

const usePhysicsStore = create<PhysicsState>((set, get) => ({
  container: null,
  containerConfig: DEFAULT_CONTAINER_CONFIG,
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
