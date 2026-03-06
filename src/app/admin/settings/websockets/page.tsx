"use client";

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import Grid from '@mui/material/Grid';
import { Plus, Edit, Trash2, Radio, Wifi, WifiOff } from 'lucide-react';
import { api } from '@/lib/api';
import { useSchemaStore } from '@/store/schema';
import { useRealtime } from '@/components/admin/RealtimeProvider';
import { useTranslation } from '@/lib/i18n';
import { useConfirm } from '@/components/admin/ConfirmDialog';

const AVAILABLE_EVENTS = [
  { value: 'item:created', label: 'Item Created' },
  { value: 'item:updated', label: 'Item Updated' },
  { value: 'item:deleted', label: 'Item Deleted' },
  { value: 'file:uploaded', label: 'File Uploaded' },
  { value: 'file:deleted', label: 'File Deleted' },
  { value: 'page:created', label: 'Page Created' },
  { value: 'page:updated', label: 'Page Updated' },
  { value: 'page:deleted', label: 'Page Deleted' },
];

interface WsEndpoint {
  id: string;
  name: string;
  path: string;
  collection: string | null;
  events: string[];
  auth_required: boolean;
  roles: string[];
  status: string;
  description: string | null;
}

const EMPTY_FORM: Omit<WsEndpoint, 'id'> = {
  name: '',
  path: '/ws/',
  collection: '',
  events: [],
  auth_required: true,
  roles: [],
  status: 'active',
  description: '',
};

export default function WebSocketEndpointsPage() {
  const [endpoints, setEndpoints] = useState<WsEndpoint[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const { collections } = useSchemaStore();
  const { status: wsStatus } = useRealtime();
  const { t } = useTranslation();
  const confirm = useConfirm();

  const fetchEndpoints = async () => {
    try {
      const res = await api.get<{ data: WsEndpoint[] }>('/ws-endpoints');
      setEndpoints(res.data || []);
    } catch {}
  };

  useEffect(() => { fetchEndpoints(); }, []);

  const handleOpen = (endpoint?: WsEndpoint) => {
    if (endpoint) {
      setEditingId(endpoint.id);
      setForm({
        name: endpoint.name,
        path: endpoint.path,
        collection: endpoint.collection || '',
        events: endpoint.events,
        auth_required: !!endpoint.auth_required,
        roles: endpoint.roles,
        status: endpoint.status,
        description: endpoint.description || '',
      });
    } else {
      setEditingId(null);
      setForm({ ...EMPTY_FORM });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await api.patch(`/ws-endpoints/${editingId}`, form);
      } else {
        await api.post('/ws-endpoints', form);
      }
      setDialogOpen(false);
      fetchEndpoints();
    } catch {}
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: t('common.delete'),
      message: 'Are you sure you want to delete this WebSocket endpoint?',
    });
    if (!ok) return;
    try {
      await api.del(`/ws-endpoints/${id}`);
      fetchEndpoints();
    } catch {}
  };

  const toggleEvent = (ev: string) => {
    setForm((f) => ({
      ...f,
      events: f.events.includes(ev) ? f.events.filter((e) => e !== ev) : [...f.events, ev],
    }));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={600}>
            {t('websocket.title')}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Manage custom WebSocket endpoints for real-time data streaming.
            </Typography>
            <Chip
              icon={wsStatus === 'connected' ? <Wifi size={12} /> : <WifiOff size={12} />}
              label={wsStatus}
              size="small"
              color={wsStatus === 'connected' ? 'success' : 'default'}
              sx={{ height: 22, fontSize: 11 }}
            />
          </Box>
        </Box>
        <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => handleOpen()}>
          {t('websocket.createEndpoint')}
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('common.name')}</TableCell>
              <TableCell>{t('websocket.endpointPath')}</TableCell>
              <TableCell>{t('websocket.watchCollection')}</TableCell>
              <TableCell>{t('websocket.events')}</TableCell>
              <TableCell>{t('common.status')}</TableCell>
              <TableCell>{t('websocket.authRequired')}</TableCell>
              <TableCell align="right">{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {endpoints.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Radio size={40} style={{ opacity: 0.15 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      No WebSocket endpoints defined yet.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              endpoints.map((ep) => (
                <TableRow key={ep.id} hover>
                  <TableCell>
                    <Typography fontWeight={600} fontSize={13}>{ep.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={ep.path} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: 12 }} />
                  </TableCell>
                  <TableCell>{ep.collection || '—'}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {ep.events.map((ev) => (
                        <Chip key={ev} label={ev.split(':')[1]} size="small" sx={{ fontSize: 10, height: 20 }} />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={ep.status}
                      size="small"
                      color={ep.status === 'active' ? 'success' : 'default'}
                      sx={{ fontSize: 11 }}
                    />
                  </TableCell>
                  <TableCell>{ep.auth_required ? 'Yes' : 'No'}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpen(ep)}><Edit size={15} /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(ep.id)}><Trash2 size={15} /></IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Endpoint' : 'Create Endpoint'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label={t('websocket.endpointName')}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label={t('websocket.endpointPath')}
                value={form.path}
                onChange={(e) => setForm({ ...form, path: e.target.value })}
                helperText="e.g. /ws/sensors"
                sx={{ '& input': { fontFamily: 'monospace' } }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                select
                fullWidth
                label={t('websocket.watchCollection')}
                value={form.collection}
                onChange={(e) => setForm({ ...form, collection: e.target.value })}
              >
                <MenuItem value="">None (all collections)</MenuItem>
                {Object.keys(collections).map((key) => (
                  <MenuItem key={key} value={key}>{key}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" fontWeight={600} mb={1}>
                {t('websocket.events')}
              </Typography>
              <FormGroup row>
                {AVAILABLE_EVENTS.map((ev) => (
                  <FormControlLabel
                    key={ev.value}
                    control={
                      <Checkbox
                        checked={form.events.includes(ev.value)}
                        onChange={() => toggleEvent(ev.value)}
                        size="small"
                      />
                    }
                    label={<Typography fontSize={13}>{ev.label}</Typography>}
                    sx={{ width: '48%' }}
                  />
                ))}
              </FormGroup>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label={t('common.status')}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.auth_required}
                    onChange={(e) => setForm({ ...form, auth_required: e.target.checked })}
                  />
                }
                label={t('websocket.authRequired')}
                sx={{ mt: 1 }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label={t('common.description')}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleSave}>{t('common.save')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
