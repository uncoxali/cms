"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useProjectStore } from '@/store/project';
import { ExtensionRegistry } from '@/lib/meta/registry';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

const DRAWER_WIDTH = 68;

// Map module IDs to feature flag keys
const MODULE_FEATURE_MAP: Record<string, string> = {
  dashboard: 'insights',
  files: 'files',
  flows: 'flows',
  activity: 'activity',
};

export default function Sidebar() {
  const pathname = usePathname();
  const role = useAuthStore((state) => state.role);
  const featureFlags = useProjectStore((state) => state.settings.featureFlags);

  return (
    <Box
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        height: '100vh',
        background: 'linear-gradient(180deg, #13151a 0%, #0e1015 100%)',
        borderRight: '1px solid rgba(255, 255, 255, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pt: 2,
        pb: 2,
        position: 'relative',
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '1px',
          height: '100%',
          background: 'linear-gradient(180deg, rgba(102,68,255,0.2) 0%, transparent 30%, transparent 70%, rgba(102,68,255,0.1) 100%)',
        },
      }}
    >
      {/* Logo */}
      <Box sx={{ mb: 4, position: 'relative' }}>
        <Box sx={{
          width: 38,
          height: 38,
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #6644ff 0%, #4422cc 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(102, 68, 255, 0.3)',
          transition: 'all 300ms ease',
          cursor: 'pointer',
          '&:hover': {
            transform: 'scale(1.08)',
            boxShadow: '0 6px 24px rgba(102, 68, 255, 0.45)',
          },
        }}>
          <Typography sx={{ color: 'white', fontWeight: 800, fontSize: 16, letterSpacing: '-0.03em' }}>N</Typography>
        </Box>
      </Box>

      {/* Nav Items */}
      <List sx={{ width: '100%', px: 1, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {ExtensionRegistry.modules.map((item) => {
          if (!role || !item.permissionsRequired.includes(role)) return null;
          const flagKey = MODULE_FEATURE_MAP[item.id];
          if (flagKey && !(featureFlags as any)[flagKey]) return null;

          const isActive = pathname.startsWith(item.path);

          return (
            <ListItem key={item.id} disablePadding sx={{ display: 'block' }}>
              <Tooltip title={item.name} placement="right" arrow>
                <ListItemButton
                  component={Link}
                  href={item.path}
                  sx={{
                    minHeight: 44,
                    justifyContent: 'center',
                    px: 1.5,
                    mx: 0.5,
                    borderRadius: '10px',
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.4)',
                    position: 'relative',
                    transition: 'all 200ms ease',
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(102,68,255,0.2) 0%, rgba(102,68,255,0.08) 100%)'
                      : 'transparent',
                    '&::before': isActive ? {
                      content: '""',
                      position: 'absolute',
                      left: -4,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 3,
                      height: 20,
                      borderRadius: '0 3px 3px 0',
                      background: 'linear-gradient(180deg, #6644ff, #8B6FFF)',
                    } : {},
                    '&:hover': {
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(102,68,255,0.25) 0%, rgba(102,68,255,0.12) 100%)'
                        : 'rgba(255,255,255,0.04)',
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 0, justifyContent: 'center', color: 'inherit' }}>
                    <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  </ListItemIcon>
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>

      {/* Bottom indicator */}
      <Box sx={{
        width: 32, height: 4, borderRadius: 2,
        background: 'rgba(255,255,255,0.06)',
        mb: 1,
      }} />
    </Box>
  );
}
