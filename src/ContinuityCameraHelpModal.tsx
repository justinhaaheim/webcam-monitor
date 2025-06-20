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

        {/* Step 1: Enable Continuity Camera */}
        <Box sx={{mb: 3}}>
          <Typography
            level="title-md"
            sx={{alignItems: 'center', display: 'flex', gap: 1, mb: 2}}>
            <InfoOutlined fontSize="small" />
            Step 1: Enable Continuity Camera
          </Typography>
          <Typography level="body-sm" sx={{mb: 1}}>
            Make sure <strong>Continuity Camera is enabled</strong> in your
            iPhone Settings app (Settings {'>'} General {'>'} AirPlay &
            Continuity).
          </Typography>
        </Box>

        <Divider sx={{my: 3}} />

        {/* Step 2: Check iPhone Settings */}
        <Box sx={{mb: 3}}>
          <Typography
            level="title-md"
            sx={{alignItems: 'center', display: 'flex', gap: 1, mb: 2}}>
            <PhoneIphoneOutlined fontSize="small" />
            Step 2: Prepare Your iPhone
          </Typography>
          <Box component="ul" sx={{m: 0, pl: 3}}>
            <Typography component="li" level="body-sm" sx={{mb: 1}}>
              <strong>Turn off Focus modes</strong> (especially Sleep mode) and
              <strong> Low Power Mode</strong> on your iPhone
            </Typography>
            <Typography component="li" level="body-sm" sx={{mb: 1}}>
              <strong>Stop all audio/video playback</strong> on your iPhone,
              including local playback (music, videos) and remote playback
              (Apple TV, Spotify via Chromecast, etc.)
            </Typography>
            <Typography component="li" level="body-sm" sx={{mb: 1}}>
              <strong>
                Ensure both your iPhone and Mac have Bluetooth and WiFi enabled
              </strong>{' '}
              and are near each other
            </Typography>
          </Box>
        </Box>

        <Divider sx={{my: 3}} />

        {/* Step 3: Check FaceTime */}
        <Box sx={{mb: 3}}>
          <Typography
            level="title-md"
            sx={{alignItems: 'center', display: 'flex', gap: 1, mb: 2}}>
            <WifiOutlined fontSize="small" />
            Step 3: Check FaceTime
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
              If you see it, select it to enable it, then check this app again.
              You should see your iPhone as an option. You may need to refresh
              the page.
            </Typography>
          </Box>
        </Box>

        <Divider sx={{my: 3}} />

        {/* Step 4: USB-C Method */}
        <Box sx={{mb: 3}}>
          <Typography
            level="title-md"
            sx={{alignItems: 'center', display: 'flex', gap: 1, mb: 2}}>
            <UsbOutlined fontSize="small" />
            Step 4: Try USB-C Connection
          </Typography>
          <Typography level="body-sm" sx={{fontStyle: 'italic', mb: 2}}>
            If your iPhone doesn't appear in FaceTime, try connecting with a
            cable:
          </Typography>
          <Box component="ol" sx={{m: 0, pl: 3}}>
            <Typography component="li" level="body-sm" sx={{mb: 1}}>
              Connect your iPhone to your Mac using a{' '}
              <strong>USB-C cable</strong>
            </Typography>
            <Typography component="li" level="body-sm" sx={{mb: 1}}>
              <strong>Close FaceTime</strong> completely, then{' '}
              <strong>reopen it</strong>
            </Typography>
            <Typography component="li" level="body-sm" sx={{mb: 1}}>
              Check the video dropdown again for your iPhone
            </Typography>
            <Typography component="li" level="body-sm" sx={{mb: 1}}>
              If found, select it and return to this app
            </Typography>
          </Box>
        </Box>

        <Divider sx={{my: 3}} />

        {/* Step 5: Magic Pose Method */}
        <Box sx={{mb: 3}}>
          <Typography
            level="title-md"
            sx={{alignItems: 'center', display: 'flex', gap: 1, mb: 2}}>
            <PhoneIphoneOutlined fontSize="small" />
            Step 5: Try the "Magic Pose"
          </Typography>
          <Typography level="body-sm" sx={{fontStyle: 'italic', mb: 2}}>
            If USB connection doesn't work, try this wireless method:
          </Typography>
          <Box component="ol" sx={{m: 0, pl: 3}}>
            <Typography component="li" level="body-sm" sx={{mb: 1}}>
              Place your iPhone in <strong>landscape orientation</strong>
            </Typography>
            <Typography component="li" level="body-sm" sx={{mb: 1}}>
              Ensure it's <strong>locked with screen off</strong>
            </Typography>
            <Typography component="li" level="body-sm" sx={{mb: 1}}>
              Keep it <strong>motionless</strong> and prop it so the{' '}
              <strong>back cameras face you unobstructed</strong> (lean it
              against your laptop screen)
            </Typography>
            <Typography component="li" level="body-sm" sx={{mb: 1}}>
              Make sure <strong>a person is visible in the camera frame</strong>
            </Typography>
            <Typography component="li" level="body-sm" sx={{mb: 1}}>
              Wait 5-30 seconds for it to appear automatically in FaceTime's
              video dropdown
            </Typography>
          </Box>
        </Box>

        <Divider sx={{my: 3}} />

        <Typography
          level="body-xs"
          sx={{color: 'text.secondary', mb: 3, textAlign: 'center'}}>
          Need additional help? Visit{' '}
          <a
            href="https://support.apple.com/en-us/102546"
            rel="noopener noreferrer"
            style={{color: 'inherit', textDecoration: 'underline'}}
            target="_blank">
            Apple's Continuity Camera Support Page
          </a>{' '}
          for more detailed troubleshooting.
        </Typography>

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
