"use client";

import { useState, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import { alpha } from '@mui/material/styles';
import { FileItem, useFilesStore } from '@/store/files';
import { FileLibraryModal } from './FileLibraryModal';
import {
  Upload, X, Image as ImageIcon, Video, FileText, Music, Archive, File,
  FolderOpen, ExternalLink, Check, GripVertical
} from 'lucide-react';

interface MediaItemFieldProps {
  value: FileItem | FileItem[] | string | null;
  onChange: (value: FileItem | FileItem[] | null) => void;
  label: string;
  disabled?: boolean;
  mode?: 'single' | 'multiple';
  allowedTypes?: ('image' | 'video' | 'audio' | 'document' | 'archive' | 'all' | 'other')[];
  description?: string;
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

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(2)} GB`;
}

export function MediaItemField({
  value,
  onChange,
  label,
  disabled = false,
  mode = 'single',
  allowedTypes = ['all'],
  description,
}: MediaItemFieldProps) {
  const { files, uploadFile } = useFilesStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getSelectedFiles = (): FileItem[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      const file = files.find(f => f.id === value);
      return file ? [file] : [];
    }
    return [value];
  };

  const selectedFiles = getSelectedFiles();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setUploading(true);

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
    e.target.value = '';
  };

  const handleSelectFromLibrary = (file: FileItem) => {
    if (mode === 'single') {
      onChange(file);
    } else {
      if (!selectedFiles.find(f => f.id === file.id)) {
        onChange([...selectedFiles, file]);
      }
    }
  };

  const handleRemove = (fileId: string) => {
    if (mode === 'single') {
      onChange(null);
    } else {
      onChange(selectedFiles.filter(f => f.id !== fileId));
    }
  };

  const handleClearAll = () => {
    onChange(mode === 'single' ? null : []);
  };

  const renderFilePreview = (file: FileItem, index?: number) => {
    const Icon = TYPE_ICON[file.type] || File;
    const color = TYPE_COLOR[file.type] || '#6B7280';

    return (
      <Paper
        key={file.id}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '12px',
          transition: 'all 150ms ease',
          '&:hover': {
            borderColor: alpha(color, 0.5),
            '& .overlay': { opacity: 1 },
          },
        }}
      >
        <Box sx={{
          height: mode === 'single' ? 200 : 120,
          bgcolor: `${color}08`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          {file.type === 'image' && file.url ? (
            <Box component="img" src={file.url} alt={file.name} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Icon size={mode === 'single' ? 48 : 32} color={color} style={{ opacity: 0.6 }} />
          )}

          {!disabled && (
            <Box className="overlay" sx={{
              position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
              opacity: 0, transition: 'opacity 150ms ease',
            }}>
              <IconButton size="small" sx={{ bgcolor: 'rgba(255,255,255,0.9)' }} onClick={() => setModalOpen(true)}>
                <FolderOpen size={16} />
              </IconButton>
              <IconButton size="small" sx={{ bgcolor: 'rgba(255,255,255,0.9)' }} onClick={() => handleRemove(file.id)}>
                <X size={16} />
              </IconButton>
            </Box>
          )}
        </Box>

        <Box sx={{ p: 1.5 }}>
          <Typography variant="body2" fontWeight={600} noWrap>{file.name}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Chip label={file.type} size="small" sx={{ fontSize: 10, height: 18, bgcolor: `${color}15`, color }} />
            <Typography variant="caption" color="text.secondary">{formatSize(file.size)}</Typography>
          </Box>
          {file.width && file.height && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
              {file.width} × {file.height}
            </Typography>
          )}
        </Box>

        {mode === 'multiple' && index !== undefined && (
          <Box sx={{
            position: 'absolute', top: 8, left: 8,
            width: 22, height: 22, borderRadius: '50%',
            bgcolor: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 12, fontWeight: 700,
          }}>
            {index + 1}
          </Box>
        )}
      </Paper>
    );
  };

  const renderEmptyState = () => (
    <Paper
      onClick={() => !disabled && setModalOpen(true)}
      sx={{
        border: '2px dashed',
        borderColor: 'divider',
        borderRadius: '12px',
        p: 4,
        textAlign: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 150ms ease',
        '&:hover': !disabled ? {
          borderColor: '#8B5CF6',
          bgcolor: alpha('#8B5CF6', 0.02),
        } : {},
      }}
    >
      <Box sx={{
        width: 56, height: 56, borderRadius: '16px',
        bgcolor: alpha('#8B5CF6', 0.1), mx: 'auto', mb: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Upload size={24} color="#8B5CF6" />
      </Box>
      <Typography variant="body1" fontWeight={600} mb={0.5}>
        {mode === 'single' ? 'Choose File' : 'Add Files'}
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        {mode === 'single' ? 'Select from library or upload new' : 'Select from library or upload new'}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<FolderOpen size={14} />}
          onClick={(e) => { e.stopPropagation(); setModalOpen(true); }}
        >
          Browse
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={uploading ? <CircularProgress size={14} /> : <Upload size={14} />}
          onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
          disabled={uploading || disabled}
        >
          Upload
        </Button>
      </Box>
    </Paper>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box>
          <Typography variant="body2" fontWeight={600}>{label}</Typography>
          {description && (
            <Typography variant="caption" color="text.secondary">{description}</Typography>
          )}
        </Box>
        {mode === 'multiple' && selectedFiles.length > 0 && (
          <Button size="small" color="error" onClick={handleClearAll}>
            Clear All
          </Button>
        )}
      </Box>

      <input
        ref={fileInputRef}
        type="file"
        multiple={mode === 'multiple'}
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

      {selectedFiles.length === 0 ? (
        renderEmptyState()
      ) : mode === 'single' ? (
        <Box sx={{ position: 'relative' }}>
          {renderFilePreview(selectedFiles[0])}
          {!disabled && (
            <IconButton
              size="small"
              onClick={() => setModalOpen(true)}
              sx={{
                position: 'absolute', top: 8, right: 8,
                bgcolor: 'background.paper', boxShadow: 1,
                '&:hover': { bgcolor: 'background.paper' },
              }}
            >
              <FolderOpen size={16} />
            </IconButton>
          )}
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 2 }}>
          {selectedFiles.map((file, index) => renderFilePreview(file, index))}
          {!disabled && (
            <Paper
              onClick={() => setModalOpen(true)}
              sx={{
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: '12px',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                minHeight: 160, cursor: 'pointer',
                transition: 'all 150ms ease',
                '&:hover': { borderColor: '#8B5CF6', bgcolor: alpha('#8B5CF6', 0.02) },
              }}
            >
              <Upload size={24} color="#8B5CF6" style={{ opacity: 0.6 }} />
              <Typography variant="caption" color="text.secondary" mt={1}>Add More</Typography>
            </Paper>
          )}
        </Box>
      )}

      <FileLibraryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={handleSelectFromLibrary}
        mode={mode}
        allowedTypes={allowedTypes}
        title={mode === 'single' ? 'Choose File' : 'Select Files'}
      />
    </Box>
  );
}
