'use client';

import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Popover from '@mui/material/Popover';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import InputBase from '@mui/material/InputBase';
import Tooltip from '@mui/material/Tooltip';
import { alpha, useTheme } from '@mui/material/styles';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronRight, LogOut, User, Shield,
  Search, Sun, Moon, Settings, Home, Sparkles
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useProjectStore } from '@/store/project';
import { useTranslation } from '@/lib/i18n';
import { api, getUploadUrl } from '@/lib/api';
import { DARK_THEMES, LIGHT_THEMES, THEME_LIST, ThemePreset } from '@/lib/themes';
import NotificationBell from './NotificationBell';

const BREADCRUMB_LABELS: Record<string, string> = {
  admin: 'Admin',
  dashboard: 'Dashboard',
  content: 'Content',
  files: 'Files',
  users: 'Users',
  settings: 'Settings',
  flows: 'Flows',
  activity: 'Activity',
  pages: 'Pages',
  project: 'Project',
  roles: 'Roles',
  'data-model': 'Data Model',
  websockets: 'WebSocket',
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);
  const logout = useAuthStore((state) => state.logout);
  const updateSettings = useProjectStore((s) => s.updateSettings);
  const themePresetId = useProjectStore((s) => s.settings.themePreset);
  const customThemes = useProjectStore((s) => s.settings.customThemes);

  const { t } = useTranslation();

  const [userMenuAnchor, setUserMenuAnchor] = useState<HTMLElement | null>(null);
  const userMenuOpen = Boolean(userMenuAnchor);

  const pathnames = pathname.split('/').filter((x) => x);

  const handleLogout = async () => {
    setUserMenuAnchor(null);
    await logout();
    router.push('/admin/login');
  };

  const toggleTheme = useCallback(() => {
    const nextMode: 'light' | 'dark' = isDark ? 'light' : 'dark';

    const allPresets: ThemePreset[] = [
      ...THEME_LIST,
      ...(customThemes || []),
    ];

    const currentPreset = allPresets.find((p) => p.id === themePresetId);
    const nextPreset =
      currentPreset?.mode === nextMode
        ? currentPreset
        : allPresets.find((p) => p.mode === nextMode) ||
          (nextMode === 'dark' ? DARK_THEMES[0] : LIGHT_THEMES[0]);

    updateSettings({
      theme: nextMode,
      themePreset: nextPreset?.id || themePresetId,
    });
  }, [customThemes, isDark, themePresetId, updateSettings]);

  const roleLabel = role === 'admin' ? t('header.superAdmin') : role === 'editor' ? t('header.editor') : t('header.viewer');

  return (
    <Box
      sx={{
        height: 64,
        px: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.paper',
      }}
    >
      {/* Breadcrumbs */}
      <Breadcrumbs
        separator={<ChevronRight size={14} style={{ opacity: 0.4 }} />}
        aria-label='breadcrumb'
      >
        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const label = BREADCRUMB_LABELS[value] || decodeURIComponent(value).charAt(0).toUpperCase() + decodeURIComponent(value).slice(1);
          const isHome = index === 0 && value === 'admin';

          if (isHome) {
            return (
              <Link href='/admin/dashboard' key={to} style={{ textDecoration: 'none' }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha('#8B5CF6', 0.1),
                    color: '#8B5CF6',
                    transition: 'all 150ms ease',
                    '&:hover': { bgcolor: alpha('#8B5CF6', 0.15) },
                  }}
                >
                  <Home size={16} />
                </Box>
              </Link>
            );
          }

          return last ? (
            <Typography key={to} color='text.primary' fontWeight={600} fontSize={14}>
              {label}
            </Typography>
          ) : (
            <Link href={to} key={to} style={{ textDecoration: 'none' }}>
              <Typography color='text.secondary' fontSize={13} fontWeight={500}
                sx={{ '&:hover': { color: '#8B5CF6' } }}>
                {label}
              </Typography>
            </Link>
          );
        })}
      </Breadcrumbs>

      {/* Search */}
      <Box
        component="button"
        onClick={() => document.dispatchEvent(new CustomEvent('openCommandPalette'))}
        sx={{
          display: { xs: 'none', md: 'flex' },
          alignItems: 'center',
          gap: 1.5,
          px: 2,
          py: 1,
          borderRadius: '10px',
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: alpha(theme.palette.text.primary, isDark ? 0.04 : 0.02),
          width: 280,
          cursor: 'pointer',
          transition: 'all 150ms ease',
          '&:hover': {
            borderColor: alpha('#8B5CF6', 0.5),
            bgcolor: alpha('#8B5CF6', isDark ? 0.08 : 0.04),
          },
        }}
      >
        <Search size={16} color={theme.palette.text.secondary} />
        <InputBase
          placeholder={t('header.search') || 'Search...'}
          readOnly
          sx={{ flex: 1, fontSize: 13, color: 'text.primary' }}
        />
        <Chip label='⌘K' size='small' sx={{ height: 20, fontSize: 10, fontWeight: 600, bgcolor: alpha(theme.palette.text.primary, 0.08), borderRadius: '6px' }} />
      </Box>

      {/* Actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Tooltip title={isDark ? 'Light mode' : 'Dark mode'} arrow>
          <IconButton size='small' onClick={toggleTheme}
            sx={{ width: 36, height: 36, borderRadius: '10px', border: `1px solid ${theme.palette.divider}`, '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.04) } }}>
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </IconButton>
        </Tooltip>

        <NotificationBell />

        {user && (
          <>
            <Box onClick={(e) => setUserMenuAnchor(e.currentTarget)} sx={{
              display: 'flex', alignItems: 'center', gap: 1.5, pl: 1.5, pr: 2, py: 0.75,
              borderRadius: '10px', cursor: 'pointer', transition: 'all 150ms ease',
              '&:hover': { bgcolor: alpha(theme.palette.text.primary, isDark ? 0.06 : 0.04) },
            }}>
              <Avatar src={getUploadUrl(user.avatar)} sx={{
                width: 32, height: 32, fontSize: 13, fontWeight: 700,
                background: `linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)`, color: '#fff',
              }}>
                {!user.avatar && (user.name || 'U').charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography fontWeight={600} fontSize={13} lineHeight={1.3}>{user.name}</Typography>
                <Typography fontSize={11} color='text.secondary' lineHeight={1.2}>{roleLabel}</Typography>
              </Box>
            </Box>

            <Popover open={userMenuOpen} anchorEl={userMenuAnchor} onClose={() => setUserMenuAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              sx={{ mt: 1 }}>
              <Box sx={{ width: 260, py: 1 }}>
                <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar src={getUploadUrl(user.avatar)} sx={{ width: 40, height: 40, background: `linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)`, color: '#fff' }}>
                      {!user.avatar && (user.name || 'U').charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography fontWeight={700} fontSize={14}>{user.name}</Typography>
                      <Typography variant='body2' color='text.secondary' fontSize={12}>{user.email}</Typography>
                    </Box>
                  </Box>
                  <Chip icon={<Shield size={12} />} label={roleLabel} size='small' sx={{ mt: 1.5, bgcolor: alpha('#8B5CF6', 0.1), color: '#8B5CF6', fontWeight: 600 }} />
                </Box>
                <List sx={{ p: 0.5 }}>
                  <ListItem component='button' onClick={() => { setUserMenuAnchor(null); router.push('/admin/settings/profile'); }}
                    sx={{ cursor: 'pointer', border: 'none', bgcolor: 'transparent', width: '100%', borderRadius: '8px', py: 1, '&:hover': { bgcolor: alpha('#8B5CF6', 0.06) } }}>
                    <ListItemIcon sx={{ minWidth: 32 }}><User size={16} /></ListItemIcon>
                    <ListItemText primary={t('header.profile')} slotProps={{ primary: { fontSize: 13 } }} />
                  </ListItem>
                  <ListItem component='button' onClick={() => { setUserMenuAnchor(null); router.push('/admin/settings'); }}
                    sx={{ cursor: 'pointer', border: 'none', bgcolor: 'transparent', width: '100%', borderRadius: '8px', py: 1, '&:hover': { bgcolor: alpha('#8B5CF6', 0.06) } }}>
                    <ListItemIcon sx={{ minWidth: 32 }}><Settings size={16} /></ListItemIcon>
                    <ListItemText primary='Settings' slotProps={{ primary: { fontSize: 13 } }} />
                  </ListItem>
                  <Divider sx={{ my: 0.5 }} />
                  <ListItem component='button' onClick={handleLogout}
                    sx={{ cursor: 'pointer', border: 'none', bgcolor: 'transparent', width: '100%', borderRadius: '8px', py: 1, color: 'error.main', '&:hover': { bgcolor: alpha('#EF4444', 0.08) } }}>
                    <ListItemIcon sx={{ minWidth: 32, color: 'error.main' }}><LogOut size={16} /></ListItemIcon>
                    <ListItemText primary={t('header.signOut')} slotProps={{ primary: { fontSize: 13, fontWeight: 600 } }} />
                  </ListItem>
                </List>
              </Box>
            </Popover>
          </>
        )}
      </Box>
    </Box>
  );
}
