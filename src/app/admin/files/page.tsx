"use client";

import { useState, useEffect, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import { useFilesStore, FileItem } from '@/store/files';
import { useActivityStore } from '@/store/activity';
import { useNotificationsStore } from '@/store/notifications';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import { useAuthStore } from '@/store/auth';
import {
  Search, Upload, Grid3X3, List as ListIcon, Star, StarOff,
  Image as ImageIcon, Video, FileText, Music, Archive, File,
  FolderOpen, Trash2, Download, Info, X, Clock, User, Tag, HardDrive
} from 'lucide-react';

const TYPE_ICON: Record<string, any> = {
  image: ImageIcon,
  video: Video,
  document: FileText,
  audio: Music,
  archive: Archive,
  other: File,
};

const TYPE_COLOR: Record<string, string> = {
  image: '#3B82F6',
  video: '#EF4444',
  document: '#22C55E',
  audio: '#F59E0B',
  archive: '#8B5CF6',
  other: '#6B7280',
};

const FILTER_TABS = [
  { value: 'all', label: 'All Files' },
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Videos' },
  { value: 'document', label: 'Documents' },
  { value: 'audio', label: 'Audio' },
  { value: 'favorites', label: '★ Favorites' },
];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(2)} GB`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function FilesPage() {
  const theme = useTheme();
  const { files, folders, fetchFiles, uploadFile, deleteFileApi, toggleFavoriteApi, loading: storeLoading } = useFilesStore();
  const { addLog } = useActivityStore();
  const { addNotification } = useNotificationsStore();
  const role = useAuthStore((s) => s.role);
  const canEdit = role === 'admin' || role === 'editor';
  const confirm = useConfirm();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const filteredFiles = files.filter(f => {
    const q = search.toLowerCase();
    const matchSearch = !q || f.name.toLowerCase().includes(q) || f.tags.some(t => t.toLowerCase().includes(q));
    const matchType = typeFilter === 'all' || (typeFilter === 'favorites' ? f.isFavorite : f.type === typeFilter);
    return matchSearch && matchType;
  });

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  const handleDelete = async (id: string) => {
    const file = files.find(f => f.id === id);
    const ok = await confirm({ title: 'Delete File', message: `Are you sure you want to delete "${file?.name}"? This action cannot be undone.`, confirmText: 'Delete', severity: 'error' });
    if (!ok) return;
    try {
      await deleteFileApi(id);
      setSelectedFile(null);
      addNotification({ title: 'File Deleted', message: `${file?.name} has been removed.` });
      setSnackbar({ open: true, message: 'File deleted successfully', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to delete file', severity: 'error' });
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setUploading(true);
    let successCount = 0;

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const formData = new FormData();
      formData.append('file', file);

      try {
        await uploadFile(formData);
        successCount++;
        addNotification({ title: 'File Uploaded', message: `${file.name} uploaded successfully.` });
      } catch {
        setSnackbar({ open: true, message: `Failed to upload ${file.name}`, severity: 'error' });
      }
    }

    if (successCount > 0) {
      setSnackbar({ open: true, message: `${successCount} file${successCount > 1 ? 's' : ''} uploaded successfully`, severity: 'success' });
    }
    setUploading(false);
    e.target.value = '';
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      await toggleFavoriteApi(id);
      if (selectedFile?.id === id) {
        setSelectedFile(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
      }
    } catch {
      setSnackbar({ open: true, message: 'Failed to update favorite', severity: 'error' });
    }
  };

  const handleBulkDelete = async () => {
    const ok = await confirm({ title: 'Delete Multiple Files', message: `Are you sure you want to delete ${selectedIds.length} files? This action cannot be undone.`, confirmText: `Delete ${selectedIds.length} Files`, severity: 'error' });
    if (!ok) return;
    try {
      for (const id of selectedIds) {
        await deleteFileApi(id);
      }
      setSnackbar({ open: true, message: `${selectedIds.length} files deleted`, severity: 'success' });
      setSelectedIds([]);
    } catch {
      setSnackbar({ open: true, message: 'Bulk delete failed', severity: 'error' });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 120px)', gap: 0 }}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        onChange={handleUpload}
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z,.txt,.csv"
      />

      {/* Folder Sidebar */}
      <Box sx={{
        width: 220, flexShrink: 0,
        borderRight: 1, borderColor: 'divider',
        display: 'flex', flexDirection: 'column',
        mr: 3,
      }}>
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <FolderOpen size={16} style={{ opacity: 0.5 }} />
          <Typography variant="subtitle2" fontWeight={700} fontSize={12} letterSpacing="0.05em" textTransform="uppercase" color="text.secondary">
            Folders
          </Typography>
        </Box>
        <List sx={{ px: 0.5 }}>
          {folders.map(folder => (
            <ListItemButton key={folder.id} sx={{
              borderRadius: '8px', py: 0.75, mb: 0.25,
              pl: folder.parent && folder.parent !== 'root' ? 4 : folder.parent === 'root' ? 2.5 : 1.5,
            }}>
              <ListItemIcon sx={{ minWidth: 28 }}><FolderOpen size={15} style={{ opacity: 0.5 }} /></ListItemIcon>
              <ListItemText primary={folder.name} slotProps={{ primary: { fontSize: 13, fontWeight: 400 } }} />
            </ListItemButton>
          ))}
        </List>

        <Box sx={{ mt: 'auto', p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">Storage</Typography>
            <Typography variant="caption" fontWeight={600}>{formatSize(totalSize)}</Typography>
          </Box>
          <Box sx={{ width: '100%', height: 4, borderRadius: 2, bgcolor: 'action.hover' }}>
            <Box sx={{ width: `${Math.min((totalSize / 10737418240) * 100, 100)}%`, height: '100%', borderRadius: 2, bgcolor: 'primary.main' }} />
          </Box>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em">File Library</Typography>
            <Typography variant="body2" color="text.secondary">{files.length} files • {formatSize(totalSize)} total</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            {canEdit && selectedIds.length > 0 && (
              <Button variant="outlined" color="error" startIcon={<Trash2 size={16} />} onClick={handleBulkDelete}>
                Delete ({selectedIds.length})
              </Button>
            )}
            {canEdit && (
              <Button
                variant="contained"
                startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <Upload size={16} />}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            )}
          </Box>
        </Box>

        {uploading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

        {/* Toolbar */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search files..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ width: 280 }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment> } }}
          />
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {FILTER_TABS.map(tab => (
              <Chip
                key={tab.value}
                label={tab.label}
                size="small"
                clickable
                onClick={() => setTypeFilter(tab.value)}
                sx={{
                  fontWeight: typeFilter === tab.value ? 700 : 400,
                  bgcolor: typeFilter === tab.value ? `${theme.palette.primary.main}12` : 'transparent',
                  color: typeFilter === tab.value ? 'primary.light' : 'text.secondary',
                  border: '1px solid',
                  borderColor: typeFilter === tab.value ? `${theme.palette.primary.main}40` : theme.palette.divider,
                }}
              />
            ))}
          </Box>
          <Box sx={{ ml: 'auto' }}>
            <ToggleButtonGroup value={viewMode} exclusive onChange={(_, v) => v && setViewMode(v)} size="small">
              <ToggleButton value="grid" sx={{ px: 1 }}><Grid3X3 size={16} /></ToggleButton>
              <ToggleButton value="list" sx={{ px: 1 }}><ListIcon size={16} /></ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {/* File Content */}
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          {storeLoading && files.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : filteredFiles.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <File size={48} style={{ opacity: 0.15, marginBottom: 16 }} />
              <Typography color="text.secondary" mb={2}>No files found.</Typography>
              {canEdit && (
                <Button variant="contained" startIcon={<Upload size={16} />} onClick={() => fileInputRef.current?.click()}>
                  Upload Your First File
                </Button>
              )}
            </Box>
          ) : viewMode === 'grid' ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 2 }}>
              {filteredFiles.map(file => {
                const Icon = TYPE_ICON[file.type] || File;
                const color = TYPE_COLOR[file.type] || '#6B7280';
                return (
                  <Paper
                    key={file.id}
                    onClick={() => setSelectedFile(file)}
                    sx={{
                      cursor: 'pointer',
                      overflow: 'hidden',
                      transition: 'all 200ms ease',
                      border: selectedFile?.id === file.id ? `1px solid ${color}` : 1,
                      borderColor: selectedFile?.id === file.id ? color : 'divider',
                      '&:hover': { transform: 'translateY(-2px)', borderColor: `${color}40` },
                    }}
                  >
                    <Box sx={{
                      height: 120, bgcolor: `${color}08`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                    }}>
                      {file.type === 'image' && file.url ? (
                        <Box
                          component="img"
                          src={file.url}
                          alt={file.name}
                          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <Icon size={36} color={color} style={{ opacity: 0.6 }} />
                      )}
                      <Box sx={{ position: 'absolute', top: 6, left: 6 }}>
                        <Checkbox
                          size="small"
                          checked={selectedIds.includes(file.id)}
                          onChange={() => toggleSelect(file.id)}
                          onClick={e => e.stopPropagation()}
                          sx={{ p: 0.25, bgcolor: 'rgba(0,0,0,0.3)', borderRadius: '4px' }}
                        />
                      </Box>
                      {file.isFavorite && (
                        <Star size={14} fill={theme.palette.warning.main} color={theme.palette.warning.main} style={{ position: 'absolute', top: 8, right: 8 }} />
                      )}
                    </Box>
                    <Box sx={{ p: 1.5 }}>
                      <Typography variant="body2" fontWeight={500} noWrap fontSize={13}>{file.name}</Typography>
                      <Typography variant="caption" color="text.secondary" fontSize={11}>{formatSize(file.size)}</Typography>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox"><Checkbox size="small" /></TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell>Modified</TableCell>
                    <TableCell>Uploaded By</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredFiles.map(file => {
                    const Icon = TYPE_ICON[file.type] || File;
                    const color = TYPE_COLOR[file.type] || '#6B7280';
                    return (
                      <TableRow key={file.id} hover onClick={() => setSelectedFile(file)} sx={{ cursor: 'pointer' }}>
                        <TableCell padding="checkbox">
                          <Checkbox size="small" checked={selectedIds.includes(file.id)} onChange={() => toggleSelect(file.id)} onClick={e => e.stopPropagation()} />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            {file.type === 'image' && file.url ? (
                              <Box
                                component="img"
                                src={file.url}
                                alt={file.name}
                                sx={{ width: 28, height: 28, borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }}
                              />
                            ) : (
                              <Icon size={16} color={color} />
                            )}
                            <Typography variant="body2" fontWeight={500}>{file.name}</Typography>
                            {file.isFavorite && <Star size={12} fill={theme.palette.warning.main} color={theme.palette.warning.main} />}
                          </Box>
                        </TableCell>
                        <TableCell><Chip label={file.type} size="small" sx={{ bgcolor: `${color}15`, color, fontWeight: 600, fontSize: 11 }} /></TableCell>
                        <TableCell>{formatSize(file.size)}</TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{timeAgo(file.modifiedOn)}</Typography></TableCell>
                        <TableCell>{file.uploadedBy}</TableCell>
                        <TableCell align="right">
                          {canEdit && (
                            <>
                              <IconButton size="small" onClick={e => { e.stopPropagation(); handleToggleFavorite(file.id); }}>
                                {file.isFavorite ? <Star size={14} fill={theme.palette.warning.main} color={theme.palette.warning.main} /> : <StarOff size={14} />}
                              </IconButton>
                              <IconButton size="small" color="error" onClick={e => { e.stopPropagation(); handleDelete(file.id); }}>
                                <Trash2 size={14} />
                              </IconButton>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Box>

      {/* File Detail Drawer */}
      <Drawer anchor="right" open={!!selectedFile} onClose={() => setSelectedFile(null)}>
        {selectedFile && (() => {
          const Icon = TYPE_ICON[selectedFile.type] || File;
          const color = TYPE_COLOR[selectedFile.type] || '#6B7280';
          return (
            <Box sx={{ width: 380, p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="subtitle1" fontWeight={700}>File Details</Typography>
                <IconButton size="small" onClick={() => setSelectedFile(null)}><X size={18} /></IconButton>
              </Box>

              <Box sx={{
                height: 200, bgcolor: `${color}08`, borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                mb: 3, border: 1, borderColor: 'divider',
                overflow: 'hidden',
              }}>
                {selectedFile.type === 'image' && selectedFile.url ? (
                  <Box
                    component="img"
                    src={selectedFile.url}
                    alt={selectedFile.name}
                    sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <Icon size={56} color={color} style={{ opacity: 0.5 }} />
                )}
              </Box>

              <Typography variant="h6" fontWeight={700} mb={0.5} sx={{ wordBreak: 'break-all' }}>
                {selectedFile.name}
              </Typography>
              <Chip label={selectedFile.type} size="small" sx={{ alignSelf: 'flex-start', mb: 3, bgcolor: `${color}15`, color, fontWeight: 600 }} />

              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1 }}>
                {[
                  { icon: HardDrive, label: 'Size', value: formatSize(selectedFile.size) },
                  { icon: FileText, label: 'MIME Type', value: selectedFile.mimeType },
                  ...(selectedFile.width ? [{ icon: Info, label: 'Dimensions', value: `${selectedFile.width} × ${selectedFile.height}` }] : []),
                  { icon: User, label: 'Uploaded by', value: selectedFile.uploadedBy },
                  { icon: Clock, label: 'Uploaded', value: new Date(selectedFile.uploadedOn).toLocaleDateString() },
                  { icon: Clock, label: 'Modified', value: timeAgo(selectedFile.modifiedOn) },
                  { icon: FolderOpen, label: 'Folder', value: selectedFile.folder },
                ].map(item => (
                  <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <item.icon size={14} style={{ opacity: 0.4 }} />
                      <Typography variant="body2" color="text.secondary" fontSize={13}>{item.label}</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={500} fontSize={13}>{item.value}</Typography>
                  </Box>
                ))}

                {selectedFile.tags.length > 0 && (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Tag size={14} style={{ opacity: 0.4 }} />
                      <Typography variant="body2" color="text.secondary" fontSize={13}>Tags</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {selectedFile.tags.map(tag => (
                        <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>

              {canEdit && (
                <Box sx={{ display: 'flex', gap: 1, mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Button variant="outlined" fullWidth startIcon={selectedFile.isFavorite ? <Star size={14} /> : <StarOff size={14} />}
                    onClick={() => handleToggleFavorite(selectedFile.id)} size="small">
                    {selectedFile.isFavorite ? 'Unfavorite' : 'Favorite'}
                  </Button>
                  <Button variant="outlined" color="error" fullWidth startIcon={<Trash2 size={14} />}
                    onClick={() => handleDelete(selectedFile.id)} size="small">
                    Delete
                  </Button>
                </Box>
              )}
            </Box>
          );
        })()}
      </Drawer>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
