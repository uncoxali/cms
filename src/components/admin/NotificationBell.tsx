"use client";

import { useState } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import { Bell, Wifi, WifiOff, Trash2 } from 'lucide-react';
import { useRealtime } from './RealtimeProvider';
import { useTranslation } from '@/lib/i18n';

export default function NotificationBell() {
  const { status, realtimeNotifications, clearNotifications } = useRealtime();
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const open = Boolean(anchorEl);

  const unreadCount = realtimeNotifications.filter((n) => !n.read).length;

  const statusColor = status === 'connected' ? 'success.main' : status === 'connecting' ? 'warning.main' : 'error.main';
  const StatusIcon = status === 'connected' ? Wifi : WifiOff;

  return (
    <>
      <Tooltip title={`WebSocket: ${status}`} arrow>
        <IconButton
          size="small"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            width: 36,
            height: 36,
            border: 1,
            borderColor: 'divider',
            borderRadius: '10px',
            transition: 'all 200ms ease',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <Badge
            badgeContent={unreadCount}
            color="error"
            sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 18, minWidth: 18 } }}
          >
            <Bell size={17} />
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
        <Box sx={{ width: 380, maxHeight: 460, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography fontWeight={700} fontSize={15}>
                {t('header.notifications')}
              </Typography>
              <Chip
                icon={<StatusIcon size={12} />}
                label={status}
                size="small"
                sx={{
                  height: 20,
                  fontSize: 10,
                  '& .MuiChip-icon': { color: statusColor },
                  bgcolor: 'action.hover',
                }}
              />
            </Box>
            {realtimeNotifications.length > 0 && (
              <IconButton size="small" onClick={clearNotifications}>
                <Trash2 size={14} />
              </IconButton>
            )}
          </Box>
          <Divider />
          <List sx={{ p: 0, overflowY: 'auto', flexGrow: 1, maxHeight: 350 }}>
            {realtimeNotifications.length === 0 ? (
              <ListItem sx={{ py: 4, justifyContent: 'center', flexDirection: 'column', gap: 1 }}>
                <StatusIcon size={24} style={{ opacity: 0.3 }} />
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  {t('header.noNotifications')}
                </Typography>
              </ListItem>
            ) : (
              realtimeNotifications.map((notif) => (
                <ListItem
                  key={notif.id}
                  sx={{
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    py: 1.5,
                    px: 2,
                    borderBottom: 1,
                    borderColor: 'divider',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={600} fontSize={13}>
                      {notif.message}
                    </Typography>
                    <Chip
                      label={notif.event.split(':')[0]}
                      size="small"
                      sx={{ height: 18, fontSize: 10, ml: 1 }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary" fontSize={11}>
                    {new Date(notif.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </Typography>
                </ListItem>
              ))
            )}
          </List>
          {realtimeNotifications.length > 0 && (
            <>
              <Divider />
              <Box sx={{ p: 1, textAlign: 'center' }}>
                <Button size="small" color="inherit" fullWidth onClick={clearNotifications} sx={{ fontSize: 12 }}>
                  Clear All
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Popover>
    </>
  );
}
