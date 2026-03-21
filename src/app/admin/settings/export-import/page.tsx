"use client";

import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';
import { alpha, useTheme } from '@mui/material/styles';
import { useSchemaStore } from '@/store/schema';
import { useNotificationsStore } from '@/store/notifications';
import { api } from '@/lib/api';
import {
  Download,
  Upload,
  FileSpreadsheet,
  FileJson,
  Database,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
}

export default function ExportImportPage() {
  const theme = useTheme();
  const { collections } = useSchemaStore();
  const { addNotification } = useNotificationsStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [exportCollection, setExportCollection] = useState<string>('all');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [exportLoading, setExportLoading] = useState(false);

  const [importCollection, setImportCollection] = useState<string>('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);

  const collectionOptions = Object.entries(collections).map(([key, val]) => ({
    value: key,
    label: val.label || key,
  }));

  const handleExport = async () => {
    setExportLoading(true);
    try {
      let url = `/api/export?format=${exportFormat}`;
      if (exportCollection !== 'all') {
        url += `&collection=${exportCollection}`;
      }

      const token = api.getToken();
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `export_${exportCollection}_${Date.now()}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      addNotification({ title: 'Export Complete', message: 'Data exported successfully' });
    } catch (err: any) {
      addNotification({ title: 'Export Failed', message: err.message });
    } finally {
      setExportLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportResult(null);

    // Preview file content
    try {
      const text = await file.text();
      if (file.name.endsWith('.json')) {
        const data = JSON.parse(text);
        setImportPreview(Array.isArray(data) ? data.slice(0, 3) : [data]);
      } else {
        // Parse CSV preview
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length > 0) {
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          const preview = lines.slice(1, 4).map(line => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            return headers.reduce((acc, h, i) => ({ ...acc, [h]: values[i] || '' }), {});
          });
          setImportPreview(preview);
        }
      }
    } catch (err) {
      setImportPreview([]);
    }
  };

  const handleImport = async () => {
    if (!importFile || !importCollection) {
      addNotification({ title: 'Error', message: 'Please select a file and collection' });
      return;
    }

    setImportLoading(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('collection', importCollection);

      const token = api.getToken();
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Import failed');

      setImportResult({
        success: true,
        imported: result.imported || 0,
        errors: result.errors || [],
      });

      addNotification({
        title: 'Import Complete',
        message: `${result.imported || 0} items imported`,
      });
    } catch (err: any) {
      setImportResult({
        success: false,
        imported: 0,
        errors: [err.message],
      });
      addNotification({ title: 'Import Failed', message: err.message });
    } finally {
      setImportLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    if (!importCollection) return;

    const col = collections[importCollection];
    if (!col) return;

    const headers = col.fields.map((f: any) => f.name);
    const csv = headers.join(',') + '\n';

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template_${importCollection}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ p: 4, overflow: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Export & Import
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Export data to CSV/JSON or import data from files
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Export Section */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: '16px', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '14px',
                  bgcolor: alpha('#3B82F6', 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Download size={24} color="#3B82F6" />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700}>Export Data</Typography>
                <Typography variant="body2" color="text.secondary">
                  Download content as CSV or JSON
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                select
                fullWidth
                label="Collection"
                value={exportCollection}
                onChange={(e) => setExportCollection(e.target.value)}
              >
                <MenuItem value="all">All Collections</MenuItem>
                {collectionOptions.map((col) => (
                  <MenuItem key={col.value} value={col.value}>{col.label}</MenuItem>
                ))}
              </TextField>

              <TextField
                select
                fullWidth
                label="Format"
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as any)}
              >
                <MenuItem value="csv">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FileSpreadsheet size={16} />
                    CSV (Spreadsheet)
                  </Box>
                </MenuItem>
                <MenuItem value="json">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FileJson size={16} />
                    JSON (Data)
                  </Box>
                </MenuItem>
              </TextField>

              {exportLoading && <LinearProgress />}

              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={<Download size={18} />}
                onClick={handleExport}
                disabled={exportLoading}
                sx={{ borderRadius: '10px', py: 1.5 }}
              >
                {exportLoading ? 'Exporting...' : 'Export Data'}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Import Section */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: '16px', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '14px',
                  bgcolor: alpha('#10B981', 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Upload size={24} color="#10B981" />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700}>Import Data</Typography>
                <Typography variant="body2" color="text.secondary">
                  Upload CSV or JSON files
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                select
                fullWidth
                label="Target Collection"
                value={importCollection}
                onChange={(e) => setImportCollection(e.target.value)}
              >
                {collectionOptions.map((col) => (
                  <MenuItem key={col.value} value={col.value}>{col.label}</MenuItem>
                ))}
              </TextField>

              <Box
                sx={{
                  border: 2,
                  borderStyle: 'dashed',
                  borderColor: importFile ? '#10B981' : 'divider',
                  borderRadius: '12px',
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 200ms',
                  bgcolor: importFile ? alpha('#10B981', 0.05) : 'transparent',
                  '&:hover': {
                    borderColor: '#10B981',
                    bgcolor: alpha('#10B981', 0.05),
                  },
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json"
                  hidden
                  onChange={handleFileSelect}
                />
                {importFile ? (
                  <Box>
                    <CheckCircle2 size={32} color="#10B981" style={{ marginBottom: 8 }} />
                    <Typography variant="body2" fontWeight={600}>{importFile.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(importFile.size / 1024).toFixed(1)} KB • Click to change
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <Upload size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                    <Typography variant="body2" color="text.secondary">
                      Click to select file (CSV or JSON)
                    </Typography>
                  </Box>
                )}
              </Box>

              {importCollection && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FileSpreadsheet size={16} />}
                  onClick={handleDownloadTemplate}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Download Template
                </Button>
              )}

              {importLoading && <LinearProgress />}

              {importResult && (
                <Alert
                  severity={importResult.success ? 'success' : 'error'}
                  icon={importResult.success ? <CheckCircle2 /> : <AlertCircle />}
                >
                  <Typography variant="body2" fontWeight={600}>
                    {importResult.success
                      ? `${importResult.imported} items imported successfully`
                      : 'Import failed'}
                  </Typography>
                  {importResult.errors.length > 0 && (
                    <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                      {importResult.errors.slice(0, 3).join('; ')}
                    </Typography>
                  )}
                </Alert>
              )}

              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={<Upload size={18} />}
                onClick={handleImport}
                disabled={!importFile || !importCollection || importLoading}
                sx={{ borderRadius: '10px', py: 1.5 }}
              >
                {importLoading ? 'Importing...' : 'Import Data'}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Import Preview */}
        {importPreview.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 3, borderRadius: '16px' }}>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>
                Preview ({importPreview.length} rows)
              </Typography>
              <Box sx={{ overflow: 'auto' }}>
                <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                  <Box component="thead">
                    <Box component="tr">
                      {Object.keys(importPreview[0]).map((key) => (
                        <Box
                          key={key}
                          component="th"
                          sx={{
                            p: 1.5,
                            textAlign: 'left',
                            fontWeight: 600,
                            fontSize: 12,
                            borderBottom: 2,
                            borderColor: 'divider',
                            bgcolor: alpha('#8B5CF6', 0.05),
                          }}
                        >
                          {key}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                  <Box component="tbody">
                    {importPreview.map((row, idx) => (
                      <Box component="tr" key={idx}>
                        {Object.values(row).map((val: any, i) => (
                          <Box
                            key={i}
                            component="td"
                            sx={{
                              p: 1.5,
                              fontSize: 13,
                              borderBottom: 1,
                              borderColor: 'divider',
                              maxWidth: 200,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {String(val || '')}
                          </Box>
                        ))}
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
