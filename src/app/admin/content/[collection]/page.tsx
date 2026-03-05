"use client";

import { use, useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import Link from 'next/link';
import { notFound, useSearchParams, useRouter } from 'next/navigation';
import { Search, Filter, Plus, Save, Download, Upload } from 'lucide-react';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { useBookmarksStore } from '@/store/bookmarks';
import { useSchemaStore } from '@/store/schema';

export default function CollectionPage({ params }: { params: Promise<{ collection: string }> }) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const collectionKey = resolvedParams.collection;
  
  const { collections } = useSchemaStore();
  const config = collections[collectionKey];

  if (!config) {
    notFound();
  }

  const { bookmarks, addBookmark } = useBookmarksStore();
  const bookmarkId = searchParams.get('bookmark');
  const activeBookmark = bookmarks.find(b => b.id === bookmarkId && b.collection === collectionKey);

  // Bookmark Dialog State
  const [openSaveDialog, setOpenSaveDialog] = useState(false);
  const [bookmarkName, setBookmarkName] = useState('');

  // Default columns vs Bookmark columns vs Preset columns
  const initialColumns = activeBookmark 
    ? config.fields.filter(f => activeBookmark.visibleColumns.includes(f.name))
    : config.preset?.visibleColumns 
      ? config.fields.filter(f => config.preset!.visibleColumns!.includes(f.name))
      : config.fields.slice(0, 5);

  const [columns, setColumns] = useState(initialColumns);

  useEffect(() => {
    if (activeBookmark) {
      setColumns(config.fields.filter(f => activeBookmark.visibleColumns.includes(f.name)));
    } else if (config.preset?.visibleColumns) {
      setColumns(config.fields.filter(f => config.preset!.visibleColumns!.includes(f.name)));
    } else {
      setColumns(config.fields.slice(0, 5));
    }
  }, [activeBookmark, config, collectionKey]);

  const handleSaveBookmark = () => {
    if (!bookmarkName.trim()) return;
    
    const newId = `b_${Date.now()}`;
    addBookmark({
      id: newId,
      name: bookmarkName,
      collection: collectionKey,
      filters: [], // Mock filters for now
      sort: '-createdAt',
      visibleColumns: columns.map(c => c.name),
      layout: 'table',
      pageSize: config.preset?.pageSize || 20,
      scope: 'personal',
      createdBy: 'currentUser',
      dateCreated: new Date().toISOString()
    });
    
    setOpenSaveDialog(false);
    setBookmarkName('');
    router.push(`/admin/content/${collectionKey}?bookmark=${newId}`);
  };

  // Mock data state
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const defaultData = Array.from({ length: config.preset?.pageSize || 10 }).map((_, idx) => {
      const row: any = {};
      config.fields.forEach(col => {
        if (col.type === 'number') row[col.name] = idx + 1;
        else if (col.type === 'boolean') row[col.name] = idx % 2 === 0;
        else row[col.name] = `Mock ${col.label} ${idx + 1}`;
      });
      row.id = idx + 1;
      return row;
    });
    setData(defaultData);
  }, [config]);

  // Inline Editing State
  const [editingCell, setEditingCell] = useState<{ id: any, field: string } | null>(null);
  const [editValue, setEditValue] = useState<any>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleDoubleClick = (id: any, field: string, value: any, type: string) => {
    // Only allow editing basic string/number/boolean fields for this mock
    if (['string', 'number'].includes(type)) {
      setEditingCell({ id, field });
      setEditValue(value);
    }
  };

  const handleSaveEdit = (id: any, field: string) => {
    setData(prev => prev.map(row => {
      if (row.id === id) {
        return { ...row, [field]: editValue };
      }
      return row;
    }));
    setEditingCell(null);
  };

  const handleExport = () => {
    if (data.length === 0) return;

    const headers = columns.map(c => c.label).join(',');
    const csvRows = data.map(row => {
      return columns.map(col => {
        let val = row[col.name];
        if (typeof val === 'boolean') val = val ? 'true' : 'false';
        if (typeof val === 'string') {
          val = val.replace(/"/g, '""');
          if (val.search(/("|,|\n)/g) >= 0) val = `"${val}"`;
        }
        return val;
      }).join(',');
    });

    const csvString = [headers, ...csvRows].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('url');
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${collectionKey}_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    
    URL.revokeObjectURL(url);
  };

  // Import State
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<{ row: number, message: string }[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(file);
    // Reset file input so same file can be selected again
    e.target.value = '';
  };

  const parseCSV = (csvText: string) => {
    const lines = csvText.split('\n').filter(l => l.trim());
    if (lines.length < 2) return; // Need at least headers and one row

    const headers = lines[0].split(',').map(h => h.trim());
    const parsedData: any[] = [];
    const errors: { row: number, message: string }[] = [];

    for (let i = 1; i < lines.length; i++) {
      // Simple CSV split (doesn't handle commas inside quotes well, but fine for mock)
      const values = lines[i].split(',').map(v => v.trim());
      const rowData: any = {};
      
      headers.forEach((header, index) => {
        // Find if this header matches a field in our collection
        const fieldConfig = config.fields.find(f => f.label === header || f.name === header);
        let val: any = values[index];
        
        if (fieldConfig) {
          // Type coercion
          if (fieldConfig.type === 'number') val = Number(val);
          if (fieldConfig.type === 'boolean') val = val === 'true' || val === '1' || val.toLowerCase() === 'yes';
          
          // Basic Validation
          if (fieldConfig.required && (val === undefined || val === null || val === '')) {
            errors.push({ row: i, message: `Missing required field: ${fieldConfig.label}` });
          }
          
          rowData[fieldConfig.name] = val;
        } else {
          // Keep unmapped data just in case
          rowData[header] = val;
        }
      });
      
      // Mock an ID if not present
      if (!rowData.id) rowData.id = `imported_${Date.now()}_${i}`;
      
      parsedData.push(rowData);
    }

    setImportData(parsedData);
    setImportErrors(errors);
  };

  const finalizeImport = () => {
    if (importErrors.length > 0 || importData.length === 0) return;
    
    // In a real app, send to API. Here, just prepend to local state.
    setData(prev => [...importData, ...prev]);
    setOpenImportDialog(false);
    setImportData([]);
    setImportErrors([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: any, field: string) => {
    if (e.key === 'Enter') {
      handleSaveEdit(id, field);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight={600} display="flex" alignItems="center" gap={2}>
          {config.label} 
          {activeBookmark && <Typography component="span" variant="h5" color="primary.main">• {activeBookmark.name}</Typography>}
          {!activeBookmark && config.preset && <Chip label="Default Preset" size="small" variant="outlined" />}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<Download size={18} />} color="inherit" onClick={handleExport}>
            Export
          </Button>
          <Button variant="outlined" startIcon={<Upload size={18} />} color="inherit" onClick={() => setOpenImportDialog(true)}>
            Import
          </Button>
          <Button variant="outlined" startIcon={<Save size={18} />} color="inherit" onClick={() => setOpenSaveDialog(true)}>
            Bookmark
          </Button>
          <Button variant="outlined" startIcon={<Filter size={18} />} color="inherit">
            Filter
          </Button>
          <Link href={`/admin/content/${collectionKey}/new`} passHref style={{ textDecoration: 'none' }}>
            <Button variant="contained" startIcon={<Plus size={18} />}>
              Create Item
            </Button>
          </Link>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', backgroundColor: 'background.paper' }}>
        <TextField
          placeholder="Search..."
          variant="outlined"
          size="small"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={20} />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 400 }}
        />
      </Paper>

      <TableContainer component={Paper} sx={{ flexGrow: 1, overflow: 'auto', backgroundColor: 'background.paper' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox color="primary" />
              </TableCell>
              {columns.map(col => (
                <TableCell key={col.name} sx={{ fontWeight: 600 }}>
                  {col.label}
                </TableCell>
              ))}
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
              <TableRow key={row.id} hover>
                <TableCell padding="checkbox">
                  <Checkbox color="primary" />
                </TableCell>
                {columns.map(col => {
                  const isEditing = editingCell?.id === row.id && editingCell?.field === col.name;
                  
                  return (
                    <TableCell 
                      key={col.name} 
                      onDoubleClick={() => handleDoubleClick(row.id, col.name, row[col.name], col.type)}
                      sx={{ cursor: ['string', 'number'].includes(col.type) ? 'pointer' : 'default' }}
                    >
                      {isEditing ? (
                        <TextField
                          autoFocus
                          size="small"
                          fullWidth
                          variant="standard"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveEdit(row.id, col.name)}
                          onKeyDown={(e) => handleKeyDown(e, row.id, col.name)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        typeof row[col.name] === 'boolean' 
                          ? (row[col.name] ? 'Yes' : 'No') 
                          : row[col.name]
                      )}
                    </TableCell>
                  );
                })}
                <TableCell align="right">
                  <Link href={`/admin/content/${collectionKey}/${row.id}`} passHref style={{ textDecoration: 'none' }}>
                    <Button size="small" variant="text" color="inherit">
                      Edit
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={data.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        rowsPerPageOptions={[5, 10, 25, 50]}
        sx={{ borderTop: 1, borderColor: 'divider' }}
      />

      <Dialog open={openSaveDialog} onClose={() => setOpenSaveDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Save Bookmark</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Bookmark Name"
            type="text"
            fullWidth
            variant="outlined"
            value={bookmarkName}
            onChange={(e) => setBookmarkName(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenSaveDialog(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSaveBookmark} variant="contained" disabled={!bookmarkName.trim()}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Import Dialog Placeholder */}
      <Dialog open={openImportDialog} onClose={() => setOpenImportDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Import Data</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" mb={2}>
              Upload a CSV file to import records into <strong>{config.label}</strong>.
            </Typography>
            <Button variant="outlined" component="label" startIcon={<Upload size={18} />}>
              Select CSV File
              <input type="file" accept=".csv" hidden onChange={handleFileUpload} />
            </Button>
            
            {importData.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" mb={2}>Preview ({importData.length} rows)</Typography>
                <TableContainer component={Paper} sx={{ maxHeight: 300, overflow: 'auto' }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        {Object.keys(importData[0]).map(key => (
                          <TableCell key={key}>{key}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {importData.slice(0, 5).map((row, i) => (
                        <TableRow key={i}>
                          {Object.values(row).map((val: any, j) => (
                            <TableCell key={j}>{String(val)}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {importData.length > 5 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Showing first 5 rows...
                  </Typography>
                )}
                
                {importErrors.length > 0 && (
                  <Box sx={{ mt: 3, p: 2, bgcolor: 'error.main', color: 'error.contrastText', borderRadius: 1 }}>
                    <Typography variant="subtitle2" fontWeight="bold">Validation Errors Found:</Typography>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {importErrors.map((err, idx) => (
                        <li key={idx}><Typography variant="body2">Row {err.row}: {err.message}</Typography></li>
                      ))}
                    </ul>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenImportDialog(false)} color="inherit">Cancel</Button>
          <Button 
            onClick={finalizeImport} 
            variant="contained" 
            disabled={importData.length === 0 || importErrors.length > 0}
            color="primary"
          >
            Import {importData.length} Records
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
