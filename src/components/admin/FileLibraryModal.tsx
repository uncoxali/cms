"use client";

import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Divider from '@mui/material/Divider';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import { alpha } from '@mui/material/styles';
import { useFilesStore, FileItem } from '@/store/files';
import {
  Search, Upload, Grid3X3, List as ListIcon,
  Image as ImageIcon, Video, FileText, Music, Archive, File,
  FolderOpen, X, Check
} from 'lucide-react';

interface FileLibraryModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (file: FileItem) => void;
  mode?: 'single' | 'multiple';
  allowedTypes?: ('image' | 'video' | 'audio' | 'document' | 'archive' | 'all' | 'other')[];
  title?: string;
}

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
  { value: 'all', label: 'All' },
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Videos' },
  { value: 'document', label: 'Documents' },
];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(2)} GB`;
}

export function FileLibraryModal({
  open,
  onClose,
  onSelect,
  mode = 'single',
  allowedTypes = ['all'],
  title = 'Select File'
}: FileLibraryModalProps) {
  const { files, fetchFiles, uploadFile, loading } = useFilesStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadingProgress, setUploadingProgress] = useState(false);

  useEffect(() => {
    if (open) {
      fetchFiles();
      setSelectedFile(null);
      setSelectedIds([]);
    }
  }, [open, fetchFiles]);

  const filteredFiles = files.filter(f => {
    const q = search.toLowerCase();
    const matchSearch = !q || f.name.toLowerCase().includes(q);
    const matchType = typeFilter === 'all' || f.type === typeFilter;
    const matchAllowed = allowedTypes.includes('all') || allowedTypes.includes(f.type);
    return matchSearch && matchType && matchAllowed;
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setUploading(true);
    setUploadingProgress(true);

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const formData = new FormData();
      formData.append('file', file);

      try {
        await uploadFile(formData);
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }

    setUploading(false);
    setUploadingProgress(false);
    e.target.value = '';
  };

  const handleConfirm = () => {
    if (mode === 'single' && selectedFile) {
      onSelect(selectedFile);
      onClose();
    } else if (mode === 'multiple' && selectedIds.length > 0) {
      const selectedFiles = files.filter(f => selectedIds.includes(f.id));
      selectedFiles.forEach(f => onSelect(f));
      onClose();
    }
  };

  const toggleSelect = (file: FileItem) => {
    if (mode === 'single') {
      setSelectedFile(prev => prev?.id === file.id ? null : file);
    } else {
      setSelectedIds(prev => prev.includes(file.id) ? prev.filter(id => id !== file.id) : [...prev, file.id]);
    }
  };

  const isSelected = (file: FileItem) => {
    if (mode === 'single') return selectedFile?.id === file.id;
    return selectedIds.includes(file.id);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{
      sx: { height: '85vh', maxHeight: 800 }
    }}>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        onChange={handleUpload}
        accept={allowedTypes.includes('all') ? '*/*' : allowedTypes.map(t => {
          if (t === 'image') return 'image/*';
          if (t === 'video') return 'video/*';
          if (t === 'audio') return 'audio/*';
          if (t === 'document') return '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv';
          return '*/*';
        }).join(',')}
      />

      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: alpha('#8B5CF6', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FolderOpen size={18} color="#8B5CF6" />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>{title}</Typography>
            <Typography variant="caption" color="text.secondary">
              {mode === 'single' ? 'Choose a file' : `${selectedIds.length} selected`}
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose}><X size={18} /></IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ px: 3, py: 2, display: 'flex', gap: 2, alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
          <TextField
            size="small"
            placeholder="Search files..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ width: 260 }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment> } }}
          />
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {FILTER_TABS.map(tab => (
              <Chip
                key={tab.value}
                label={tab.label}
                size="small"
                clickable
                onClick={() => setTypeFilter(tab.value)}
                sx={{
                  fontWeight: typeFilter === tab.value ? 700 : 400,
                  bgcolor: typeFilter === tab.value ? `${'#8B5CF6'}15` : 'transparent',
                  border: '1px solid',
                  borderColor: typeFilter === tab.value ? '#8B5CF6' : 'divider',
                }}
              />
            ))}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
            <ToggleButtonGroup value={viewMode} exclusive onChange={(_, v) => v && setViewMode(v)} size="small">
              <ToggleButton value="grid" sx={{ px: 1 }}><Grid3X3 size={16} /></ToggleButton>
              <ToggleButton value="list" sx={{ px: 1 }}><ListIcon size={16} /></ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <Button
            variant="contained"
            startIcon={uploading ? <CircularProgress size={14} color="inherit" /> : <Upload size={16} />}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            size="small"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </Box>

        {uploadingProgress && <LinearProgress />}

        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
          {loading && files.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : filteredFiles.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <File size={48} style={{ opacity: 0.15, marginBottom: 16 }} />
              <Typography color="text.secondary" mb={2}>No files found</Typography>
              <Button variant="outlined" startIcon={<Upload size={16} />} onClick={() => fileInputRef.current?.click()}>
                Upload Your First File
              </Button>
            </Box>
          ) : viewMode === 'grid' ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 1.5 }}>
              {filteredFiles.map(file => {
                const Icon = TYPE_ICON[file.type] || File;
                const color = TYPE_COLOR[file.type] || '#6B7280';
                const selected = isSelected(file);
                return (
                  <Paper
                    key={file.id}
                    onClick={() => toggleSelect(file)}
                    sx={{
                      cursor: 'pointer',
                      overflow: 'hidden',
                      transition: 'all 150ms ease',
                      border: selected ? `2px solid #8B5CF6` : 1,
                      borderColor: selected ? '#8B5CF6' : 'divider',
                      bgcolor: selected ? alpha('#8B5CF6', 0.05) : 'background.paper',
                      '&:hover': { borderColor: '#8B5CF6', transform: 'translateY(-1px)' },
                    }}
                  >
                    <Box sx={{
                      height: 100, bgcolor: `${color}08`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'relative', overflow: 'hidden',
                    }}>
                      {file.type === 'image' && file.url ? (
                        <Box component="img" src={file.url} alt={file.name} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Icon size={32} color={color} style={{ opacity: 0.6 }} />
                      )}
                      {selected && (
                        <Box sx={{
                          position: 'absolute', top: 6, right: 6,
                          width: 22, height: 22, borderRadius: '50%',
                          bgcolor: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <Check size={14} color="white" />
                        </Box>
                      )}
                    </Box>
                    <Box sx={{ p: 1 }}>
                      <Typography variant="body2" fontWeight={500} noWrap fontSize={12}>{file.name}</Typography>
                      <Typography variant="caption" color="text.secondary" fontSize={10}>{formatSize(file.size)}</Typography>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {filteredFiles.map(file => {
                const Icon = TYPE_ICON[file.type] || File;
                const color = TYPE_COLOR[file.type] || '#6B7280';
                const selected = isSelected(file);
                return (
                  <Box
                    key={file.id}
                    onClick={() => toggleSelect(file)}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 1,
                      borderRadius: '8px', cursor: 'pointer',
                      bgcolor: selected ? alpha('#8B5CF6', 0.08) : 'transparent',
                      border: selected ? `1px solid ${alpha('#8B5CF6', 0.3)}` : '1px solid transparent',
                      '&:hover': { bgcolor: alpha('#8B5CF6', 0.04) },
                    }}
                  >
                    <Checkbox size="small" checked={selected} sx={{ p: 0.5 }} />
                    {file.type === 'image' && file.url ? (
                      <Box component="img" src={file.url} alt={file.name} sx={{ width: 36, height: 36, borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <Box sx={{ width: 36, height: 36, borderRadius: '6px', bgcolor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={18} color={color} />
                      </Box>
                    )}
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={500} noWrap>{file.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{formatSize(file.size)}</Typography>
                    </Box>
                    <Chip label={file.type} size="small" sx={{ fontSize: 10, height: 20, bgcolor: `${color}15`, color }} />
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {mode === 'single' && selectedFile && (
            <Chip
              label={selectedFile.name}
              size="small"
              onDelete={() => setSelectedFile(null)}
              sx={{ maxWidth: 200 }}
            />
          )}
          {mode === 'multiple' && selectedIds.length > 0 && (
            <Chip label={`${selectedIds.length} selected`} size="small" />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button onClick={onClose} variant="outlined">Cancel</Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            disabled={mode === 'single' ? !selectedFile : selectedIds.length === 0}
          >
            {mode === 'single' ? 'Select' : `Select ${selectedIds.length} Files`}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}

import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
