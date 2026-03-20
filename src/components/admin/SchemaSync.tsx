'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import { useTheme, alpha } from '@mui/material/styles';
import { 
  Download, Upload, Code, Database, Table, Columns3, 
  ChevronRight, Check, AlertTriangle, Copy, Clipboard, FileText
} from 'lucide-react';
import { api } from '@/lib/api';
import { useSchemaStore } from '@/store/schema';

interface SchemaExport {
  version: string;
  exportedAt: string;
  collections: {
    id: string;
    label: string;
    icon: string;
    fields: Array<{
      name: string;
      type: string;
      label: string;
      required: boolean;
      hidden: boolean;
      interface: string;
      options?: Record<string, any>;
    }>;
    relations: Array<{
      field: string;
      relatedCollection: string;
      displayField: string;
    }>;
  }[];
}

export default function SchemaSync() {
  const theme = useTheme();
  const { collections, fetchSchema } = useSchemaStore();
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportCode, setExportCode] = useState('');
  const [importCode, setImportCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const toggleCollection = (id: string) => {
    setSelectedCollections(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedCollections(Object.keys(collections));
  };

  const selectNone = () => {
    setSelectedCollections([]);
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const exportData: SchemaExport = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        collections: selectedCollections.map(id => {
          const col = collections[id];
          const fieldAny = col.fields as any[];
          return {
            id: col.id,
            label: col.label,
            icon: col.icon || 'database',
            fields: col.fields.map(f => ({
              name: f.name,
              type: f.type,
              label: f.label,
              required: f.required || false,
              hidden: fieldAny.find(x => x.name === f.name)?.hidden || false,
              interface: fieldAny.find(x => x.name === f.name)?.interface || 'input',
              options: fieldAny.find(x => x.name === f.name)?.options,
            })),
            relations: col.fields
              .filter(f => f.type === 'relation' && (f as any).relationInfo)
              .map(f => ({
                field: f.name,
                relatedCollection: (f as any).relationInfo.collection,
                displayField: (f as any).relationInfo.displayField,
              })),
          };
        }),
      };

      setExportCode(JSON.stringify(exportData, null, 2));
      setExportDialogOpen(true);
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Export failed', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(exportCode);
    setSnackbar({ open: true, message: 'Copied to clipboard!', severity: 'success' });
  };

  const handleDownload = () => {
    const blob = new Blob([exportCode], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schema-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!importCode.trim()) {
      setSnackbar({ open: true, message: 'Please paste schema code', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      const schema = JSON.parse(importCode) as SchemaExport;
      
      if (!schema.version || !schema.collections) {
        throw new Error('Invalid schema format');
      }

      for (const col of schema.collections) {
        try {
          await api.post(`/schema/${col.id}`, {
            label: col.label,
            icon: col.icon,
            fields: col.fields.map(f => ({
              name: f.name,
              type: f.type,
              required: f.required,
              nullable: !f.required,
            })),
          });
        } catch (err: any) {
          console.warn(`Collection ${col.id} may already exist:`, err.message);
        }
      }

      await fetchSchema();
      setImportDialogOpen(false);
      setImportCode('');
      setSnackbar({ open: true, message: 'Schema imported successfully!', severity: 'success' });
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Import failed', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setImportCode(event.target?.result as string);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const allCollections = Object.entries(collections);

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={1}>
        Schema Sync
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={4}>
        Export and import schema definitions between environments.
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        <Paper sx={{ p: 3, flex: '1 1 400px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Download size={20} color={theme.palette.primary.main} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Export Schema
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Export selected collections as JSON
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" fontWeight={500}>
                Select Collections ({selectedCollections.length} of {allCollections.length})
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" onClick={selectAll}>All</Button>
                <Button size="small" onClick={selectNone}>None</Button>
              </Box>
            </Box>

            <List sx={{ maxHeight: 300, overflow: 'auto', border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
              {allCollections.map(([id, col]) => (
                <ListItem key={id} disablePadding>
                  <ListItemButton onClick={() => toggleCollection(id)}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Checkbox
                        edge="start"
                        checked={selectedCollections.includes(id)}
                        tabIndex={-1}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={col.label}
                      secondary={id}
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
              {allCollections.length === 0 && (
                <ListItem>
                  <ListItemText primary="No collections found" />
                </ListItem>
              )}
            </List>
          </Box>

          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={18} /> : <Download size={18} />}
            onClick={handleExport}
            disabled={selectedCollections.length === 0 || loading}
            fullWidth
          >
            Export Selected ({selectedCollections.length})
          </Button>
        </Paper>

        <Paper sx={{ p: 3, flex: '1 1 400px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.success.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Upload size={20} color={theme.palette.success.main} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Import Schema
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Import schema from JSON code or file
              </Typography>
            </Box>
          </Box>

          <Alert severity="info" sx={{ mb: 2 }}>
            Importing will create new collections and fields. Existing collections will be skipped.
          </Alert>

          <TextField
            label="Schema JSON"
            multiline
            rows={8}
            fullWidth
            placeholder="Paste your schema JSON here..."
            value={importCode}
            onChange={(e) => setImportCode(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<Upload size={18} />}
              fullWidth
            >
              Upload File
              <input type="file" accept=".json" hidden onChange={handleFileUpload} />
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={loading ? <CircularProgress size={18} /> : <Upload size={18} />}
              onClick={handleImport}
              disabled={!importCode.trim() || loading}
              fullWidth
            >
              Import
            </Button>
          </Box>
        </Paper>
      </Box>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Code size={20} color={theme.palette.primary.main} />
          <Typography variant="h6" fontWeight={600}>
            Schema Presets
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Quick-start templates for common use cases.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {[
            { name: 'Blog', icon: FileText, description: 'Posts, categories, tags, authors' },
            { name: 'E-commerce', icon: Columns3, description: 'Products, orders, customers, inventory' },
            { name: 'Portfolio', icon: Database, description: 'Projects, skills, testimonials' },
          ].map(preset => (
            <Paper
              key={preset.name}
              sx={{
                p: 2,
                flex: '1 1 200px',
                border: `1px solid ${theme.palette.divider}`,
                cursor: 'pointer',
                transition: 'all 200ms ease',
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <preset.icon size={18} color={theme.palette.primary.main} />
                <Typography variant="subtitle2" fontWeight={600}>
                  {preset.name}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {preset.description}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Paper>

      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Schema Export</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
            <Button startIcon={<Copy size={16} />} size="small" onClick={handleCopyToClipboard}>
              Copy to Clipboard
            </Button>
            <Button startIcon={<Download size={16} />} size="small" onClick={handleDownload}>
              Download
            </Button>
          </Box>
          <TextField
            multiline
            rows={15}
            fullWidth
            value={exportCode}
            InputProps={{ readOnly: true }}
            sx={{ fontFamily: 'monospace', fontSize: 12 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
