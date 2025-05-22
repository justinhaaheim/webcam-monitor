import Box from '@mui/joy/Box';
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
    const getDevicesAndPermissions = async () => {
      try {
        // 1. Request initial permission (stream is temporary and stopped immediately)
        // This helps ensure permissions are granted before enumerateDevices is called,
        // which can sometimes return more accurate/complete device labels after permission.
        const permissionStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: true, // Simple constraint just for permission
        });
        permissionStream.getTracks().forEach((track) => track.stop());

        // 2. Enumerate devices
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        console.log('All devices:', allDevices);
        const videoDevices = allDevices.filter(
          (device) => device.kind === 'videoinput',
        );
        setDevices(videoDevices);

        // 3. Set initial selected device if not already set
        if (videoDevices.length > 0 && !selectedDeviceId) {
          // Check local storage for a previously selected device
          const storedDeviceId = localStorage.getItem('selectedVideoDeviceId');
          if (
            storedDeviceId &&
            videoDevices.some((d) => d.deviceId === storedDeviceId)
          ) {
            setSelectedDeviceId(storedDeviceId);
          } else if (videoDevices[0]?.deviceId) {
            setSelectedDeviceId(videoDevices[0].deviceId);
            localStorage.setItem(
              'selectedVideoDeviceId',
              videoDevices[0].deviceId,
            );
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
    void getDevicesAndPermissions();
    // This effect should run once on mount to get initial permissions and devices.
    // selectedDeviceId is included because we use it to determine if we should set a default.
    // However, the core logic of fetching devices and permissions itself doesn't depend on it changing later.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setDevices, setSelectedDeviceId, setError]); // Add stable setters if required by stricter linting, but intent is once.

  // Effect solely for cleaning up the stream when it changes or on unmount
  useEffect(() => {
    // This cleanup function will be called when the `stream` state changes
    // or when the component unmounts.
    return () => {
      if (stream) {
        console.log(
          'Cleanup effect: Stopping all tracks for the current stream.',
        );
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]); // Dependency: only the stream itself.

  // Effect for ACQUIRING the stream when selectedDeviceId changes
  useEffect(() => {
    if (!selectedDeviceId) {
      // If no device is selected, ensure the stream state is null.
      // The cleanup effect above will handle stopping tracks if stream was not already null.
      if (stream !== null) {
        setStream(null);
      }
      return;
    }

    let isActive = true; // Flag to prevent state updates on unmounted component

    const getMedia = async () => {
      // The previous stream (if any, and if different from what we are about to set)
      // will be cleaned up by the separate cleanup effect when setStream is called.
      try {
        const constraints: MediaStreamConstraints = {
          audio: false,
          video: {
            deviceId: {exact: selectedDeviceId},

            // Request HD, allow fallback
            frameRate: {ideal: 60, min: 30},

            // Request HD, allow fallback
            height: {ideal: 1080, min: 720},
            width: {ideal: 1920, min: 1280}, // Request high frame rate, allow fallback
          },
        };
        console.log(
          `Acquisition effect: Requesting media for deviceId: ${selectedDeviceId} with constraints:`,
          JSON.stringify(constraints, null, 2),
        );

        const newStreamInstance =
          await navigator.mediaDevices.getUserMedia(constraints);

        if (isActive) {
          console.log(
            `Acquisition effect: Successfully got new stream for deviceId: ${selectedDeviceId}`,
          );
          const videoTracks = newStreamInstance.getVideoTracks();
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
          setStream(newStreamInstance); // This will trigger the cleanup effect for the *old* stream if it was different
          setError(null);
          localStorage.setItem('selectedVideoDeviceId', selectedDeviceId);
        } else {
          // If the effect became inactive (e.g., component unmounted or selectedDeviceId changed again quickly)
          // stop the stream we just acquired but won't use.
          console.log(
            `Acquisition effect: isActive became false. Stopping tracks for orphaned new stream for deviceId: ${selectedDeviceId}`,
          );
          newStreamInstance.getTracks().forEach((track) => track.stop());
        }
      } catch (err) {
        console.error(
          `Acquisition effect: Error accessing webcam for deviceId: ${selectedDeviceId}`,
          err,
        );
        if (isActive) {
          setError(
            `Error accessing camera: ${err instanceof Error ? err.message : String(err)}. It might not support the requested resolution/framerate or is in use.`,
          );
          // Ensure stream is cleared on error, which will also trigger cleanup effect for any prior stream.
          if (stream !== null) {
            setStream(null);
          }
        }
      }
    };

    void getMedia();

    return () => {
      isActive = false;
      // The main stream cleanup (for streams that made it into state) is handled by the separate effect.
      // The newStreamInstance (local to getMedia) is stopped if isActive is false when getMedia resolves.
      console.log(
        `Acquisition effect cleanup: isActive set to false for deviceId: ${selectedDeviceId}`,
      );
    };
    // This effect runs when selectedDeviceId changes, or when setStream/setError setters change (which are stable).
    // It does *not* depend on the `stream` state directly for its decision to run or acquire media.
  }, [selectedDeviceId, setStream, setError, stream]); // stream needs to be here if we read it to decide to call setStream(null)

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
