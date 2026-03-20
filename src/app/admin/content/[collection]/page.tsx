'use client';

import { use, useState, useEffect, useCallback } from 'react';
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
import { Search, Filter, Plus, Save, Download, Upload, Trash2, Database, Bookmark, ArrowLeft, Edit3, Copy, ChevronUp, ChevronDown, Columns3 } from 'lucide-react';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import Tooltip from '@mui/material/Tooltip';
import { alpha, useTheme } from '@mui/material/styles';
import { useBookmarksStore } from '@/store/bookmarks';
import { useSchemaStore } from '@/store/schema';
import { useAuthStore, hasCollectionAccess } from '@/store/auth';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import { AdvancedFilterDialog, FilterGroup } from '@/components/admin/AdvancedFilterDialog';
import { BulkEditDialog } from '@/components/admin/BulkEditDialog';
import { ColumnCustomizer } from '@/components/admin/ColumnCustomizer';
import { api } from '@/lib/api';
import { LayoutSelector, KanbanBoard, CalendarBoard, CardsLayout, LayoutType } from '@/components/admin/layouts';

interface ApiMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default function CollectionPage({ params }: { params: Promise<{ collection: string }> }) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const confirm = useConfirm();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const collectionKey = resolvedParams.collection;
  
  const { collections } = useSchemaStore();
  const user = useAuthStore((s) => s.user);
  const config = collections[collectionKey];

  const { bookmarks, addBookmark } = useBookmarksStore();
  const bookmarkId = searchParams.get('bookmark');
  const activeBookmark = bookmarks.find(b => b.id === bookmarkId && b.collection === collectionKey);

  const [openSaveDialog, setOpenSaveDialog] = useState(false);
  const [bookmarkName, setBookmarkName] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [meta, setMeta] = useState<ApiMeta>({ total: 0, page: 1, limit: 25, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [filterField, setFilterField] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [layout, setLayout] = useState<LayoutType>('table');
  const [advancedFilterOpen, setAdvancedFilterOpen] = useState(false);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [columnCustomizerOpen, setColumnCustomizerOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<FilterGroup[]>([]);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  if (!config) {
    notFound();
  }

  const canEdit = hasCollectionAccess(user, collectionKey, 'update') || hasCollectionAccess(user, collectionKey, 'create');
  const canDelete = hasCollectionAccess(user, collectionKey, 'delete');
  const canRead = hasCollectionAccess(user, collectionKey, 'read');

  if (!canRead) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h5" color="text.secondary">Access Denied</Typography>
        <Typography variant="body2" color="text.disabled">You don&apos;t have permission to view this collection.</Typography>
      </Box>
    );
  }

  useEffect(() => {
    if (config?.preset?.pageSize) {
      setRowsPerPage(config.preset.pageSize);
    }
  }, [config]);

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
      filters: [],
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

  const statusField = config.fields.find(f => f.type === 'select' || f.name === 'status');
  const dateField = config.fields.find(f => f.type === 'datetime' || f.name === 'date');
  
  const statusOptions = (statusField?.options as any)?.choices || [
    { value: 'draft', label: 'Draft', color: '#6B7280' },
    { value: 'in-progress', label: 'In Progress', color: '#F59E0B' },
    { value: 'review', label: 'Review', color: '#3B82F6' },
    { value: 'done', label: 'Done', color: '#10B981' },
  ];

  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounce(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const hasRelations = config.fields.some(f => f.type === 'relation' && f.relationInfo);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {
        page: String(page + 1),
        limit: String(rowsPerPage),
      };

      if (hasRelations) {
        params.populate = '*';
      }

      // Apply sort
      if (sortField) {
        params.sort = sortOrder === 'desc' ? `-${sortField}` : sortField;
      } else if (config.preset?.sort) {
        const sortPrefix = config.preset.sort.order === 'desc' ? '-' : '';
        params.sort = `${sortPrefix}${config.preset.sort.field}`;
      }

      if (searchDebounce) {
        params.search = searchDebounce;
      }

      if (Object.keys(activeFilters).length > 0) {
        const filterObj: Record<string, any> = {};
        for (const [field, value] of Object.entries(activeFilters)) {
          filterObj[field] = { _contains: value };
        }
        params.filter = JSON.stringify(filterObj);
      }

      const res = await api.get<{ data: any[]; meta: ApiMeta }>(`/items/${collectionKey}`, params);
      setData(res.data || []);
      setMeta(res.meta || { total: 0, page: 1, limit: 25, pages: 0 });
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [collectionKey, page, rowsPerPage, searchDebounce, activeFilters, config.preset?.sort, hasRelations, sortField, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const [editingCell, setEditingCell] = useState<{ id: any, field: string } | null>(null);
  const [editValue, setEditValue] = useState<any>('');

  const handleDoubleClick = (id: any, field: string, value: any, type: string) => {
    if (!canEdit) return;
    if (['string', 'number', 'text', 'integer', 'float'].includes(type)) {
      setEditingCell({ id, field });
      setEditValue(value ?? '');
    }
  };

  const handleSaveEdit = async (id: any, field: string) => {
    try {
      await api.patch(`/items/${collectionKey}/${id}`, { [field]: editValue });
      setData(prev => prev.map(row => row.id === id ? { ...row, [field]: editValue } : row));
      setSnackbar({ open: true, message: 'Updated successfully', severity: 'success' });
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Update failed', severity: 'error' });
    }
    setEditingCell(null);
  };

  const handleDelete = async (id: any) => {
    const ok = await confirm({ title: 'Delete Item', message: 'Are you sure you want to delete this item?', confirmText: 'Delete', severity: 'error' });
    if (!ok) return;
    try {
      await api.del(`/items/${collectionKey}/${id}`);
      setSnackbar({ open: true, message: 'Deleted successfully', severity: 'success' });
      fetchData();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Delete failed', severity: 'error' });
    }
  };

  const handleDuplicate = async (id: any) => {
    const item = data.find(r => r.id === id);
    if (!item) return;
    try {
      const { id: _, date_created: __, date_updated: ___, ...itemData } = item;
      await api.post(`/items/${collectionKey}`, itemData);
      setSnackbar({ open: true, message: 'Item duplicated successfully', severity: 'success' });
      fetchData();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Duplicate failed', severity: 'error' });
    }
  };

  const handleBulkEdit = async (updates: Record<string, unknown>) => {
    try {
      await Promise.all(selectedIds.map(id => api.patch(`/items/${collectionKey}/${id}`, updates)));
      setSnackbar({ open: true, message: `${selectedIds.length} items updated`, severity: 'success' });
      setSelectedIds([]);
      fetchData();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Bulk edit failed', severity: 'error' });
    }
  };

  const handleBulkDelete = async () => {
    const ok = await confirm({ title: 'Delete Multiple Items', message: `Are you sure you want to delete ${selectedIds.length} items?`, confirmText: `Delete ${selectedIds.length} Items`, severity: 'error' });
    if (!ok) return;
    try {
      await Promise.all(selectedIds.map(id => api.del(`/items/${collectionKey}/${id}`)));
      setSnackbar({ open: true, message: `${selectedIds.length} items deleted`, severity: 'success' });
      setSelectedIds([]);
      fetchData();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Bulk delete failed', severity: 'error' });
    }
  };

  const handleExport = () => {
    if (data.length === 0) return;
    const headers = columns.map(c => c.label).join(',');
    const csvRows = data.map(row => {
      return columns.map(col => {
        let val = row[col.name];
        if (val === null || val === undefined) return '';
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
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${collectionKey}_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<{ row: number, message: string }[]>([]);
  const [importing, setImporting] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => parseCSV(event.target?.result as string);
    reader.readAsText(file);
    e.target.value = '';
  };

  const parseCSV = (csvText: string) => {
    const lines = csvText.split('\n').filter(l => l.trim());
    if (lines.length < 2) return;
    const headers = lines[0].split(',').map(h => h.trim());
    const parsedData: any[] = [];
    const errors: { row: number, message: string }[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const rowData: any = {};
      headers.forEach((header, index) => {
        const fieldConfig = config.fields.find(f => f.label === header || f.name === header);
        let val: any = values[index];
        if (fieldConfig) {
          if (fieldConfig.type === 'number') val = Number(val);
          if (fieldConfig.type === 'boolean') val = val === 'true' || val === '1' || val?.toLowerCase() === 'yes';
          rowData[fieldConfig.name] = val;
        } else {
          rowData[header] = val;
        }
      });
      parsedData.push(rowData);
    }
    setImportData(parsedData);
    setImportErrors(errors);
  };

  const finalizeImport = async () => {
    if (importErrors.length > 0 || importData.length === 0) return;
    setImporting(true);
    try {
      let successCount = 0;
      for (const row of importData) {
        const cleanRow = { ...row };
        delete cleanRow.id;
        await api.post(`/items/${collectionKey}`, cleanRow);
        successCount++;
      }
      setSnackbar({ open: true, message: `${successCount} records imported successfully`, severity: 'success' });
      setOpenImportDialog(false);
      setImportData([]);
      setImportErrors([]);
      fetchData();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Import failed', severity: 'error' });
    } finally {
      setImporting(false);
    }
  };

  const handleAddFilter = () => {
    if (filterField && filterValue) {
      setActiveFilters(prev => ({ ...prev, [filterField]: filterValue }));
      setFilterField('');
      setFilterValue('');
      setFilterAnchor(null);
      setPage(0);
    }
  };

  const handleRemoveFilter = (field: string) => {
    setActiveFilters(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setPage(0);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === data.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.map(r => r.id));
    }
  };

  const toggleSelect = (id: string | number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setPage(0);
  };

  const activeFiltersCount = advancedFilters.reduce((sum, g) => sum + g.conditions.length, 0);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', animation: 'fadeIn 300ms ease-out' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Link href="/admin/content" style={{ textDecoration: 'none' }}>
            <Box sx={{
              width: 40, height: 40, borderRadius: '10px', bgcolor: alpha('#8B5CF6', 0.1),
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms ease',
              '&:hover': { bgcolor: alpha('#8B5CF6', 0.15) },
            }}>
              <ArrowLeft size={18} color="#8B5CF6" />
            </Box>
          </Link>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                width: 44, height: 44, borderRadius: '12px', bgcolor: alpha('#8B5CF6', 0.1),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Database size={22} color="#8B5CF6" />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={700}>{config.label}</Typography>
                {!loading && (
                  <Typography variant="body2" color="text.secondary">
                    {meta.total} record{meta.total !== 1 ? 's' : ''} found
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
          {activeBookmark && (
            <Chip icon={<Bookmark size={14} />} label={activeBookmark.name} size="small"
              sx={{ bgcolor: alpha('#8B5CF6', 0.1), color: '#8B5CF6', fontWeight: 600 }} />
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          {canDelete && selectedIds.length > 0 && (
            <>
              <Button variant="outlined" startIcon={<Edit3 size={16} />} onClick={() => setBulkEditOpen(true)} sx={{ borderRadius: '10px' }}>
                Edit ({selectedIds.length})
              </Button>
              <Button variant="outlined" color="error" startIcon={<Trash2 size={16} />} onClick={handleBulkDelete} sx={{ borderRadius: '10px' }}>
                Delete ({selectedIds.length})
              </Button>
            </>
          )}
          <Button variant="outlined" startIcon={<Download size={18} />} onClick={handleExport} sx={{ borderRadius: '10px' }}>
            Export
          </Button>
          {canEdit && (
            <Button variant="outlined" startIcon={<Upload size={18} />} onClick={() => setOpenImportDialog(true)} sx={{ borderRadius: '10px' }}>
              Import
            </Button>
          )}
          <Button variant="outlined" startIcon={<Columns3 size={18} />} onClick={() => setColumnCustomizerOpen(true)} sx={{ borderRadius: '10px' }}>
            Columns
          </Button>
          <Button variant="outlined" startIcon={<Save size={18} />} onClick={() => setOpenSaveDialog(true)} sx={{ borderRadius: '10px' }}>
            Bookmark
          </Button>
          <Button variant="outlined" startIcon={<Filter size={18} />} onClick={() => setAdvancedFilterOpen(true)}
            sx={{ borderRadius: '10px', ...(activeFiltersCount > 0 && { borderColor: 'primary.main', color: 'primary.main' }) }}>
            Filter{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
          </Button>
          <LayoutSelector value={layout} onChange={setLayout} />
          {canEdit && (
            <Link href={`/admin/content/${collectionKey}/new`} passHref style={{ textDecoration: 'none' }}>
              <Button variant="contained" startIcon={<Plus size={18} />} sx={{ borderRadius: '10px' }}>
                Create Item
              </Button>
            </Link>
          )}
        </Box>
      </Box>

      {/* Search */}
      <Paper sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', borderRadius: '16px' }}>
        <TextField
          placeholder="Search across all fields..."
          size="small"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
          sx={{ maxWidth: 400, flexGrow: 1 }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={18} /></InputAdornment> } }}
        />
        {Object.entries(activeFilters).map(([field, value]) => (
          <Chip key={field} label={`${field}: ${value}`} size="small" onDelete={() => handleRemoveFilter(field)}
            sx={{ bgcolor: alpha('#8B5CF6', 0.1), color: '#8B5CF6', fontWeight: 600, borderRadius: '8px' }} />
        ))}
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Layout Switcher */}
      {layout === 'kanban' && statusField && (
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <KanbanBoard collectionKey={collectionKey} statusField={statusField.name} statusOptions={statusOptions} fields={config.fields} onItemUpdate={fetchData} />
        </Box>
      )}

      {layout === 'calendar' && dateField && (
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <CalendarBoard collectionKey={collectionKey} dateField={dateField.name} titleField={'title'} fields={config.fields} onItemUpdate={fetchData} />
        </Box>
      )}

      {layout === 'cards' && (
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <CardsLayout collectionKey={collectionKey} fields={config.fields} canEdit={canEdit} canDelete={canDelete} onItemUpdate={fetchData} />
        </Box>
      )}

      {layout === 'table' && (
        <>
          <TableContainer component={Paper} sx={{ flexGrow: 1, borderRadius: '16px' }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : data.length === 0 ? (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <Box sx={{ width: 72, height: 72, borderRadius: '20px', bgcolor: alpha('#8B5CF6', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
                  <Database size={32} color="#8B5CF6" style={{ opacity: 0.5 }} />
                </Box>
                <Typography variant="h6" fontWeight={700} mb={1}>No records found</Typography>
                <Typography color="text.secondary" mb={3}>Create your first item to get started.</Typography>
                {canEdit && (
                  <Link href={`/admin/content/${collectionKey}/new`} passHref style={{ textDecoration: 'none' }}>
                    <Button variant="contained" startIcon={<Plus size={16} />}>Create First Item</Button>
                  </Link>
                )}
              </Box>
            ) : (
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox checked={selectedIds.length === data.length && data.length > 0}
                        indeterminate={selectedIds.length > 0 && selectedIds.length < data.length} onChange={toggleSelectAll} />
                    </TableCell>
                    {columns.map(col => (
                      <TableCell 
                        key={col.name} 
                        sx={{ fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort(col.name)}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {col.label}
                          {sortField === col.name && (
                            sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                          )}
                        </Box>
                      </TableCell>
                    ))}
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((row) => (
                    <TableRow key={row.id} hover selected={selectedIds.includes(row.id)}>
                      <TableCell padding="checkbox">
                        <Checkbox checked={selectedIds.includes(row.id)} onChange={() => toggleSelect(row.id)} />
                      </TableCell>
                      {columns.map(col => {
                        const isEditing = editingCell?.id === row.id && editingCell?.field === col.name;
                        const cellValue = row[col.name];

                        if (col.type === 'relation' && col.relationInfo) {
                          const relData = row[`${col.name}_data`];
                          const displayField = col.relationInfo.displayField || 'id';
                          return (
                            <TableCell key={col.name}>
                              {relData ? (
                                <Chip label={relData[displayField] || `#${relData.id}`} size="small"
                                  sx={{ fontWeight: 500, bgcolor: alpha('#8B5CF6', 0.1), color: '#8B5CF6' }} />
                              ) : cellValue ? (
                                <Typography variant="body2" color="text.secondary" fontSize={13}>#{cellValue}</Typography>
                              ) : (
                                <Typography variant="body2" color="text.disabled" fontSize={13}>—</Typography>
                              )}
                            </TableCell>
                          );
                        }
                        
                        return (
                          <TableCell key={col.name}
                            onDoubleClick={() => handleDoubleClick(row.id, col.name, cellValue, col.type)}
                            sx={{ cursor: ['string', 'number', 'text', 'integer', 'float'].includes(col.type) ? 'pointer' : 'default' }}>
                            {isEditing ? (
                              <TextField autoFocus size="small" fullWidth variant="standard" value={editValue}
                                onChange={(e) => setEditValue(e.target.value)} onBlur={() => handleSaveEdit(row.id, col.name)}
                                onClick={(e) => e.stopPropagation()} />
                            ) : (
                              cellValue === null || cellValue === undefined ? (
                                <Typography variant="body2" color="text.disabled" fontSize={13}>—</Typography>
                              ) : typeof cellValue === 'boolean' ? (
                                cellValue ? 'Yes' : 'No'
                              ) : typeof cellValue === 'string' && cellValue.length > 80 ? (
                                `${cellValue.slice(0, 80)}...`
                              ) : (
                                String(cellValue)
                              )
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          {canEdit && (
                            <Tooltip title="Duplicate">
                              <IconButton size="small" onClick={() => handleDuplicate(row.id)}>
                                <Copy size={14} />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Link href={`/admin/content/${collectionKey}/${row.id}`} passHref style={{ textDecoration: 'none' }}>
                            <Button size="small" variant="text">{canEdit ? 'Edit' : 'View'}</Button>
                          </Link>
                          {canDelete && (
                            <IconButton size="small" color="error" onClick={() => handleDelete(row.id)}>
                              <Trash2 size={14} />
                            </IconButton>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
          <TablePagination component="div" count={meta.total} page={page} onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[10, 25, 50, 100]} sx={{ borderTop: 1, borderColor: 'divider' }} />
        </>
      )}

      {/* Filter Menu - Simple filter (kept for quick use) */}
      <Menu anchorEl={filterAnchor} open={Boolean(filterAnchor)} onClose={() => setFilterAnchor(null)}>
        <Box sx={{ p: 2, width: 280 }}>
          <Typography variant="subtitle2" fontWeight={700} mb={2}>Add Filter</Typography>
          <TextField select fullWidth size="small" label="Field" value={filterField} onChange={(e) => setFilterField(e.target.value)} sx={{ mb: 2 }}>
            {config.fields.filter(f => f.searchable || ['string', 'number'].includes(f.type)).map(f => (
              <MenuItem key={f.name} value={f.name}>{f.label}</MenuItem>
            ))}
          </TextField>
          <TextField fullWidth size="small" label="Contains" value={filterValue} onChange={(e) => setFilterValue(e.target.value)} sx={{ mb: 2 }} />
          <Button fullWidth variant="contained" size="small" onClick={handleAddFilter} disabled={!filterField || !filterValue}>Apply Filter</Button>
        </Box>
      </Menu>

      {/* Advanced Filter Dialog */}
      <AdvancedFilterDialog
        open={advancedFilterOpen}
        onClose={() => setAdvancedFilterOpen(false)}
        onApply={(filters) => {
          setAdvancedFilters(filters);
          setPage(0);
        }}
        fields={config.fields}
        currentFilters={advancedFilters}
      />

      {/* Bulk Edit Dialog */}
      <BulkEditDialog
        open={bulkEditOpen}
        onClose={() => setBulkEditOpen(false)}
        selectedItems={selectedIds as string[]}
        fields={config.fields}
        onBulkEdit={handleBulkEdit}
      />

      {/* Column Customizer */}
      <ColumnCustomizer
        open={columnCustomizerOpen}
        onClose={() => setColumnCustomizerOpen(false)}
        fields={config.fields}
        currentColumns={columns.map(c => c.name)}
        onApply={(newColumns) => {
          setColumns(config.fields.filter(f => newColumns.includes(f.name)));
        }}
      />

      {/* Bookmark Dialog */}
      <Dialog open={openSaveDialog} onClose={() => setOpenSaveDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Save Bookmark</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Bookmark Name" fullWidth variant="outlined" value={bookmarkName} onChange={(e) => setBookmarkName(e.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenSaveDialog(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSaveBookmark} variant="contained" disabled={!bookmarkName.trim()}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={openImportDialog} onClose={() => setOpenImportDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Import Data</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography mb={2}>Upload a CSV file to import records into <strong>{config.label}</strong>.</Typography>
            <Button variant="outlined" component="label" startIcon={<Upload size={18} />}>
              Select CSV File
              <input type="file" accept=".csv" hidden onChange={handleFileUpload} />
            </Button>
            
            {importData.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" mb={2}>Preview ({importData.length} rows)</Typography>
                <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        {Object.keys(importData[0]).map(key => <TableCell key={key}>{key}</TableCell>)}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {importData.slice(0, 5).map((row, i) => (
                        <TableRow key={i}>
                          {Object.values(row).map((val: any, j) => <TableCell key={j}>{String(val)}</TableCell>)}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {importErrors.length > 0 && (
                  <Alert severity="error" sx={{ mt: 2 }}>Validation errors found. Please fix them before importing.</Alert>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenImportDialog(false)} color="inherit">Cancel</Button>
          <Button onClick={finalizeImport} variant="contained" disabled={importData.length === 0 || importErrors.length > 0 || importing}>
            {importing ? 'Importing...' : `Import ${importData.length} Records`}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
