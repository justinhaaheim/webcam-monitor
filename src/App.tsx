import Box from '@mui/joy/Box';
import {useCallback, useEffect, useRef, useState} from 'react';

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
  const initialStreamAcquiredRef = useRef<boolean>(false); // Track if we've already initialized a stream
  const videoRef = useRef<HTMLVideoElement>(null);

  const HIDE_CONTROLS_DELAY = 10000;

  // Central function to update stream based on a device ID
  const streamRef = useRef<MediaStream | null>(null);

  const updateStream = useCallback(
    async (deviceId?: string) => {
      // First stop any existing stream
      if (streamRef.current) {
        console.log('Stopping tracks on existing stream');
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setStream(null);
      }

      // If no deviceId is provided, just leave the stream as null
      if (!deviceId) {
        console.log('No device ID provided, stream will remain null');
        return;
      }

      try {
        console.log(`Requesting media for deviceId: ${deviceId}`);

        // First check device capabilities
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const device = allDevices.find((d) => d.deviceId === deviceId);
        console.log('Selected device:', device);

        const constraints: MediaStreamConstraints = {
          audio: false,
          video: {
            deviceId: {exact: deviceId},
            frameRate: {ideal: 60, min: 30},
            height: {ideal: 1080, min: 720},
            width: {ideal: 1920, min: 1280},
          },
        };

        const newStream =
          await navigator.mediaDevices.getUserMedia(constraints);

        // Log capabilities and settings
        const videoTracks = newStream.getVideoTracks();
        if (videoTracks.length > 0) {
          const firstTrack = videoTracks[0];
          if (firstTrack) {
            const capabilities = firstTrack.getCapabilities();
            console.log(
              'Video track capabilities:',
              JSON.stringify(capabilities, null, 2),
            );
            const allTrackSettings = videoTracks.map((track) =>
              track.getSettings(),
            );
            console.log(
              'Actual video track settings (all tracks):',
              JSON.stringify(allTrackSettings, null, 2),
            );
          }
        } else {
          console.log('No video tracks found on the new stream.');
        }

        // Set the new stream to state and ref
        streamRef.current = newStream;
        setStream(newStream);
        setError(null);

        // Store the successfully selected device ID
        localStorage.setItem('selectedVideoDeviceId', deviceId);
      } catch (err) {
        console.error(`Error accessing webcam for deviceId: ${deviceId}`, err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error('Full error object:', err);
        setError(
          `Error accessing camera: ${errorMessage || 'Unknown error'}. It might not support the requested resolution/framerate or is in use.`,
        );
        // Ensure stream is cleared on error (already set to null above)
      }
    },
    [], // No dependencies needed since we use ref
  );

  // Event handler for device change - called by dropdown
  const handleDeviceChange = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    void updateStream(deviceId); // Immediately update the stream (imperative)
  };

  const showControlsAndResetTimer = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      setControlsVisible(false);
    }, HIDE_CONTROLS_DELAY);
  };

  // Fullscreen effect - this is fine as is
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Controls visibility effect - this is fine as is
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

  // Initial device enumeration effect - runs once on mount
  useEffect(() => {
    const getDevicesAndPermissions = async () => {
      try {
        // Request initial permission (stream is temporary and stopped immediately)
        const permissionStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: true, // Simple constraint just for permission
        });
        permissionStream.getTracks().forEach((track) => track.stop());

        // Enumerate devices
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        console.log('All devices:', allDevices);
        const videoDevices = allDevices.filter(
          (device) => device.kind === 'videoinput',
        );
        setDevices(videoDevices);

        // Set initial selected device if devices exist and none is selected
        if (videoDevices.length > 0) {
          // Check local storage for a previously selected device
          const storedDeviceId = localStorage.getItem('selectedVideoDeviceId');
          if (
            storedDeviceId &&
            videoDevices.some((d) => d.deviceId === storedDeviceId)
          ) {
            setSelectedDeviceId(storedDeviceId);
          } else if (videoDevices[0]?.deviceId) {
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

    // Only run if we haven't set up devices yet
    if (devices.length === 0) {
      void getDevicesAndPermissions();
    }
  }, [devices.length]);

  // Effect to initialize stream once when selectedDeviceId becomes available
  useEffect(() => {
    if (selectedDeviceId && !initialStreamAcquiredRef.current) {
      initialStreamAcquiredRef.current = true;
      void updateStream(selectedDeviceId);
    }
  }, [selectedDeviceId, updateStream]);

  // Effect to cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        console.log('Component unmounting, stopping all tracks');
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []); // No dependencies needed since we use ref

  // Video metadata effect - this is fine as is
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
    return;
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
          display: 'block',
          height: '100%',
          maxHeight: '100%',
          maxWidth: '100%',
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
