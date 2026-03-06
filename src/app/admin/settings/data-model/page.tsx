"use client";

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Checkbox from '@mui/material/Checkbox';
import Slide from '@mui/material/Slide';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import { useRouter } from 'next/navigation';
import { useSchemaStore } from '@/store/schema';
import { useActivityStore } from '@/store/activity';
import { useNotificationsStore } from '@/store/notifications';
import { Database, Plus, Trash2 } from 'lucide-react';
import { useConfirm } from '@/components/admin/ConfirmDialog';

export default function DataModelListPage() {
  const router = useRouter();
  const { collections, loading, createCollection, dropCollection, bulkDropCollections } = useSchemaStore();
  const { addLog } = useActivityStore();
  const { addNotification } = useNotificationsStore();
  const confirm = useConfirm();
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const collectionsList = Object.keys(collections).map(key => ({
    key,
    ...collections[key]
  }));

  // Create Collection Dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLabel, setNewLabel] = useState('');

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const key = newName.toLowerCase().replace(/\s+/g, '_');
    if (collections[key]) {
      addNotification({ title: 'Error', message: `Collection "${key}" already exists.` });
      return;
    }
    setCreating(true);
    try {
      await createCollection(key, {
        id: key,
        name: newLabel || newName,
        label: newLabel || newName,
        icon: 'Database',
        fields: [
          { name: 'id', label: 'ID', type: 'number', group: 'Meta', sortable: true, searchable: true },
        ],
        preset: { visibleColumns: ['id'], pageSize: 20 },
      });
      addNotification({ title: 'Collection Created', message: `"${newLabel || newName}" table created in database.` });
      setCreateOpen(false);
      setNewName('');
      setNewLabel('');
      router.push(`/admin/settings/data-model/${key}`);
    } catch (err: any) {
      addNotification({ title: 'Error', message: err.message || 'Failed to create collection' });
    } finally {
      setCreating(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelected(collectionsList.map(c => c.key));
    } else {
      setSelected([]);
    }
  };

  const handleSelectOne = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleBulkDelete = async () => {
    const ok = await confirm({ 
      title: 'Bulk Delete Collections', 
      message: `Are you sure you want to delete ${selected.length} collections? This will permanently delete all data and schema for these collections. This cannot be undone.`, 
      confirmText: `Delete ${selected.length} Collections`, 
      severity: 'error' 
    });
    if (!ok) return;

    try {
      await bulkDropCollections(selected);
      addNotification({ title: 'Success', message: `${selected.length} collections deleted successfully.` });
      setSelected([]);
    } catch (err: any) {
      addNotification({ title: 'Error', message: err.message || 'Failed to delete some collections' });
      // Refresh schema anyway to sync state
      useSchemaStore.getState().fetchSchema();
    } finally {
      // Done
    }
  };

  const handleDelete = async (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await confirm({ title: 'Delete Collection', message: `Are you sure you want to delete collection "${key}"? All data in this collection will be lost. This cannot be undone.`, confirmText: 'Delete Collection', severity: 'error' });
    if (!ok) return;
    try {
      await dropCollection(key);
      addNotification({ title: 'Collection Deleted', message: `"${key}" table dropped from database.` });
    } catch (err: any) {
      addNotification({ title: 'Error', message: err.message || 'Failed to delete collection' });
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={600} display="flex" alignItems="center" gap={2}>
            <Database size={28} /> Data Model
          </Typography>
          <Typography variant="body2" color="text.secondary">Manage the schema of your project's collections and fields.</Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setCreateOpen(true)}>
          Create Collection
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ flexGrow: 1 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selected.length > 0 && selected.length < collectionsList.length}
                  checked={collectionsList.length > 0 && selected.length === collectionsList.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Collection</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>System Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">Fields</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">Relations</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {collectionsList.map((col) => (
              <TableRow 
                key={col.key} 
                hover 
                selected={selected.includes(col.key)}
                sx={{ cursor: 'pointer' }}
                onClick={() => router.push(`/admin/settings/data-model/${col.key}`)}
              >
                <TableCell padding="checkbox">
                  <Checkbox 
                    checked={selected.includes(col.key)} 
                    onClick={(e) => handleSelectOne(col.key, e)}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 1, bgcolor: 'action.hover' }}>
                      <Database size={16} />
                    </Box>
                    <Typography variant="body1" fontWeight={500}>{col.label}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip label={col.key} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} />
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2">{col.fields.length}</Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2">{col.fields.filter(f => f.relationInfo).length}</Typography>
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" color="error" onClick={(e) => handleDelete(col.key, e)}>
                    <Trash2 size={16} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Bulk Action Toolbar */}
      <Slide direction="up" in={selected.length > 0} mountOnEnter unmountOnExit>
        <Paper
          elevation={6}
          sx={{
            position: 'fixed',
            bottom: 24,
            left: 'calc(50% + 110px)', // Adjustment for sidebar
            transform: 'translateX(-50%)',
            px: 3,
            py: 1.5,
            borderRadius: 3,
            bgcolor: 'background.paper',
            border: theme => `1px solid ${theme.palette.divider}`,
            zIndex: 1000,
            minWidth: 400,
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Typography variant="subtitle2" fontWeight={600}>
              {selected.length} collections selected
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={() => setSelected([])}
                disabled={loading}
              >
                Clear
              </Button>
              <Button 
                variant="contained" 
                color="error" 
                size="small" 
                startIcon={<Trash2 size={16} />}
                onClick={handleBulkDelete}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete Selected'}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Slide>

      {/* Create Collection Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Create New Collection</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <TextField fullWidth label="System Name (key)" value={newName} onChange={(e) => setNewName(e.target.value)} required helperText="Lowercase, no spaces. e.g. 'blog_posts'" />
            <TextField fullWidth label="Display Label" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} helperText="Human-readable name. e.g. 'Blog Posts'" />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCreateOpen(false)} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!newName.trim() || creating}>{creating ? 'Creating...' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
