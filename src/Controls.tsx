import './Controls.css'; // We'll create this next

import React from 'react';

interface ControlsProps {
  devices: MediaDeviceInfo[];
  fillMode: 'cover' | 'contain';
  isFlipped: boolean;
  isVisible: boolean;
  onDeviceChange: (deviceId: string) => void;
  onFillModeToggle: () => void;
  onFlipToggle: () => void;
  onFullscreen: () => void;
  selectedDeviceId: string | undefined;
}

const Controls: React.FC<ControlsProps> = ({
  devices,
  selectedDeviceId,
  onDeviceChange,
  isFlipped,
  onFlipToggle,
  fillMode,
  onFillModeToggle,
  onFullscreen,
  isVisible,
}) => {
  if (!isVisible) {
    return null;
  }

  return (
    <div className={`controls-overlay ${isVisible ? '' : 'hidden'}`}>
      <div className="control-group">
        <label htmlFor="webcam-select">Camera:</label>
        <select
          disabled={devices.length === 0}
          id="webcam-select"
          onChange={(e) => onDeviceChange(e.target.value)}
          value={selectedDeviceId ?? ''}>
          {devices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Camera ${device.deviceId.substring(0, 8)}`}
            </option>
          ))}
        </select>
      </div>

      <div className="control-group">
        <button
          onClick={onFlipToggle}
          title={isFlipped ? 'Unflip Video' : 'Flip Video Horizontally'}>
          {isFlipped ? 'Unflip' : 'Flip'} {/* Icon could go here */}
        </button>
      </div>

      <div className="control-group">
        <button
          onClick={onFillModeToggle}
          title={fillMode === 'cover' ? 'Contain Video' : 'Fill Container'}>
          {fillMode === 'cover' ? 'Contain' : 'Fill'} {/* Icon could go here */}
        </button>
      </div>

      <div className="control-group">
        <button onClick={onFullscreen} title="Enter Fullscreen">
          Fullscreen {/* Icon could go here */}
        </button>
      </div>
    </div>
  );
};

export default Controls;
