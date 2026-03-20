'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Slider from '@mui/material/Slider';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import { alpha } from '@mui/material/styles';
import { useNotificationsStore } from '@/store/notifications';
import {
  Shield,
  Lock,
  KeyRound,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function PasswordPolicyPage() {
  const { addNotification } = useNotificationsStore();

  const [settings, setSettings] = useState({
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    specialCharsPattern: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    maxAge: 90,
    enforceMaxAge: true,
    preventReuse: 5,
    enforceReuse: true,
    maxAttempts: 5,
    lockoutDuration: 30,
    enforceLockout: true,
    requirePasswordChange: true,
    sendExpiryWarnings: true,
    warningDaysBefore: 7,
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleSave = () => {
    addNotification({ title: 'Settings Saved', message: 'Password policy has been updated.' });
  };

  const strength = calculateStrength(settings);

  function calculateStrength(s: typeof settings): { score: number; label: string; color: string } {
    let score = 0;
    if (s.minLength >= 8) score++;
    if (s.minLength >= 12) score++;
    if (s.requireUppercase) score++;
    if (s.requireLowercase) score++;
    if (s.requireNumbers) score++;
    if (s.requireSpecialChars) score++;
    if (s.enforceMaxAge) score++;
    if (s.enforceReuse) score++;
    if (s.enforceLockout) score++;

    if (score < 4) return { score, label: 'Weak', color: '#EF4444' };
    if (score < 6) return { score, label: 'Fair', color: '#F59E0B' };
    if (score < 8) return { score, label: 'Good', color: '#22C55E' };
    return { score, label: 'Strong', color: '#10B981' };
  }

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
              Password Policy
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Configure password requirements and security policies
            </Typography>
          </Box>
        </Box>

        <Paper sx={{ p: 4, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Lock size={20} />
              <Typography variant='h6' fontWeight={700}>
                Password Requirements
              </Typography>
            </Box>
            <Chip
              label={`Policy Strength: ${strength.label}`}
              sx={{ bgcolor: alpha(strength.color, 0.1), color: strength.color, fontWeight: 700 }}
            />
          </Box>

          <Alert severity='info' sx={{ mb: 3 }}>
            Adjust the slider below to set the minimum password length. Current: {settings.minLength} characters.
          </Alert>

          <Box sx={{ mb: 4 }}>
            <Typography variant='body2' gutterBottom>
              Minimum Length: {settings.minLength} characters
            </Typography>
            <Slider
              value={settings.minLength}
              onChange={(_, v) => setSettings({ ...settings, minLength: v as number })}
              min={4}
              max={32}
              marks={[
                { value: 8, label: '8' },
                { value: 12, label: '12' },
                { value: 16, label: '16' },
                { value: 24, label: '24' },
              ]}
            />
          </Box>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.requireUppercase}
                    onChange={(e) => setSettings({ ...settings, requireUppercase: e.target.checked })}
                  />
                }
                label='Require uppercase letters (A-Z)'
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.requireLowercase}
                    onChange={(e) => setSettings({ ...settings, requireLowercase: e.target.checked })}
                  />
                }
                label='Require lowercase letters (a-z)'
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.requireNumbers}
                    onChange={(e) => setSettings({ ...settings, requireNumbers: e.target.checked })}
                  />
                }
                label='Require numbers (0-9)'
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.requireSpecialChars}
                    onChange={(e) => setSettings({ ...settings, requireSpecialChars: e.target.checked })}
                  />
                }
                label='Require special characters'
              />
            </Grid>
          </Grid>

          {settings.requireSpecialChars && (
            <TextField
              fullWidth
              label='Allowed Special Characters'
              value={settings.specialCharsPattern}
              onChange={(e) => setSettings({ ...settings, specialCharsPattern: e.target.value })}
              sx={{ mt: 2 }}
              helperText='Characters that are allowed in passwords'
            />
          )}
        </Paper>

        <Paper sx={{ p: 4, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Clock size={20} />
            <Typography variant='h6' fontWeight={700}>
              Expiration & History
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enforceMaxAge}
                    onChange={(e) => setSettings({ ...settings, enforceMaxAge: e.target.checked })}
                  />
                }
                label='Enforce password expiration'
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enforceReuse}
                    onChange={(e) => setSettings({ ...settings, enforceReuse: e.target.checked })}
                  />
                }
                label='Prevent password reuse'
              />
            </Grid>

            {settings.enforceMaxAge && (
              <Grid size={{ xs: 12 }}>
                <Typography variant='body2' gutterBottom>
                  Password expires after: {settings.maxAge} days
                </Typography>
                <Slider
                  value={settings.maxAge}
                  onChange={(_, v) => setSettings({ ...settings, maxAge: v as number })}
                  min={7}
                  max={365}
                  marks={[
                    { value: 30, label: '30 days' },
                    { value: 90, label: '90 days' },
                    { value: 180, label: '6 months' },
                    { value: 365, label: '1 year' },
                  ]}
                />
              </Grid>
            )}

            {settings.enforceReuse && (
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  type='number'
                  label='Remember last N passwords'
                  value={settings.preventReuse}
                  onChange={(e) => setSettings({ ...settings, preventReuse: parseInt(e.target.value) || 0 })}
                  inputProps={{ min: 1, max: 24 }}
                />
              </Grid>
            )}
          </Grid>
        </Paper>

        <Paper sx={{ p: 4, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <AlertTriangle size={20} />
            <Typography variant='h6' fontWeight={700}>
              Account Security
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enforceLockout}
                    onChange={(e) => setSettings({ ...settings, enforceLockout: e.target.checked })}
                  />
                }
                label='Enable account lockout'
              />
            </Grid>

            {settings.enforceLockout && (
              <>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    type='number'
                    label='Max failed attempts'
                    value={settings.maxAttempts}
                    onChange={(e) => setSettings({ ...settings, maxAttempts: parseInt(e.target.value) || 5 })}
                    inputProps={{ min: 3, max: 20 }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    type='number'
                    label='Lockout duration (minutes)'
                    value={settings.lockoutDuration}
                    onChange={(e) => setSettings({ ...settings, lockoutDuration: parseInt(e.target.value) || 30 })}
                    inputProps={{ min: 1, max: 1440 }}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </Paper>

        <Paper sx={{ p: 4, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <KeyRound size={20} />
            <Typography variant='h6' fontWeight={700}>
              Notifications
            </Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.requirePasswordChange}
                    onChange={(e) => setSettings({ ...settings, requirePasswordChange: e.target.checked })}
                  />
                }
                label='Require password change on first login'
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.sendExpiryWarnings}
                    onChange={(e) => setSettings({ ...settings, sendExpiryWarnings: e.target.checked })}
                  />
                }
                label='Send expiry warning emails'
              />
            </Grid>
            {settings.sendExpiryWarnings && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type='number'
                  label='Warn N days before expiry'
                  value={settings.warningDaysBefore}
                  onChange={(e) => setSettings({ ...settings, warningDaysBefore: parseInt(e.target.value) || 7 })}
                  inputProps={{ min: 1, max: 30 }}
                />
              </Grid>
            )}
          </Grid>
        </Paper>

        <Paper sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Eye size={20} />
            <Typography variant='h6' fontWeight={700}>
              Password Preview
            </Typography>
          </Box>

          <Alert severity='info' sx={{ mb: 2 }}>
            This is how password requirements appear to users when creating an account:
          </Alert>

          <Paper variant='outlined' sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {settings.requireUppercase && (
                <Chip size='small' icon={<CheckCircle size={14} />} label='A-Z' color='success' />
              )}
              {settings.requireLowercase && (
                <Chip size='small' icon={<CheckCircle size={14} />} label='a-z' color='success' />
              )}
              {settings.requireNumbers && (
                <Chip size='small' icon={<CheckCircle size={14} />} label='0-9' color='success' />
              )}
              {settings.requireSpecialChars && (
                <Chip size='small' icon={<CheckCircle size={14} />} label='!@#$%...' color='success' />
              )}
              <Chip size='small' icon={<CheckCircle size={14} />} label={`Min ${settings.minLength} chars`} color='success' />
            </Box>
          </Paper>
        </Paper>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant='outlined'>Reset to Defaults</Button>
          <Button variant='contained' onClick={handleSave} startIcon={<CheckCircle size={18} />}>
            Save Settings
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
