import AspectRatioOutlined from '@mui/icons-material/AspectRatioOutlined';
import BugReportOutlined from '@mui/icons-material/BugReportOutlined';
import CompareArrowsOutlined from '@mui/icons-material/CompareArrowsOutlined';
import FullscreenExitOutlined from '@mui/icons-material/FullscreenExitOutlined';
import FullscreenOutlined from '@mui/icons-material/FullscreenOutlined';
import HelpOutlineOutlined from '@mui/icons-material/HelpOutlineOutlined';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import FormControl from '@mui/joy/FormControl';
import Option from '@mui/joy/Option';
import Select from '@mui/joy/Select';
import React from 'react';

interface ControlsProps {
  devices: MediaDeviceInfo[];
  fillMode: 'cover' | 'contain';
  isFlipped: boolean;
  isFullScreen: boolean;
  isVisible: boolean;
  onContinuityCameraHelpOpen: () => void;
  onDebugToggle: () => void;
  onDeviceChange: (deviceId: string) => void;
  onFillModeToggle: () => void;
  onFlipToggle: () => void;
  onFullscreen: () => void;
  selectedDeviceId: string | undefined;
  showDebugInfo: boolean;
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
  isFullScreen,
  isVisible,
  onDebugToggle,
  onContinuityCameraHelpOpen,
}) => {
  if (!isVisible) {
    return null;
  }

  const HELP_OPTION_VALUE = '__continuity_camera_help__';

  const handleJoySelectChange = (
    _event: React.SyntheticEvent | null,
    newValue: string | null,
  ) => {
    if (newValue === HELP_OPTION_VALUE) {
      onContinuityCameraHelpOpen();
    } else if (newValue !== null) {
      onDeviceChange(newValue);
    }
  };

  const iconButtonStyles = {
    borderRadius: '50%',
    boxShadow: 'sm',
    height: '40px',
    minWidth: 'auto',
    padding: 0,
    width: '40px',
  };

  return (
    <Box
      sx={{
        alignItems: 'center',
        borderRadius: 'lg',
        bottom: '20px',
        display: 'flex',
        gap: 1.5,
        left: '50%',
        opacity: isVisible ? 1 : 0,
        padding: '8px',
        position: 'absolute',
        transform: 'translateX(-50%)',
        transition: 'opacity 0.3s ease-in-out, visibility 0.3s ease-in-out',
        visibility: isVisible ? 'visible' : 'hidden',
        zIndex: 10,
      }}>
      <FormControl size="sm" sx={{minWidth: 180}}>
        <Select
          color="neutral"
          disabled={devices.length === 0}
          onChange={handleJoySelectChange}
          placeholder="Select camera..."
          slotProps={{
            button: {
              sx: {
                boxShadow: 'sm',
                fontSize: '0.875rem',
                minHeight: '40px',
              },
            },
            listbox: {
              sx: {
                backgroundColor: 'background.popup',
                fontSize: '0.875rem',
              },
            },
          }}
          value={selectedDeviceId ?? ''}
          variant="soft">
          {devices.map((device) => (
            <Option key={device.deviceId} value={device.deviceId}>
              {device.label || `Camera ${device.deviceId.substring(0, 10)}...`}
            </Option>
          ))}

          {/* Special help item for continuity camera */}
          <Option
            key={HELP_OPTION_VALUE}
            sx={{
              '&:hover': {
                backgroundColor: 'primary.50',
                color: 'primary.600',
              },
              borderColor: 'divider',
              borderTop: '1px solid',
              color: 'primary.500',
              fontStyle: 'italic',
              mt: 0.5,
              pt: 1,
            }}
            value={HELP_OPTION_VALUE}>
            <Box sx={{alignItems: 'center', display: 'flex', gap: 1}}>
              <HelpOutlineOutlined fontSize="small" />
              Looking for your iPhone continuity camera?
            </Box>
          </Option>
        </Select>
      </FormControl>

      <Button
        color="neutral"
        onClick={onFlipToggle}
        sx={iconButtonStyles}
        title={isFlipped ? 'Unflip Video' : 'Flip Video Horizontally'}
        variant="soft">
        <CompareArrowsOutlined />
      </Button>

      <Button
        color="neutral"
        onClick={onFillModeToggle}
        sx={iconButtonStyles}
        title={fillMode === 'cover' ? 'Contain Video' : 'Fill Container'}
        variant="soft">
        <AspectRatioOutlined />
      </Button>

      <Button
        color="neutral"
        onClick={onFullscreen}
        sx={iconButtonStyles}
        title={isFullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        variant="soft">
        {isFullScreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
      </Button>

      <Button
        color="neutral"
        onClick={onDebugToggle}
        sx={{...iconButtonStyles, marginLeft: 'auto'}}
        title="Toggle Debug Information"
        variant="soft">
        <BugReportOutlined />
      </Button>
    </Box>
  );
};

export default Controls;
