import './App.css';

import {useEffect, useRef, useState} from 'react';
// import WebcamFeed from './WebcamFeed'; // To be created
// import Controls from './Controls'; // To be created
// import DebugInfo from './DebugInfo'; // To be created

interface MediaDeviceInfoExtended extends MediaDeviceInfo {
  id: string;
}

function App() {
  const [devices, setDevices] = useState<MediaDeviceInfoExtended[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(
    undefined,
  );
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [fillMode, setFillMode] = useState<'cover' | 'contain'>('cover'); // 'cover' for fill, 'contain' for contain
  const [showDebugInfo, setShowDebugInfo] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get available media devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        // Request permission first to ensure labels are populated
        await navigator.mediaDevices.getUserMedia({audio: false, video: true});
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter(
          (device) => device.kind === 'videoinput',
        ) as MediaDeviceInfoExtended[];
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
            audio: false,
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
    }
  }, [stream]);

  if (error && devices.length === 0) {
    return (
      <div className="app-error">
        Error: {error} Please ensure you have a camera connected and granted
        permissions.
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* 
        Placeholder for WebcamFeed, Controls, DebugInfo.
        These will be developed in subsequent steps.
      */}
      <p>Webcam App Placeholder</p>
      {error && <p style={{color: 'red'}}>{error}</p>}

      <video
        autoPlay
        playsInline
        ref={videoRef}
        style={{
          backgroundColor: 'black',
          height: '100%',
          maxHeight: '100vh',
          maxWidth: '100vw',
          objectFit: fillMode,
          transform: isFlipped ? 'scaleX(-1)' : 'scaleX(1)',
          width: '100%',
        }}
      />

      <div>
        <h3>Available Video Devices:</h3>
        {devices.length === 0 && (
          <p>
            No video devices found. Make sure your camera is connected and
            permissions are granted.
          </p>
        )}
        <select
          disabled={devices.length === 0}
          onChange={(e) => setSelectedDeviceId(e.target.value)}
          value={selectedDeviceId}>
          {devices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Camera ${device.deviceId.substring(0, 8)}`}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h3>Controls (Temporary):</h3>
        <button onClick={() => setIsFlipped(!isFlipped)}>
          {isFlipped ? 'Unflip' : 'Flip Horizontal'}
        </button>
        <button
          onClick={() =>
            setFillMode(fillMode === 'cover' ? 'contain' : 'cover')
          }>
          {fillMode === 'cover' ? 'Contain Video' : 'Fill Container'}
        </button>
        <button onClick={() => setShowDebugInfo(!showDebugInfo)}>
          {showDebugInfo ? 'Hide Debug' : 'Show Debug'}
        </button>
      </div>

      {showDebugInfo && (
        <div>
          <h3>Debug Info (Temporary):</h3>
          <p>Selected Device ID: {selectedDeviceId}</p>
          <p>Flipped: {isFlipped.toString()}</p>
          <p>Fill Mode: {fillMode}</p>
          {stream?.getVideoTracks()?.[0] && (
            <>
              <p>Device Label: {stream.getVideoTracks()[0].label}</p>
              <p>
                Requested Frame Rate:{' '}
                {stream.getVideoTracks()[0].getSettings()?.frameRate} fps
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
