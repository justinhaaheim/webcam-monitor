import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Option from '@mui/joy/Option';
import Select from '@mui/joy/Select';
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

  const handleJoySelectChange = (
    _event: React.SyntheticEvent | null,
    newValue: string | null,
  ) => {
    if (newValue !== null) {
      onDeviceChange(newValue);
    }
  };

  const commonButtonStyles = {
    fontSize: '0.9rem',
    padding: '6px 12px',
    textTransform: 'none',
  };

  return (
    <Box
      sx={{
        alignItems: 'center',
        borderRadius: 'md',
        bottom: '20px',
        display: 'flex',
        gap: 2,
        left: '50%',
        opacity: isVisible ? 1 : 0,
        padding: '8px',
        position: 'absolute',
        transform: 'translateX(-50%)',
        transition: 'opacity 0.3s ease-in-out, visibility 0.3s ease-in-out',
        visibility: isVisible ? 'visible' : 'hidden',
        zIndex: 10,
      }}>
      <FormControl size="sm" sx={{minWidth: 150}}>
        <FormLabel sx={{color: 'neutral.plainColor', mb: 0.5}}>
          Camera
        </FormLabel>
        <Select
          disabled={devices.length === 0}
          onChange={handleJoySelectChange}
          placeholder="Select camera..."
          slotProps={{
            button: {
              sx: {
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  borderColor: 'rgba(255,255,255,0.5)',
                },
                '.MuiSelect-nativeInput': {
                  paddingBottom: '8px',
                  paddingTop: '8px',
                },
                backgroundColor: 'rgba(0,0,0,0.4)',
                borderColor: 'rgba(255,255,255,0.3)',
                borderRadius: 'sm',
                color: 'white',
                fontSize: '0.9rem',
              },
            },
            listbox: {
              sx: {
                backgroundColor: 'neutral.solidBg',
                color: 'neutral.plainColor',
              },
            },
          }}
          value={selectedDeviceId ?? ''}>
          {devices.map((device) => (
            <Option key={device.deviceId} value={device.deviceId}>
              {device.label || `Camera ${device.deviceId.substring(0, 10)}...`}
            </Option>
          ))}
        </Select>
      </FormControl>

      <Button
        color="neutral"
        onClick={onFlipToggle}
        sx={commonButtonStyles}
        title={isFlipped ? 'Unflip Video' : 'Flip Video Horizontally'}
        variant="outlined">
        {isFlipped ? 'Unflip' : 'Flip'}
      </Button>

      <Button
        color="neutral"
        onClick={onFillModeToggle}
        sx={commonButtonStyles}
        title={fillMode === 'cover' ? 'Contain Video' : 'Fill Container'}
        variant="outlined">
        {fillMode === 'cover' ? 'Contain' : 'Fill'}
      </Button>

      <Button
        color="neutral"
        onClick={onFullscreen}
        sx={commonButtonStyles}
        title="Enter Fullscreen"
        variant="outlined">
        Fullscreen
      </Button>
    </Box>
  );
};

export default Controls;
