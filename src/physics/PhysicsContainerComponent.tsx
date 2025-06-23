import type {PhysicsContainerOptions} from './createPhysicsContainer';

import {useEffect} from 'react';

import {createPhysicsContainer} from './createPhysicsContainer';
import usePhysicsStore from './physicsStore';

type Props = PhysicsContainerOptions;

/**
 * React component that bootstraps the shared Matter.js physics container on mount
 * and cleans it up on unmount. Renders nothing (the canvas is mounted to body).
 */
function PhysicsContainerComponent({gravity, parent}: Props) {
  const setContainer = usePhysicsStore((s) => s.setContainer);

  useEffect(() => {
    const container = createPhysicsContainer({gravity, parent});
    setContainer(container);

    return () => {
      container.unload();
      setContainer(null);
    };
    // We intentionally ignore parent ref because a stable element is expected.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gravity, setContainer]);

  return null;
}

export default PhysicsContainerComponent;
