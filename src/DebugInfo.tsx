import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import React, {useEffect, useRef, useState} from 'react';

interface DebugInfoProps {
  fillMode: 'cover' | 'contain';
  isFlipped: boolean;
  selectedDeviceId: string | undefined;
  stream: MediaStream | null;
  videoResolution: {height: number | undefined; width: number | undefined};
}

const DebugInfo: React.FC<DebugInfoProps> = ({
  stream,
  fillMode,
  isFlipped,
  selectedDeviceId,
  videoResolution,
}) => {
  const [currentFps, setCurrentFps] = useState<number>(0);
  const fpsCounterRef = useRef<number>(0);
  const lastTimestampRef = useRef<number>(performance.now());

  useEffect(() => {
    let animationFrameId: number;
    const calculateFps = (timestamp: number) => {
      fpsCounterRef.current++;
      const deltaTime = timestamp - lastTimestampRef.current;
      if (deltaTime >= 1000) {
        setCurrentFps(fpsCounterRef.current);
        fpsCounterRef.current = 0;
        lastTimestampRef.current = timestamp;
      }
      animationFrameId = requestAnimationFrame(calculateFps);
    };
    animationFrameId = requestAnimationFrame(calculateFps);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

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
        zIndex: 20,
      }}>
      <Typography
        level="title-md"
        sx={{color: 'neutral.50', mb: 1.5, textAlign: 'center'}}>
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
          label: 'Render FPS',
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
    </Box>
  );
};

export default DebugInfo;
