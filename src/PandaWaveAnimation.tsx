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
            9.09% { 
              transform: translateX(25%) translateY(-25%) rotate(0deg);
            }
            /* Wait positioned (2s pause) */
            45.45% { 
              transform: translateX(25%) translateY(-25%) rotate(0deg);
            }
            /* Start waving - faster now */
            50% { 
              transform: translateX(25%) translateY(-25%) rotate(-10deg);
            }
            54.55% { 
              transform: translateX(25%) translateY(-25%) rotate(10deg);
            }
            59.09% { 
              transform: translateX(25%) translateY(-25%) rotate(-10deg);
            }
            63.64% { 
              transform: translateX(25%) translateY(-25%) rotate(10deg);
            }
            68.18% { 
              transform: translateX(25%) translateY(-25%) rotate(-10deg);
            }
            72.73% { 
              transform: translateX(25%) translateY(-25%) rotate(0deg);
            }
            /* Wait after waving (1s pause) */
            90.91% { 
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
          animation: 'pandaWaveSequence 5.5s ease-in-out forwards',
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
