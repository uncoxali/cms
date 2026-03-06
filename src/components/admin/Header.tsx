'use client';

import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Badge from '@mui/material/Badge';
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
import { useTheme, alpha } from '@mui/material/styles';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  Check,
  ChevronRight,
  LogOut,
  User,
  Shield,
  Search,
  Sun,
  Moon,
  Settings,
  Home,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useNotificationsStore } from '@/store/notifications';
import { useProjectStore } from '@/store/project';
import { useTranslation } from '@/lib/i18n';
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
  const themeMode = useProjectStore((s) => s.settings.theme);
  const updateSettings = useProjectStore((s) => s.updateSettings);

  const { t } = useTranslation();
  const notifications = useNotificationsStore((state) => state.notifications);
  const markAsRead = useNotificationsStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationsStore((state) => state.markAllAsRead);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const open = Boolean(anchorEl);

  const [userMenuAnchor, setUserMenuAnchor] = useState<HTMLElement | null>(null);
  const userMenuOpen = Boolean(userMenuAnchor);

  const [searchFocused, setSearchFocused] = useState(false);

  const pathnames = pathname.split('/').filter((x) => x);

  const handleLogout = async () => {
    setUserMenuAnchor(null);
    await logout();
    router.push('/admin/login');
  };

  const toggleTheme = useCallback(() => {
    const next = isDark ? 'light' : 'dark';
    updateSettings({ theme: next });
  }, [isDark, updateSettings]);

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

  return (
    <Box
      sx={{
        height: 60,
        px: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundColor: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Left: Breadcrumbs */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Breadcrumbs
          separator={
            <ChevronRight
              size={14}
              style={{ opacity: 0.35, color: theme.palette.text.secondary }}
            />
          }
          aria-label='breadcrumb'
        >
          {pathnames.map((value, index) => {
            const last = index === pathnames.length - 1;
            const to = `/${pathnames.slice(0, index + 1).join('/')}`;
            const label =
              BREADCRUMB_LABELS[value] ||
              decodeURIComponent(value).charAt(0).toUpperCase() +
                decodeURIComponent(value).slice(1);
            const isHome = index === 0 && value === 'admin';

            if (isHome) {
              return (
                <Link
                  href='/admin/dashboard'
                  key={to}
                  passHref
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                >
                  <Home size={15} color={theme.palette.text.secondary} />
                </Link>
              );
            }

            return last ? (
              <Typography
                key={to}
                color='text.primary'
                fontWeight={600}
                fontSize={14}
                sx={{ letterSpacing: '-0.01em' }}
              >
                {label}
              </Typography>
            ) : (
              <Link href={to} key={to} passHref style={{ textDecoration: 'none' }}>
                <Typography
                  color='text.secondary'
                  fontSize={13}
                  sx={{
                    transition: 'color 200ms ease',
                    '&:hover': { color: theme.palette.primary.main },
                  }}
                >
                  {label}
                </Typography>
              </Link>
            );
          })}
        </Breadcrumbs>
      </Box>

      {/* Center: Search */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 0.5,
          borderRadius: '12px',
          border: `1px solid ${searchFocused ? theme.palette.primary.main : theme.palette.divider}`,
          bgcolor: searchFocused
            ? alpha(theme.palette.primary.main, 0.04)
            : alpha(theme.palette.background.default, 0.5),
          transition: 'all 250ms ease',
          width: 280,
          boxShadow: searchFocused
            ? `0 0 0 3px ${alpha(theme.palette.primary.main, 0.08)}`
            : 'none',
        }}
      >
        <Search
          size={15}
          color={searchFocused ? theme.palette.primary.main : theme.palette.text.secondary}
        />
        <InputBase
          placeholder={t('header.search') || 'Search...'}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          sx={{
            flex: 1,
            fontSize: 13,
            color: 'text.primary',
            '& input::placeholder': {
              color: theme.palette.text.secondary,
              opacity: 0.7,
            },
          }}
        />
        <Chip
          label='⌘K'
          size='small'
          sx={{
            height: 22,
            fontSize: 10,
            fontWeight: 700,
            fontFamily: 'monospace',
            bgcolor: alpha(theme.palette.text.primary, 0.06),
            color: 'text.secondary',
            borderRadius: '6px',
            '& .MuiChip-label': { px: 0.75 },
          }}
        />
      </Box>

      {/* Right: Actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* Theme Toggle */}
        <Tooltip title={isDark ? 'Light mode' : 'Dark mode'} arrow>
          <IconButton
            size='small'
            onClick={toggleTheme}
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              border: `1px solid ${theme.palette.divider}`,
              color: 'text.secondary',
              transition: 'all 200ms ease',
              '&:hover': {
                bgcolor: 'action.hover',
                borderColor: alpha(theme.palette.text.primary, 0.15),
                color: 'text.primary',
              },
            }}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </IconButton>
        </Tooltip>

        {/* Realtime Notifications */}
        <NotificationBell />

        {/* App Notifications */}
        <Tooltip title={t('header.notifications')} arrow>
          <IconButton
            size='small'
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              border: `1px solid ${theme.palette.divider}`,
              color: 'text.secondary',
              transition: 'all 200ms ease',
              '&:hover': {
                bgcolor: 'action.hover',
                borderColor: alpha(theme.palette.text.primary, 0.15),
                color: 'text.primary',
              },
            }}
          >
            <Badge
              badgeContent={unreadCount}
              color='error'
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: 10,
                  height: 18,
                  minWidth: 18,
                  fontWeight: 700,
                },
              }}
            >
              <Bell size={16} />
            </Badge>
          </IconButton>
        </Tooltip>

        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{ mt: 1 }}
        >
          <Box sx={{ width: 360, maxHeight: 440, display: 'flex', flexDirection: 'column' }}>
            <Box
              sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <Typography fontWeight={700} fontSize={15}>
                {t('header.notifications')}
              </Typography>
              {unreadCount > 0 && (
                <Button
                  size='small'
                  startIcon={<Check size={14} />}
                  onClick={markAllAsRead}
                  color='inherit'
                  sx={{ fontSize: 12 }}
                >
                  {t('header.markAllRead')}
                </Button>
              )}
            </Box>
            <Divider />
            <List sx={{ p: 0, overflowY: 'auto', flexGrow: 1, maxHeight: 300 }}>
              {notifications.length === 0 ? (
                <ListItem sx={{ py: 5, justifyContent: 'center', flexDirection: 'column', gap: 1 }}>
                  <Bell size={28} style={{ opacity: 0.12 }} />
                  <Typography fontWeight={600} fontSize={14} color='text.primary'>
                    {t('header.allClear')}
                  </Typography>
                  <Typography variant='body2' color='text.secondary' fontSize={12}>
                    {t('header.noNotifications')}
                  </Typography>
                </ListItem>
              ) : (
                notifications.slice(0, 5).map((notif) => (
                  <ListItem
                    key={notif.id}
                    sx={{
                      bgcolor: notif.isRead
                        ? 'transparent'
                        : alpha(theme.palette.primary.main, 0.04),
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      py: 1.5,
                      px: 2,
                      transition: 'background-color 200ms ease',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        width: '100%',
                        mb: 0.5,
                      }}
                    >
                      <Typography
                        variant='subtitle2'
                        fontWeight={notif.isRead ? 400 : 700}
                        fontSize={13}
                      >
                        {notif.title}
                      </Typography>
                      {!notif.isRead && (
                        <Box
                          sx={{
                            width: 7,
                            height: 7,
                            bgcolor: theme.palette.primary.main,
                            borderRadius: '50%',
                            mt: 0.5,
                            flexShrink: 0,
                            boxShadow: `0 0 8px ${alpha(theme.palette.primary.main, 0.5)}`,
                          }}
                        />
                      )}
                    </Box>
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      fontSize={12}
                      sx={{ mb: 0.5 }}
                    >
                      {notif.message}
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        width: '100%',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant='caption' color='text.secondary' fontSize={11}>
                        {new Date(notif.timestamp).toLocaleString([], {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </Typography>
                      {!notif.isRead && (
                        <Button
                          size='small'
                          sx={{ minWidth: 'auto', p: 0, fontSize: 11 }}
                          onClick={() => markAsRead(notif.id)}
                        >
                          {t('header.markRead')}
                        </Button>
                      )}
                    </Box>
                  </ListItem>
                ))
              )}
            </List>
            <Divider />
            <Box sx={{ p: 1, textAlign: 'center' }}>
              <Link href='/admin/activity' passHref style={{ textDecoration: 'none' }}>
                <Button
                  size='small'
                  color='inherit'
                  fullWidth
                  onClick={() => setAnchorEl(null)}
                  sx={{ fontSize: 12 }}
                >
                  {t('header.viewAllActivity')}
                </Button>
              </Link>
            </Box>
          </Box>
        </Popover>

        {/* Divider */}

        {/* User Avatar with Dropdown */}
        {user && (
          <>
            <Box
              onClick={(e) => setUserMenuAnchor(e.currentTarget)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                pl: 1,
                pr: 1.5,
                py: 0.5,
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 200ms ease',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <Avatar
                src={user.avatar || undefined}
                sx={{
                  width: 32,
                  height: 32,
                  fontSize: 13,
                  fontWeight: 700,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                  color: '#fff',
                }}
              >
                {!user.avatar && user.name.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography fontWeight={600} fontSize={13} color='text.primary' lineHeight={1.3}>
                  {user.name}
                </Typography>
                <Typography
                  fontSize={11}
                  color='text.secondary'
                  lineHeight={1.2}
                  sx={{ opacity: 0.8 }}
                >
                  {roleLabel}
                </Typography>
              </Box>
            </Box>

            <Popover
              open={userMenuOpen}
              anchorEl={userMenuAnchor}
              onClose={() => setUserMenuAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              sx={{ mt: 1 }}
            >
              <Box sx={{ width: 260, py: 0.5 }}>
                <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <Avatar
                      src={user.avatar || undefined}
                      sx={{
                        width: 40,
                        height: 40,
                        fontSize: 16,
                        fontWeight: 700,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                        color: '#fff',
                      }}
                    >
                      {!user.avatar && user.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography fontWeight={700} fontSize={14} lineHeight={1.3}>
                        {user.name}
                      </Typography>
                      <Typography variant='body2' color='text.secondary' fontSize={12}>
                        {user.email}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    icon={<Shield size={12} />}
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
                <List sx={{ p: 0.5 }}>
                  <ListItem
                    component='button'
                    onClick={() => {
                      setUserMenuAnchor(null);
                      router.push('/admin/settings/profile');
                    }}
                    sx={{
                      cursor: 'pointer',
                      border: 'none',
                      bgcolor: 'transparent',
                      width: '100%',
                      borderRadius: '8px',
                      py: 1,
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <User size={16} />
                    </ListItemIcon>
                    <ListItemText
                      primary={t('header.profile')}
                      slotProps={{ primary: { fontSize: 13 } }}
                    />
                  </ListItem>
                  <Divider sx={{ my: 0.5 }} />
                  <ListItem
                    component='button'
                    onClick={handleLogout}
                    sx={{
                      cursor: 'pointer',
                      border: 'none',
                      bgcolor: 'transparent',
                      width: '100%',
                      borderRadius: '8px',
                      py: 1,
                      color: theme.palette.error.main,
                      '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08) },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32, color: theme.palette.error.main }}>
                      <LogOut size={16} />
                    </ListItemIcon>
                    <ListItemText
                      primary={t('header.signOut')}
                      slotProps={{ primary: { fontSize: 13, fontWeight: 600 } }}
                    />
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
