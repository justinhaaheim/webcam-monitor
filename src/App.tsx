import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import {useEffect, useRef, useState} from 'react';

import Controls from './Controls';
import DebugInfo from './DebugInfo';

// Removed import './App.css';

function App() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(
    undefined,
  );
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [fillMode, setFillMode] = useState<'cover' | 'contain'>('cover');
  const [showDebugInfo, setShowDebugInfo] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [videoResolution, setVideoResolution] = useState<{
    height: number | undefined;
    width: number | undefined;
  }>({height: undefined, width: undefined});
  const controlsTimeoutRef = useRef<number | null>(null);
  const appContainerRef = useRef<HTMLDivElement>(null); // Ref for the main container

  const HIDE_CONTROLS_DELAY = 10000;

  const showControlsAndResetTimer = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      setControlsVisible(false);
    }, HIDE_CONTROLS_DELAY);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    showControlsAndResetTimer();
    const currentAppContainer = appContainerRef.current;

    if (currentAppContainer) {
      currentAppContainer.addEventListener(
        'mousemove',
        showControlsAndResetTimer,
      );
      currentAppContainer.addEventListener(
        'mousedown',
        showControlsAndResetTimer,
      );
    }
    window.addEventListener('keydown', showControlsAndResetTimer);

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (currentAppContainer) {
        currentAppContainer.removeEventListener(
          'mousemove',
          showControlsAndResetTimer,
        );
        currentAppContainer.removeEventListener(
          'mousedown',
          showControlsAndResetTimer,
        );
      }
      window.removeEventListener('keydown', showControlsAndResetTimer);
    };
  }, []);

  useEffect(() => {
    const getDevices = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({audio: false, video: true});
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter(
          (device) => device.kind === 'videoinput',
        );
        setDevices(videoDevices);
        if (videoDevices.length > 0 && !selectedDeviceId) {
          if (videoDevices[0]?.deviceId) {
            setSelectedDeviceId(videoDevices[0].deviceId);
          }
        }
      } catch (err) {
        console.error(
          'Error enumerating devices or getting initial permission:',
          err,
        );
        setError(
          'Could not access camera. Please ensure permissions are granted and a camera is available.',
        );
      }
    };
    void getDevices();
  }, [selectedDeviceId]);

  useEffect(() => {
    if (selectedDeviceId) {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      const getMedia = async () => {
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {deviceId: {exact: selectedDeviceId}},
          });
          setStream(newStream);
          setError(null);
        } catch (err) {
          console.error('Error accessing webcam:', err);
          setError(
            `Error accessing selected camera. It might be in use or unavailable. Try another one.`,
          );
          setStream(null);
        }
      };
      void getMedia();
      return () => {
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDeviceId]);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const currentVideoRef = videoRef.current;
    if (currentVideoRef && stream) {
      currentVideoRef.srcObject = stream;
      const handleLoadedMetadata = () => {
        if (currentVideoRef) {
          setVideoResolution({
            height: currentVideoRef.videoHeight,
            width: currentVideoRef.videoWidth,
          });
        }
      };
      currentVideoRef.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => {
        currentVideoRef?.removeEventListener(
          'loadedmetadata',
          handleLoadedMetadata,
        );
      };
    }
  }, [stream]);

  if (error && devices.length === 0) {
    return (
      <Box
        sx={{
          alignItems: 'center',
          backgroundColor: 'black',
          color: 'white',
          display: 'flex',
          fontSize: '1.2em',
          height: '100vh',
          justifyContent: 'center',
          p: 3,
          textAlign: 'center',
          width: '100vw',
        }}>
        Error: {error} Please ensure you have a camera connected and permissions
        are granted.
      </Box>
    );
  }

  const handleDeviceChange = (deviceId: string) =>
    setSelectedDeviceId(deviceId);
  const handleFlipToggle = () => setIsFlipped(!isFlipped);
  const handleFillModeToggle = () =>
    setFillMode(fillMode === 'cover' ? 'contain' : 'cover');
  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      appContainerRef.current?.requestFullscreen().catch((err: unknown) => {
        if (err instanceof Error) {
          console.error(
            `Error attempting to enable full-screen mode: ${err.message} (${err.name})`,
          );
        } else {
          console.error(
            'An unknown error occurred while enabling full-screen mode.',
            err,
          );
        }
      });
    } else {
      document.exitFullscreen().catch((err: unknown) => {
        if (err instanceof Error) {
          console.error(
            `Error attempting to exit full-screen mode: ${err.message} (${err.name})`,
          );
        } else {
          console.error(
            'An unknown error occurred while exiting full-screen mode.',
            err,
          );
        }
      });
    }
  };
  const handleDebugToggle = () => setShowDebugInfo(!showDebugInfo);

  return (
    <Box
      ref={appContainerRef} // Added ref for event listeners and fullscreen
      sx={{
        alignItems: 'center',
        backgroundColor: 'black',
        display: 'flex',
        height: '100vh',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
        width: '100vw',
      }}>
      <video
        autoPlay
        playsInline
        ref={videoRef}
        style={{
          backgroundColor: 'black',
          height: '100%',
          objectFit: fillMode,
          transform: isFlipped ? 'scaleX(-1)' : 'scaleX(1)',
          width: '100%',
        }}
      />

      {error && !stream && (
        <Box
          sx={{
            backgroundColor: 'rgba(0,0,0,0.7)',
            borderRadius: 'sm',
            color: 'red',
            left: '50%',
            p: 1,
            position: 'absolute',
            top: '10px',
            transform: 'translateX(-50%)',
            zIndex: 100,
          }}>
          {error}
        </Box>
      )}

      <Controls
        devices={devices}
        fillMode={fillMode}
        isFlipped={isFlipped}
        isFullScreen={isFullScreen}
        isVisible={controlsVisible}
        onDebugToggle={handleDebugToggle}
        onDeviceChange={handleDeviceChange}
        onFillModeToggle={handleFillModeToggle}
        onFlipToggle={handleFlipToggle}
        onFullscreen={handleFullscreen}
        selectedDeviceId={selectedDeviceId}
        showDebugInfo={showDebugInfo}
      />

      {showDebugInfo && (
        <DebugInfo
          fillMode={fillMode}
          isFlipped={isFlipped}
          selectedDeviceId={selectedDeviceId}
          stream={stream}
          videoResolution={videoResolution}
        />
      )}
    </Box>
  );
}

export default App;
