"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import {
  MessageCircle, X, Send, Plus, ArrowLeft, Users, Circle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useRealtime } from './RealtimeProvider';
import { useTranslation } from '@/lib/i18n';

interface ChatRoom {
  id: string;
  name: string;
  type: string;
  members: string[];
}

interface ChatMessage {
  id: number;
  room_id: string;
  user_id: string;
  user_email: string | null;
  message: string;
  type: string;
  created_at: string;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((s) => s.user);
  const { on, send, onlineUsers } = useRealtime();
  const { t } = useTranslation();

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ data: ChatRoom[] }>('/chat/rooms');
      setRooms(res.data || []);
    } catch (err: any) {
      console.error('[Chat] fetchRooms error:', err);
      setError(err.message || 'Failed to load rooms');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (roomId: string) => {
    try {
      const res = await api.get<{ data: ChatMessage[] }>('/chat/messages', { room_id: roomId });
      setMessages(res.data || []);
    } catch (err: any) {
      console.error('[Chat] fetchMessages error:', err);
    }
  }, []);

  useEffect(() => {
    if (open) fetchRooms();
  }, [open, fetchRooms]);

  useEffect(() => {
    if (activeRoom) {
      fetchMessages(activeRoom.id);
      send('join_room', {}, `chat:${activeRoom.id}`);
    }
  }, [activeRoom, fetchMessages, send]);

  useEffect(() => {
    const unsub = on('chat:message', (msg) => {
      if (msg.room === `chat:${activeRoom?.id}` && msg.userId !== user?.id) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            room_id: activeRoom!.id,
            user_id: msg.data.userId as string,
            user_email: msg.data.email as string,
            message: msg.data.message as string,
            type: 'text',
            created_at: msg.timestamp,
          },
        ]);
      }
    });
    return unsub;
  }, [on, activeRoom, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !activeRoom) return;
    const msgText = input.trim();
    setInput('');

    const optimisticMsg: ChatMessage = {
      id: Date.now(),
      room_id: activeRoom.id,
      user_id: user?.id || '',
      user_email: user?.email || '',
      message: msgText,
      type: 'text',
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      await api.post('/chat/messages', { room_id: activeRoom.id, message: msgText });
      send('chat:message', { message: msgText, email: user?.email, userId: user?.id }, `chat:${activeRoom.id}`);
    } catch (err: any) {
      console.error('[Chat] send error:', err);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;
    setError(null);
    try {
      const res = await api.post<{ data: ChatRoom }>('/chat/rooms', { name: newRoomName, type: 'group' });
      setCreateDialogOpen(false);
      setNewRoomName('');
      fetchRooms();
      if (res.data) setActiveRoom(res.data);
    } catch (err: any) {
      console.error('[Chat] createRoom error:', err);
      setError(err.message || 'Failed to create room');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <Fab
        color="primary"
        size="medium"
        onClick={() => setOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1300,
          background: 'linear-gradient(135deg, #6644ff, #5533dd)',
          boxShadow: '0 4px 20px rgba(102, 68, 255, 0.4)',
        }}
      >
        <MessageCircle size={22} />
      </Fab>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 380,
            bgcolor: 'background.paper',
          },
        }}
      >
        {activeRoom ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: 1, borderColor: 'divider' }}>
              <IconButton size="small" onClick={() => setActiveRoom(null)}>
                <ArrowLeft size={18} />
              </IconButton>
              <Box sx={{ flexGrow: 1 }}>
                <Typography fontWeight={700} fontSize={14}>{activeRoom.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {activeRoom.members.length} members
                </Typography>
              </Box>
              <IconButton size="small" onClick={() => setOpen(false)}>
                <X size={18} />
              </IconButton>
            </Box>

            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {messages.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">{t('chat.noMessages')}</Typography>
                </Box>
              )}
              {messages.map((msg) => {
                const isOwn = msg.user_id === user?.id;
                const isSystem = msg.type === 'system';

                if (isSystem) {
                  return (
                    <Box key={msg.id} sx={{ textAlign: 'center', py: 0.5 }}>
                      <Chip label={msg.message} size="small" sx={{ fontSize: 11, height: 22, bgcolor: 'action.hover' }} />
                    </Box>
                  );
                }

                return (
                  <Box
                    key={msg.id}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isOwn ? 'flex-end' : 'flex-start',
                    }}
                  >
                    {!isOwn && (
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.25, fontSize: 10 }}>
                        {msg.user_email || msg.user_id}
                      </Typography>
                    )}
                    <Box
                      sx={{
                        maxWidth: '80%',
                        px: 1.5,
                        py: 1,
                        borderRadius: isOwn ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                        bgcolor: isOwn ? 'primary.main' : 'action.hover',
                        color: isOwn ? '#fff' : 'text.primary',
                      }}
                    >
                      <Typography fontSize={13} sx={{ wordBreak: 'break-word' }}>{msg.message}</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, fontSize: 10 }}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                );
              })}
              <div ref={messagesEndRef} />
            </Box>

            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <TextField
                fullWidth
                size="small"
                placeholder={t('chat.typeMessage')}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={handleSend} disabled={!input.trim()} color="primary">
                          <Send size={16} />
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
              <Typography fontWeight={700} fontSize={16}>{t('chat.title')}</Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <IconButton size="small" onClick={() => setCreateDialogOpen(true)}>
                  <Plus size={18} />
                </IconButton>
                <IconButton size="small" onClick={() => setOpen(false)}>
                  <X size={18} />
                </IconButton>
              </Box>
            </Box>

            {error && (
              <Alert severity="error" onClose={() => setError(null)} sx={{ mx: 2, mt: 1, borderRadius: '8px' }}>
                {error}
              </Alert>
            )}

            {onlineUsers.length > 0 && (
              <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  {t('chat.online')} ({onlineUsers.length})
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                  {onlineUsers.map((uid) => (
                    <Badge
                      key={uid}
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={<Circle size={8} fill="#22C55E" color="#22C55E" />}
                    >
                      <Avatar sx={{ width: 28, height: 28, fontSize: 11, bgcolor: 'primary.main' }}>
                        {uid.charAt(0).toUpperCase()}
                      </Avatar>
                    </Badge>
                  ))}
                </Box>
              </Box>
            )}

            <List sx={{ flexGrow: 1, overflowY: 'auto', p: 0 }}>
              {loading ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : rooms.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Users size={36} style={{ opacity: 0.15 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {t('chat.noMessages')}
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<Plus size={14} />}
                    onClick={() => setCreateDialogOpen(true)}
                    sx={{ mt: 1 }}
                  >
                    {t('chat.newConversation')}
                  </Button>
                </Box>
              ) : (
                rooms.map((room) => (
                  <ListItem key={room.id} disablePadding>
                    <ListItemButton onClick={() => setActiveRoom(room)} sx={{ px: 2, py: 1.5 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.dark', width: 36, height: 36 }}>
                          {room.type === 'direct' ? <MessageCircle size={18} /> : <Users size={18} />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={room.name}
                        secondary={`${room.members.length} members`}
                        slotProps={{
                          primary: { fontSize: 13, fontWeight: 600 },
                          secondary: { fontSize: 11 },
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))
              )}
            </List>
          </Box>
        )}
      </Drawer>

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('chat.newConversation')}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2, borderRadius: '8px' }}>
              {error}
            </Alert>
          )}
          <TextField
            fullWidth
            label="Room Name"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            sx={{ mt: 1 }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreateRoom(); }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleCreateRoom}>{t('common.create')}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
