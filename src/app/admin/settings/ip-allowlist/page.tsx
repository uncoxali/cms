'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { alpha } from '@mui/material/styles';
import { useNotificationsStore } from '@/store/notifications';
import {
  Shield,
  Plus,
  Trash2,
  Globe,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';

interface IpRule {
  id: string;
  ip: string;
  label: string;
  type: 'allow' | 'deny';
  role?: string;
  expiresAt?: string;
  createdAt: string;
}

const MOCK_RULES: IpRule[] = [
  {
    id: '1',
    ip: '192.168.1.0/24',
    label: 'Office Network',
    type: 'allow',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    ip: '10.0.0.1',
    label: 'VPN Gateway',
    type: 'allow',
    createdAt: '2024-02-01T10:00:00Z',
  },
  {
    id: '3',
    ip: '203.0.113.0/24',
    label: 'External Partners',
    type: 'allow',
    role: 'partner',
    createdAt: '2024-02-15T10:00:00Z',
  },
];

export default function IpAllowlistPage() {
  const { addNotification } = useNotificationsStore();

  const [rules, setRules] = useState<IpRule[]>(MOCK_RULES);
  const [createOpen, setCreateOpen] = useState(false);
  const [globalEnabled, setGlobalEnabled] = useState(false);
  const [defaultPolicy, setDefaultPolicy] = useState<'allow' | 'deny'>('allow');
  const [formData, setFormData] = useState({
    ip: '',
    label: '',
    type: 'allow' as 'allow' | 'deny',
    role: '',
  });

  const handleCreate = () => {
    if (!formData.ip) {
      addNotification({ title: 'Error', message: 'IP address is required.' });
      return;
    }
    const newRule: IpRule = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date().toISOString(),
    };
    setRules(prev => [...prev, newRule]);
    setCreateOpen(false);
    setFormData({ ip: '', label: '', type: 'allow', role: '' });
    addNotification({ title: 'Rule Created', message: 'IP rule has been added.' });
  };

  const handleDelete = (ruleId: string) => {
    setRules(prev => prev.filter(r => r.id !== ruleId));
    addNotification({ title: 'Rule Deleted', message: 'IP rule has been removed.' });
  };

  const handleToggle = (ruleId: string) => {
    setRules(prev => prev.map(r => 
      r.id === ruleId ? { ...r, type: r.type === 'allow' ? 'deny' : 'allow' } : r
    ));
  };

  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 4 }}>
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              bgcolor: alpha('#8B5CF6', 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Shield size={24} color='#8B5CF6' />
          </Box>
          <Box>
            <Typography variant='h5' fontWeight={700}>
              IP Allowlist / Firewall
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Control access based on IP addresses
            </Typography>
          </Box>
        </Box>

        <Paper sx={{ p: 4, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant='h6' fontWeight={700}>
              General Settings
            </Typography>
            <Switch
              checked={globalEnabled}
              onChange={(e) => setGlobalEnabled(e.target.checked)}
            />
          </Box>

          {globalEnabled && (
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={defaultPolicy === 'allow'}
                    onChange={(e) => setDefaultPolicy(e.target.checked ? 'allow' : 'deny')}
                  />
                }
                label="Allow by default, deny listed IPs"
              />
              <Typography variant='caption' color='text.secondary' display='block' sx={{ ml: 6 }}>
                When enabled, only listed IPs will be able to access the admin panel
              </Typography>
            </Box>
          )}
        </Paper>

        <Paper sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant='h6' fontWeight={700}>
              IP Rules ({rules.length})
            </Typography>
            <Button
              variant='contained'
              startIcon={<Plus size={18} />}
              onClick={() => setCreateOpen(true)}
              disabled={!globalEnabled}
            >
              Add Rule
            </Button>
          </Box>

          {!globalEnabled && (
            <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 1, mb: 3 }}>
              <Typography variant='body2' color='warning.dark'>
                Enable IP filtering above to start using allowlist rules.
              </Typography>
            </Box>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>IP Address</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Label</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align='right'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rules.map(rule => (
                  <TableRow key={rule.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MapPin size={16} color='#8B5CF6' />
                        <Typography sx={{ fontFamily: 'monospace' }}>{rule.ip}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{rule.label}</TableCell>
                    <TableCell>
                      {rule.role ? (
                        <Chip label={rule.role} size='small' variant='outlined' />
                      ) : (
                        <Typography variant='caption' color='text.secondary'>All roles</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={rule.type === 'allow' ? 'Allow' : 'Deny'}
                        size='small'
                        color={rule.type === 'allow' ? 'success' : 'error'}
                        onClick={() => handleToggle(rule.id)}
                        clickable
                      />
                    </TableCell>
                    <TableCell align='right'>
                      <IconButton size='small' color='error' onClick={() => handleDelete(rule.id)}>
                        <Trash2 size={16} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {rules.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align='center' sx={{ py: 4 }}>
                      <Typography color='text.secondary'>No IP rules configured</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant='subtitle2' fontWeight={700} gutterBottom>
            IP Address Formats
          </Typography>
          <Box component='ul' sx={{ pl: 2, '& li': { mb: 1 } }}>
            <Typography variant='body2' component='li'>Single IP: <code>192.168.1.1</code></Typography>
            <Typography variant='body2' component='li'>CIDR Range: <code>192.168.1.0/24</code></Typography>
            <Typography variant='body2' component='li'>Wildcard: <code>192.168.*.*</code></Typography>
          </Box>
        </Paper>
      </Box>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Add IP Rule</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            label='IP Address'
            value={formData.ip}
            onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
            placeholder='192.168.1.1 or 192.168.0.0/24'
            sx={{ mb: 3, mt: 1 }}
          />
          <TextField
            fullWidth
            label='Label'
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            placeholder='e.g., Office Network'
            sx={{ mb: 3 }}
          />
          <TextField
            fullWidth
            select
            label='Rule Type'
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'allow' | 'deny' })}
            sx={{ mb: 3 }}
          >
            <option value='allow'>Allow</option>
            <option value='deny'>Deny</option>
          </TextField>
          <TextField
            fullWidth
            label='Role (optional)'
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            placeholder='Leave empty for all roles'
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant='contained' onClick={handleCreate}>Add Rule</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
