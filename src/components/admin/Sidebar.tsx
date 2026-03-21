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
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import { FileText, LayoutGrid, FileEdit, FolderOpen, Users, Zap, Activity, Settings, Sparkles } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

const DRAWER_WIDTH = 240;

const MODULE_FEATURE_MAP: Record<string, string> = {
  dashboard: 'insights',
  files: 'files',
  flows: 'flows',
  activity: 'activity',
  comments: 'comments',
  revisions: 'revisions',
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
  // pages: 'sidebar.pages',
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
  const { settings } = useProjectStore();
  const { featureFlags, logoSettings, logoUrl, projectName } = settings;
  const [navPages, setNavPages] = useState<NavPage[]>([]);
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

/*
  useEffect(() => {
    if (!token) return;
    api.get<{ data: NavPage[] }>('/pages', { nav: '1' })
      .then(res => setNavPages(res.data || []))
      .catch(() => {});
  }, [token]);
*/

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

  return (
    <Box
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        borderRight: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <Box sx={{ p: 2.5, pb: 2 }}>
        <Link href="/admin/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {logoSettings?.type === 'custom' ? (
              <>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    background: logoSettings.color 
                      ? alpha(logoSettings.color, 0.15)
                      : `linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)`,
                    color: logoSettings.color || '#8B5CF6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {(() => {
                    const Icon = logoSettings.icon ? (LucideIcons as any)[logoSettings.icon] : Sparkles;
                    return Icon ? <Icon size={20} /> : <Sparkles size={20} />;
                  })()}
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={800} fontSize={15} sx={{ 
                    fontFamily: logoSettings.font || 'inherit',
                    lineHeight: 1.2,
                    letterSpacing: '-0.01em'
                  }}>
                    {logoSettings.text || projectName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontSize={10} fontWeight={500} sx={{ mt: -0.5, display: 'block' }}>
                    Admin Panel
                  </Typography>
                </Box>
              </>
            ) : (
              <>
                {logoUrl ? (
                  <Box component="img" src={logoUrl} sx={{ width: 32, height: 32, objectFit: 'contain' }} />
                ) : (
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '10px',
                      background: `linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>
                      {projectName.charAt(0)}
                    </Typography>
                  </Box>
                )}
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} fontSize={14}>
                    {projectName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontSize={11}>
                    Content Platform
                  </Typography>
                </Box>
              </>
            )}
          </Box>
        </Link>
      </Box>

      {/* Navigation */}
      <List sx={{ px: 1.5, flexGrow: 1, overflow: 'auto' }}>
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
              <ListItemButton
                component={Link}
                href={item.path}
                sx={{
                  borderRadius: '10px',
                  mb: 0.5,
                  py: 1,
                  px: 1.5,
                  position: 'relative',
                  bgcolor: isActive ? alpha('#8B5CF6', isDark ? 0.15 : 0.1) : 'transparent',
                  '&:hover': {
                    bgcolor: isActive 
                      ? alpha('#8B5CF6', isDark ? 0.2 : 0.15) 
                      : alpha(theme.palette.text.primary, isDark ? 0.06 : 0.04),
                  },
                }}
              >
                {isActive && (
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 3,
                      height: 20,
                      borderRadius: '0 3px 3px 0',
                      bgcolor: '#8B5CF6',
                    }}
                  />
                )}
                <ListItemIcon
                  sx={{
                    minWidth: 36,
                    color: isActive ? '#8B5CF6' : theme.palette.text.secondary,
                  }}
                >
                  <item.icon size={18} />
                </ListItemIcon>
                <ListItemText
                  primary={label}
                  slotProps={{
                    primary: {
                      sx: {
                        fontSize: 13.5,
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? '#8B5CF6' : 'text.primary',
                      },
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}

{/* Custom Pages (Disabled for now) */}
{/*
        {visiblePages.length > 0 && (
          <>
            <Box sx={{ my: 0.5, mx: 1, height: 1, bgcolor: 'divider' }} />
            {visiblePages.map((page) => {
              const isActive = pathname === `/admin/pages/view/${page.id}`;
              return (
                <ListItem key={`page-${page.id}`} disablePadding>
                  <ListItemButton
                    component={Link}
                    href={`/admin/pages/view/${page.id}`}
                    sx={{
                      borderRadius: '10px',
                      mb: 0.5,
                      py: 1,
                      px: 1.5,
                      position: 'relative',
                      bgcolor: isActive ? alpha('#8B5CF6', isDark ? 0.15 : 0.1) : 'transparent',
                      '&:hover': {
                        bgcolor: isActive 
                          ? alpha('#8B5CF6', isDark ? 0.2 : 0.15) 
                          : alpha(theme.palette.text.primary, isDark ? 0.06 : 0.04),
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: isActive ? '#8B5CF6' : 'text.secondary' }}>
                      <FileText size={18} />
                    </ListItemIcon>
                    <ListItemText
                      primary={page.title}
                      slotProps={{
                        primary: {
                          sx: {
                            fontSize: 13.5,
                            fontWeight: isActive ? 600 : 500,
                            color: isActive ? '#8B5CF6' : 'text.primary',
                          },
                        },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </>
        )}
*/}
      </List>

      {/* Settings */}
      <Box sx={{ p: 1.5, borderTop: `1px solid ${theme.palette.divider}` }}>
        <ListItemButton
          component={Link}
          href="/admin/settings"
          sx={{
            borderRadius: '10px',
            py: 1,
            px: 1.5,
            bgcolor: pathname.startsWith('/admin/settings') 
              ? alpha('#8B5CF6', isDark ? 0.15 : 0.1) 
              : 'transparent',
            '&:hover': {
              bgcolor: alpha('#8B5CF6', isDark ? 0.15 : 0.08),
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: pathname.startsWith('/admin/settings') ? '#8B5CF6' : 'text.secondary' }}>
            <Settings size={18} />
          </ListItemIcon>
          <ListItemText
            primary="Settings"
            slotProps={{
              primary: {
                sx: {
                  fontSize: 13.5,
                  fontWeight: 500,
                  color: pathname.startsWith('/admin/settings') ? '#8B5CF6' : 'text.primary',
                },
              },
            }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );
}
