'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Link from 'next/link';
import { useTheme, alpha } from '@mui/material/styles';
import {
  Database, Bookmark, Blocks, Settings as SettingsIcon, Shield,
  FolderOpen, Zap, SlidersHorizontal, Globe, Radio, User,
  Bot, Search, GitCompare, Users, Webhook,
} from 'lucide-react';

const SETTINGS_NAV = [
  { title: 'Profile', icon: User, path: '/admin/settings/profile' },
  { title: 'Users', icon: Users, path: '/admin/settings/users' },
  { title: 'Data Model', icon: Database, path: '/admin/settings/data-model' },
  { title: 'Roles & Permissions', icon: Shield, path: '/admin/settings/roles' },
  { title: 'Webhooks', icon: Webhook, path: '/admin/settings/webhooks' },
  { title: 'Flows', icon: Zap, path: '/admin/settings/flows' },
  { title: 'Files & Storage', icon: FolderOpen, path: '/admin/settings/files' },
  { title: 'AI Assistant', icon: Bot, path: '/admin/settings/ai' },
  { title: 'SEO Settings', icon: Search, path: '/admin/settings/seo' },
  { title: 'Schema Sync', icon: GitCompare, path: '/admin/settings/schema-sync' },
  { title: 'Project Settings', icon: Globe, path: '/admin/settings/project' },
  { title: 'Presets', icon: SlidersHorizontal, path: '/admin/settings/presets' },
  { title: 'WebSocket', icon: Radio, path: '/admin/settings/websockets' },
  { title: 'Extensions', icon: Blocks, path: '/admin/settings/extensions' },
  { title: 'Bookmarks', icon: Bookmark, path: '/admin/settings/bookmarks' },
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden', m: -4 }}>
      {/* Sidebar */}
      <Box
        sx={{
          width: 240,
          flexShrink: 0,
          height: '100vh',
          bgcolor: 'background.paper',
          borderRight: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2.5, pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: '10px',
              background: `linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <SettingsIcon size={18} color="#fff" />
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight={700} fontSize={14}>Settings</Typography>
              <Typography variant="caption" color="text.secondary" fontSize={11}>Configure your CMS</Typography>
            </Box>
          </Box>
        </Box>

        <List sx={{ px: 1.5, flexGrow: 1, overflow: 'auto' }}>
          {SETTINGS_NAV.map((item) => {
            const isActive = pathname.startsWith(item.path);
            return (
              <Link href={item.path} key={item.title} style={{ textDecoration: 'none' }}>
                <ListItem disablePadding>
                  <ListItemButton
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
                      <Box sx={{
                        position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                        width: 3, height: 20, borderRadius: '0 3px 3px 0', bgcolor: '#8B5CF6',
                      }} />
                    )}
                    <ListItemIcon sx={{ minWidth: 36, color: isActive ? '#8B5CF6' : theme.palette.text.secondary }}>
                      <item.icon size={18} />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.title}
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
              </Link>
            );
          })}
        </List>
      </Box>

      {/* Page Content */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 4, height: '100%', bgcolor: 'background.default' }}>{children}</Box>
    </Box>
  );
}
