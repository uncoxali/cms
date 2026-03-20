'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Slider from '@mui/material/Slider';
import { alpha } from '@mui/material/styles';
import { useNotificationsStore } from '@/store/notifications';
import { useActivityStore } from '@/store/activity';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import {
  Image,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Crop,
  Maximize,
  RotateCw,
  Sun,
  Palette,
  Grid3X3,
  Eye,
  Download,
  RefreshCw,
  Settings2,
  Zap,
} from 'lucide-react';

interface Transformation {
  id: string;
  name: string;
  key: string;
  fit: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  width?: number;
  height?: number;
  quality: number;
  format: 'original' | 'webp' | 'jpeg' | 'png' | 'avif';
  withoutEnlargement: boolean;
  grayscale: boolean;
  blur: number;
  rotate: number;
  flip: boolean;
  flop: boolean;
  tint: string;
  active: boolean;
  createdAt: string;
}

const MOCK_TRANSFORMATIONS: Transformation[] = [
  {
    id: '1',
    name: 'Thumbnail',
    key: 'thumbnail',
    fit: 'cover',
    width: 200,
    height: 200,
    quality: 80,
    format: 'webp',
    withoutEnlargement: true,
    grayscale: false,
    blur: 0,
    rotate: 0,
    flip: false,
    flop: false,
    tint: '',
    active: true,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    name: 'Medium',
    key: 'medium',
    fit: 'inside',
    width: 800,
    height: 600,
    quality: 85,
    format: 'webp',
    withoutEnlargement: false,
    grayscale: false,
    blur: 0,
    rotate: 0,
    flip: false,
    flop: false,
    tint: '',
    active: true,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '3',
    name: 'Large',
    key: 'large',
    fit: 'inside',
    width: 1920,
    height: 1080,
    quality: 90,
    format: 'webp',
    withoutEnlargement: false,
    grayscale: false,
    blur: 0,
    rotate: 0,
    flip: false,
    flop: false,
    tint: '',
    active: true,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '4',
    name: 'Social Square',
    key: 'social-square',
    fit: 'cover',
    width: 1080,
    height: 1080,
    quality: 95,
    format: 'jpeg',
    withoutEnlargement: true,
    grayscale: false,
    blur: 0,
    rotate: 0,
    flip: false,
    flop: false,
    tint: '',
    active: true,
    createdAt: '2024-02-01T10:00:00Z',
  },
  {
    id: '5',
    name: 'Grayscale Preview',
    key: 'grayscale',
    fit: 'contain',
    width: 600,
    height: 400,
    quality: 70,
    format: 'png',
    withoutEnlargement: true,
    grayscale: true,
    blur: 0,
    rotate: 0,
    flip: false,
    flop: false,
    tint: '',
    active: false,
    createdAt: '2024-02-15T10:00:00Z',
  },
];

const FIT_OPTIONS = [
  { value: 'cover', label: 'Cover', description: 'Crop to cover (exact dimensions)' },
  { value: 'contain', label: 'Contain', description: 'Fit inside, preserve aspect ratio' },
  { value: 'fill', label: 'Fill', description: 'Stretch to fill (may distort)' },
  { value: 'inside', label: 'Inside', description: 'Resize to fit inside' },
  { value: 'outside', label: 'Outside', description: 'Resize to cover outside' },
];

const FORMAT_OPTIONS = [
  { value: 'original', label: 'Original', description: 'Keep original format' },
  { value: 'webp', label: 'WebP', description: 'Modern format, best compression' },
  { value: 'jpeg', label: 'JPEG', description: 'Universal format' },
  { value: 'png', label: 'PNG', description: 'Lossless, supports transparency' },
  { value: 'avif', label: 'AVIF', description: 'Latest format, best compression' },
];

export default function FileStoragePage() {
  const { addNotification } = useNotificationsStore();
  const { addLog } = useActivityStore();
  const confirm = useConfirm();

  const [transformations, setTransformations] = useState<Transformation[]>(MOCK_TRANSFORMATIONS);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTransform, setEditTransform] = useState<Transformation | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTransform, setPreviewTransform] = useState<Transformation | null>(null);
  const [globalSettings, setGlobalSettings] = useState({
    defaultQuality: 85,
    defaultFormat: 'webp' as Transformation['format'],
    preserveOriginal: true,
    cacheMaxAge: 31536000,
  });

  const [formData, setFormData] = useState<Partial<Transformation>>({
    name: '',
    key: '',
    fit: 'cover',
    width: 800,
    height: 600,
    quality: 85,
    format: 'webp',
    withoutEnlargement: true,
    grayscale: false,
    blur: 0,
    rotate: 0,
    flip: false,
    flop: false,
    tint: '',
    active: true,
  });

  const handleOpenCreate = () => {
    setEditTransform(null);
    setFormData({
      name: '',
      key: '',
      fit: 'cover',
      width: 800,
      height: 600,
      quality: 85,
      format: 'webp',
      withoutEnlargement: true,
      grayscale: false,
      blur: 0,
      rotate: 0,
      flip: false,
      flop: false,
      tint: '',
      active: true,
    });
    setCreateOpen(true);
  };

  const handleOpenEdit = (transform: Transformation) => {
    setEditTransform(transform);
    setFormData({ ...transform });
    setCreateOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.key) {
      addNotification({ title: 'Error', message: 'Name and key are required.' });
      return;
    }

    if (editTransform) {
      setTransformations(prev => prev.map(t => 
        t.id === editTransform.id ? { ...t, ...formData } as Transformation : t
      ));
      addNotification({ title: 'Transformation Updated', message: `"${formData.name}" has been updated.` });
    } else {
      const newTransform: Transformation = {
        ...formData as Transformation,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      setTransformations(prev => [...prev, newTransform]);
      addNotification({ title: 'Transformation Created', message: `"${formData.name}" has been created.` });
      addLog({ action: 'create', collection: 'file_transformations', item: newTransform.id, user: 'Admin', meta: { name: formData.name } });
    }
    setCreateOpen(false);
  };

  const handleDelete = async (transform: Transformation) => {
    const ok = await confirm({
      title: 'Delete Transformation',
      message: `Are you sure you want to delete "${transform.name}"?`,
      confirmText: 'Delete',
      severity: 'error',
    });
    if (!ok) return;
    setTransformations(prev => prev.filter(t => t.id !== transform.id));
    addNotification({ title: 'Transformation Deleted', message: `"${transform.name}" has been deleted.` });
  };

  const handleToggle = (transform: Transformation) => {
    setTransformations(prev => prev.map(t => 
      t.id === transform.id ? { ...t, active: !t.active } : t
    ));
    addNotification({ 
      title: transform.active ? 'Transformation Disabled' : 'Transformation Enabled', 
      message: `"${transform.name}" is now ${transform.active ? 'disabled' : 'enabled'}.` 
    });
  };

  const handleDuplicate = (transform: Transformation) => {
    const newTransform: Transformation = {
      ...transform,
      id: Date.now().toString(),
      name: `${transform.name} (Copy)`,
      key: `${transform.key}-copy`,
      createdAt: new Date().toISOString(),
    };
    setTransformations(prev => [...prev, newTransform]);
    addNotification({ title: 'Transformation Duplicated', message: `A copy of "${transform.name}" has been created.` });
  };

  const generateUrl = (transform: Transformation) => {
    const params = new URLSearchParams();
    if (transform.width) params.set('w', transform.width.toString());
    if (transform.height) params.set('h', transform.height.toString());
    params.set('fit', transform.fit);
    params.set('q', transform.quality.toString());
    if (transform.format !== 'original') params.set('f', transform.format);
    if (transform.withoutEnlargement) params.set('withoutEnlargement', 'true');
    if (transform.grayscale) params.set('grayscale', 'true');
    if (transform.blur > 0) params.set('blur', transform.blur.toString());
    if (transform.rotate !== 0) params.set('rot', transform.rotate.toString());
    if (transform.flip) params.set('flip', 'true');
    if (transform.flop) params.set('flop', 'true');
    if (transform.tint) params.set('tint', transform.tint);
    return `/api/files/transform/{filename}?${params.toString()}`;
  };

  const getFitIcon = (fit: string) => {
    switch (fit) {
      case 'cover': return <Maximize size={14} />;
      case 'contain': return <Grid3X3 size={14} />;
      default: return <Crop size={14} />;
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', px: 4, py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant='h5' fontWeight={700}>
              File Storage & Transformations
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Configure image transformations, thumbnails, and storage settings
            </Typography>
          </Box>
          <Button variant='contained' startIcon={<Plus size={18} />} onClick={handleOpenCreate}>
            Create Transformation
          </Button>
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1, p: 4 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Typography variant='h6' fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Image size={20} />
              Presets ({transformations.length})
            </Typography>
            <Grid container spacing={2}>
              {transformations.map(transform => (
                <Grid size={{ xs: 12, sm: 6 }} key={transform.id}>
                  <Paper
                    sx={{
                      p: 3,
                      height: '100%',
                      transition: 'all 200ms',
                      opacity: transform.active ? 1 : 0.6,
                      '&:hover': { boxShadow: 4 },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '10px',
                            bgcolor: alpha('#8B5CF6', 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Image size={20} color='#8B5CF6' />
                        </Box>
                        <Box>
                          <Typography variant='subtitle1' fontWeight={700}>
                            {transform.name}
                          </Typography>
                          <Typography variant='caption' sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                            {transform.key}
                          </Typography>
                        </Box>
                      </Box>
                      <Switch
                        checked={transform.active}
                        onChange={() => handleToggle(transform)}
                        size='small'
                      />
                    </Box>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      {transform.width && transform.height && (
                        <Chip
                          size='small'
                          label={`${transform.width}×${transform.height}`}
                          variant='outlined'
                          sx={{ fontFamily: 'monospace' }}
                        />
                      )}
                      <Chip
                        size='small'
                        icon={getFitIcon(transform.fit)}
                        label={transform.fit}
                        variant='outlined'
                      />
                      <Chip
                        size='small'
                        label={`${transform.quality}%`}
                        variant='outlined'
                      />
                      <Chip
                        size='small'
                        label={transform.format}
                        color='primary'
                        sx={{ fontFamily: 'monospace' }}
                      />
                      {transform.grayscale && (
                        <Chip size='small' label='B&W' color='default' />
                      )}
                    </Box>

                    <Paper variant='outlined' sx={{ p: 1.5, mb: 2, bgcolor: 'grey.50' }}>
                      <Typography variant='caption' sx={{ fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all' }}>
                        {generateUrl(transform)}
                      </Typography>
                    </Paper>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title='Preview'>
                        <IconButton size='small' onClick={() => { setPreviewTransform(transform); setPreviewOpen(true); }}>
                          <Eye size={16} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title='Edit'>
                        <IconButton size='small' onClick={() => handleOpenEdit(transform)}>
                          <Edit2 size={16} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title='Duplicate'>
                        <IconButton size='small' onClick={() => handleDuplicate(transform)}>
                          <Copy size={16} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title='Delete'>
                        <IconButton size='small' color='error' onClick={() => handleDelete(transform)}>
                          <Trash2 size={16} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    bgcolor: alpha('#8B5CF6', 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Settings2 size={18} color='#8B5CF6' />
                </Box>
                <Typography variant='subtitle1' fontWeight={700}>
                  Global Settings
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant='body2' color='text.secondary' gutterBottom>
                  Default Quality
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Slider
                    value={globalSettings.defaultQuality}
                    onChange={(_, v) => setGlobalSettings({ ...globalSettings, defaultQuality: v as number })}
                    min={10}
                    max={100}
                    sx={{ flexGrow: 1 }}
                  />
                  <Chip label={`${globalSettings.defaultQuality}%`} size='small' />
                </Box>
              </Box>

              <TextField
                fullWidth
                select
                label='Default Format'
                value={globalSettings.defaultFormat}
                onChange={(e) => setGlobalSettings({ ...globalSettings, defaultFormat: e.target.value as Transformation['format'] })}
                sx={{ mb: 3 }}
              >
                {FORMAT_OPTIONS.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </TextField>

              <FormControlLabel
                control={
                  <Switch
                    checked={globalSettings.preserveOriginal}
                    onChange={(e) => setGlobalSettings({ ...globalSettings, preserveOriginal: e.target.checked })}
                  />
                }
                label='Preserve Original Files'
                sx={{ display: 'block', mb: 2 }}
              />

              <TextField
                fullWidth
                label='Cache Max Age (seconds)'
                type='number'
                value={globalSettings.cacheMaxAge}
                onChange={(e) => setGlobalSettings({ ...globalSettings, cacheMaxAge: parseInt(e.target.value) })}
                helperText='31536000 = 1 year'
                sx={{ mb: 2 }}
              />

              <Button fullWidth variant='outlined'>
                Save Settings
              </Button>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant='subtitle2' fontWeight={700} gutterBottom>
                Quick Stats
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant='body2' color='text.secondary'>Active Presets</Typography>
                  <Chip label={transformations.filter(t => t.active).length} size='small' color='success' />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant='body2' color='text.secondary'>Total Presets</Typography>
                  <Typography variant='body2' fontWeight={600}>{transformations.length}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant='body2' color='text.secondary'>Avg Quality</Typography>
                  <Typography variant='body2' fontWeight={600}>
                    {Math.round(transformations.reduce((acc, t) => acc + t.quality, 0) / transformations.length)}%
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>
          {editTransform ? 'Edit Transformation' : 'Create Transformation'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='Name'
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder='e.g., Thumbnail'
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='Key'
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value.replace(/\s+/g, '-').toLowerCase() })}
                placeholder='e.g., thumbnail'
                helperText='URL-safe identifier'
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1 }} />
              <Typography variant='subtitle2' fontWeight={700} sx={{ mb: 2 }}>
                Size & Fit
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label='Width'
                type='number'
                value={formData.width || ''}
                onChange={(e) => setFormData({ ...formData, width: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder='Auto'
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label='Height'
                type='number'
                value={formData.height || ''}
                onChange={(e) => setFormData({ ...formData, height: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder='Auto'
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                select
                label='Fit Mode'
                value={formData.fit}
                onChange={(e) => setFormData({ ...formData, fit: e.target.value as Transformation['fit'] })}
              >
                {FIT_OPTIONS.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>
                    <Box>
                      <Typography variant='body2'>{opt.label}</Typography>
                      <Typography variant='caption' color='text.secondary'>{opt.description}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.withoutEnlargement}
                    onChange={(e) => setFormData({ ...formData, withoutEnlargement: e.target.checked })}
                  />
                }
                label="Don't enlarge smaller images"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1 }} />
              <Typography variant='subtitle2' fontWeight={700} sx={{ mb: 2 }}>
                Output
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant='body2' gutterBottom>Quality: {formData.quality}%</Typography>
                <Slider
                  value={formData.quality}
                  onChange={(_, v) => setFormData({ ...formData, quality: v as number })}
                  min={10}
                  max={100}
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                select
                label='Format'
                value={formData.format}
                onChange={(e) => setFormData({ ...formData, format: e.target.value as Transformation['format'] })}
              >
                {FORMAT_OPTIONS.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>
                    <Box>
                      <Typography variant='body2'>{opt.label}</Typography>
                      <Typography variant='caption' color='text.secondary'>{opt.description}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1 }} />
              <Typography variant='subtitle2' fontWeight={700} sx={{ mb: 2 }}>
                Effects
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant='body2' gutterBottom>Blur: {formData.blur}</Typography>
                <Slider
                  value={formData.blur}
                  onChange={(_, v) => setFormData({ ...formData, blur: v as number })}
                  min={0}
                  max={20}
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant='body2' gutterBottom>Rotate: {formData.rotate}°</Typography>
                <Slider
                  value={formData.rotate}
                  onChange={(_, v) => setFormData({ ...formData, rotate: v as number })}
                  min={0}
                  max={360}
                  step={90}
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.grayscale}
                    onChange={(e) => setFormData({ ...formData, grayscale: e.target.checked })}
                  />
                }
                label='Grayscale'
                sx={{ mr: 3 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.flip}
                    onChange={(e) => setFormData({ ...formData, flip: e.target.checked })}
                  />
                }
                label='Flip'
                sx={{ mr: 3 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.flop}
                    onChange={(e) => setFormData({ ...formData, flop: e.target.checked })}
                  />
                }
                label='Flop'
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='Tint Color'
                value={formData.tint}
                onChange={(e) => setFormData({ ...formData, tint: e.target.value })}
                placeholder='e.g., #FF0000 or rgba(255,0,0,0.5)'
                helperText='Color overlay (optional)'
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant='contained' onClick={handleSave}>
            {editTransform ? 'Save Changes' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>
          Preview: {previewTransform?.name}
        </DialogTitle>
        <DialogContent dividers>
          <Paper
            sx={{
              p: 4,
              bgcolor: 'grey.100',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 300,
            }}
          >
            <Image size={64} style={{ opacity: 0.2, marginBottom: 16 }} />
            <Typography variant='body2' color='text.secondary' textAlign='center'>
              Image preview would appear here with the transformation applied.
              <br />
              Settings: {previewTransform?.width}×{previewTransform?.height}, {previewTransform?.quality}% quality, {previewTransform?.format}
            </Typography>
          </Paper>
          <Box sx={{ mt: 2 }}>
            <Typography variant='caption' sx={{ fontFamily: 'monospace', display: 'block', wordBreak: 'break-all' }}>
              {previewTransform && generateUrl(previewTransform)}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          <Button variant='outlined' startIcon={<Copy size={16} />} onClick={() => {
            navigator.clipboard.writeText(previewTransform ? generateUrl(previewTransform) : '');
            addNotification({ title: 'Copied', message: 'URL copied to clipboard.' });
          }}>
            Copy URL
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
