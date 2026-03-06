'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import { Mail, Shield, User as UserIcon, Settings as SettingsIcon, Camera } from 'lucide-react';
import { useTheme, alpha } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useTranslation } from '@/lib/i18n';
import { api } from '@/lib/api';

export default function ProfilePage() {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const updateUserAvatar = useAuthStore((s) => s.updateUserAvatar);
  const { t } = useTranslation();

  if (!user) return null;

  const roleLabel =
    role === 'admin'
      ? t('header.superAdmin')
      : role === 'editor'
        ? t('header.editor')
        : t('header.viewer');

  const roleColor =
    role === 'admin'
      ? theme.palette.primary.main
      : role === 'editor'
        ? theme.palette.info.main
        : theme.palette.text.secondary;

  const avatarSrc = user.avatar || null;
  const isAdmin = role === 'admin';

  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [avatarFiles, setAvatarFiles] = useState<any[]>([]);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const loadAvatarFiles = async () => {
    setAvatarLoading(true);
    setAvatarError(null);
    try {
      const res = await api.get<{ data: any[] }>('/files');
      setAvatarFiles(res.data || []);
    } catch {
      setAvatarFiles([]);
    } finally {
      setAvatarLoading(false);
    }
  };

  const openAvatarDialog = () => {
    setAvatarDialogOpen(true);
    if (!avatarFiles.length) {
      loadAvatarFiles();
    }
  };

  const handleSelectAvatar = async (file: any) => {
    const isImage =
      file.type === 'image' ||
      String(file.mime_type || '')
        .toLowerCase()
        .startsWith('image/');
    if (!isImage) {
      setAvatarError('Only image files can be used as avatar.');
      return;
    }

    const avatarPath = `/uploads/${file.filename_disk}`;
    setAvatarSaving(true);
    setAvatarError(null);
    try {
      await api.patch(`/users/${user.id}`, { avatar: avatarPath });
      updateUserAvatar(avatarPath);
      setAvatarDialogOpen(false);
    } catch (err: any) {
      setAvatarError(err.message || 'Failed to update avatar');
    } finally {
      setAvatarSaving(false);
    }
  };

  const handleClearAvatar = async () => {
    if (!avatarSrc) return;
    setAvatarSaving(true);
    setAvatarError(null);
    try {
      await api.patch(`/users/${user.id}`, { avatar: null });
      updateUserAvatar(null);
    } catch (err: any) {
      setAvatarError(err.message || 'Failed to clear avatar');
    } finally {
      setAvatarSaving(false);
    }
  };

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant='h5' fontWeight={700} gutterBottom>
          {t('header.profile')}
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          {t('settings.general') || 'View your account information and role in this workspace.'}
        </Typography>
      </Box>

      <Paper
        sx={{
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.paper,
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 3,
            alignItems: { xs: 'flex-start', sm: 'center' },
          }}
        >
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={avatarSrc || undefined}
              sx={{
                width: 80,
                height: 80,
                fontSize: 30,
                fontWeight: 700,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                color: '#fff',
              }}
            >
              {!avatarSrc && (user.name?.charAt(0)?.toUpperCase() || 'N')}
            </Avatar>
            <Button
              variant='contained'
              size='small'
              startIcon={<Camera size={14} />}
              onClick={openAvatarDialog}
              sx={{
                mt: 1.5,
                px: 1.5,
                py: 0.5,
                fontSize: 11,
                textTransform: 'none',
              }}
            >
              Change avatar
            </Button>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant='h6' fontWeight={700}>
              {user.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Mail size={14} style={{ opacity: 0.6 }} />
              <Typography variant='body2' color='text.secondary'>
                {user.email}
              </Typography>
            </Box>
            <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                icon={<Shield size={14} />}
                label={roleLabel}
                size='small'
                sx={{
                  height: 24,
                  fontSize: 11,
                  fontWeight: 600,
                  bgcolor: alpha(roleColor, 0.12),
                  color: roleColor,
                  '& .MuiChip-icon': { color: roleColor },
                }}
              />
            </Box>
          </Box>
        </Box>

        <Divider />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2,
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <UserIcon size={16} style={{ opacity: 0.7 }} />
              <Typography variant='caption' color='text.secondary'>
                {t('settings.profile') || 'Account ID'}
              </Typography>
            </Box>
            <Typography
              variant='body2'
              sx={{ mt: 0.5, fontFamily: 'monospace', wordBreak: 'break-all' }}
            >
              {user.id}
            </Typography>
          </Box>

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SettingsIcon size={16} style={{ opacity: 0.7 }} />
              <Typography variant='caption' color='text.secondary'>
                {t('settings.permissions') || 'Workspace Role'}
              </Typography>
            </Box>
            <Typography variant='body2' sx={{ mt: 0.5 }}>
              {user.role_name || roleLabel}
            </Typography>
          </Box>
        </Box>

        <Divider />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography variant='subtitle1' fontWeight={600}>
            {t('settings.security')}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {t('settings.saveAllChanges') ||
              'Your profile information is managed by an administrator. Contact your admin to update your details.'}
          </Typography>
          {isAdmin && (
            <Button
              variant='outlined'
              size='small'
              sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
              onClick={() => router.push(`/admin/users/${user.id}`)}
            >
              Open full user settings
            </Button>
          )}
          <Typography variant='body2' color='text.secondary'>
            Avatar and account details can be edited from the <strong>Users</strong> section by an
            administrator.
          </Typography>
        </Box>
      </Paper>

      <Dialog
        open={avatarDialogOpen}
        onClose={() => !avatarSaving && setAvatarDialogOpen(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>Select avatar from files</DialogTitle>
        <DialogContent dividers sx={{ minHeight: 260 }}>
          {avatarError && (
            <Alert
              severity='warning'
              sx={{ mb: 2, borderRadius: 2 }}
              onClose={() => setAvatarError(null)}
            >
              {avatarError}
            </Alert>
          )}
          {avatarLoading ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                py: 6,
              }}
            >
              <Typography color='text.secondary'>Loading files...</Typography>
            </Box>
          ) : avatarFiles.length === 0 ? (
            <Typography variant='body2' color='text.secondary'>
              No files found in library. Upload an image first.
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {avatarFiles.map((file) => (
                <Grid size={{ xs: 4, sm: 3, md: 2 }} key={file.id}>
                  <Box
                    onClick={() => handleSelectAvatar(file)}
                    sx={{
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      '&:hover': {
                        borderColor: theme.palette.primary.main,
                        boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.15)}`,
                      },
                    }}
                  >
                    {file.type === 'image' ||
                    String(file.mime_type || '')
                      .toLowerCase()
                      .startsWith('image/') ? (
                      <Box
                        component='img'
                        src={`/uploads/${file.filename_disk}`}
                        alt={file.filename_download}
                        sx={{
                          width: '100%',
                          aspectRatio: '1 / 1',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: '100%',
                          aspectRatio: '1 / 1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: alpha(theme.palette.background.default, 0.6),
                        }}
                      >
                        <Camera size={20} style={{ opacity: 0.5 }} />
                      </Box>
                    )}
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          {avatarSrc && (
            <Button
              onClick={handleClearAvatar}
              color='inherit'
              disabled={avatarSaving}
              size='small'
            >
              Clear avatar
            </Button>
          )}
          <Button onClick={() => !avatarSaving && setAvatarDialogOpen(false)} size='small'>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
