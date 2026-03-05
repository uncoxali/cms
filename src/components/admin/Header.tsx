"use client";

import { useState } from 'react';
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
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Check, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useNotificationsStore } from '@/store/notifications';

export default function Header() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  const notifications = useNotificationsStore(state => state.notifications);
  const markAsRead = useNotificationsStore(state => state.markAsRead);
  const markAllAsRead = useNotificationsStore(state => state.markAllAsRead);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const open = Boolean(anchorEl);

  const pathnames = pathname.split('/').filter((x) => x);

  return (
    <Box
      sx={{
        height: 56,
        px: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
        backgroundColor: 'rgba(15, 17, 20, 0.6)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <Breadcrumbs
        separator={<ChevronRight size={14} style={{ opacity: 0.3 }} />}
        aria-label="breadcrumb"
      >
        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const title = decodeURIComponent(value).charAt(0).toUpperCase() + decodeURIComponent(value).slice(1);

          return last ? (
            <Typography color="text.primary" key={to} fontWeight={600} fontSize={14}>
              {title}
            </Typography>
          ) : (
            <Link href={to} key={to} passHref style={{ textDecoration: 'none' }}>
              <Typography
                color="text.secondary"
                fontSize={14}
                sx={{
                  transition: 'color 200ms ease',
                  '&:hover': { color: 'text.primary' },
                }}
              >
                {title}
              </Typography>
            </Link>
          );
        })}
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {/* Notifications */}
        <IconButton
          size="small"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            width: 36, height: 36,
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '10px',
            transition: 'all 200ms ease',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderColor: 'rgba(255,255,255,0.12)',
            },
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

        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{ mt: 1 }}
        >
          <Box sx={{ width: 360, maxHeight: 420, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography fontWeight={700} fontSize={15}>Notifications</Typography>
              {unreadCount > 0 && (
                <Button size="small" startIcon={<Check size={14} />} onClick={markAllAsRead} color="inherit" sx={{ fontSize: 12 }}>
                  Mark all read
                </Button>
              )}
            </Box>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.04)' }} />
            <List sx={{ p: 0, overflowY: 'auto', flexGrow: 1, maxHeight: 300 }}>
              {notifications.length === 0 ? (
                <ListItem sx={{ py: 4, justifyContent: 'center' }}>
                  <ListItemText
                    primary="All clear!"
                    secondary="No notifications right now."
                    slotProps={{ primary: { textAlign: 'center', fontWeight: 600 }, secondary: { textAlign: 'center' } }}
                  />
                </ListItem>
              ) : (
                notifications.slice(0, 5).map(notif => (
                  <ListItem
                    key={notif.id}
                    sx={{
                      bgcolor: notif.isRead ? 'transparent' : 'rgba(102, 68, 255, 0.04)',
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      py: 1.5, px: 2,
                      transition: 'background-color 200ms ease',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 0.5 }}>
                      <Typography variant="subtitle2" fontWeight={notif.isRead ? 400 : 700} fontSize={13}>
                        {notif.title}
                      </Typography>
                      {!notif.isRead && (
                        <Box sx={{ width: 7, height: 7, bgcolor: '#6644ff', borderRadius: '50%', mt: 0.5, flexShrink: 0, boxShadow: '0 0 8px rgba(102,68,255,0.5)' }} />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary" fontSize={12} sx={{ mb: 0.5 }}>
                      {notif.message}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary" fontSize={11}>
                        {new Date(notif.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </Typography>
                      {!notif.isRead && (
                        <Button size="small" sx={{ minWidth: 'auto', p: 0, fontSize: 11 }} onClick={() => markAsRead(notif.id)}>
                          Mark read
                        </Button>
                      )}
                    </Box>
                  </ListItem>
                ))
              )}
            </List>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.04)' }} />
            <Box sx={{ p: 1, textAlign: 'center' }}>
              <Link href="/admin/activity" passHref style={{ textDecoration: 'none' }}>
                <Button size="small" color="inherit" fullWidth onClick={() => setAnchorEl(null)} sx={{ fontSize: 12 }}>
                  View All Activity
                </Button>
              </Link>
            </Box>
          </Box>
        </Popover>

        {/* User Avatar */}
        {user && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 1.5,
              py: 0.75,
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.06)',
              cursor: 'pointer',
              transition: 'all 200ms ease',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderColor: 'rgba(255,255,255,0.12)',
              },
            }}
          >
            <Avatar
              sx={{
                width: 28, height: 28, fontSize: 12, fontWeight: 700,
                background: 'linear-gradient(135deg, #6644ff 0%, #8B6FFF 100%)',
              }}
            >
              {user.name.charAt(0)}
            </Avatar>
            <Typography variant="body2" fontWeight={600} fontSize={13} color="text.primary">
              {user.name}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
