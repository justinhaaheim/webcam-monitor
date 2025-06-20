import InfoOutlined from '@mui/icons-material/InfoOutlined';
import PhoneIphoneOutlined from '@mui/icons-material/PhoneIphoneOutlined';
import UsbOutlined from '@mui/icons-material/UsbOutlined';
import WifiOutlined from '@mui/icons-material/WifiOutlined';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Divider from '@mui/joy/Divider';
import Modal from '@mui/joy/Modal';
import ModalClose from '@mui/joy/ModalClose';
import ModalDialog from '@mui/joy/ModalDialog';
import Typography from '@mui/joy/Typography';
import React from 'react';

interface ContinuityCameraHelpModalProps {
  onClose: () => void;
  open: boolean;
}

const ContinuityCameraHelpModal: React.FC<ContinuityCameraHelpModalProps> = ({
  open,
  onClose,
}) => {
  return (
    <Modal onClose={onClose} open={open}>
      <ModalDialog
        aria-labelledby="continuity-camera-help-title"
        sx={{
          maxHeight: '90vh',
          maxWidth: '600px',
          overflow: 'auto',
          width: '90vw',
        }}>
        <ModalClose />

        <Box sx={{alignItems: 'center', display: 'flex', gap: 1, mb: 2}}>
          <PhoneIphoneOutlined color="primary" />
          <Typography
            component="h2"
            id="continuity-camera-help-title"
            level="h4">
            iPhone Continuity Camera Setup
          </Typography>
        </Box>

        <Typography level="body-sm" sx={{color: 'text.secondary', mb: 3}}>
          Having trouble seeing your iPhone as a camera option? Follow these
          steps to get it connected.
        </Typography>

        {/* Essential Prerequisites */}
        <Box sx={{mb: 3}}>
          <Typography
            level="title-md"
            sx={{alignItems: 'center', display: 'flex', gap: 1, mb: 2}}>
            <InfoOutlined fontSize="small" />
            Essential Requirements
          </Typography>
          <Box component="ul" sx={{m: 0, pl: 3}}>
            <Typography component="li" level="body-sm" sx={{mb: 1}}>
              <strong>Enable Continuity Camera</strong> in your iPhone Settings
              app
            </Typography>
            <Typography component="li" level="body-sm" sx={{mb: 1}}>
              <strong>Disable Focus modes</strong> (especially Sleep mode) on
              your iPhone
            </Typography>
            <Typography component="li" level="body-sm" sx={{mb: 1}}>
              <strong>Disable Low Power Mode</strong> on your iPhone
            </Typography>
            <Typography component="li" level="body-sm" sx={{mb: 1}}>
              <strong>Stop any audio/video playback</strong> on your iPhone
              (music, videos, etc.)
            </Typography>
            <Typography component="li" level="body-sm" sx={{mb: 1}}>
              <strong>
                Ensure both devices have Bluetooth and WiFi enabled
              </strong>{' '}
              and are near each other
            </Typography>
          </Box>
        </Box>

        <Divider sx={{my: 3}} />

        {/* Primary Method - FaceTime */}
        <Box sx={{mb: 3}}>
          <Typography
            level="title-md"
            sx={{alignItems: 'center', display: 'flex', gap: 1, mb: 2}}>
            <WifiOutlined fontSize="small" />
            Step 1: Check FaceTime
          </Typography>
          <Box component="ol" sx={{m: 0, pl: 3}}>
            <Typography component="li" level="body-sm" sx={{mb: 1}}>
              Open the <strong>FaceTime app</strong> on your Mac
            </Typography>
            <Typography component="li" level="body-sm" sx={{mb: 1}}>
              Click on the <strong>Video</strong> dropdown menu
            </Typography>
            <Typography component="li" level="body-sm" sx={{mb: 1}}>
              Look for your iPhone under the <strong>Camera</strong> section
            </Typography>
            <Typography component="li" level="body-sm" sx={{mb: 1}}>
              If you see it, click it to enable it, then check this app again
            </Typography>
          </Box>
        </Box>

        <Divider sx={{my: 3}} />

        {/* USB-C Method */}
        <Box sx={{mb: 3}}>
          <Typography
            level="title-md"
            sx={{alignItems: 'center', display: 'flex', gap: 1, mb: 2}}>
            <UsbOutlined fontSize="small" />
            Step 2: USB-C Connection (Most Reliable)
          </Typography>
          <Typography level="body-sm" sx={{fontStyle: 'italic', mb: 2}}>
            If your iPhone doesn't appear in FaceTime, try this method:
          </Typography>
          <Box component="ol" sx={{m: 0, pl: 3}}>
            <Typography component="li" level="body-sm" sx={{mb: 1}}>
              Connect your iPhone to your Mac using a{' '}
              <strong>USB-C cable</strong>
            </Typography>
            <Typography component="li" level="body-sm" sx={{mb: 1}}>
              <strong>Close FaceTime</strong> completely
            </Typography>
            <Typography component="li" level="body-sm" sx={{mb: 1}}>
              <strong>Reopen FaceTime</strong> and check the video dropdown
              again
            </Typography>
            <Typography component="li" level="body-sm" sx={{mb: 1}}>
              Select your iPhone from the camera options
            </Typography>
            <Typography component="li" level="body-sm" sx={{mb: 1}}>
              Return to this app - your iPhone should now appear in the camera
              list
            </Typography>
          </Box>
        </Box>

        <Divider sx={{my: 3}} />

        {/* Magic Pose Method */}
        <Box sx={{mb: 3}}>
          <Typography level="title-sm" sx={{color: 'text.secondary', mb: 2}}>
            Advanced: Wireless "Magic Pose" Method
          </Typography>
          <Typography
            level="body-xs"
            sx={{color: 'text.secondary', fontStyle: 'italic', mb: 2}}>
            This wireless method can work but is less reliable than using a USB
            cable:
          </Typography>
          <Box component="ul" sx={{m: 0, pl: 3}}>
            <Typography
              component="li"
              level="body-xs"
              sx={{color: 'text.secondary', mb: 0.5}}>
              Place iPhone in <strong>landscape orientation</strong>
            </Typography>
            <Typography
              component="li"
              level="body-xs"
              sx={{color: 'text.secondary', mb: 0.5}}>
              Phone must be <strong>locked with screen off</strong>
            </Typography>
            <Typography
              component="li"
              level="body-xs"
              sx={{color: 'text.secondary', mb: 0.5}}>
              Keep it <strong>motionless</strong> (prop it against your laptop
              screen)
            </Typography>
            <Typography
              component="li"
              level="body-xs"
              sx={{color: 'text.secondary', mb: 0.5}}>
              <strong>Back cameras must face you</strong> with a person visible
              in frame
            </Typography>
            <Typography
              component="li"
              level="body-xs"
              sx={{color: 'text.secondary', mb: 0.5}}>
              Wait 5-30 seconds for it to appear in FaceTime automatically
            </Typography>
          </Box>
        </Box>

        <Box sx={{display: 'flex', justifyContent: 'flex-end', mt: 4}}>
          <Button onClick={onClose} variant="solid">
            Got it!
          </Button>
        </Box>
      </ModalDialog>
    </Modal>
  );
};

export default ContinuityCameraHelpModal;
