"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useProjectStore } from '@/store/project';
import { ExtensionRegistry } from '@/lib/meta/registry';
import { api } from '@/lib/api';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useTheme, alpha } from '@mui/material/styles';
import { FileText } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

const DRAWER_WIDTH = 220;

const MODULE_FEATURE_MAP: Record<string, string> = {
  dashboard: 'insights',
  files: 'files',
  flows: 'flows',
  activity: 'activity',
};

interface NavPage {
  id: number;
  title: string;
  path: string;
  icon: string | null;
  roles: string[];
}

const SIDEBAR_KEYS: Record<string, string> = {
  dashboard: 'sidebar.insights',
  content: 'sidebar.content',
  pages: 'sidebar.pages',
  files: 'sidebar.files',
  users: 'sidebar.users',
  flows: 'sidebar.automations',
  settings: 'sidebar.settings',
  activity: 'sidebar.activity',
};

export default function Sidebar() {
  const pathname = usePathname();
  const role = useAuthStore((state) => state.role);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const featureFlags = useProjectStore((state) => state.settings.featureFlags);
  const [navPages, setNavPages] = useState<NavPage[]>([]);
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  useEffect(() => {
    if (!token) return;
    api.get<{ data: NavPage[] }>('/pages', { nav: '1' })
      .then(res => setNavPages(res.data || []))
      .catch(() => {});
  }, [token]);

  const userPerms = user?.permissions as any;
  const modulePerms = userPerms?._modules || {};
  const pagePerms = userPerms?._pages || {};
  const isAdmin = user?.admin_access;

  const hasModuleAccess = (moduleId: string): boolean => {
    if (isAdmin) return true;
    if (modulePerms[moduleId] === false) return false;
    return true;
  };

  const hasPageAccess = (pageId: number): boolean => {
    if (isAdmin) return true;
    if (pagePerms[pageId] === false) return false;
    return true;
  };

  const visiblePages = navPages.filter(p => {
    if (!role) return false;
    if (!hasPageAccess(p.id)) return false;
    if (!p.roles || p.roles.length === 0) return true;
    return p.roles.includes(role);
  });

  const navItemSx = (isActive: boolean) => ({
    minHeight: 42,
    justifyContent: 'flex-start',
    borderRadius: '10px',
    px: 1.5,
    color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
    position: 'relative' as const,
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    background: isActive
      ? alpha(theme.palette.primary.main, isDark ? 0.14 : 0.08)
      : 'transparent',
    '&::before': isActive
      ? {
          content: '""',
          position: 'absolute',
          left: -8,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 3,
          height: 20,
          borderRadius: '0 4px 4px 0',
          background: `linear-gradient(180deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
        }
      : {},
    '&:hover': {
      background: isActive
        ? alpha(theme.palette.primary.main, isDark ? 0.2 : 0.12)
        : alpha(theme.palette.text.primary, isDark ? 0.06 : 0.04),
      color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
    },
  });

  return (
    <Box
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        height: '100vh',
        bgcolor: isDark
          ? alpha(theme.palette.background.paper, 0.6)
          : theme.palette.background.paper,
        borderRight: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        pt: 2,
        pb: 2,
        position: 'relative',
        backdropFilter: isDark ? 'blur(20px)' : 'none',
      }}
    >
      {/* Logo + Project title */}
      <Box sx={{ mb: 3, px: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{
          width: 36,
          height: 36,
          borderRadius: '12px',
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.35)}`,
          transition: 'all 300ms ease',
          cursor: 'pointer',
          '&:hover': {
            transform: 'scale(1.08)',
            boxShadow: `0 6px 24px ${alpha(theme.palette.primary.main, 0.45)}`,
          },
        }}>
          <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 16, letterSpacing: '-0.03em' }}>N</Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, fontSize: 13, letterSpacing: '-0.02em' }}
          >
            Neurofy CMS
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11, opacity: 0.8 }}>
            Admin Panel
          </Typography>
        </Box>
      </Box>

      {/* Core Modules */}
      <List sx={{
        width: '100%',
        px: 1.25,
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.25,
      }}>
        {ExtensionRegistry.modules.map((item) => {
          if (!role || !item.permissionsRequired.includes(role)) return null;
          if (!hasModuleAccess(item.id)) return null;
          const flagKey = MODULE_FEATURE_MAP[item.id];
          if (flagKey && !(featureFlags as any)[flagKey]) return null;

          const isActive = pathname.startsWith(item.path);

          const labelKey = SIDEBAR_KEYS[item.id];
          const label = labelKey ? t(labelKey) : item.name;

          return (
            <ListItem key={item.id} disablePadding>
              <ListItemButton component={Link} href={item.path} sx={navItemSx(isActive)}>
                <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
                  <item.icon size={20} strokeWidth={isActive ? 2.2 : 1.7} />
                </ListItemIcon>
                <ListItemText
                  primary={label}
                  slotProps={{
                    primary: {
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 500,
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}

        {/* Custom Pages */}
        {visiblePages.length > 0 && (
          <>
            <Box sx={{
              display: 'flex',
              justifyContent: 'flex-start',
              px: 2,
              mt: 1,
              mb: 0.5,
            }}>
              <Box sx={{
                width: '100%',
                height: 1,
                bgcolor: theme.palette.divider,
                borderRadius: 1,
              }} />
            </Box>
            {visiblePages.map((page) => {
              const isActive = pathname === `/admin/pages/view/${page.id}`;
              return (
                <ListItem key={`page-${page.id}`} disablePadding>
                  <ListItemButton component={Link} href={`/admin/pages/view/${page.id}`} sx={navItemSx(isActive)}>
                    <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
                      <FileText size={20} strokeWidth={isActive ? 2.2 : 1.7} />
                    </ListItemIcon>
                    <ListItemText
                      primary={page.title}
                      slotProps={{
                        primary: {
                          fontSize: 13,
                          fontWeight: isActive ? 600 : 500,
                        },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </>
        )}
      </List>

      {/* Bottom accent */}
      <Box sx={{
        width: 28,
        height: 3,
        borderRadius: 2,
        bgcolor: alpha(theme.palette.primary.main, 0.2),
        mb: 1,
      }} />
    </Box>
  );
}
