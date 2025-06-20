import Box from '@mui/joy/Box';
import {useCallback, useEffect, useRef, useState} from 'react';

import ContinuityCameraHelpModal from './ContinuityCameraHelpModal';
import Controls from './Controls';
import DebugInfo from './DebugInfo';
import PandaWaveAnimation from './PandaWaveAnimation';

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
  const [isContinuityCameraHelpOpen, setIsContinuityCameraHelpOpen] =
    useState<boolean>(false);
  const [videoResolution, setVideoResolution] = useState<{
    height: number | undefined;
    width: number | undefined;
  }>({height: undefined, width: undefined});
  const [isPandaAnimationTriggered, setIsPandaAnimationTriggered] =
    useState<boolean>(false);
  const pandaAutoTriggerTimeoutRef = useRef<number | null>(null);
  const controlsTimeoutRef = useRef<number | null>(null);
  const appContainerRef = useRef<HTMLDivElement>(null); // Ref for the main container
  const initialStreamAcquiredRef = useRef<boolean>(false); // Track if we've already initialized a stream
  const videoRef = useRef<HTMLVideoElement>(null);
  const previousDevicesRef = useRef<MediaDeviceInfo[]>([]); // Track previous device list for change detection

  const HIDE_CONTROLS_DELAY = 10000;

  // Central function to update stream based on a device ID
  const streamRef = useRef<MediaStream | null>(null);

  // Helper function to format device data for console.table
  const formatDevicesForTable = useCallback((deviceList: MediaDeviceInfo[]) => {
    return deviceList.map((device, index) => ({
      DeviceId: device.deviceId.slice(0, 20) + '...',
      // Truncate for readability
      GroupId: device.groupId?.slice(0, 20) + '...' || 'N/A',

      Index: index,
      Label: device.label || `Camera ${index + 1}`,
    }));
  }, []);

  // Helper function to detect and log device changes
  const logDeviceChanges = useCallback(
    (oldDevices: MediaDeviceInfo[], newDevices: MediaDeviceInfo[]) => {
      const oldDeviceIds = new Set(oldDevices.map((d) => d.deviceId));
      const newDeviceIds = new Set(newDevices.map((d) => d.deviceId));

      const addedDevices = newDevices.filter(
        (d) => !oldDeviceIds.has(d.deviceId),
      );
      const removedDevices = oldDevices.filter(
        (d) => !newDeviceIds.has(d.deviceId),
      );

      if (addedDevices.length > 0) {
        console.log('📹 New cameras detected:');
        console.table(formatDevicesForTable(addedDevices));
      }

      if (removedDevices.length > 0) {
        console.log('❌ Cameras removed:');
        console.table(formatDevicesForTable(removedDevices));
      }

      if (addedDevices.length === 0 && removedDevices.length === 0) {
        console.log(
          '🔄 Device change event detected but no camera changes found',
        );
      }
    },
    [formatDevicesForTable],
  );

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

        // Get a basic stream first to check capabilities
        let capabilityStream: MediaStream | null = null;
        try {
          capabilityStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {deviceId: {exact: deviceId}},
          });
          const track = capabilityStream.getVideoTracks()[0];
          if (track) {
            const capabilities = track.getCapabilities();
            console.log('Device capabilities:', capabilities);
          }
        } catch (err) {
          console.warn('Could not get device capabilities:', err);
        } finally {
          if (capabilityStream) {
            capabilityStream.getTracks().forEach((track) => track.stop());
          }
        }

        // Try constraints with progressive fallback
        const constraintSets = [
          // First try: High quality with high framerate
          {
            deviceId: {exact: deviceId},
            frameRate: {ideal: 60, min: 30},
            height: {ideal: 1080, min: 720},
            width: {ideal: 1920, min: 1280},
          },
          // Second try: Medium quality with medium framerate
          {
            deviceId: {exact: deviceId},
            frameRate: {ideal: 30, min: 15},
            height: {ideal: 720, min: 480},
            width: {ideal: 1280, min: 640},
          },
          // Third try: Basic quality
          {
            deviceId: {exact: deviceId},
            height: {ideal: 480},
            width: {ideal: 640},
          },
          // Last resort: Just the device ID
          {
            deviceId: {exact: deviceId},
          },
        ];

        let newStream: MediaStream | null = null;
        let lastError: Error | null = null;

        for (let i = 0; i < constraintSets.length; i++) {
          const constraints: MediaStreamConstraints = {
            audio: false,
            video: constraintSets[i],
          };

          try {
            console.log(`Trying constraint set ${i + 1}:`, constraints.video);
            newStream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log(`Success with constraint set ${i + 1}`);
            break;
          } catch (err) {
            console.log(`Constraint set ${i + 1} failed:`, err);
            lastError = err instanceof Error ? err : new Error(String(err));
            if (i === constraintSets.length - 1) {
              throw lastError;
            }
          }
        }

        if (!newStream) {
          throw lastError ?? new Error('Failed to get media stream');
        }

        // Log capabilities and settings with better formatting
        const videoTracks = newStream.getVideoTracks();
        if (videoTracks.length > 0) {
          const firstTrack = videoTracks[0];
          if (firstTrack) {
            const capabilities = firstTrack.getCapabilities();
            console.log('📋 Video track capabilities:');
            console.table({
              'Aspect Ratio': `${capabilities.aspectRatio?.min ?? 'N/A'} - ${capabilities.aspectRatio?.max ?? 'N/A'}`,
              'Facing Mode': capabilities.facingMode?.join(', ') ?? 'N/A',
              'Frame Rate': `${capabilities.frameRate?.min ?? 'N/A'} - ${capabilities.frameRate?.max ?? 'N/A'} fps`,
              Height: `${capabilities.height?.min ?? 'N/A'} - ${capabilities.height?.max ?? 'N/A'} px`,
              Width: `${capabilities.width?.min ?? 'N/A'} - ${capabilities.width?.max ?? 'N/A'} px`,
            });

            const trackSettings = firstTrack.getSettings();
            console.log('⚙️ Active track settings:');
            console.table({
              'Aspect Ratio': trackSettings.aspectRatio ?? 'N/A',
              'Device ID': trackSettings.deviceId
                ? trackSettings.deviceId.slice(0, 20) + '...'
                : 'N/A',
              'Facing Mode': trackSettings.facingMode ?? 'N/A',
              'Frame Rate': `${trackSettings.frameRate ?? 'N/A'} fps`,
              Height: `${trackSettings.height ?? 'N/A'} px`,
              Width: `${trackSettings.width ?? 'N/A'} px`,
            });
          }
        } else {
          console.log('❌ No video tracks found on the new stream.');
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
        const videoDevices = allDevices.filter(
          (device) => device.kind === 'videoinput',
        );

        console.log('📹 Initial camera enumeration:');
        console.table(formatDevicesForTable(videoDevices));

        setDevices(videoDevices);
        previousDevicesRef.current = videoDevices;

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
  }, [devices.length, formatDevicesForTable]);

  // Dynamic device detection effect - listens for device changes
  useEffect(() => {
    const handleDeviceListChange = async () => {
      console.log('🔄 Device change detected, re-enumerating devices');
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter(
          (device) => device.kind === 'videoinput',
        );

        // Log exactly what changed
        logDeviceChanges(previousDevicesRef.current, videoDevices);

        // Update current device list and tracking
        setDevices(videoDevices);
        previousDevicesRef.current = videoDevices;

        // Check if currently selected device still exists
        if (
          selectedDeviceId &&
          !videoDevices.some((d) => d.deviceId === selectedDeviceId)
        ) {
          console.log(
            'Currently selected device was removed:',
            selectedDeviceId,
          );
          // Currently selected device was removed
          if (videoDevices.length > 0) {
            // Switch to first available device
            console.log(
              'Switching to first available device:',
              videoDevices[0]?.deviceId,
            );
            const newDeviceId = videoDevices[0]?.deviceId;
            if (newDeviceId) {
              setSelectedDeviceId(newDeviceId);
              updateStream(newDeviceId).catch((err) => {
                console.error(
                  'Error switching to new device after device change:',
                  err,
                );
              });
            }
          } else {
            // No cameras available
            console.log('No cameras available after device change');
            setSelectedDeviceId(undefined);
            if (streamRef.current) {
              streamRef.current.getTracks().forEach((track) => track.stop());
              streamRef.current = null;
              setStream(null);
            }
            setError(
              'No cameras are currently available. Please connect a camera.',
            );
          }
        }
      } catch (err) {
        console.error('Error re-enumerating devices after device change:', err);
        setError('Error detecting camera changes. Please refresh the page.');
      }
    };

    // Only add listener after initial device enumeration
    if (devices.length > 0) {
      const deviceChangeHandler = () => {
        handleDeviceListChange().catch((err) => {
          console.error('Error in device change handler:', err);
        });
      };

      navigator.mediaDevices.addEventListener(
        'devicechange',
        deviceChangeHandler,
      );

      return () => {
        navigator.mediaDevices.removeEventListener(
          'devicechange',
          deviceChangeHandler,
        );
      };
    }

    return;
  }, [devices.length, selectedDeviceId, updateStream, logDeviceChanges]);

  // Effect to initialize stream once when selectedDeviceId becomes available
  useEffect(() => {
    if (selectedDeviceId && !initialStreamAcquiredRef.current) {
      initialStreamAcquiredRef.current = true;
      updateStream(selectedDeviceId).catch((err) => {
        console.error('Error initializing stream:', err);
      });
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

  // Generate random interval between 5-20 minutes (in milliseconds)
  const getRandomPandaInterval = useCallback(() => {
    const minMinutes = 5;
    const maxMinutes = 20;
    const randomMinutes =
      Math.random() * (maxMinutes - minMinutes) + minMinutes;
    return randomMinutes * 60 * 1000; // Convert to milliseconds
  }, []);

  // Schedule the next auto-trigger with random timing
  const scheduleNextPandaAutoTrigger = useCallback(() => {
    // Clear any existing timeout
    if (pandaAutoTriggerTimeoutRef.current) {
      clearTimeout(pandaAutoTriggerTimeoutRef.current);
    }

    const nextInterval = getRandomPandaInterval();
    const nextVisitTime = new Date(Date.now() + nextInterval);
    const minutesFromNow = (nextInterval / 60000).toFixed(1);

    console.log(
      `🐼 Next panda visit scheduled in ${minutesFromNow} minutes (at ${nextVisitTime.toLocaleTimeString()})`,
    );

    pandaAutoTriggerTimeoutRef.current = window.setTimeout(() => {
      console.log('🐼 Auto-triggering panda animation! 🎬');
      setIsPandaAnimationTriggered(true);
    }, nextInterval);
  }, [getRandomPandaInterval]);

  // Initialize panda auto-trigger system
  useEffect(() => {
    // Wait 5 minutes after app opens, then start the random trigger system
    const initialDelayTimeout = window.setTimeout(
      () => {
        console.log(
          '🐼 Panda auto-trigger system activated! Starting random visit schedule...',
        );
        scheduleNextPandaAutoTrigger();
      },
      5 * 60 * 1000,
    ); // 5 minutes

    // Cleanup on unmount
    return () => {
      clearTimeout(initialDelayTimeout);
      if (pandaAutoTriggerTimeoutRef.current) {
        clearTimeout(pandaAutoTriggerTimeoutRef.current);
      }
    };
  }, [scheduleNextPandaAutoTrigger]);

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
  const handleContinuityCameraHelpOpen = () =>
    setIsContinuityCameraHelpOpen(true);
  const handleContinuityCameraHelpClose = () =>
    setIsContinuityCameraHelpOpen(false);
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
  const handlePandaTrigger = () => setIsPandaAnimationTriggered(true);
  const handlePandaAnimationComplete = () => {
    setIsPandaAnimationTriggered(false);
    console.log('🐼 Panda animation completed! Scheduling next visit...');
    // Schedule the next random auto-trigger
    scheduleNextPandaAutoTrigger();
  };

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
        onContinuityCameraHelpOpen={handleContinuityCameraHelpOpen}
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
          onPandaTrigger={handlePandaTrigger}
          selectedDeviceId={selectedDeviceId}
          stream={stream}
          videoResolution={videoResolution}
        />
      )}

      <ContinuityCameraHelpModal
        onClose={handleContinuityCameraHelpClose}
        open={isContinuityCameraHelpOpen}
      />

      <PandaWaveAnimation
        isTriggered={isPandaAnimationTriggered}
        onAnimationComplete={handlePandaAnimationComplete}
      />
    </Box>
  );
}

export default App;
