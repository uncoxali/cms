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
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { alpha } from '@mui/material/styles';
import { useNotificationsStore } from '@/store/notifications';
import {
  KeyRound,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
} from 'lucide-react';

interface ApiToken {
  id: string;
  name: string;
  token: string;
  userId: string;
  userName: string;
  role: string;
  permissions: string[];
  expiresAt?: string;
  lastUsed?: string;
  createdAt: string;
  active: boolean;
}

const MOCK_TOKENS: ApiToken[] = [
  {
    id: '1',
    name: 'Production API Key',
    token: 'sk_live_abc123def456...',
    userId: '1',
    userName: 'Sarah Chen',
    role: 'Admin',
    permissions: ['read', 'write', 'delete'],
    lastUsed: '2024-03-15T10:30:00Z',
    createdAt: '2024-01-15T10:00:00Z',
    active: true,
  },
  {
    id: '2',
    name: 'Development Key',
    token: 'sk_test_xyz789...',
    userId: '1',
    userName: 'Sarah Chen',
    role: 'Admin',
    permissions: ['read', 'write'],
    lastUsed: '2024-03-14T15:45:00Z',
    createdAt: '2024-02-01T10:00:00Z',
    active: true,
  },
  {
    id: '3',
    name: 'CI/CD Pipeline',
    token: 'sk_live_ci123...',
    userId: '2',
    userName: 'Mike Johnson',
    role: 'Editor',
    permissions: ['read'],
    expiresAt: '2024-12-31T23:59:59Z',
    lastUsed: '2024-03-13T09:00:00Z',
    createdAt: '2024-03-01T10:00:00Z',
    active: true,
  },
];

export default function ApiTokensPage() {
  const { addNotification } = useNotificationsStore();

  const [tokens, setTokens] = useState<ApiToken[]>(MOCK_TOKENS);
  const [createOpen, setCreateOpen] = useState(false);
  const [showToken, setShowToken] = useState<string | null>(null);
  const [newToken, setNewToken] = useState({
    name: '',
    userId: '1',
    role: 'editor',
    permissions: [] as string[],
    expiresIn: 'never',
  });

  const handleCreate = () => {
    const token: ApiToken = {
      id: Date.now().toString(),
      name: newToken.name,
      token: `sk_live_${Math.random().toString(36).substring(2, 15)}...`,
      userId: newToken.userId,
      userName: 'Current User',
      role: newToken.role,
      permissions: newToken.permissions,
      expiresAt: newToken.expiresIn !== 'never' ? newToken.expiresIn : undefined,
      createdAt: new Date().toISOString(),
      active: true,
    };
    setTokens(prev => [...prev, token]);
    setShowToken(token.id);
    setCreateOpen(false);
    setNewToken({ name: '', userId: '1', role: 'editor', permissions: [], expiresIn: 'never' });
    addNotification({ title: 'Token Created', message: 'New API token has been generated.' });
  };

  const handleDelete = (tokenId: string) => {
    setTokens(prev => prev.filter(t => t.id !== tokenId));
    addNotification({ title: 'Token Deleted', message: 'API token has been revoked.' });
  };

  const handleCopy = (token: string) => {
    navigator.clipboard.writeText(token);
    addNotification({ title: 'Copied', message: 'Token copied to clipboard.' });
  };

  const handleRegenerate = (tokenId: string) => {
    setTokens(prev => prev.map(t => 
      t.id === tokenId 
        ? { ...t, token: `sk_live_${Math.random().toString(36).substring(2, 15)}...` }
        : t
    ));
    addNotification({ title: 'Token Regenerated', message: 'New token has been generated.' });
  };

  const handleToggle = (tokenId: string) => {
    setTokens(prev => prev.map(t => 
      t.id === tokenId ? { ...t, active: !t.active } : t
    ));
    addNotification({ title: 'Token Updated', message: 'Token status has been updated.' });
  };

  const formatDate = (date?: string) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 4 }}>
      <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
              <KeyRound size={24} color='#8B5CF6' />
            </Box>
            <Box>
              <Typography variant='h5' fontWeight={700}>
                API Tokens
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Manage personal API tokens for programmatic access
              </Typography>
            </Box>
          </Box>
          <Button variant='contained' startIcon={<Plus size={18} />} onClick={() => setCreateOpen(true)}>
            Create Token
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Permissions</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Last Used</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align='right'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tokens.map(token => (
                <TableRow key={token.id} hover sx={{ opacity: token.active ? 1 : 0.5 }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant='body2' fontWeight={600}>{token.name}</Typography>
                      {token.expiresAt && (
                        <Tooltip title={`Expires ${formatDate(token.expiresAt)}`}>
                          <Clock size={14} color='#F59E0B' />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{token.userName}</TableCell>
                  <TableCell>
                    <Chip label={token.role} size='small' variant='outlined' />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {token.permissions.map(p => (
                        <Chip key={p} label={p} size='small' sx={{ fontSize: 10 }} />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>{formatDate(token.lastUsed)}</TableCell>
                  <TableCell>{formatDate(token.createdAt)}</TableCell>
                  <TableCell>
                    <Chip
                      label={token.active ? 'Active' : 'Inactive'}
                      size='small'
                      color={token.active ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align='right'>
                    <Tooltip title='Copy Token'>
                      <IconButton size='small' onClick={() => handleCopy(token.token)}>
                        <Copy size={16} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title='Regenerate'>
                      <IconButton size='small' onClick={() => handleRegenerate(token.id)}>
                        <RefreshCw size={16} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={token.active ? 'Deactivate' : 'Activate'}>
                      <IconButton size='small' onClick={() => handleToggle(token.id)}>
                        {token.active ? <EyeOff size={16} /> : <Eye size={16} />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title='Delete'>
                      <IconButton size='small' color='error' onClick={() => handleDelete(token.id)}>
                        <Trash2 size={16} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant='subtitle2' fontWeight={700} gutterBottom>
            Token Format
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Use the Authorization header with Bearer token:
          </Typography>
          <Paper variant='outlined' sx={{ p: 2, mt: 1, bgcolor: 'grey.50' }}>
            <Typography sx={{ fontFamily: 'monospace', fontSize: 13 }}>
              Authorization: Bearer sk_live_xxxxxxxxxxxx
            </Typography>
          </Paper>
        </Paper>
      </Box>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Create API Token</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            label='Token Name'
            value={newToken.name}
            onChange={(e) => setNewToken({ ...newToken, name: e.target.value })}
            placeholder='e.g., Production API Key'
            sx={{ mb: 3, mt: 1 }}
          />
          <TextField
            fullWidth
            select
            label='Assign to User'
            value={newToken.userId}
            onChange={(e) => setNewToken({ ...newToken, userId: e.target.value })}
            sx={{ mb: 3 }}
          >
            <MenuItem value='1'>Sarah Chen</MenuItem>
            <MenuItem value='2'>Mike Johnson</MenuItem>
          </TextField>
          <TextField
            fullWidth
            select
            label='Role'
            value={newToken.role}
            onChange={(e) => setNewToken({ ...newToken, role: e.target.value })}
            sx={{ mb: 3 }}
          >
            <MenuItem value='admin'>Admin</MenuItem>
            <MenuItem value='editor'>Editor</MenuItem>
            <MenuItem value='viewer'>Viewer</MenuItem>
          </TextField>
          <Typography variant='body2' fontWeight={600} gutterBottom>
            Permissions
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            {['read', 'write', 'delete'].map(p => (
              <Chip
                key={p}
                label={p}
                onClick={() => {
                  const perms = newToken.permissions.includes(p)
                    ? newToken.permissions.filter(x => x !== p)
                    : [...newToken.permissions, p];
                  setNewToken({ ...newToken, permissions: perms });
                }}
                color={newToken.permissions.includes(p) ? 'primary' : 'default'}
                variant={newToken.permissions.includes(p) ? 'filled' : 'outlined'}
              />
            ))}
          </Box>
          <TextField
            fullWidth
            select
            label='Expires In'
            value={newToken.expiresIn}
            onChange={(e) => setNewToken({ ...newToken, expiresIn: e.target.value })}
          >
            <MenuItem value='never'>Never</MenuItem>
            <MenuItem value='30days'>30 Days</MenuItem>
            <MenuItem value='90days'>90 Days</MenuItem>
            <MenuItem value='1year'>1 Year</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant='contained' onClick={handleCreate} disabled={!newToken.name}>
            Create Token
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!showToken} onClose={() => setShowToken(null)} maxWidth='sm' fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircle color='#22C55E' />
          Token Created
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            Copy this token now. You won&apos;t be able to see it again.
          </Typography>
          <Paper variant='outlined' sx={{ p: 2, bgcolor: 'warning.light' }}>
            <Typography sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {tokens.find(t => t.id === showToken)?.token}
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowToken(null)}>Done</Button>
          <Button
            variant='contained'
            onClick={() => handleCopy(tokens.find(t => t.id === showToken)?.token || '')}
          >
            Copy Token
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
