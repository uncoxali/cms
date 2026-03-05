"use client";

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Link from 'next/link';
import {
  Database, Bookmark, Blocks, Settings as SettingsIcon,
  Shield, FolderOpen, Zap, SlidersHorizontal, Globe
} from 'lucide-react';

const SETTINGS_NAV = [
  { title: 'Data Model', icon: Database, path: '/admin/settings/data-model' },
  { title: 'Project Settings', icon: Globe, path: '/admin/settings/project' },
  { title: 'Roles & Permissions', icon: Shield, path: '/admin/settings/roles' },
  { title: 'Presets', icon: SlidersHorizontal, path: '/admin/settings/presets' },
  { title: 'Files & Storage', icon: FolderOpen, path: '/admin/settings/files' },
  { title: 'Flows', icon: Zap, path: '/admin/settings/flows' },
  { title: 'Extensions', icon: Blocks, path: '/admin/settings/extensions' },
  { title: 'Bookmarks', icon: Bookmark, path: '/admin/settings/bookmarks' },
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <Box sx={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden', m: -4 }}>
      {/* Sidebar — same style as ContentSidebar */}
      <Box sx={{
        width: 240,
        flexShrink: 0,
        height: '100%',
        background: 'linear-gradient(180deg, #13151a 0%, #111318 100%)',
        borderRight: '1px solid rgba(255, 255, 255, 0.04)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Box sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
        }}>
          <SettingsIcon size={16} style={{ opacity: 0.5 }} />
          <Typography variant="subtitle2" fontWeight={700} fontSize={12}
            letterSpacing="0.05em" textTransform="uppercase" color="text.secondary">
            Settings
          </Typography>
        </Box>
        <List sx={{ px: 1, pt: 1 }}>
          {SETTINGS_NAV.map((item) => {
            const isActive = pathname.startsWith(item.path);
            return (
              <Link href={item.path} key={item.title} style={{ textDecoration: 'none', color: 'inherit' }}>
                <ListItemButton sx={{
                  borderRadius: '8px',
                  mb: 0.5,
                  py: 0.75,
                  backgroundColor: isActive ? 'rgba(102, 68, 255, 0.08)' : 'transparent',
                  color: isActive ? '#8B6FFF' : 'text.secondary',
                  transition: 'all 200ms ease',
                  '&:hover': {
                    backgroundColor: isActive ? 'rgba(102, 68, 255, 0.12)' : 'rgba(255,255,255,0.03)',
                    color: isActive ? '#8B6FFF' : 'text.primary',
                  },
                }}>
                  <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
                    <item.icon size={16} strokeWidth={isActive ? 2.5 : 1.5} />
                  </ListItemIcon>
                  <ListItemText primary={item.title}
                    slotProps={{ primary: { fontSize: 13, fontWeight: isActive ? 600 : 400 } }} />
                </ListItemButton>
              </Link>
            );
          })}
        </List>
      </Box>

      {/* Page Content */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 4, height: '100%' }}>
        {children}
      </Box>
    </Box>
  );
}
