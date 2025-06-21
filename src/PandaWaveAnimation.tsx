import Box from '@mui/joy/Box';
import React, {useCallback, useMemo} from 'react';

import pandaImage from './assets/pandaWithCape.png';

interface PandaWaveAnimationProps {
  isTriggered: boolean;
  onAnimationComplete: () => void;
}

type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

const PandaWaveAnimation: React.FC<PandaWaveAnimationProps> = ({
  isTriggered,
  onAnimationComplete,
}) => {
  const handleAnimationEnd = useCallback(() => {
    onAnimationComplete();
  }, [onAnimationComplete]);

  // Randomly select a corner each time the animation is triggered
  const selectedCorner = useMemo((): Corner => {
    if (!isTriggered) return 'bottom-right'; // Default when not triggered
    const corners: Corner[] = [
      'top-left',
      'top-right',
      'bottom-left',
      'bottom-right',
    ];
    // eslint-disable-next-line @typescript-eslint/non-nullable-type-assertion-style
    return corners[Math.floor(Math.random() * corners.length)] as Corner;
  }, [isTriggered]);

  // Get corner-specific styling and animations
  const cornerConfig = useMemo(() => {
    const configs = {
      'bottom-left': {
        animationName: 'pandaWaveBottomLeft',
        endTransform: 'translateX(-150%) translateY(50%)',
        positioning: {bottom: '-40px', left: '20px'},
        startTransform: 'translateX(-150%) translateY(50%)',
        visibleTransform: 'translateX(25%) translateY(-25%)',
      },
      'bottom-right': {
        animationName: 'pandaWaveBottomRight',
        endTransform: 'translateX(150%) translateY(50%)',
        positioning: {bottom: '-40px', right: '20px'},
        startTransform: 'translateX(150%) translateY(50%)',
        visibleTransform: 'translateX(-25%) translateY(-25%)',
      },
      'top-left': {
        animationName: 'pandaWaveTopLeft',
        endTransform: 'translateX(-150%) translateY(-50%)',
        positioning: {left: '20px', top: '-40px'},
        startTransform: 'translateX(-150%) translateY(-50%)',
        visibleTransform: 'translateX(25%) translateY(25%)',
      },
      'top-right': {
        animationName: 'pandaWaveTopRight',
        endTransform: 'translateX(150%) translateY(-50%)',
        positioning: {right: '20px', top: '-40px'},
        startTransform: 'translateX(150%) translateY(-50%)',
        visibleTransform: 'translateX(-25%) translateY(25%)',
      },
    };
    return configs[selectedCorner];
  }, [selectedCorner]);

  if (!isTriggered) {
    return null;
  }

  return (
    <>
      <style>
        {`
          @keyframes pandaWaveTopLeft {
            0% { 
              transform: ${cornerConfig.startTransform} rotate(0deg);
            }
            9.09% { 
              transform: ${cornerConfig.visibleTransform} rotate(0deg);
            }
            45.45% { 
              transform: ${cornerConfig.visibleTransform} rotate(0deg);
            }
            50% { 
              transform: ${cornerConfig.visibleTransform} rotate(-12deg);
            }
            52% { 
              transform: ${cornerConfig.visibleTransform} rotate(12deg);
            }
            54% { 
              transform: ${cornerConfig.visibleTransform} rotate(-12deg);
            }
            56% { 
              transform: ${cornerConfig.visibleTransform} rotate(12deg);
            }
            58% { 
              transform: ${cornerConfig.visibleTransform} rotate(-12deg);
            }
            60% { 
              transform: ${cornerConfig.visibleTransform} rotate(12deg);
            }
            62% { 
              transform: ${cornerConfig.visibleTransform} rotate(-12deg);
            }
            64% { 
              transform: ${cornerConfig.visibleTransform} rotate(12deg);
            }
            66% { 
              transform: ${cornerConfig.visibleTransform} rotate(0deg);
            }
            90.91% { 
              transform: ${cornerConfig.visibleTransform} rotate(0deg);
            }
            100% { 
              transform: ${cornerConfig.endTransform} rotate(0deg);
            }
          }

          @keyframes pandaWaveTopRight {
            0% { 
              transform: ${cornerConfig.startTransform} rotate(0deg);
            }
            9.09% { 
              transform: ${cornerConfig.visibleTransform} rotate(0deg);
            }
            45.45% { 
              transform: ${cornerConfig.visibleTransform} rotate(0deg);
            }
            50% { 
              transform: ${cornerConfig.visibleTransform} rotate(-12deg);
            }
            52% { 
              transform: ${cornerConfig.visibleTransform} rotate(12deg);
            }
            54% { 
              transform: ${cornerConfig.visibleTransform} rotate(-12deg);
            }
            56% { 
              transform: ${cornerConfig.visibleTransform} rotate(12deg);
            }
            58% { 
              transform: ${cornerConfig.visibleTransform} rotate(-12deg);
            }
            60% { 
              transform: ${cornerConfig.visibleTransform} rotate(12deg);
            }
            62% { 
              transform: ${cornerConfig.visibleTransform} rotate(-12deg);
            }
            64% { 
              transform: ${cornerConfig.visibleTransform} rotate(12deg);
            }
            66% { 
              transform: ${cornerConfig.visibleTransform} rotate(0deg);
            }
            90.91% { 
              transform: ${cornerConfig.visibleTransform} rotate(0deg);
            }
            100% { 
              transform: ${cornerConfig.endTransform} rotate(0deg);
            }
          }

          @keyframes pandaWaveBottomLeft {
            0% { 
              transform: ${cornerConfig.startTransform} rotate(0deg);
            }
            9.09% { 
              transform: ${cornerConfig.visibleTransform} rotate(0deg);
            }
            45.45% { 
              transform: ${cornerConfig.visibleTransform} rotate(0deg);
            }
            50% { 
              transform: ${cornerConfig.visibleTransform} rotate(-12deg);
            }
            52% { 
              transform: ${cornerConfig.visibleTransform} rotate(12deg);
            }
            54% { 
              transform: ${cornerConfig.visibleTransform} rotate(-12deg);
            }
            56% { 
              transform: ${cornerConfig.visibleTransform} rotate(12deg);
            }
            58% { 
              transform: ${cornerConfig.visibleTransform} rotate(-12deg);
            }
            60% { 
              transform: ${cornerConfig.visibleTransform} rotate(12deg);
            }
            62% { 
              transform: ${cornerConfig.visibleTransform} rotate(-12deg);
            }
            64% { 
              transform: ${cornerConfig.visibleTransform} rotate(12deg);
            }
            66% { 
              transform: ${cornerConfig.visibleTransform} rotate(0deg);
            }
            90.91% { 
              transform: ${cornerConfig.visibleTransform} rotate(0deg);
            }
            100% { 
              transform: ${cornerConfig.endTransform} rotate(0deg);
            }
          }

          @keyframes pandaWaveBottomRight {
            0% { 
              transform: ${cornerConfig.startTransform} rotate(0deg);
            }
            9.09% { 
              transform: ${cornerConfig.visibleTransform} rotate(0deg);
            }
            45.45% { 
              transform: ${cornerConfig.visibleTransform} rotate(0deg);
            }
            50% { 
              transform: ${cornerConfig.visibleTransform} rotate(-12deg);
            }
            52% { 
              transform: ${cornerConfig.visibleTransform} rotate(12deg);
            }
            54% { 
              transform: ${cornerConfig.visibleTransform} rotate(-12deg);
            }
            56% { 
              transform: ${cornerConfig.visibleTransform} rotate(12deg);
            }
            58% { 
              transform: ${cornerConfig.visibleTransform} rotate(-12deg);
            }
            60% { 
              transform: ${cornerConfig.visibleTransform} rotate(12deg);
            }
            62% { 
              transform: ${cornerConfig.visibleTransform} rotate(-12deg);
            }
            64% { 
              transform: ${cornerConfig.visibleTransform} rotate(12deg);
            }
            66% { 
              transform: ${cornerConfig.visibleTransform} rotate(0deg);
            }
            90.91% { 
              transform: ${cornerConfig.visibleTransform} rotate(0deg);
            }
            100% { 
              transform: ${cornerConfig.endTransform} rotate(0deg);
            }
          }
        `}
      </style>
      <Box
        onAnimationEnd={handleAnimationEnd}
        sx={{
          animation: `${cornerConfig.animationName} 5.5s ease-in-out forwards`,
          height: 'auto',
          pointerEvents: 'none',
          position: 'fixed',
          transform: cornerConfig.startTransform + ' rotate(0deg)', // Start position
          width: '120px',
          zIndex: 1000,
          ...cornerConfig.positioning,
        }}>
        <Box
          alt="Waving panda"
          component="img"
          src={pandaImage}
          sx={{
            height: 'auto',
            transform: 'rotate(-30deg)', // Tilt panda 30 degrees to the left
            width: '100%',
          }}
        />
      </Box>
    </>
  );
};

export default PandaWaveAnimation;
