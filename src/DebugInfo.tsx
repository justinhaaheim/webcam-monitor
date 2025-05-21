import './DebugInfo.css'; // We'll create this next

import React, {useEffect, useRef, useState} from 'react';

interface DebugInfoProps {
  fillMode: 'cover' | 'contain';
  isFlipped: boolean;
  selectedDeviceId: string | undefined;
  stream: MediaStream | null;
  videoResolution: {height: number | undefined; width: number | undefined};
  // FPS will be calculated internally
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
        // Update FPS every second
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

  return (
    <div className="debug-info-panel">
      <p>
        <strong>Debug Information</strong>
      </p>
      <p>
        Device ID: <span>{selectedDeviceId?.substring(0, 10)}...</span>
      </p>
      <p>
        Label: <span>{videoTrack?.label ?? 'N/A'}</span>
      </p>
      <p>
        Actual Res:{' '}
        <span>
          {videoResolution.width ?? 'N/A'}x{videoResolution.height ?? 'N/A'}
        </span>
      </p>
      <p>
        Set FPS: <span>{settings?.frameRate?.toFixed(1) ?? 'N/A'}</span>
      </p>
      <p>
        Render FPS: <span>{currentFps}</span>
      </p>
      <p>
        Fill Mode: <span>{fillMode}</span>
      </p>
      <p>
        Flipped: <span>{isFlipped.toString()}</span>
      </p>
    </div>
  );
};

export default DebugInfo;
