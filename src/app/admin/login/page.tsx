"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, Role } from '@/store/auth';
import { useActivityStore } from '@/store/activity';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme, alpha } from '@mui/material/styles';
import { Eye, EyeOff, LogIn, Shield, Zap, Database, BarChart3, Lock, KeyRound } from 'lucide-react';
import { api } from '@/lib/api';

const ROLES = [
  { value: 'admin', label: 'Administrator', desc: 'Full system access', color: '#EF4444' },
  { value: 'editor', label: 'Editor', desc: 'Content management', color: '#3B82F6' },
  { value: 'viewer', label: 'Viewer', desc: 'Read-only access', color: '#22C55E' },
];

const FEATURES = [
  { icon: Database, label: 'Dynamic Data Model' },
  { icon: Zap, label: 'Flow Automations' },
  { icon: BarChart3, label: 'Insights Dashboard' },
  { icon: Shield, label: 'Granular Permissions' },
];

export default function LoginPage() {
  const login = useAuthStore((state) => state.login);
  const loginWithApi = useAuthStore((state) => state.loginWithApi);
  const authError = useAuthStore((state) => state.error);
  const setError = useAuthStore((state) => state.setError);
  const { addLog } = useActivityStore();
  const router = useRouter();
  const theme = useTheme();

  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>('admin');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  // Forgot Password state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    const success = await loginWithApi(email, password);
    if (success) {
      router.push('/admin/dashboard');
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    setResetMessage(null);

    if (!resetEmail) {
      setResetMessage({ type: 'error', text: 'Please enter your email address' });
      return;
    }
    if (!resetNewPassword || resetNewPassword.length < 6) {
      setResetMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setResetMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setResetLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, newPassword: resetNewPassword }),
      });
      const data = await res.json();

      if (res.ok) {
        setResetMessage({ type: 'success', text: 'Password reset successfully! You can now sign in with your new password.' });
        setResetNewPassword('');
        setResetConfirmPassword('');
      } else {
        setResetMessage({ type: 'error', text: data.error || 'Reset failed' });
      }
    } catch {
      setResetMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setResetLoading(false);
    }
  };

  const handleCloseForgot = () => {
    setForgotOpen(false);
    setResetEmail('');
    setResetNewPassword('');
    setResetConfirmPassword('');
    setResetMessage(null);
  };

  return (
    <Box sx={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      overflow: 'hidden',
      bgcolor: theme.palette.background.default,
    }}>
      {/* Left Panel — Branding */}
      <Box sx={{
        display: { xs: 'none', md: 'flex' },
        width: '45%',
        flexDirection: 'column',
        justifyContent: 'center',
        px: 8,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <Box sx={{
          position: 'absolute', top: -100, left: -100,
          width: 400, height: 400, borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.15)} 0%, transparent 70%)`,
          filter: 'blur(60px)',
        }} />
        <Box sx={{
          position: 'absolute', bottom: -50, right: -50,
          width: 300, height: 300, borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.12)} 0%, transparent 70%)`,
          filter: 'blur(60px)',
        }} />

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 6 }}>
            <Box sx={{
              width: 48, height: 48, borderRadius: '14px',
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.35)}`,
            }}>
              <Typography sx={{ color: 'white', fontWeight: 800, fontSize: 20 }}>N</Typography>
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={800} color="text.primary" letterSpacing="-0.03em">
                NexDirect
              </Typography>
              <Typography variant="caption" color="text.secondary" fontSize={12}>
                Data Studio
              </Typography>
            </Box>
          </Box>

          <Typography variant="h3" fontWeight={800} color="text.primary" letterSpacing="-0.03em" lineHeight={1.2} mb={2}>
            Your data,{' '}
            <Box component="span" sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              your way.
            </Box>
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={6} maxWidth={420} lineHeight={1.7}>
            Manage content, automate workflows, and build powerful applications with a modern headless CMS.
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {FEATURES.map(f => (
              <Box key={f.label} sx={{
                display: 'flex', alignItems: 'center', gap: 1,
                px: 2, py: 1,
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.06)',
                bgcolor: 'rgba(255,255,255,0.02)',
              }}>
                <f.icon size={14} style={{ opacity: 0.6 }} />
                <Typography variant="caption" fontWeight={500} color="text.secondary" fontSize={12}>
                  {f.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Right Panel — Login Form */}
      <Box sx={{
        flexGrow: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 4,
        position: 'relative',
      }}>
        <Box sx={{
          display: { xs: 'none', md: 'block' },
          position: 'absolute', left: 0, top: '10%', bottom: '10%',
          width: '1px',
          background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.06) 50%, transparent)',
        }} />

        <Box sx={{ width: '100%', maxWidth: 420 }}>
          {/* Mobile logo */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 2, mb: 5, justifyContent: 'center' }}>
            <Box sx={{
              width: 40, height: 40, borderRadius: '12px',
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.35)}`,
            }}>
              <Typography sx={{ color: 'white', fontWeight: 800, fontSize: 16 }}>N</Typography>
            </Box>
            <Typography variant="h6" fontWeight={800} color="text.primary">NexDirect</Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={800} color="text.primary" letterSpacing="-0.02em" mb={0.5}>
              Welcome back
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to your account to continue
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              slotProps={{ input: { sx: { bgcolor: alpha(theme.palette.background.paper, 0.4) } } }}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              slotProps={{
                input: {
                  sx: { bgcolor: alpha(theme.palette.background.paper, 0.4) },
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: 'text.secondary' }}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }
              }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <FormControlLabel
                control={<Checkbox checked={remember} onChange={e => setRemember(e.target.checked)} size="small" />}
                label={<Typography variant="body2" color="text.secondary" fontSize={13}>Remember me</Typography>}
              />
              <Button
                variant="text"
                onClick={() => { setForgotOpen(true); setResetEmail(email); }}
                sx={{ fontSize: 13, color: theme.palette.primary.main, p: 0, minWidth: 'auto' }}
              >
                Forgot password?
              </Button>
            </Box>

            {authError && (
              <Alert severity="error" onClose={() => setError(null)} sx={{ borderRadius: '12px' }}>
                {authError}
              </Alert>
            )}

            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleLogin}
              disabled={loading || !email}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <LogIn size={18} />}
              sx={{
                py: 1.5,
                fontSize: 15,
                fontWeight: 700,
                position: 'relative',
                overflow: 'hidden',
                '&::after': loading ? {
                  content: '""',
                  position: 'absolute',
                  top: 0, left: 0,
                  width: '30%', height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                  animation: 'shimmer 1.5s infinite',
                  '@keyframes shimmer': {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(500%)' },
                  },
                } : {},
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            <Divider sx={{ my: 1, borderColor: theme.palette.divider }}>
              <Typography variant="caption" color="text.secondary" fontSize={11}>Quick Login</Typography>
            </Divider>

            <Box sx={{ display: 'flex', gap: 1.5 }}>
              {ROLES.map(r => (
                <Button
                  key={r.value}
                  variant="outlined"
                  fullWidth
                  size="small"
                  onClick={() => {
                    setEmail(`${r.value}@example.com`);
                    setPassword(`${r.value}123`);
                  }}
                  sx={{
                    py: 1,
                    borderColor: email === `${r.value}@example.com` ? `${r.color}40` : 'rgba(255,255,255,0.06)',
                    bgcolor: email === `${r.value}@example.com` ? `${r.color}08` : 'transparent',
                    color: email === `${r.value}@example.com` ? r.color : 'text.secondary',
                    flexDirection: 'column',
                    gap: 0.25,
                    '&:hover': {
                      borderColor: `${r.color}50`,
                      bgcolor: `${r.color}08`,
                    },
                  }}
                >
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: r.color, mb: 0.5 }} />
                  <Typography variant="caption" fontWeight={600} fontSize={11}>{r.label}</Typography>
                </Button>
              ))}
            </Box>
          </Box>

          <Box sx={{ mt: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
            <Lock size={12} style={{ opacity: 0.3 }} />
            <Typography variant="caption" color="text.secondary" fontSize={11}>
              Secured with end-to-end encryption
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotOpen} onClose={handleCloseForgot} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <KeyRound size={20} />
          Reset Password
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Enter your email and a new password to reset your account.
          </Typography>

          {resetMessage && (
            <Alert severity={resetMessage.type} sx={{ mb: 2, borderRadius: '10px' }} onClose={() => setResetMessage(null)}>
              {resetMessage.text}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={resetEmail}
              onChange={e => setResetEmail(e.target.value)}
              size="small"
            />
            <TextField
              fullWidth
              label="New Password"
              type="password"
              value={resetNewPassword}
              onChange={e => setResetNewPassword(e.target.value)}
              size="small"
              helperText="Minimum 6 characters"
            />
            <TextField
              fullWidth
              label="Confirm New Password"
              type="password"
              value={resetConfirmPassword}
              onChange={e => setResetConfirmPassword(e.target.value)}
              size="small"
              error={resetConfirmPassword.length > 0 && resetNewPassword !== resetConfirmPassword}
              helperText={resetConfirmPassword.length > 0 && resetNewPassword !== resetConfirmPassword ? 'Passwords do not match' : ''}
              onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button onClick={handleCloseForgot} color="inherit">Cancel</Button>
          <Button
            onClick={handleResetPassword}
            variant="contained"
            disabled={resetLoading || !resetEmail || !resetNewPassword || resetNewPassword !== resetConfirmPassword}
            startIcon={resetLoading ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {resetLoading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
