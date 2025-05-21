import './App.css';

import {useEffect, useRef, useState} from 'react';

import Controls from './Controls'; // Import the new Controls component
import DebugInfo from './DebugInfo'; // Import the DebugInfo component
// import DebugInfo from './DebugInfo'; // To be created

function App() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(
    undefined,
  );
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [fillMode, setFillMode] = useState<'cover' | 'contain'>('cover'); // 'cover' for fill, 'contain' for contain
  const [showDebugInfo, setShowDebugInfo] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [videoResolution, setVideoResolution] = useState<{
    height: number | undefined;
    width: number | undefined;
  }>({height: undefined, width: undefined});
  const controlsTimeoutRef = useRef<number | null>(null);

  const HIDE_CONTROLS_DELAY = 3000; // 3 seconds

  // Function to show controls and reset hide timer
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
    // Initial call to show controls and start timer
    showControlsAndResetTimer();

    // Event listeners for activity on the app container
    const appContainer = document.getElementById('app-main-container'); // Assuming app-container has this ID or use a ref
    if (appContainer) {
      appContainer.addEventListener('mousemove', showControlsAndResetTimer);
      appContainer.addEventListener('mousedown', showControlsAndResetTimer);
    }
    // Listen for keydown on window as it might not be focused on appContainer
    window.addEventListener('keydown', showControlsAndResetTimer);

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (appContainer) {
        appContainer.removeEventListener(
          'mousemove',
          showControlsAndResetTimer,
        );
        appContainer.removeEventListener(
          'mousedown',
          showControlsAndResetTimer,
        );
      }
      window.removeEventListener('keydown', showControlsAndResetTimer);
    };
  }, []); // Run only on mount and unmount

  // Get available media devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        // Request permission first to ensure labels are populated
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
  }, [selectedDeviceId]); // Rerun if selectedDeviceId changes to ensure it's still valid

  // Effect to get and set the media stream based on selected device
  useEffect(() => {
    if (selectedDeviceId) {
      // Stop any existing stream before starting a new one
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const getMedia = async () => {
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({
            video: {deviceId: {exact: selectedDeviceId}}, // No audio needed
          });
          setStream(newStream);
          setError(null); // Clear previous errors
        } catch (err) {
          console.error('Error accessing webcam:', err);
          setError(
            `Error accessing selected camera. It might be in use or unavailable. Try another one.`,
          );
          setStream(null);
        }
      };
      void getMedia();

      // Cleanup function to stop the stream when component unmounts or device changes
      return () => {
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDeviceId]); // Only re-run when selectedDeviceId changes

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      // Listen for loadedmetadata to get initial video dimensions
      const handleLoadedMetadata = () => {
        if (videoRef.current) {
          setVideoResolution({
            height: videoRef.current.videoHeight,
            width: videoRef.current.videoWidth,
          });
        }
      };
      videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);

      // Optional: Listen for resize events on the video element if its display size can change
      // and you want to track that separately from the intrinsic video resolution.
      // For intrinsic resolution, loadedmetadata is usually enough.

      return () => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        videoRef.current?.removeEventListener(
          'loadedmetadata',
          handleLoadedMetadata,
        );
      };
    }
  }, [stream]);

  if (error && devices.length === 0) {
    return (
      <div className="app-error">
        Error: {error} Please ensure you have a camera connected and permissions
        are granted.
      </div>
    );
  }

  // TODO: Implement actual components for these
  const handleDeviceChange = (deviceId: string) =>
    setSelectedDeviceId(deviceId);
  const handleFlipToggle = () => setIsFlipped(!isFlipped);
  const handleFillModeToggle = () =>
    setFillMode(fillMode === 'cover' ? 'contain' : 'cover');
  const handleFullscreen = () => {
    if (videoRef.current?.parentElement) {
      void videoRef.current.parentElement.requestFullscreen();
    }
  };
  const handleDebugToggle = () => setShowDebugInfo(!showDebugInfo);

  return (
    <div className="app-container" id="app-main-container">
      {error && <p style={{color: 'red'}}>{error}</p>}

      <video
        autoPlay
        className="webcam-video"
        playsInline
        ref={videoRef}
        style={{
          objectFit: fillMode,
          transform: isFlipped ? 'scaleX(-1)' : 'scaleX(1)',
        }}
      />

      <Controls
        devices={devices}
        fillMode={fillMode}
        isFlipped={isFlipped}
        isVisible={controlsVisible}
        onDeviceChange={handleDeviceChange}
        onFillModeToggle={handleFillModeToggle}
        onFlipToggle={handleFlipToggle}
        onFullscreen={handleFullscreen}
        selectedDeviceId={selectedDeviceId}
      />

      {/* Debug Toggle Button */}
      <button
        className="debug-toggle-button"
        onClick={handleDebugToggle}
        title={
          showDebugInfo ? 'Hide Debug Information' : 'Show Debug Information'
        }>
        {showDebugInfo ? 'DBG' : 'DBG'} {/* Simple label, could be an icon */}
      </button>

      {showDebugInfo && (
        <DebugInfo
          fillMode={fillMode}
          isFlipped={isFlipped}
          selectedDeviceId={selectedDeviceId}
          stream={stream}
          videoResolution={videoResolution}
        />
      )}

      {/* --- Temporary Controls & Info - Will be replaced by components --- */}
      {/* REMOVED OLD TEMPORARY DEBUG INFO FROM HERE */}
      {/* --- End Temporary --- */}
    </div>
  );
}

export default App;
