import Box from '@mui/joy/Box';
import React, {useEffect, useState} from 'react';

import pandaImage from './assets/pandaWithCape.png';

interface PandaWaveAnimationProps {
  isTriggered: boolean;
  onAnimationComplete: () => void;
}

type AnimationState = 'hidden' | 'entering' | 'waving' | 'exiting';

const PandaWaveAnimation: React.FC<PandaWaveAnimationProps> = ({
  isTriggered,
  onAnimationComplete,
}) => {
  const [animationState, setAnimationState] =
    useState<AnimationState>('hidden');

  useEffect(() => {
    if (!isTriggered) {
      setAnimationState('hidden');
      return;
    }

    // Start the animation sequence
    setAnimationState('entering');

    // After entering completes (500ms), start waving
    const enteringTimer = setTimeout(() => {
      setAnimationState('waving');
    }, 500);

    // After waving for 2 seconds, start exiting
    const wavingTimer = setTimeout(() => {
      setAnimationState('exiting');
    }, 2500);

    // After exiting completes (500ms), hide and call completion callback
    const exitingTimer = setTimeout(() => {
      setAnimationState('hidden');
      onAnimationComplete();
    }, 3000);

    return () => {
      clearTimeout(enteringTimer);
      clearTimeout(wavingTimer);
      clearTimeout(exitingTimer);
    };
  }, [isTriggered, onAnimationComplete]);

  if (animationState === 'hidden') {
    return null;
  }

  const getTransform = () => {
    switch (animationState) {
      case 'entering':
        return 'translateX(25%) translateY(-25%) rotate(0deg)';
      case 'waving':
        return 'translateX(25%) translateY(-25%) rotate(0deg)';
      case 'exiting':
        return 'translateX(100%) translateY(-25%) rotate(0deg)';
      default:
        return 'translateX(100%) translateY(0%) rotate(0deg)';
    }
  };

  const getAnimation = () => {
    if (animationState === 'waving') {
      return 'pandaWave 0.3s ease-in-out infinite alternate';
    }
    return 'none';
  };

  return (
    <>
      <style>
        {`
          @keyframes pandaWave {
            0% { transform: translateX(25%) translateY(-25%) rotate(-10deg); }
            100% { transform: translateX(25%) translateY(-25%) rotate(10deg); }
          }
        `}
      </style>
      <Box
        alt="Waving panda"
        component="img"
        src={pandaImage}
        sx={{
          animation: getAnimation(),
          bottom: '20px',
          height: 'auto',
          pointerEvents: 'none',
          position: 'fixed',
          right: '20px',
          transform: getTransform(),
          transition:
            animationState === 'entering' || animationState === 'exiting'
              ? 'transform 0.5s ease-in-out'
              : 'none',
          width: '120px',
          zIndex: 1000,
        }}
      />
    </>
  );
};

export default PandaWaveAnimation;
