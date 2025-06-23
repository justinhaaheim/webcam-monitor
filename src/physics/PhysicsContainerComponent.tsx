import {useEffect} from 'react';

import {createPhysicsContainer} from './createPhysicsContainer';
import usePhysicsStore from './physicsStore';

/**
 * React component that bootstraps the shared Matter.js physics container on mount
 * and cleans it up on unmount. Renders nothing (the canvas is mounted to body).
 */
function PhysicsContainerComponent() {
  const setContainer = usePhysicsStore((s) => s.setContainer);
  const containerConfig = usePhysicsStore((s) => s.containerConfig);

  useEffect(() => {
    const container = createPhysicsContainer(containerConfig);
    setContainer(container);

    return () => {
      container.unload();
      setContainer(null);
    };
    // We intentionally ignore parent ref because a stable element is expected.
  }, [containerConfig, setContainer]); // run once; containerConfig reference stable unless changed imperatively, but include for dependency clarity

  return null;
}

export default PhysicsContainerComponent;
