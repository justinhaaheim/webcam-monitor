import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Option from '@mui/joy/Option';
import Select from '@mui/joy/Select';
import React from 'react';
// import IconButton from '@mui/joy/IconButton'; // Consider for future icon use
// import { SettingsBrightness } from '@mui/icons-material'; // Example Icon

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

  const handleJoySelectChange = (
    _event: React.SyntheticEvent | null,
    newValue: string | null,
  ) => {
    if (newValue !== null) {
      onDeviceChange(newValue);
    }
  };

  const commonButtonStyles = {
    fontSize: '0.875rem', // Slightly smaller font
    padding: '4px 10px', // Adjust padding for a more compact button
    textTransform: 'none',
    minHeight: '32px', // Ensure consistent height
    boxShadow: 'xs', // Subtle shadow from Joy UI theme
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        padding: '6px', // Reduced padding around the entire control group
        borderRadius: 'lg', // Larger radius for the group container
        display: 'flex',
        alignItems: 'center',
        gap: 1.5, // Adjusted gap using theme spacing unit
        transition: 'opacity 0.3s ease-in-out, visibility 0.3s ease-in-out',
        opacity: isVisible ? 1 : 0,
        visibility: isVisible ? 'visible' : 'hidden',
        // backgroundColor: 'rgba(0, 0, 0, 0.1)', // Optional: very subtle background for the bar
        // backdropFilter: 'blur(4px)', // Optional: frosted glass effect
      }}>
      <FormControl size="sm" sx={{minWidth: 180}}>
        <FormLabel
          sx={{color: 'neutral.plainColor', mb: 0.2, fontSize: '0.75rem'}}>
          {' '}
          {/* Smaller label */}
          Camera
        </FormLabel>
        <Select
          variant="soft" // Softer variant for Select
          color="neutral"
          placeholder="Select camera..."
          value={selectedDeviceId ?? ''}
          onChange={handleJoySelectChange}
          disabled={devices.length === 0}
          slotProps={{
            button: {
              sx: {
                fontSize: '0.875rem',
                minHeight: '32px',
                boxShadow: 'xs',
              },
            },
            listbox: {
              sx: {
                backgroundColor: 'background.popup', // Joy UI token for popup backgrounds
                fontSize: '0.875rem',
              },
            },
          }}>
          {devices.map((device) => (
            <Option key={device.deviceId} value={device.deviceId}>
              {device.label || `Camera ${device.deviceId.substring(0, 10)}...`}
            </Option>
          ))}
        </Select>
      </FormControl>

      <Button
        variant="soft" // Softer variant for buttons
        color="neutral"
        onClick={onFlipToggle}
        title={isFlipped ? 'Unflip Video' : 'Flip Video Horizontally'}
        sx={commonButtonStyles}>
        {isFlipped ? 'Unflip' : 'Flip'}
      </Button>

      <Button
        variant="soft"
        color="neutral"
        onClick={onFillModeToggle}
        title={fillMode === 'cover' ? 'Contain Video' : 'Fill Container'}
        sx={commonButtonStyles}>
        {fillMode === 'cover' ? 'Contain' : 'Fill'}
      </Button>

      <Button
        variant="soft"
        color="neutral"
        onClick={onFullscreen}
        title="Enter Fullscreen"
        sx={commonButtonStyles}>
        Fullscreen
      </Button>
    </Box>
  );
};

export default Controls;
