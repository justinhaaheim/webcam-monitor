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
    color: 'primary.plainColor',
    fontWeight: 'bold',
    ml: 1,
    textAlign: 'right',
  };
  const labelStyles = {
    color: 'text.secondary',
  };

  return (
    <Box
      sx={{
        backgroundColor: 'background.surface',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 'md',
        bottom: '10px',
        boxShadow: 'sm',
        color: 'text.primary',
        fontSize: '13px',
        maxWidth: '280px',
        padding: '10px 15px',
        position: 'absolute',
        right: '10px',
        transition: 'opacity 0.3s ease-in-out, visibility 0.3s ease-in-out',
        zIndex: 20,
      }}>
      <Typography
        component="p"
        level="title-sm"
        sx={{fontWeight: 'bold', mb: 1, textAlign: 'center'}}>
        Debug Information
      </Typography>
      <Box
        component="div"
        sx={{display: 'flex', justifyContent: 'space-between', m: '6px 0'}}>
        <Typography component="span" sx={labelStyles}>
          Device ID:
        </Typography>
        <Typography component="span" sx={valueStyles}>
          {selectedDeviceId?.substring(0, 10)}...
        </Typography>
      </Box>
      <Box
        component="div"
        sx={{display: 'flex', justifyContent: 'space-between', m: '6px 0'}}>
        <Typography component="span" sx={labelStyles}>
          Label:
        </Typography>
        <Typography component="span" sx={valueStyles}>
          {videoTrack?.label ?? 'N/A'}
        </Typography>
      </Box>
      <Box
        component="div"
        sx={{display: 'flex', justifyContent: 'space-between', m: '6px 0'}}>
        <Typography component="span" sx={labelStyles}>
          Actual Res:
        </Typography>
        <Typography component="span" sx={valueStyles}>
          {videoResolution.width ?? 'N/A'}x{videoResolution.height ?? 'N/A'}
        </Typography>
      </Box>
      <Box
        component="div"
        sx={{display: 'flex', justifyContent: 'space-between', m: '6px 0'}}>
        <Typography component="span" sx={labelStyles}>
          Set FPS:
        </Typography>
        <Typography component="span" sx={valueStyles}>
          {settings?.frameRate?.toFixed(1) ?? 'N/A'}
        </Typography>
      </Box>
      <Box
        component="div"
        sx={{display: 'flex', justifyContent: 'space-between', m: '6px 0'}}>
        <Typography component="span" sx={labelStyles}>
          Render FPS:
        </Typography>
        <Typography component="span" sx={valueStyles}>
          {currentFps}
        </Typography>
      </Box>
      <Box
        component="div"
        sx={{display: 'flex', justifyContent: 'space-between', m: '6px 0'}}>
        <Typography component="span" sx={labelStyles}>
          Fill Mode:
        </Typography>
        <Typography component="span" sx={valueStyles}>
          {fillMode}
        </Typography>
      </Box>
      <Box
        component="div"
        sx={{display: 'flex', justifyContent: 'space-between', m: '6px 0'}}>
        <Typography component="span" sx={labelStyles}>
          Flipped:
        </Typography>
        <Typography component="span" sx={valueStyles}>
          {isFlipped.toString()}
        </Typography>
      </Box>
    </Box>
  );
};

export default DebugInfo;
