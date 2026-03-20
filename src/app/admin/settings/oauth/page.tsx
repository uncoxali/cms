'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import { alpha } from '@mui/material/styles';
import { useNotificationsStore } from '@/store/notifications';
import {
  KeyRound,
  Globe,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  ExternalLink,
  Copy,
} from 'lucide-react';

interface OAuthProvider {
  id: string;
  name: string;
  clientId: string;
  clientSecret: string;
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  enabled: boolean;
  autoRegister: boolean;
  icon: string;
}

const MOCK_PROVIDERS: OAuthProvider[] = [
  {
    id: 'google',
    name: 'Google',
    clientId: '',
    clientSecret: '',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['openid', 'email', 'profile'],
    enabled: false,
    autoRegister: true,
    icon: '🔵',
  },
  {
    id: 'github',
    name: 'GitHub',
    clientId: '',
    clientSecret: '',
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    scopes: ['user:email', 'read:user'],
    enabled: false,
    autoRegister: true,
    icon: '🐙',
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    clientId: '',
    clientSecret: '',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scopes: ['openid', 'email', 'profile'],
    enabled: false,
    autoRegister: true,
    icon: '🟪',
  },
];

export default function OAuthPage() {
  const { addNotification } = useNotificationsStore();

  const [providers, setProviders] = useState<OAuthProvider[]>(MOCK_PROVIDERS);
  const [editProvider, setEditProvider] = useState<OAuthProvider | null>(null);
  const [formData, setFormData] = useState<Partial<OAuthProvider>>({});
  const [showSecret, setShowSecret] = useState(false);

  const handleOpenEdit = (provider: OAuthProvider) => {
    setEditProvider(provider);
    setFormData({ ...provider });
  };

  const handleSave = () => {
    if (!editProvider) return;
    setProviders(prev => prev.map(p => 
      p.id === editProvider.id ? { ...p, ...formData } as OAuthProvider : p
    ));
    addNotification({ title: 'Provider Updated', message: `${editProvider.name} settings have been saved.` });
    setEditProvider(null);
  };

  const handleAddProvider = () => {
    const newProvider: OAuthProvider = {
      id: `custom-${Date.now()}`,
      name: 'Custom Provider',
      clientId: '',
      clientSecret: '',
      authUrl: '',
      tokenUrl: '',
      scopes: ['openid', 'email'],
      enabled: false,
      autoRegister: true,
      icon: '🔐',
    };
    setProviders(prev => [...prev, newProvider]);
    handleOpenEdit(newProvider);
  };

  const handleDelete = (providerId: string) => {
    setProviders(prev => prev.filter(p => p.id !== providerId));
    addNotification({ title: 'Provider Removed', message: 'OAuth provider has been removed.' });
  };

  const handleToggle = (provider: OAuthProvider) => {
    setProviders(prev => prev.map(p => 
      p.id === provider.id ? { ...p, enabled: !p.enabled } : p
    ));
    addNotification({ 
      title: provider.enabled ? 'Provider Disabled' : 'Provider Enabled', 
      message: `${provider.name} is now ${provider.enabled ? 'disabled' : 'enabled'}.` 
    });
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
            <KeyRound size={24} color='#8B5CF6' />
          </Box>
          <Box>
            <Typography variant='h5' fontWeight={700}>
              OAuth / SSO
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Configure single sign-on with external identity providers
            </Typography>
          </Box>
        </Box>

        <Alert severity='info' sx={{ mb: 3 }}>
          OAuth allows users to sign in using their existing accounts from Google, GitHub, Microsoft, and more.
        </Alert>

        <Paper sx={{ p: 4, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant='h6' fontWeight={700}>
              Identity Providers
            </Typography>
            <Button variant='outlined' startIcon={<Plus size={16} />} onClick={handleAddProvider}>
              Add Provider
            </Button>
          </Box>

          <Grid container spacing={3}>
            {providers.map(provider => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={provider.id}>
                <Paper
                  variant='outlined'
                  sx={{
                    p: 3,
                    height: '100%',
                    opacity: provider.enabled ? 1 : 0.7,
                    transition: 'all 200ms',
                    '&:hover': { boxShadow: 2 },
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Typography variant='h4'>{provider.icon}</Typography>
                      <Typography variant='subtitle1' fontWeight={700}>
                        {provider.name}
                      </Typography>
                    </Box>
                    <Switch
                      checked={provider.enabled}
                      onChange={() => handleToggle(provider)}
                      size='small'
                    />
                  </Box>

                  <Typography variant='caption' color='text.secondary' display='block' sx={{ mb: 2 }}>
                    {provider.scopes.join(', ')}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    {provider.autoRegister && (
                      <Chip label='Auto-register' size='small' color='success' variant='outlined' />
                    )}
                    {provider.clientId && (
                      <Chip label='Configured' size='small' color='primary' variant='outlined' />
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size='small'
                      startIcon={<Edit2 size={14} />}
                      onClick={() => handleOpenEdit(provider)}
                    >
                      Configure
                    </Button>
                    <Button
                      size='small'
                      color='error'
                      onClick={() => handleDelete(provider.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>

        <Paper sx={{ p: 4 }}>
          <Typography variant='h6' fontWeight={700} gutterBottom>
            General SSO Settings
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='Default Role'
                value='editor'
                helperText='Role assigned to new SSO users'
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='Redirect URL'
                value='https://app.example.com/auth/callback'
                helperText='URL in your OAuth app settings'
                InputProps={{
                  endAdornment: (
                    <Button size='small' startIcon={<Copy size={14} />} onClick={() => {
                      navigator.clipboard.writeText('https://app.example.com/auth/callback');
                      addNotification({ title: 'Copied', message: 'Redirect URL copied.' });
                    }}>
                      Copy
                    </Button>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={<Switch defaultChecked />}
                label='Allow SSO users to link multiple providers'
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={<Switch defaultChecked />}
                label='Sync user profile on each login'
              />
            </Grid>
          </Grid>
        </Paper>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant='contained' onClick={() => addNotification({ title: 'Saved', message: 'SSO settings saved.' })}>
            Save Settings
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
