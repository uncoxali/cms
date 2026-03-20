'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import { alpha, useTheme } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import { useActivityStore } from '@/store/activity';
import { useNotificationsStore } from '@/store/notifications';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import { Modal, FormField, FormSection } from '@/components/admin/Modal';
import { StatusToggle } from '@/components/admin/Toggle';
import { api } from '@/lib/api';
import {
  Plus,
  Webhook as WebhookIcon,
  Zap,
  Globe,
  Bell,
  Key,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
  Edit2,
  Copy,
  ExternalLink,
  Search,
  Play,
  Pause,
  Activity,
  RefreshCw,
  Send,
  MoreVertical,
} from 'lucide-react';

interface WebhookRecord {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  status: 'active' | 'inactive' | 'error';
  collections: string[];
  events: string[];
  headers: { key: string; value: string }[];
  auth: {
    type: 'none' | 'bearer' | 'basic' | 'apikey';
    key?: string;
    value?: string;
  };
  last_triggered?: string;
  success_rate: number;
  date_created: string;
}

interface HeaderRow {
  key: string;
  value: string;
}

const METHOD_COLORS: Record<string, { bg: string; text: string }> = {
  GET: { bg: 'rgba(34, 197, 94, 0.1)', text: '#22C55E' },
  POST: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3B82F6' },
  PUT: { bg: 'rgba(245, 158, 11, 0.1)', text: '#F59E0B' },
  PATCH: { bg: 'rgba(168, 85, 247, 0.1)', text: '#A855F7' },
  DELETE: { bg: 'rgba(239, 68, 68, 0.1)', text: '#EF4444' },
};

const EVENT_GROUPS = [
  {
    label: 'Items',
    events: ['items.create', 'items.update', 'items.delete', 'items.publish', 'items.unpublish'],
  },
  {
    label: 'Files',
    events: ['files.upload', 'files.delete'],
  },
  {
    label: 'Auth',
    events: ['auth.login', 'auth.logout', 'auth.password-reset'],
  },
];

export default function WebhooksPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const router = useRouter();
  const { addLog } = useActivityStore();
  const { addNotification } = useNotificationsStore();
  const confirm = useConfirm();

  const [webhooks, setWebhooks] = useState<WebhookRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'error'>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editWebhook, setEditWebhook] = useState<WebhookRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookRecord | null>(null);
  const [headerRows, setHeaderRows] = useState<HeaderRow[]>([{ key: '', value: '' }]);
  const [formData, setFormData] = useState<{
    name: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    url: string;
    collections: string[];
    events: string[];
    auth: { type: 'none' | 'bearer' | 'basic' | 'apikey'; value?: string };
    status: 'active' | 'inactive' | 'error';
  }>({
    name: '',
    method: 'POST',
    url: '',
    collections: [],
    events: [],
    auth: { type: 'none' },
    status: 'active',
  });

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: any[] }>('/webhooks');
      const mapped: WebhookRecord[] = (res.data || []).map((w: any) => ({
        id: String(w.id),
        name: w.name || 'Unnamed Webhook',
        method: w.method || 'POST',
        url: w.url || '',
        status: w.status || 'active',
        collections: w.collections || [],
        events: w.events || [],
        headers: w.headers || [],
        auth: w.auth || { type: 'none' },
        last_triggered: w.last_triggered,
        success_rate: w.success_rate || 100,
        date_created: w.date_created || '',
      }));
      setWebhooks(mapped);
      if (selectedWebhook) {
        const updated = mapped.find(w => w.id === selectedWebhook.id);
        if (updated) setSelectedWebhook(updated);
      }
    } catch (err) {
      console.error('Failed to fetch webhooks:', err);
      addNotification({ title: 'Error', message: 'Failed to load webhooks' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.url.trim()) {
      addNotification({ title: 'Error', message: 'Name and URL are required' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        headers: headerRows.filter(h => h.key.trim() && h.value.trim()),
      };

      if (editWebhook) {
        await api.patch(`/webhooks/${editWebhook.id}`, payload);
        addLog({ action: 'update', collection: 'webhooks', item: formData.name, user: 'Admin' });
        addNotification({ title: 'Webhook Updated', message: `"${formData.name}" has been updated.` });
      } else {
        await api.post('/webhooks', payload);
        addLog({ action: 'create', collection: 'webhooks', item: formData.name, user: 'Admin' });
        addNotification({ title: 'Webhook Created', message: `"${formData.name}" is now active.` });
      }
      handleCloseDialog();
      fetchWebhooks();
    } catch (err: any) {
      addNotification({ title: 'Error', message: err.message || 'Failed to save webhook' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (webhook: WebhookRecord) => {
    const ok = await confirm({
      title: 'Delete Webhook',
      message: `Are you sure you want to delete "${webhook.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      severity: 'error'
    });
    if (!ok) return;
    try {
      await api.del(`/webhooks/${webhook.id}`);
      addLog({ action: 'delete', collection: 'webhooks', item: webhook.name, user: 'Admin' });
      addNotification({ title: 'Webhook Deleted', message: `"${webhook.name}" has been removed.` });
      if (selectedWebhook?.id === webhook.id) setSelectedWebhook(null);
      fetchWebhooks();
    } catch {
      addNotification({ title: 'Error', message: 'Failed to delete webhook' });
    }
  };

  const handleToggleStatus = async (webhook: WebhookRecord) => {
    const newStatus = webhook.status === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/webhooks/${webhook.id}`, { status: newStatus });
      addNotification({
        title: `Webhook ${newStatus === 'active' ? 'Enabled' : 'Disabled'}`,
        message: `"${webhook.name}" is now ${newStatus}.`
      });
      fetchWebhooks();
    } catch {
      addNotification({ title: 'Error', message: 'Failed to update webhook status' });
    }
  };

  const handleTestWebhook = async (webhook: WebhookRecord) => {
    try {
      await api.post(`/webhooks/${webhook.id}/test`, {});
      addNotification({ title: 'Webhook Tested', message: 'Test request sent successfully' });
      fetchWebhooks();
    } catch {
      addNotification({ title: 'Error', message: 'Failed to test webhook' });
    }
  };

  const handleCloseDialog = () => {
    setCreateOpen(false);
    setEditWebhook(null);
    setFormData({ name: '', method: 'POST', url: '', collections: [], events: [], auth: { type: 'none' }, status: 'active' });
    setHeaderRows([{ key: '', value: '' }]);
  };

  const openEditDialog = (wh: WebhookRecord) => {
    setEditWebhook(wh);
    setFormData({
      name: wh.name,
      method: wh.method,
      url: wh.url,
      collections: wh.collections,
      events: wh.events,
      auth: wh.auth,
      status: wh.status,
    });
    setHeaderRows(wh.headers.length > 0 ? wh.headers : [{ key: '', value: '' }]);
    setCreateOpen(true);
  };

  const filteredWebhooks = webhooks.filter(w => {
    const matchSearch = !search || w.name.toLowerCase().includes(search.toLowerCase()) || w.url.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || w.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    addNotification({ title: 'Copied', message: 'URL copied to clipboard.' });
  };

  const timeAgo = (iso?: string) => {
    if (!iso) return 'Never';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { color: '#22C55E', bg: 'rgba(34, 197, 94, 0.1)', icon: CheckCircle, label: 'Active' };
      case 'inactive':
        return { color: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)', icon: Pause, label: 'Inactive' };
      case 'error':
        return { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)', icon: XCircle, label: 'Error' };
      default:
        return { color: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)', icon: AlertCircle, label: 'Unknown' };
    }
  };

  const stats = {
    total: webhooks.length,
    active: webhooks.filter(w => w.status === 'active').length,
    errors: webhooks.filter(w => w.status === 'error').length,
    successRate: webhooks.length > 0
      ? Math.round(webhooks.reduce((sum, w) => sum + w.success_rate, 0) / webhooks.length)
      : 100,
  };

  const toggleEvent = (event: string) => {
    const events = formData.events.includes(event)
      ? formData.events.filter(e => e !== event)
      : [...formData.events, event];
    setFormData({ ...formData, events });
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', px: 3, py: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '14px',
                bgcolor: alpha('#8B5CF6', 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <WebhookIcon size={24} color='#8B5CF6' />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  bgcolor: '#8B5CF6',
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 0.5 },
                    '50%': { opacity: 1 },
                  },
                }}
              />
            </Box>
            <Box>
              <Typography variant='h5' fontWeight={700}>
                Webhooks
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Send HTTP callbacks when events occur
              </Typography>
            </Box>
          </Box>
          <Button
            variant='contained'
            startIcon={<Plus size={18} />}
            onClick={() => setCreateOpen(true)}
            sx={{
              bgcolor: '#8B5CF6',
              '&:hover': { bgcolor: '#7C3AED' },
              px: 3,
            }}
          >
            Create Webhook
          </Button>
        </Box>

        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
          <Paper
            variant='outlined'
            sx={{
              px: 2.5,
              py: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              cursor: 'pointer',
              transition: 'all 200ms',
              '&:hover': { bgcolor: alpha('#8B5CF6', 0.05), borderColor: '#8B5CF6' },
            }}
            onClick={() => setStatusFilter('all')}
          >
            <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: alpha('#8B5CF6', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <WebhookIcon size={18} color='#8B5CF6' />
            </Box>
            <Box>
              <Typography variant='h6' fontWeight={700}>{stats.total}</Typography>
              <Typography variant='caption' color='text.secondary'>Total Webhooks</Typography>
            </Box>
          </Paper>
          <Paper
            variant='outlined'
            sx={{
              px: 2.5,
              py: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              cursor: 'pointer',
              transition: 'all 200ms',
              '&:hover': { bgcolor: alpha('#22C55E', 0.05), borderColor: '#22C55E' },
            }}
            onClick={() => setStatusFilter('active')}
          >
            <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: alpha('#22C55E', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={18} color='#22C55E' />
            </Box>
            <Box>
              <Typography variant='h6' fontWeight={700}>{stats.active}</Typography>
              <Typography variant='caption' color='text.secondary'>Active</Typography>
            </Box>
          </Paper>
          <Paper
            variant='outlined'
            sx={{
              px: 2.5,
              py: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              cursor: 'pointer',
              transition: 'all 200ms',
              '&:hover': { bgcolor: alpha('#22C55E', 0.05), borderColor: '#22C55E' },
            }}
          >
            <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: alpha('#22C55E', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={18} color='#22C55E' />
            </Box>
            <Box>
              <Typography variant='h6' fontWeight={700}>{stats.successRate}%</Typography>
              <Typography variant='caption' color='text.secondary'>Success Rate</Typography>
            </Box>
          </Paper>
          {stats.errors > 0 && (
            <Paper
              variant='outlined'
              sx={{
                px: 2.5,
                py: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                cursor: 'pointer',
                transition: 'all 200ms',
                borderColor: alpha('#EF4444', 0.3),
                '&:hover': { bgcolor: alpha('#EF4444', 0.05), borderColor: '#EF4444' },
              }}
              onClick={() => setStatusFilter('error')}
            >
              <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: alpha('#EF4444', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertCircle size={18} color='#EF4444' />
              </Box>
              <Box>
                <Typography variant='h6' fontWeight={700}>{stats.errors}</Typography>
                <Typography variant='caption' color='text.secondary'>Errors</Typography>
              </Box>
            </Paper>
          )}
        </Box>

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size='small'
            placeholder='Search webhooks...'
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ width: 300 }}
            slotProps={{
              input: {
                startAdornment: (
                  <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                    <Search size={16} color={theme.palette.text.secondary} />
                  </Box>
                ),
              },
            }}
          />
          <TextField
            select
            size='small'
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
            sx={{ width: 150 }}
          >
            <MenuItem value='all'>All Status</MenuItem>
            <MenuItem value='active'>Active</MenuItem>
            <MenuItem value='inactive'>Inactive</MenuItem>
            <MenuItem value='error'>Error</MenuItem>
          </TextField>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex' }}>
        {/* Webhooks List */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : filteredWebhooks.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <WebhookIcon size={56} style={{ opacity: 0.15, marginBottom: 16 }} />
              <Typography variant='h6' color='text.secondary' gutterBottom>
                {search || statusFilter !== 'all' ? 'No webhooks found' : 'No webhooks yet'}
              </Typography>
              <Typography variant='body2' color='text.disabled' sx={{ mb: 3 }}>
                {search || statusFilter !== 'all' ? 'Try adjusting your search or filters' : 'Create your first webhook to get started'}
              </Typography>
              {!search && statusFilter === 'all' && (
                <Button variant='contained' startIcon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
                  Create Webhook
                </Button>
              )}
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {filteredWebhooks.map((webhook) => {
                const statusConfig = getStatusConfig(webhook.status);
                const StatusIcon = statusConfig.icon;
                const methodConfig = METHOD_COLORS[webhook.method] || METHOD_COLORS.POST;

                return (
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={webhook.id}>
                    <Paper
                      sx={{
                        p: 0,
                        height: '100%',
                        cursor: 'pointer',
                        transition: 'all 200ms',
                        border: '2px solid',
                        borderColor: selectedWebhook?.id === webhook.id ? '#8B5CF6' : 'divider',
                        overflow: 'hidden',
                        '&:hover': {
                          borderColor: '#8B5CF6',
                          boxShadow: `0 8px 30px ${alpha('#8B5CF6', 0.15)}`,
                          transform: 'translateY(-2px)',
                        },
                      }}
                      onClick={() => setSelectedWebhook(webhook)}
                    >
                      {/* Header */}
                      <Box sx={{ p: 2.5, pb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box
                              sx={{
                                width: 44,
                                height: 44,
                                borderRadius: '12px',
                                bgcolor: methodConfig.bg,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Typography variant='caption' fontWeight={800} sx={{ color: methodConfig.text, fontSize: 11 }}>
                                {webhook.method}
                              </Typography>
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant='subtitle1' fontWeight={700} noWrap sx={{ maxWidth: 160 }}>
                                {webhook.name}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Box
                                  sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    bgcolor: statusConfig.color,
                                    boxShadow: webhook.status === 'active' ? `0 0 8px ${statusConfig.color}` : 'none',
                                  }}
                                />
                                <Typography variant='caption' color='text.secondary'>
                                  {statusConfig.label}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title='Test'>
                              <IconButton size='small' onClick={(e) => { e.stopPropagation(); handleTestWebhook(webhook); }}>
                                <Send size={15} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title='Edit'>
                              <IconButton size='small' onClick={(e) => { e.stopPropagation(); openEditDialog(webhook); }}>
                                <Edit2 size={15} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title='Delete'>
                              <IconButton size='small' color='error' onClick={(e) => { e.stopPropagation(); handleDelete(webhook); }}>
                                <Trash2 size={15} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>

                        {/* URL */}
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          p: 1.5,
                          bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                          borderRadius: 1.5,
                          mb: 2,
                        }}>
                          <Globe size={14} color={theme.palette.text.secondary} />
                          <Typography
                            variant='body2'
                            color='text.secondary'
                            sx={{
                              flexGrow: 1,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontFamily: 'monospace',
                              fontSize: 12,
                            }}
                          >
                            {webhook.url}
                          </Typography>
                          <Tooltip title='Copy URL'>
                            <IconButton size='small' onClick={(e) => { e.stopPropagation(); copyUrl(webhook.url); }}>
                              <Copy size={13} />
                            </IconButton>
                          </Tooltip>
                        </Box>

                        {/* Events */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                          {webhook.events.slice(0, 3).map(event => (
                            <Chip
                              key={event}
                              label={event}
                              size='small'
                              icon={<Zap size={10} />}
                              sx={{
                                height: 24,
                                fontSize: 11,
                                bgcolor: alpha('#8B5CF6', 0.08),
                                '& .MuiChip-icon': { color: '#8B5CF6' },
                              }}
                            />
                          ))}
                          {webhook.events.length > 3 && (
                            <Chip
                              label={`+${webhook.events.length - 3}`}
                              size='small'
                              sx={{ height: 24, fontSize: 11 }}
                            />
                          )}
                          {webhook.events.length === 0 && (
                            <Typography variant='caption' color='text.disabled'>
                              No events configured
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      {/* Footer */}
                      <Box sx={{
                        px: 2.5,
                        py: 1.5,
                        borderTop: 1,
                        borderColor: 'divider',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        bgcolor: isDark ? alpha('#fff', 0.015) : alpha('#000', 0.015),
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Clock size={12} color={theme.palette.text.secondary} />
                          <Typography variant='caption' color='text.secondary'>
                            {timeAgo(webhook.last_triggered)}
                          </Typography>
                        </Box>
                        <Typography
                          variant='caption'
                          fontWeight={600}
                          sx={{
                            color: webhook.success_rate >= 90 ? '#22C55E' : webhook.success_rate >= 70 ? '#F59E0B' : '#EF4444',
                          }}
                        >
                          {webhook.success_rate}% success
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>

        {/* Detail Panel */}
        {selectedWebhook && (
          <Box sx={{
            width: 380,
            borderLeft: 1,
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.paper',
          }}>
            <Box sx={{ p: 2.5, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant='subtitle1' fontWeight={700}>{selectedWebhook.name}</Typography>
              <Typography variant='caption' color='text.secondary'>
                {selectedWebhook.method} · {selectedWebhook.url}
              </Typography>
            </Box>
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2.5 }}>
              <Typography variant='caption' color='text.secondary' sx={{ mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: 1 }}>
                Trigger Events
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 3 }}>
                {selectedWebhook.events.map(event => (
                  <Chip
                    key={event}
                    label={event}
                    size='small'
                    icon={<Zap size={10} />}
                    sx={{ bgcolor: alpha('#8B5CF6', 0.1), '& .MuiChip-icon': { color: '#8B5CF6' } }}
                  />
                ))}
                {selectedWebhook.events.length === 0 && (
                  <Typography variant='body2' color='text.disabled'>No events</Typography>
                )}
              </Box>

              <Typography variant='caption' color='text.secondary' sx={{ mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: 1 }}>
                Headers
              </Typography>
              <Box sx={{ mb: 3 }}>
                {selectedWebhook.headers.map((h, i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                    <Typography variant='caption' sx={{ fontFamily: 'monospace', color: '#8B5CF6' }}>{h.key}:</Typography>
                    <Typography variant='caption' color='text.secondary'>{h.value}</Typography>
                  </Box>
                ))}
                {selectedWebhook.headers.length === 0 && (
                  <Typography variant='body2' color='text.disabled'>No custom headers</Typography>
                )}
              </Box>

              <Typography variant='caption' color='text.secondary' sx={{ mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: 1 }}>
                Authentication
              </Typography>
              <Chip
                label={selectedWebhook.auth.type === 'none' ? 'No Auth' : selectedWebhook.auth.type}
                size='small'
                icon={<Key size={12} />}
                sx={{ mb: 3 }}
              />

              <Typography variant='caption' color='text.secondary' sx={{ mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: 1 }}>
                Statistics
              </Typography>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <Paper variant='outlined' sx={{ p: 1.5, textAlign: 'center' }}>
                    <Typography variant='h6' fontWeight={700}>{selectedWebhook.success_rate}%</Typography>
                    <Typography variant='caption' color='text.secondary'>Success Rate</Typography>
                  </Paper>
                </Grid>
                <Grid size={6}>
                  <Paper variant='outlined' sx={{ p: 1.5, textAlign: 'center' }}>
                    <Typography variant='h6' fontWeight={700}>{timeAgo(selectedWebhook.last_triggered)}</Typography>
                    <Typography variant='caption' color='text.secondary'>Last Triggered</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1 }}>
              <Button
                variant='outlined'
                size='small'
                startIcon={<Send size={14} />}
                onClick={() => handleTestWebhook(selectedWebhook)}
                sx={{ flexGrow: 1 }}
              >
                Test
              </Button>
              <Button
                variant='outlined'
                size='small'
                startIcon={<Edit2 size={14} />}
                onClick={() => openEditDialog(selectedWebhook)}
                sx={{ flexGrow: 1 }}
              >
                Edit
              </Button>
            </Box>
          </Box>
        )}
      </Box>

      {/* Create/Edit Modal */}
      <Modal
        open={createOpen}
        onClose={handleCloseDialog}
        title={editWebhook ? 'Edit Webhook' : 'Create Webhook'}
        subtitle='Send HTTP callbacks when events occur'
        icon={<WebhookIcon size={20} />}
        onSave={handleSave}
        saveText={editWebhook ? 'Update' : 'Create'}
        saving={saving}
        saveDisabled={!formData.name.trim() || !formData.url.trim()}
        width='xl'
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Name */}
          <FormField label='Webhook Name' required>
            <TextField
              fullWidth
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder='e.g., Notify Slack on item create'
            />
          </FormField>

          {/* Method & URL */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormField label='Method' sx={{ width: 130 }}>
              <Select
                fullWidth
                value={formData.method}
                onChange={e => setFormData({ ...formData, method: e.target.value as WebhookRecord['method'] })}
              >
                {(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const).map(m => (
                  <MenuItem key={m} value={m}>{m}</MenuItem>
                ))}
              </Select>
            </FormField>
            <FormField label='URL' required sx={{ flex: 1 }}>
              <TextField
                fullWidth
                value={formData.url}
                onChange={e => setFormData({ ...formData, url: e.target.value })}
                placeholder='https://api.example.com/webhook'
              />
            </FormField>
          </Box>

          {/* Status */}
          <FormField label='Status'>
            <StatusToggle
              active={formData.status === 'active'}
              onToggle={(active) => setFormData({ ...formData, status: active ? 'active' : 'inactive' })}
            />
          </FormField>

          {/* Trigger Events */}
          <FormSection title='Trigger Events' description='Select which events should trigger this webhook'>
            <Paper variant='outlined' sx={{ p: 2 }}>
              {EVENT_GROUPS.map(group => (
                <Box key={group.label} sx={{ mb: 2, '&:last-child': { mb: 0 } }}>
                  <Typography variant='caption' color='text.secondary' sx={{ mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                    {group.label}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {group.events.map(event => (
                      <Chip
                        key={event}
                        label={event}
                        size='small'
                        onClick={() => toggleEvent(event)}
                        sx={{
                          cursor: 'pointer',
                          bgcolor: formData.events.includes(event) ? alpha('#8B5CF6', 0.15) : 'transparent',
                          borderColor: formData.events.includes(event) ? '#8B5CF6' : 'divider',
                          border: '1px solid',
                          transition: 'all 150ms',
                          '&:hover': {
                            bgcolor: alpha('#8B5CF6', 0.1),
                            borderColor: '#8B5CF6',
                          },
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              ))}
            </Paper>
          </FormSection>

          {/* Headers */}
          <FormSection title='Custom Headers' description='Add custom headers to your webhook requests'>
            {headerRows.map((row, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  size='small'
                  placeholder='Header name'
                  value={row.key}
                  onChange={e => {
                    const newRows = [...headerRows];
                    newRows[index].key = e.target.value;
                    setHeaderRows(newRows);
                  }}
                  sx={{ flex: 1 }}
                />
                <TextField
                  size='small'
                  placeholder='Header value'
                  value={row.value}
                  onChange={e => {
                    const newRows = [...headerRows];
                    newRows[index].value = e.target.value;
                    setHeaderRows(newRows);
                  }}
                  sx={{ flex: 2 }}
                />
                <IconButton
                  size='small'
                  onClick={() => setHeaderRows(headerRows.filter((_, i) => i !== index))}
                  disabled={headerRows.length === 1}
                >
                  <Trash2 size={14} />
                </IconButton>
              </Box>
            ))}
            <Button
              size='small'
              startIcon={<Plus size={14} />}
              onClick={() => setHeaderRows([...headerRows, { key: '', value: '' }])}
            >
              Add Header
            </Button>
          </FormSection>

          {/* Authentication */}
          <FormSection title='Authentication' description='Configure authentication for your webhook endpoint'>
            <FormField label='Auth Type'>
              <Select
                fullWidth
                value={formData.auth.type}
                onChange={e => setFormData({ ...formData, auth: { ...formData.auth, type: e.target.value as typeof formData.auth.type } })}
              >
                <MenuItem value='none'>No Authentication</MenuItem>
                <MenuItem value='bearer'>Bearer Token</MenuItem>
                <MenuItem value='basic'>Basic Auth</MenuItem>
                <MenuItem value='apikey'>API Key</MenuItem>
              </Select>
            </FormField>
            {formData.auth.type !== 'none' && (
              <FormField label={formData.auth.type === 'bearer' ? 'Token' : formData.auth.type === 'basic' ? 'Username' : 'API Key'}>
                <TextField
                  fullWidth
                  value={formData.auth.value || ''}
                  onChange={e => setFormData({ ...formData, auth: { ...formData.auth, value: e.target.value } })}
                />
              </FormField>
            )}
          </FormSection>
        </Box>
      </Modal>
    </Box>
  );
}
