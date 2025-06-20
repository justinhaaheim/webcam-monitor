import Box from '@mui/joy/Box';
import React, {useCallback} from 'react';

import pandaImage from './assets/pandaWithCape.png';

interface PandaWaveAnimationProps {
  isTriggered: boolean;
  onAnimationComplete: () => void;
}

const PandaWaveAnimation: React.FC<PandaWaveAnimationProps> = ({
  isTriggered,
  onAnimationComplete,
}) => {
  const handleAnimationEnd = useCallback(() => {
    onAnimationComplete();
  }, [onAnimationComplete]);

  if (!isTriggered) {
    return null;
  }

  return (
    <>
      <style>
        {`
          @keyframes pandaWaveSequence {
            /* Start off-screen */
            0% { 
              transform: translateX(100%) translateY(-25%) rotate(0deg);
            }
            /* Slide in to visible position */
            12.5% { 
              transform: translateX(25%) translateY(-25%) rotate(0deg);
            }
            /* Start waving */
            25% { 
              transform: translateX(25%) translateY(-25%) rotate(-8deg);
            }
            37.5% { 
              transform: translateX(25%) translateY(-25%) rotate(8deg);
            }
            50% { 
              transform: translateX(25%) translateY(-25%) rotate(-8deg);
            }
            62.5% { 
              transform: translateX(25%) translateY(-25%) rotate(8deg);
            }
            75% { 
              transform: translateX(25%) translateY(-25%) rotate(-8deg);
            }
            /* Stop waving and prepare to exit */
            87.5% { 
              transform: translateX(25%) translateY(-25%) rotate(0deg);
            }
            /* Slide out off-screen */
            100% { 
              transform: translateX(100%) translateY(-25%) rotate(0deg);
            }
          }
        `}
      </style>
      <Box
        alt="Waving panda"
        component="img"
        onAnimationEnd={handleAnimationEnd}
        src={pandaImage}
        sx={{
          animation: 'pandaWaveSequence 4s ease-in-out forwards',
          bottom: '20px',
          height: 'auto',
          pointerEvents: 'none',
          position: 'fixed',
          right: '20px',
          transform: 'translateX(100%) translateY(-25%) rotate(0deg)', // Start position
          width: '120px',
          zIndex: 1000,
        }}
      />
    </>
  );
};

export default PandaWaveAnimation;
