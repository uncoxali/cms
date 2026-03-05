"use client";

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import { Save, Plus, Trash2 } from 'lucide-react';
import { useProjectStore } from '@/store/project';
import { useActivityStore } from '@/store/activity';

export default function FilesSettingsPage() {
  const { fileSettings, updateFileSettings } = useProjectStore();
  const { addLog } = useActivityStore();

  const [form, setForm] = useState({ ...fileSettings });
  const [newMime, setNewMime] = useState('');

  const handleSave = () => {
    updateFileSettings(form);
    addLog({ action: 'update', collection: 'fileSettings', user: 'Admin User', meta: { changed: form } });
  };

  const addMime = () => {
    if (newMime.trim() && !form.allowedMimeTypes.includes(newMime.trim())) {
      setForm({ ...form, allowedMimeTypes: [...form.allowedMimeTypes, newMime.trim()] });
      setNewMime('');
    }
  };

  const removeMime = (mime: string) => {
    setForm({ ...form, allowedMimeTypes: form.allowedMimeTypes.filter(m => m !== mime) });
  };

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={600}>Files & Storage</Typography>
          <Typography variant="body2" color="text.secondary">Configure file upload constraints, thumbnail generation, and storage defaults.</Typography>
        </Box>
        <Button variant="contained" startIcon={<Save size={18} />} onClick={handleSave}>Save Changes</Button>
      </Box>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>Upload Constraints</Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField type="number" fullWidth label="Max File Size (MB)" value={form.maxFileSize} onChange={(e) => setForm({ ...form, maxFileSize: Number(e.target.value) })} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Default Upload Folder" value={form.defaultFolder} onChange={(e) => setForm({ ...form, defaultFolder: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel control={<Switch checked={form.imageOptimization} onChange={(e) => setForm({ ...form, imageOptimization: e.target.checked })} />} label="Image Optimization (WebP conversion)" />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>Allowed MIME Types</Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField size="small" fullWidth label="Add MIME type" value={newMime} onChange={(e) => setNewMime(e.target.value)} placeholder="e.g. image/svg+xml" onKeyDown={e => e.key === 'Enter' && addMime()} />
              <Button variant="outlined" onClick={addMime} startIcon={<Plus size={16} />}>Add</Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {form.allowedMimeTypes.map(mime => (
                <Chip key={mime} label={mime} onDelete={() => removeMime(mime)} />
              ))}
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>Thumbnail Presets</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Preset Name</TableCell>
                    <TableCell>Width (px)</TableCell>
                    <TableCell>Height (px)</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {form.thumbnailSizes.map((thumb, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{thumb.name}</TableCell>
                      <TableCell>{thumb.width}</TableCell>
                      <TableCell>{thumb.height}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" color="error" onClick={() => setForm({ ...form, thumbnailSizes: form.thumbnailSizes.filter((_, i) => i !== idx) })}>
                          <Trash2 size={16} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
