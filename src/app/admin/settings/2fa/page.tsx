'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import { alpha } from '@mui/material/styles';
import { useNotificationsStore } from '@/store/notifications';
import {
  Smartphone,
  KeyRound,
  Shield,
  Download,
  Copy,
  CheckCircle,
  AlertTriangle,
  QrCode,
} from 'lucide-react';
import Chip from '@mui/material/Chip';

export default function TwoFactorPage() {
  const { addNotification } = useNotificationsStore();

  const [settings, setSettings] = useState({
    enabled: false,
    required: false,
    allowBackupCodes: true,
    maxBackupCodes: 10,
    trustDeviceDays: 30,
    allowSms: false,
    allowEmail: false,
  });

  const [showQrDialog, setShowQrDialog] = useState(false);
  const [setupStep, setSetupStep] = useState<'intro' | 'scan' | 'verify' | 'backup'>('intro');

  const handleSave = () => {
    addNotification({ title: 'Settings Saved', message: 'Two-factor authentication settings have been updated.' });
  };

  const handleEnableTFA = () => {
    setShowQrDialog(true);
    setSetupStep('scan');
  };

  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 4 }}>
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              bgcolor: alpha('#8B5CF6', 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Shield size={24} color='#8B5CF6' />
          </Box>
          <Box>
            <Typography variant='h5' fontWeight={700}>
              Two-Factor Authentication
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Add an extra layer of security to user accounts
            </Typography>
          </Box>
        </Box>

        <Paper sx={{ p: 4, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Smartphone size={20} />
              <Typography variant='h6' fontWeight={700}>
                Authentication Methods
              </Typography>
            </Box>
            <Chip
              label={settings.enabled ? 'Enabled' : 'Disabled'}
              color={settings.enabled ? 'success' : 'default'}
            />
          </Box>

          <Alert severity={settings.enabled ? 'success' : 'info'} sx={{ mb: 3 }}>
            {settings.enabled
              ? 'Two-factor authentication is currently enabled for your organization.'
              : 'Enable two-factor authentication to add an extra layer of security.'}
          </Alert>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enabled}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleEnableTFA();
                      } else {
                        setSettings({ ...settings, enabled: false });
                      }
                    }}
                  />
                }
                label='Enable Two-Factor Authentication'
              />
            </Grid>

            {settings.enabled && (
              <>
                <Grid size={{ xs: 12 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.required}
                        onChange={(e) => setSettings({ ...settings, required: e.target.checked })}
                      />
                    }
                    label='Require 2FA for all users'
                  />
                  <Typography variant='caption' color='text.secondary' display='block' sx={{ ml: 6 }}>
                    Users will be forced to set up 2FA on their next login
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.allowBackupCodes}
                        onChange={(e) => setSettings({ ...settings, allowBackupCodes: e.target.checked })}
                      />
                    }
                    label='Allow backup codes'
                  />
                </Grid>

                {settings.allowBackupCodes && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      type='number'
                      label='Number of backup codes'
                      value={settings.maxBackupCodes}
                      onChange={(e) => setSettings({ ...settings, maxBackupCodes: parseInt(e.target.value) || 10 })}
                      inputProps={{ min: 4, max: 20 }}
                    />
                  </Grid>
                )}

                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    type='number'
                    label='Trust device for N days'
                    value={settings.trustDeviceDays}
                    onChange={(e) => setSettings({ ...settings, trustDeviceDays: parseInt(e.target.value) || 30 })}
                    inputProps={{ min: 1, max: 90 }}
                    helperText='Devices marked as trusted will skip 2FA for this duration'
                  />
                </Grid>
              </>
            )}
          </Grid>
        </Paper>

        <Paper sx={{ p: 4, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <QrCode size={20} />
            <Typography variant='h6' fontWeight={700}>
              Supported Apps
            </Typography>
          </Box>

          <Grid container spacing={2}>
            {[
              { name: 'Google Authenticator', icon: '🔐' },
              { name: 'Authy', icon: '🔐' },
              { name: 'Microsoft Authenticator', icon: '🔐' },
              { name: '1Password', icon: '🔐' },
              { name: 'LastPass Authenticator', icon: '🔐' },
            ].map((app) => (
              <Grid size={{ xs: 12, sm: 6 }} key={app.name}>
                <Paper variant='outlined' sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant='h5'>{app.icon}</Typography>
                  <Typography variant='body2' fontWeight={600}>{app.name}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>

        <Paper sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <KeyRound size={20} />
            <Typography variant='h6' fontWeight={700}>
              Recovery Options
            </Typography>
          </Box>

          <Alert severity='warning' sx={{ mb: 3 }}>
            Make sure to set up at least one recovery option in case users lose access to their 2FA device.
          </Alert>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.allowEmail}
                    onChange={(e) => setSettings({ ...settings, allowEmail: e.target.checked })}
                  />
                }
                label='Email recovery codes'
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.allowSms}
                    onChange={(e) => setSettings({ ...settings, allowSms: e.target.checked })}
                  />
                }
                label='SMS recovery codes (may incur charges)'
              />
            </Grid>
          </Grid>
        </Paper>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant='outlined'>Test Configuration</Button>
          <Button variant='contained' onClick={handleSave}>
            Save Settings
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
