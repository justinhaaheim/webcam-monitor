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
            /* Start off-screen bottom-right corner */
            0% { 
              transform: translateX(150%) translateY(50%) rotate(0deg);
            }
            /* Slide in diagonally to visible position */
            9.09% { 
              transform: translateX(25%) translateY(-25%) rotate(0deg);
            }
            /* Wait positioned (2s pause) */
            45.45% { 
              transform: translateX(25%) translateY(-25%) rotate(0deg);
            }
            /* Start waving - much faster now */
            50% { 
              transform: translateX(25%) translateY(-25%) rotate(-12deg);
            }
            52% { 
              transform: translateX(25%) translateY(-25%) rotate(12deg);
            }
            54% { 
              transform: translateX(25%) translateY(-25%) rotate(-12deg);
            }
            56% { 
              transform: translateX(25%) translateY(-25%) rotate(12deg);
            }
            58% { 
              transform: translateX(25%) translateY(-25%) rotate(-12deg);
            }
            60% { 
              transform: translateX(25%) translateY(-25%) rotate(12deg);
            }
            62% { 
              transform: translateX(25%) translateY(-25%) rotate(-12deg);
            }
            64% { 
              transform: translateX(25%) translateY(-25%) rotate(12deg);
            }
            66% { 
              transform: translateX(25%) translateY(-25%) rotate(0deg);
            }
            /* Wait after waving (1s pause) */
            90.91% { 
              transform: translateX(25%) translateY(-25%) rotate(0deg);
            }
            /* Slide out diagonally off-screen */
            100% { 
              transform: translateX(150%) translateY(50%) rotate(0deg);
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
          transform: 'translateX(150%) translateY(50%) rotate(0deg)', // Start position
          width: '120px',
          zIndex: 1000,
        }}
      />
    </>
  );
};

export default PandaWaveAnimation;
