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
import { Eye, EyeOff, LogIn, Shield, Zap, Database, BarChart3, Lock } from 'lucide-react';

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

  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>('admin');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [useApi, setUseApi] = useState(true); // Toggle between API and demo mode

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    if (useApi) {
      // Real API login
      const success = await loginWithApi(email, password);
      if (success) {
        router.push('/admin/dashboard');
      }
      setLoading(false);
    } else {
      // Demo mode (legacy)
      setTimeout(() => {
        login(role);
        addLog({ action: 'login', user: role === 'admin' ? 'Admin User' : role === 'editor' ? 'Editor User' : 'Viewer User', meta: { role } });
        router.push('/admin/dashboard');
        setLoading(false);
      }, 800);
    }
  };

  return (
    <Box sx={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      overflow: 'hidden',
      bgcolor: '#0a0b0e',
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
        {/* Background gradient blobs */}
        <Box sx={{
          position: 'absolute', top: -100, left: -100,
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(102,68,255,0.15) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }} />
        <Box sx={{
          position: 'absolute', bottom: -50, right: -50,
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(26,188,156,0.1) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }} />

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 6 }}>
            <Box sx={{
              width: 48, height: 48, borderRadius: '14px',
              background: 'linear-gradient(135deg, #6644ff 0%, #4422cc 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(102, 68, 255, 0.3)',
            }}>
              <Typography sx={{ color: 'white', fontWeight: 800, fontSize: 20 }}>N</Typography>
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={800} color="white" letterSpacing="-0.03em">
                NexDirect
              </Typography>
              <Typography variant="caption" color="text.secondary" fontSize={12}>
                Data Studio
              </Typography>
            </Box>
          </Box>

          {/* Tagline */}
          <Typography variant="h3" fontWeight={800} color="white" letterSpacing="-0.03em" lineHeight={1.2} mb={2}>
            Your data,{' '}
            <Box component="span" sx={{
              background: 'linear-gradient(135deg, #6644ff 0%, #1abc9c 100%)',
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

          {/* Feature pills */}
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
        {/* Subtle border line */}
        <Box sx={{
          display: { xs: 'none', md: 'block' },
          position: 'absolute', left: 0, top: '10%', bottom: '10%',
          width: '1px',
          background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.06) 50%, transparent)',
        }} />

        <Box sx={{
          width: '100%',
          maxWidth: 420,
        }}>
          {/* Mobile logo */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 2, mb: 5, justifyContent: 'center' }}>
            <Box sx={{
              width: 40, height: 40, borderRadius: '12px',
              background: 'linear-gradient(135deg, #6644ff 0%, #4422cc 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(102, 68, 255, 0.3)',
            }}>
              <Typography sx={{ color: 'white', fontWeight: 800, fontSize: 16 }}>N</Typography>
            </Box>
            <Typography variant="h6" fontWeight={800} color="white">NexDirect</Typography>
          </Box>

          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={800} color="white" letterSpacing="-0.02em" mb={0.5}>
              Welcome back
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to your account to continue
            </Typography>
          </Box>

          {/* Form */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              slotProps={{
                input: {
                  sx: { bgcolor: 'rgba(255,255,255,0.02)' }
                }
              }}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              slotProps={{
                input: {
                  sx: { bgcolor: 'rgba(255,255,255,0.02)' },
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

            <TextField
              select
              fullWidth
              label="Sign in as"
              value={role || 'admin'}
              onChange={e => setRole(e.target.value as Role)}
              slotProps={{
                input: {
                  sx: { bgcolor: 'rgba(255,255,255,0.02)' }
                }
              }}
            >
              {ROLES.map(r => (
                <MenuItem key={r.value} value={r.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: r.color }} />
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{r.label}</Typography>
                      <Typography variant="caption" color="text.secondary" fontSize={11}>{r.desc}</Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </TextField>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <FormControlLabel
                control={<Checkbox checked={remember} onChange={e => setRemember(e.target.checked)} size="small" />}
                label={<Typography variant="body2" color="text.secondary" fontSize={13}>Remember me</Typography>}
              />
              <Button variant="text" sx={{ fontSize: 13, color: '#6644ff', p: 0, minWidth: 'auto' }}>
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
              startIcon={loading ? null : <LogIn size={18} />}
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

            <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.04)' }}>
              <Typography variant="caption" color="text.secondary" fontSize={11}>Demo Environment</Typography>
            </Divider>

            {/* Quick role buttons */}
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              {ROLES.map(r => (
                <Button
                  key={r.value}
                  variant="outlined"
                  fullWidth
                  size="small"
                  onClick={() => {
                    setRole(r.value as Role);
                    setEmail(`${r.value}@example.com`);
                  }}
                  sx={{
                    py: 1,
                    borderColor: role === r.value ? `${r.color}40` : 'rgba(255,255,255,0.06)',
                    bgcolor: role === r.value ? `${r.color}08` : 'transparent',
                    color: role === r.value ? r.color : 'text.secondary',
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

          {/* Footer */}
          <Box sx={{ mt: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
            <Lock size={12} style={{ opacity: 0.3 }} />
            <Typography variant="caption" color="text.secondary" fontSize={11}>
              Secured with end-to-end encryption
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
