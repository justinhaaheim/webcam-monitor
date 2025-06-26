import {useEffect, useRef} from 'react';

import {
  createPhysicsContainer,
  type PhysicsContainer,
} from './createPhysicsContainer';
import usePhysicsStore from './physicsStore';

/**
 * React component that bootstraps the shared Matter.js physics container on mount
 * and cleans it up on unmount. Renders a container div that the physics canvas mounts to.
 */
function PhysicsContainerComponent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const setContainer = usePhysicsStore((s) => s.setContainer);
  const containerConfig = usePhysicsStore((s) => s.containerConfig);

  useEffect(() => {
    let isCancelled = false;
    let container: PhysicsContainer | null = null;

    const init = async () => {
      if (!containerRef.current) {
        console.error('Container ref not available for physics initialization');
        return;
      }

      const newContainer = await createPhysicsContainer({
        ...containerConfig,
        containerRef,
      });
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

  return (
    <div
      ref={containerRef}
      style={{
        height: '100%',
        left: '0px',
        pointerEvents: 'none',
        position: 'fixed',
        top: '0px',
        width: '100%',
        zIndex: '2000',
      }}
    />
  );
}

export default PhysicsContainerComponent;
