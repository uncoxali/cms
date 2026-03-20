'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Collapse from '@mui/material/Collapse';
import CircularProgress from '@mui/material/CircularProgress';
import { alpha } from '@mui/material/styles';
import { useNotificationsStore } from '@/store/notifications';
import { useActivityStore } from '@/store/activity';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import { api } from '@/lib/api';
import {
  History,
  RotateCcw,
  Eye,
  GitCompare,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  Edit,
  Database,
} from 'lucide-react';

interface Revision {
  id: string;
  collection: string;
  itemId: string;
  itemName: string;
  version: number;
  changes: {
    field: string;
    fieldLabel: string;
    action: 'create' | 'update' | 'delete';
    oldValue?: any;
    newValue?: any;
  }[];
  user: {
    id: string;
    name: string;
  };
  status: 'draft' | 'published' | 'scheduled';
  dateCreated: string;
}

export default function RevisionsPage() {
  const { addNotification } = useNotificationsStore();
  const { addLog } = useActivityStore();
  const confirm = useConfirm();

  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [collectionFilter, setCollectionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedRevisions, setExpandedRevisions] = useState<Set<string>>(new Set());
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareRevisions, setCompareRevisions] = useState<[Revision, Revision] | null>(null);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null);

  useEffect(() => {
    fetchRevisions();
  }, []);

  const fetchRevisions = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Revision[] }>('/revisions');
      setRevisions(res.data || []);
    } catch (err) {
      console.error('Error fetching revisions:', err);
      addNotification({ title: 'Error', message: 'Failed to load revisions.' });
    } finally {
      setLoading(false);
    }
  };

  const filteredRevisions = revisions.filter(r => {
    const matchSearch = !search || 
      r.itemName.toLowerCase().includes(search.toLowerCase()) ||
      r.user.name.toLowerCase().includes(search.toLowerCase());
    const matchCollection = collectionFilter === 'all' || r.collection === collectionFilter;
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchCollection && matchStatus;
  });

  const collections = [...new Set(revisions.map(r => r.collection))];

  const toggleExpand = (revisionId: string) => {
    setExpandedRevisions(prev => {
      const next = new Set(prev);
      if (next.has(revisionId)) {
        next.delete(revisionId);
      } else {
        next.add(revisionId);
      }
      return next;
    });
  };

  const handleRestore = async (revision: Revision) => {
    setSelectedRevision(revision);
    setRestoreDialogOpen(true);
  };

  const confirmRestore = async () => {
    if (!selectedRevision) return;
    addNotification({ 
      title: 'Revision Restored', 
      message: `Version ${selectedRevision.version} of "${selectedRevision.itemName}" has been restored.` 
    });
    addLog({
      action: 'update',
      collection: selectedRevision.collection,
      item: selectedRevision.itemId,
      user: 'Admin',
      meta: { action: 'restore_revision', version: selectedRevision.version },
    });
    setRestoreDialogOpen(false);
    setSelectedRevision(null);
  };

  const handleCompare = (revision: Revision) => {
    const itemRevisions = revisions.filter(r => r.itemId === revision.itemId && r.id !== revision.id);
    if (itemRevisions.length > 0) {
      setCompareRevisions([itemRevisions[0], revision]);
      setCompareOpen(true);
    } else {
      addNotification({ title: 'No Other Versions', message: 'This is the only revision for this item.' });
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusChip = (status: Revision['status']) => {
    const configs: Record<Revision['status'], { color: 'success' | 'warning' | 'default'; label: string }> = {
      published: { color: 'success', label: 'Published' },
      draft: { color: 'warning', label: 'Draft' },
      scheduled: { color: 'default', label: 'Scheduled' },
    };
    return configs[status];
  };

  const getChangeIcon = (action: Revision['changes'][0]['action']) => {
    switch (action) {
      case 'create': return <Plus size={14} color='#22C55E' />;
      case 'update': return <Edit size={14} color='#F59E0B' />;
      case 'delete': return <Minus size={14} color='#EF4444' />;
    }
  };

  const groupedRevisions = filteredRevisions.reduce((acc, rev) => {
    const key = `${rev.collection}:${rev.itemId}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(rev);
    return acc;
  }, {} as Record<string, Revision[]>);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', px: 3, py: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant='h5' fontWeight={700}>
              Revisions
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Track all changes and restore previous versions
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant='outlined' startIcon={<GitCompare size={16} />}>
              Compare Versions
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size='small'
            placeholder='Search by item or user...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: 280 }}
          />
          <TextField
            select
            size='small'
            value={collectionFilter}
            onChange={(e) => setCollectionFilter(e.target.value)}
            sx={{ width: 160 }}
          >
            <MenuItem value='all'>All Collections</MenuItem>
            {collections.map(c => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size='small'
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ width: 140 }}
          >
            <MenuItem value='all'>All Status</MenuItem>
            <MenuItem value='published'>Published</MenuItem>
            <MenuItem value='draft'>Draft</MenuItem>
            <MenuItem value='scheduled'>Scheduled</MenuItem>
          </TextField>
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : Object.keys(groupedRevisions).length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <History size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
            <Typography variant='h6' color='text.secondary'>
              No revisions found
            </Typography>
          </Paper>
        ) : (
          Object.entries(groupedRevisions).map(([key, itemRevisions]) => {
            const latest = itemRevisions[0];
            
            return (
              <Paper key={key} sx={{ mb: 3, overflow: 'hidden' }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 2,
                    bgcolor: alpha('#8B5CF6', 0.05),
                    cursor: 'pointer',
                  }}
                  onClick={() => toggleExpand(latest.id)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton size='small'>
                      {expandedRevisions.has(latest.id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </IconButton>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        bgcolor: alpha('#8B5CF6', 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Database size={20} color='#8B5CF6' />
                    </Box>
                    <Box>
                      <Typography variant='subtitle1' fontWeight={700}>
                        {latest.itemName}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {latest.collection} · {itemRevisions.length} {itemRevisions.length === 1 ? 'revision' : 'revisions'}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    size='small'
                    label={`Latest: v${latest.version}`}
                    color={getStatusChip(latest.status).color}
                  />
                </Box>

                <Collapse in={expandedRevisions.has(latest.id)}>
                  <Divider />
                  <TableContainer>
                    <Table size='small'>
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.50' }}>
                          <TableCell sx={{ fontWeight: 600, width: 80 }}>Version</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Changes</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>By</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 600 }} align='right'>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {itemRevisions.map((rev) => {
                          const statusConfig = getStatusChip(rev.status);
                          return (
                            <TableRow key={rev.id} hover>
                              <TableCell>
                                <Chip
                                  label={`v${rev.version}`}
                                  size='small'
                                  variant='outlined'
                                  sx={{ fontFamily: 'monospace' }}
                                />
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                  {rev.changes.slice(0, 3).map((change, i) => (
                                    <Tooltip
                                      key={i}
                                      title={`${change.action}: ${change.oldValue || ''} → ${change.newValue || ''}`}
                                    >
                                      <Chip
                                        size='small'
                                        icon={getChangeIcon(change.action)}
                                        label={change.fieldLabel}
                                        variant='outlined'
                                        sx={{ fontSize: 11 }}
                                      />
                                    </Tooltip>
                                  ))}
                                  {rev.changes.length > 3 && (
                                    <Chip
                                      size='small'
                                      label={`+${rev.changes.length - 3} more`}
                                      sx={{ fontSize: 11 }}
                                    />
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Avatar sx={{ width: 24, height: 24, fontSize: 11, bgcolor: alpha('#8B5CF6', 0.2) }}>
                                    {rev.user.name.charAt(0)}
                                  </Avatar>
                                  <Typography variant='body2'>{rev.user.name}</Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography variant='body2' color='text.secondary'>
                                  {formatDate(rev.dateCreated)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  size='small'
                                  label={statusConfig.label}
                                  color={statusConfig.color}
                                  sx={{ fontSize: 11 }}
                                />
                              </TableCell>
                              <TableCell align='right'>
                                <Tooltip title='Preview'>
                                  <IconButton size='small'>
                                    <Eye size={16} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title='Compare'>
                                  <IconButton size='small' onClick={() => handleCompare(rev)}>
                                    <GitCompare size={16} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title='Restore'>
                                  <IconButton size='small' onClick={() => handleRestore(rev)}>
                                    <RotateCcw size={16} />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Collapse>
              </Paper>
            );
          })
        )}
      </Box>

      <Dialog open={restoreDialogOpen} onClose={() => setRestoreDialogOpen(false)}>
        <DialogTitle>Restore Revision</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to restore version {selectedRevision?.version} of "{selectedRevision?.itemName}"?
          </Typography>
          <Paper variant='outlined' sx={{ p: 2, mt: 2, bgcolor: 'warning.light', borderColor: 'warning.main' }}>
            <Typography variant='body2'>
              This will create a new revision with the current data and restore the selected version.
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialogOpen(false)}>Cancel</Button>
          <Button variant='contained' onClick={confirmRestore} startIcon={<RotateCcw size={16} />}>
            Restore Version
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={compareOpen} onClose={() => setCompareOpen(false)} maxWidth='lg' fullWidth>
        <DialogTitle>Compare Versions</DialogTitle>
        <DialogContent dividers>
          {compareRevisions && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mb: 3 }}>
                <Chip label={`Version ${compareRevisions[0].version}`} />
                <Typography>→</Typography>
                <Chip label={`Version ${compareRevisions[1].version}`} />
              </Box>
              <TableContainer component={Paper} variant='outlined'>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, width: 120 }}>Field</TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: 'error.light' }}>Removed</TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: 'success.light' }}>Added</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {compareRevisions[1].changes.map((change, i) => (
                      <TableRow key={i}>
                        <TableCell sx={{ fontWeight: 600 }}>{change.fieldLabel}</TableCell>
                        <TableCell sx={{ bgcolor: 'error.light', color: 'error.dark' }}>
                          {change.oldValue !== undefined ? String(change.oldValue) : '-'}
                        </TableCell>
                        <TableCell sx={{ bgcolor: 'success.light', color: 'success.dark' }}>
                          {change.newValue !== undefined ? String(change.newValue) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompareOpen(false)}>Close</Button>
          <Button variant='contained' onClick={() => {
            setCompareOpen(false);
            if (compareRevisions) handleRestore(compareRevisions[1]);
          }}>
            Restore Newer Version
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
