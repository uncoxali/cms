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

export default function DataModelListPage() {
  const router = useRouter();
  const { collections, addCollection, deleteCollection } = useSchemaStore();
  const { addLog } = useActivityStore();
  const { addNotification } = useNotificationsStore();

  const collectionsList = Object.keys(collections).map(key => ({
    key,
    ...collections[key]
  }));

  // Create Collection Dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLabel, setNewLabel] = useState('');

  const handleCreate = () => {
    if (!newName.trim()) return;
    const key = newName.toLowerCase().replace(/\s+/g, '_');
    if (collections[key]) {
      addNotification({ title: 'Error', message: `Collection "${key}" already exists.` });
      return;
    }
    addCollection(key, {
      id: key,
      name: newLabel || newName,
      label: newLabel || newName,
      icon: 'Database',
      fields: [
        { name: 'id', label: 'ID', type: 'number', group: 'Meta', sortable: true, searchable: true },
      ],
      preset: { visibleColumns: ['id'], pageSize: 20 },
    });
    addLog({ action: 'create', collection: 'directus_collections', item: key, user: 'Admin User', meta: { label: newLabel || newName } });
    addNotification({ title: 'Collection Created', message: `"${newLabel || newName}" is ready to configure.` });
    setCreateOpen(false);
    setNewName('');
    setNewLabel('');
    router.push(`/admin/settings/data-model/${key}`);
  };

  const handleDelete = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete collection "${key}"? This cannot be undone.`)) {
      deleteCollection(key);
      addLog({ action: 'delete', collection: 'directus_collections', item: key, user: 'Admin User' });
      addNotification({ title: 'Collection Deleted', message: `"${key}" has been removed.` });
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
                sx={{ cursor: 'pointer' }}
                onClick={() => router.push(`/admin/settings/data-model/${col.key}`)}
              >
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
          <Button variant="contained" onClick={handleCreate} disabled={!newName.trim()}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
