import {useEffect} from 'react';

import {
  createPhysicsContainer,
  type PhysicsContainer,
} from './createPhysicsContainer';
import usePhysicsStore from './physicsStore';

/**
 * React component that bootstraps the shared Matter.js physics container on mount
 * and cleans it up on unmount. Renders nothing (the canvas is mounted to body).
 */
function PhysicsContainerComponent() {
  const setContainer = usePhysicsStore((s) => s.setContainer);
  const containerConfig = usePhysicsStore((s) => s.containerConfig);

  useEffect(() => {
    let isCancelled = false;
    let container: PhysicsContainer | null = null;

    const init = async () => {
      const newContainer = await createPhysicsContainer(containerConfig);
      if (isCancelled) {
        // The effect was cleaned up before we could finish initialization.
        // We must destroy the container that was just created to avoid leaks.
        newContainer.unload();
      } else {
        container = newContainer;
        setContainer(newContainer);
      }
    };

    init().catch((err) => {
      // It's good practice to handle potential errors during initialization.
      console.error('Failed to initialize physics container:', err);
    });

    return () => {
      isCancelled = true;
      if (container) {
        container.unload();
      }
      setContainer(null);
    };
    // We intentionally ignore parent ref because a stable element is expected.
  }, [containerConfig, setContainer]); // run once; containerConfig reference stable unless changed imperatively, but include for dependency clarity

  return null;
}

export default PhysicsContainerComponent;
