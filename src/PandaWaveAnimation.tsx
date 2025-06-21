import Box from '@mui/joy/Box';
import React, {useCallback, useMemo} from 'react';

import pandaImage from './assets/pandaWithCape.png';

// Animation constants - adjust these to change all corners at once
const ANIMATION_CONSTANTS = {
  // Positioning from screen edges (pixels)
  EDGE_OFFSET: -10,

  // How far to slide vertically when entering/exiting
  // Visible position when panda is on screen (percentages)
  HORIZONTAL_VISIBLE_OFFSET: 25,

  // How much to overlap past screen edge (negative = past edge)
  // Transform percentages for slide animations
  OFF_SCREEN_DISTANCE: 150,

  // Distance from left/right/top/bottom edges
  OVERLAP_OFFSET: -40,

  // How far from edge when visible vertically
  // Panda head rotation angles to point toward center (degrees)
  ROTATION_ANGLES: {
    BOTTOM_LEFT_TO_CENTER: 30,
    BOTTOM_RIGHT_TO_CENTER: -30,
    TOP_LEFT_TO_CENTER: 150,
    TOP_RIGHT_TO_CENTER: -150,
  },

  // How far off-screen to start/end (150% = fully hidden)
  VERTICAL_SLIDE_DISTANCE: 50,

  // How far from edge when visible horizontally
  VERTICAL_VISIBLE_OFFSET: 25,
} as const;

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
        endTransform: `translateX(${ANIMATION_CONSTANTS.OFF_SCREEN_DISTANCE * -1}%) translateY(${ANIMATION_CONSTANTS.VERTICAL_SLIDE_DISTANCE}%)`,
        pandaRotation: `rotate(${ANIMATION_CONSTANTS.ROTATION_ANGLES.BOTTOM_LEFT_TO_CENTER}deg)`,
        positioning: {
          bottom: `${ANIMATION_CONSTANTS.OVERLAP_OFFSET}px`,
          left: `${ANIMATION_CONSTANTS.EDGE_OFFSET}px`,
        },
        startTransform: `translateX(${ANIMATION_CONSTANTS.OFF_SCREEN_DISTANCE * -1}%) translateY(${ANIMATION_CONSTANTS.VERTICAL_SLIDE_DISTANCE}%)`,
        visibleTransform: `translateX(${ANIMATION_CONSTANTS.HORIZONTAL_VISIBLE_OFFSET}%) translateY(${ANIMATION_CONSTANTS.VERTICAL_VISIBLE_OFFSET * -1}%)`,
      },
      'bottom-right': {
        animationName: 'pandaWaveBottomRight',
        endTransform: `translateX(${ANIMATION_CONSTANTS.OFF_SCREEN_DISTANCE}%) translateY(${ANIMATION_CONSTANTS.VERTICAL_SLIDE_DISTANCE}%)`,
        pandaRotation: `rotate(${ANIMATION_CONSTANTS.ROTATION_ANGLES.BOTTOM_RIGHT_TO_CENTER}deg)`,
        positioning: {
          bottom: `${ANIMATION_CONSTANTS.OVERLAP_OFFSET}px`,
          right: `${ANIMATION_CONSTANTS.EDGE_OFFSET}px`,
        },
        startTransform: `translateX(${ANIMATION_CONSTANTS.OFF_SCREEN_DISTANCE}%) translateY(${ANIMATION_CONSTANTS.VERTICAL_SLIDE_DISTANCE}%)`,
        visibleTransform: `translateX(${ANIMATION_CONSTANTS.HORIZONTAL_VISIBLE_OFFSET * -1}%) translateY(${ANIMATION_CONSTANTS.VERTICAL_VISIBLE_OFFSET * -1}%)`,
      },
      'top-left': {
        animationName: 'pandaWaveTopLeft',
        endTransform: `translateX(${ANIMATION_CONSTANTS.OFF_SCREEN_DISTANCE * -1}%) translateY(${ANIMATION_CONSTANTS.VERTICAL_SLIDE_DISTANCE * -1}%)`,
        pandaRotation: `rotate(${ANIMATION_CONSTANTS.ROTATION_ANGLES.TOP_LEFT_TO_CENTER}deg)`,
        positioning: {
          left: `${ANIMATION_CONSTANTS.EDGE_OFFSET}px`,
          top: `${ANIMATION_CONSTANTS.OVERLAP_OFFSET}px`,
        },
        startTransform: `translateX(${ANIMATION_CONSTANTS.OFF_SCREEN_DISTANCE * -1}%) translateY(${ANIMATION_CONSTANTS.VERTICAL_SLIDE_DISTANCE * -1}%)`,
        visibleTransform: `translateX(${ANIMATION_CONSTANTS.HORIZONTAL_VISIBLE_OFFSET}%) translateY(${ANIMATION_CONSTANTS.VERTICAL_VISIBLE_OFFSET}%)`,
      },
      'top-right': {
        animationName: 'pandaWaveTopRight',
        endTransform: `translateX(${ANIMATION_CONSTANTS.OFF_SCREEN_DISTANCE}%) translateY(${ANIMATION_CONSTANTS.VERTICAL_SLIDE_DISTANCE * -1}%)`,
        pandaRotation: `rotate(${ANIMATION_CONSTANTS.ROTATION_ANGLES.TOP_RIGHT_TO_CENTER}deg)`,
        positioning: {
          right: `${ANIMATION_CONSTANTS.EDGE_OFFSET}px`,
          top: `${ANIMATION_CONSTANTS.OVERLAP_OFFSET}px`,
        },
        startTransform: `translateX(${ANIMATION_CONSTANTS.OFF_SCREEN_DISTANCE}%) translateY(${ANIMATION_CONSTANTS.VERTICAL_SLIDE_DISTANCE * -1}%)`,
        visibleTransform: `translateX(${ANIMATION_CONSTANTS.HORIZONTAL_VISIBLE_OFFSET * -1}%) translateY(${ANIMATION_CONSTANTS.VERTICAL_VISIBLE_OFFSET}%)`,
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
            transform: cornerConfig.pandaRotation, // Point panda toward center
            width: '100%',
          }}
        />
      </Box>
    </>
  );
};

export default PandaWaveAnimation;
