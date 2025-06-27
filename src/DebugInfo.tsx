import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import React, {useEffect, useState} from 'react';

interface DebugInfoProps {
  fillMode: 'cover' | 'contain';
  isFlipped: boolean;
  nextPandaTime: number | null;
  nextPhysicsPandaTime: number | null;
  onPandaTrigger: () => void;
  onPhysicsPandaTrigger: () => void;
  selectedDeviceId: string | undefined;
  stream: MediaStream | null;
  videoResolution: {height: number | undefined; width: number | undefined};
}

const DebugInfo: React.FC<DebugInfoProps> = ({
  stream,
  fillMode,
  isFlipped,
  nextPandaTime,
  nextPhysicsPandaTime,
  onPandaTrigger,
  onPhysicsPandaTrigger,
  selectedDeviceId,
  videoResolution,
}) => {
  const [currentFps, setCurrentFps] = useState<number>(0);
  const [wavePandaCountdown, setWavePandaCountdown] = useState<string>('--:--');
  const [physicsPandaCountdown, setPhysicsPandaCountdown] =
    useState<string>('--:--');

  // Measure actual video stream FPS using video element events
  useEffect(() => {
    if (!stream) {
      setCurrentFps(0);
      return;
    }

    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFps = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime - lastTime >= 1000) {
        setCurrentFps(
          Math.round((frameCount * 1000) / (currentTime - lastTime)),
        );
        frameCount = 0;
        lastTime = currentTime;
      }

      animationId = requestAnimationFrame(measureFps);
    };

    animationId = requestAnimationFrame(measureFps);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [stream]);

  // Update countdown timers
  useEffect(() => {
    const createCountdownUpdater = (
      nextTime: number | null,
      setter: React.Dispatch<React.SetStateAction<string>>,
    ) => {
      if (!nextTime) {
        setter('--:--');
        return () => {
          /* no-op */
        };
      }

      const update = () => {
        const now = Date.now();
        const timeRemaining = nextTime - now;

        if (timeRemaining <= 0) {
          setter('00:00');
          return;
        }

        const minutes = Math.floor(timeRemaining / 60000);
        const seconds = Math.floor((timeRemaining % 60000) / 1000);
        setter(`${minutes}m${seconds.toString().padStart(2, '0')}s`);
      };

      update();
      const interval = setInterval(update, 1000);
      return () => clearInterval(interval);
    };

    const waveCleanup = createCountdownUpdater(
      nextPandaTime,
      setWavePandaCountdown,
    );
    const physicsCleanup = createCountdownUpdater(
      nextPhysicsPandaTime,
      setPhysicsPandaCountdown,
    );

    return () => {
      waveCleanup();
      physicsCleanup();
    };
  }, [nextPandaTime, nextPhysicsPandaTime]);

  const videoTrack = stream?.getVideoTracks()?.[0];
  const settings = videoTrack?.getSettings();

  const valueStyles = {
    color: 'primary.500',
    fontFamily: 'monospace',
    fontWeight: 'md',
    ml: 1.5,
    textAlign: 'right',
  };
  const labelStyles = {
    color: 'text.tertiary',
    fontSize: '0.8rem',
  };

  return (
    <Box
      sx={{
        backdropFilter: 'blur(8px)',
        backgroundColor: 'rgba(10, 10, 10, 0.8)',
        border: '1px solid',
        borderColor: 'neutral.700',
        borderRadius: 'lg',
        boxShadow: 'md',
        color: 'neutral.200',
        fontSize: '0.875rem',
        maxWidth: '300px',
        padding: '12px 18px',
        position: 'absolute',
        right: '20px',
        top: '20px',
        transition: 'opacity 0.3s ease-in-out, visibility 0.3s ease-in-out',
        // zIndex: 20,
      }}>
      <Typography
        level="title-md"
        onClick={onPandaTrigger}
        sx={{
          '&:hover': {
            color: 'primary.300',
          },
          color: 'neutral.50',
          cursor: 'pointer',
          mb: 1.5,
          textAlign: 'center',
        }}>
        Debug Info
      </Typography>
      {[
        {
          label: 'Device ID',
          value:
            (selectedDeviceId?.substring(0, 10) ?? 'N/A') +
            (selectedDeviceId && selectedDeviceId.length > 10 ? '...' : ''),
        },
        {
          label: 'Label',
          value:
            (videoTrack?.label?.substring(0, 25) ?? 'N/A') +
            (videoTrack?.label && videoTrack.label.length > 25 ? '...' : ''),
        },
        {
          label: 'Actual Res',
          value: `${videoResolution.width ?? '-'}x${videoResolution.height ?? '-'}`,
        },
        {
          label: 'Set FPS',
          value: settings?.frameRate?.toFixed(1) ?? 'N/A',
        },
        {
          label: 'Display FPS',
          value: currentFps,
        },
        {
          label: 'Fill Mode',
          value: fillMode,
        },
        {
          label: 'Flipped',
          value: isFlipped.toString(),
        },
        {
          label: 'Wave Countdown',
          value: wavePandaCountdown,
        },
        {
          label: 'Physics Countdown',
          value: physicsPandaCountdown,
        },
      ].map((item) => (
        <Box
          component="div"
          key={item.label}
          sx={{
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'space-between',
            py: 0.5,
          }}>
          <Typography component="span" sx={labelStyles}>
            {item.label}:
          </Typography>
          <Typography component="span" sx={valueStyles}>
            {item.value}
          </Typography>
        </Box>
      ))}

      <Typography
        level="title-md"
        onClick={onPhysicsPandaTrigger}
        sx={{
          '&:hover': {
            color: 'primary.300',
          },
          borderColor: 'neutral.700',
          borderTop: '1px solid',
          color: 'neutral.50',
          cursor: 'pointer',
          mb: 1.5,
          mt: 1.5,
          pt: 1.5,
          textAlign: 'center',
        }}>
        Physics Panda
      </Typography>
    </Box>
  );
};

export default DebugInfo;
