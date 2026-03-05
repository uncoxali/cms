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
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { Plus, Trash2 } from 'lucide-react';
import { useBookmarksStore } from '@/store/bookmarks';
import { useSchemaStore } from '@/store/schema';
import { useActivityStore } from '@/store/activity';

export default function PresetsPage() {
  const { bookmarks, addBookmark, deleteBookmark } = useBookmarksStore();
  const { collections } = useSchemaStore();
  const { addLog } = useActivityStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    collection: Object.keys(collections)[0] || '',
    scope: 'global' as 'global' | 'personal',
    layout: 'table',
    pageSize: 20,
  });

  const handleCreate = () => {
    const newPreset = {
      id: `preset_${Date.now()}`,
      name: form.name,
      collection: form.collection,
      filters: [],
      sort: '-date_created',
      visibleColumns: collections[form.collection]?.fields.slice(0, 5).map(f => f.name) || [],
      layout: form.layout,
      pageSize: form.pageSize,
      scope: form.scope,
      createdBy: form.scope === 'global' ? 'system' : 'currentUser',
      dateCreated: new Date().toISOString(),
    };
    addBookmark(newPreset as any);
    addLog({ action: 'create', collection: 'presets', item: newPreset.id, user: 'Admin User', meta: { name: newPreset.name, scope: form.scope } });
    setDialogOpen(false);
    setForm({ name: '', collection: Object.keys(collections)[0] || '', scope: 'global', layout: 'table', pageSize: 20 });
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this preset?')) {
      deleteBookmark(id);
      addLog({ action: 'delete', collection: 'presets', item: id, user: 'Admin User' });
    }
  };

  const globalPresets = bookmarks.filter(b => b.scope === 'global' || b.createdBy === 'system');
  const personalPresets = bookmarks.filter(b => b.scope === 'personal' && b.createdBy !== 'system');

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={600}>Saved Presets</Typography>
          <Typography variant="body2" color="text.secondary">Manage global and personal presets for collection Explore views.</Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setDialogOpen(true)}>Create Preset</Button>
      </Box>

      <Typography variant="h6" fontWeight={600} mb={2}>Global Presets</Typography>
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Collection</TableCell>
              <TableCell>Layout</TableCell>
              <TableCell>Page Size</TableCell>
              <TableCell>Columns</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {globalPresets.length === 0 && (
              <TableRow><TableCell colSpan={6}><Typography variant="body2" color="text.secondary">No global presets configured.</Typography></TableCell></TableRow>
            )}
            {globalPresets.map(p => (
              <TableRow key={p.id} hover>
                <TableCell><Typography variant="body2" fontWeight={500}>{p.name}</Typography></TableCell>
                <TableCell><Chip label={p.collection} size="small" variant="outlined" /></TableCell>
                <TableCell>{p.layout}</TableCell>
                <TableCell>{p.pageSize}</TableCell>
                <TableCell>{p.visibleColumns.length} cols</TableCell>
                <TableCell align="right">
                  <IconButton size="small" color="error" onClick={() => handleDelete(p.id)}><Trash2 size={16} /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="h6" fontWeight={600} mb={2}>Personal Presets</Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Collection</TableCell>
              <TableCell>Layout</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {personalPresets.length === 0 && (
              <TableRow><TableCell colSpan={5}><Typography variant="body2" color="text.secondary">No personal presets.</Typography></TableCell></TableRow>
            )}
            {personalPresets.map(p => (
              <TableRow key={p.id} hover>
                <TableCell><Typography variant="body2" fontWeight={500}>{p.name}</Typography></TableCell>
                <TableCell><Chip label={p.collection} size="small" variant="outlined" /></TableCell>
                <TableCell>{p.layout}</TableCell>
                <TableCell>{p.createdBy}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" color="error" onClick={() => handleDelete(p.id)}><Trash2 size={16} /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Preset Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Preset</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <TextField fullWidth label="Preset Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <TextField select fullWidth label="Collection" value={form.collection} onChange={(e) => setForm({ ...form, collection: e.target.value })}>
              {Object.keys(collections).map(key => (
                <MenuItem key={key} value={key}>{collections[key].label}</MenuItem>
              ))}
            </TextField>
            <TextField select fullWidth label="Scope" value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value as any })}>
              <MenuItem value="global">Global (All Users)</MenuItem>
              <MenuItem value="personal">Personal (Current User)</MenuItem>
            </TextField>
            <TextField select fullWidth label="Layout" value={form.layout} onChange={(e) => setForm({ ...form, layout: e.target.value })}>
              <MenuItem value="table">Table</MenuItem>
              <MenuItem value="cards">Cards</MenuItem>
            </TextField>
            <TextField type="number" fullWidth label="Page Size" value={form.pageSize} onChange={(e) => setForm({ ...form, pageSize: Number(e.target.value) })} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!form.name.trim()}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
