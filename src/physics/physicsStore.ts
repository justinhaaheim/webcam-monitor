import type {
  PandaLaunchConfig,
  PhysicsContainer,
} from './createPhysicsContainer';

import {create} from 'zustand';

interface PhysicsState {
  container: PhysicsContainer | null;
  launchPanda: (
    config: PandaLaunchConfig,
    onComplete?: (id: number) => void,
  ) => void;
  setContainer: (container: PhysicsContainer | null) => void;
}

/**
 * Global store exposing the shared Matter.js physics container.
 * Allows any component to launch new pandas without prop-drilling.
 */
const usePhysicsStore = create<PhysicsState>((set, get) => ({
  container: null,
  launchPanda: (config, onComplete?: (id: number) => void) => {
    const container = get().container;
    if (!container) {
      console.warn('Physics container not ready');
      return;
    }
    container.launchPanda(config, onComplete ?? (() => undefined));
  },
  setContainer: (container) => set({container}),
}));

export default usePhysicsStore;
