"use client";

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Slider from '@mui/material/Slider';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import { alpha, useTheme } from '@mui/material/styles';
import { useNotificationsStore } from '@/store/notifications';
import {
  Image,
  Settings,
  Save,
  RefreshCw,
  Zap,
  Maximize,
  Minimize,
  FileImage,
  Monitor,
  Smartphone,
  Tablet,
} from 'lucide-react';

interface MediaSettings {
  quality: number;
  maxWidth: number;
  maxHeight: number;
  formats: string[];
  lazyLoading: boolean;
  autoResize: boolean;
  preserveExif: boolean;
  webpPriority: boolean;
  compressionLevel: number;
  presets: {
    name: string;
    width: number;
    height: number;
    fit: 'cover' | 'contain' | 'fill';
  }[];
}

const DEFAULT_SETTINGS: MediaSettings = {
  quality: 80,
  maxWidth: 1920,
  maxHeight: 1080,
  formats: ['webp', 'jpeg', 'png'],
  lazyLoading: true,
  autoResize: true,
  preserveExif: false,
  webpPriority: true,
  compressionLevel: 6,
  presets: [
    { name: 'thumbnail', width: 150, height: 150, fit: 'cover' },
    { name: 'small', width: 480, height: 320, fit: 'cover' },
    { name: 'medium', width: 800, height: 600, fit: 'cover' },
    { name: 'large', width: 1200, height: 900, fit: 'contain' },
    { name: 'desktop', width: 1920, height: 1080, fit: 'contain' },
  ],
};

const STORAGE_KEY = 'neurofy-media-settings';

export default function MediaSettingsPage() {
  const theme = useTheme();
  const { addNotification } = useNotificationsStore();

  const [settings, setSettings] = useState<MediaSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      addNotification({ title: 'Saved', message: 'Media settings saved successfully' });
    } catch (err) {
      addNotification({ title: 'Error', message: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    addNotification({ title: 'Reset', message: 'Settings reset to defaults' });
  };

  const formatOptions = ['webp', 'jpeg', 'png', 'gif', 'avif'];

  const presetIcons: Record<string, any> = {
    thumbnail: Minimize,
    small: Smartphone,
    medium: Tablet,
    large: Monitor,
    desktop: Maximize,
  };

  return (
    <Box sx={{ p: 4, overflow: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Media Optimization
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure image processing and optimization settings
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshCw size={16} />}
            onClick={handleReset}
            sx={{ borderRadius: '10px' }}
          >
            Reset
          </Button>
          <Button
            variant="contained"
            startIcon={<Save size={16} />}
            onClick={handleSave}
            disabled={saving}
            sx={{ borderRadius: '10px' }}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Quality & Compression */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: '16px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: '12px', bgcolor: alpha('#8B5CF6', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={20} color="#8B5CF6" />
              </Box>
              <Typography variant="h6" fontWeight={700}>Quality & Compression</Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" fontWeight={600}>Image Quality</Typography>
                <Chip label={`${settings.quality}%`} size="small" />
              </Box>
              <Slider
                value={settings.quality}
                onChange={(_, val) => setSettings({ ...settings, quality: val as number })}
                min={10}
                max={100}
                step={5}
                marks={[
                  { value: 20, label: '20%' },
                  { value: 50, label: '50%' },
                  { value: 80, label: '80%' },
                  { value: 100, label: '100%' },
                ]}
              />
              <Typography variant="caption" color="text.secondary">
                Higher quality = larger file size
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" fontWeight={600}>Compression Level</Typography>
                <Chip label={settings.compressionLevel} size="small" />
              </Box>
              <Slider
                value={settings.compressionLevel}
                onChange={(_, val) => setSettings({ ...settings, compressionLevel: val as number })}
                min={1}
                max={9}
                step={1}
                marks={[
                  { value: 1, label: 'Fast' },
                  { value: 5, label: 'Balanced' },
                  { value: 9, label: 'Best' },
                ]}
              />
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={settings.webpPriority}
                  onChange={(e) => setSettings({ ...settings, webpPriority: e.target.checked })}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" fontWeight={600}>WebP Priority</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Automatically convert to WebP when possible
                  </Typography>
                </Box>
              }
            />
          </Paper>
        </Grid>

        {/* Dimensions */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: '16px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: '12px', bgcolor: alpha('#3B82F6', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Maximize size={20} color="#3B82F6" />
              </Box>
              <Typography variant="h6" fontWeight={700}>Max Dimensions</Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  label="Max Width (px)"
                  type="number"
                  value={settings.maxWidth}
                  onChange={(e) => setSettings({ ...settings, maxWidth: parseInt(e.target.value) || 0 })}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  label="Max Height (px)"
                  type="number"
                  value={settings.maxHeight}
                  onChange={(e) => setSettings({ ...settings, maxHeight: parseInt(e.target.value) || 0 })}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoResize}
                    onChange={(e) => setSettings({ ...settings, autoResize: e.target.checked })}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>Auto Resize</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Automatically resize images exceeding max dimensions
                    </Typography>
                  </Box>
                }
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.preserveExif}
                    onChange={(e) => setSettings({ ...settings, preserveExif: e.target.checked })}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>Preserve EXIF Data</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Keep camera and location metadata
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </Paper>
        </Grid>

        {/* Output Formats */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: '16px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: '12px', bgcolor: alpha('#10B981', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileImage size={20} color="#10B981" />
              </Box>
              <Typography variant="h6" fontWeight={700}>Output Formats</Typography>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
              {formatOptions.map((format) => (
                <Chip
                  key={format}
                  label={format.toUpperCase()}
                  onClick={() => {
                    const formats = settings.formats.includes(format)
                      ? settings.formats.filter((f) => f !== format)
                      : [...settings.formats, format];
                    setSettings({ ...settings, formats });
                  }}
                  color={settings.formats.includes(format) ? 'primary' : 'default'}
                  variant={settings.formats.includes(format) ? 'filled' : 'outlined'}
                  sx={{ fontWeight: 600 }}
                />
              ))}
            </Box>

            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
              Select which formats to support for uploaded images
            </Typography>
          </Paper>
        </Grid>

        {/* Lazy Loading */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: '16px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: '12px', bgcolor: alpha('#F59E0B', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Settings size={20} color="#F59E0B" />
              </Box>
              <Typography variant="h6" fontWeight={700}>Performance</Typography>
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={settings.lazyLoading}
                  onChange={(e) => setSettings({ ...settings, lazyLoading: e.target.checked })}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" fontWeight={600}>Lazy Loading</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Load images only when they enter the viewport
                  </Typography>
                </Box>
              }
            />

            <Box sx={{ mt: 3, p: 2, bgcolor: alpha('#F59E0B', 0.05), borderRadius: '12px' }}>
              <Typography variant="body2" fontWeight={600} color="#F59E0B" mb={1}>
                Performance Tips
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                - Use WebP for better compression
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                - Enable lazy loading for pages with many images
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                - Set appropriate max dimensions for your use case
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Image Presets */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3, borderRadius: '16px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: '12px', bgcolor: alpha('#EC4899', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Image size={20} color="#EC4899" />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700}>Image Presets</Typography>
                <Typography variant="caption" color="text.secondary">
                  Predefined sizes for automatic image generation
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={2}>
              {settings.presets.map((preset) => {
                const Icon = presetIcons[preset.name] || Image;
                return (
                  <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }} key={preset.name}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: '12px',
                        textAlign: 'center',
                        borderColor: alpha('#EC4899', 0.2),
                      }}
                    >
                      <Icon size={24} style={{ opacity: 0.6, marginBottom: 8 }} />
                      <Typography variant="body2" fontWeight={700} sx={{ textTransform: 'capitalize' }}>
                        {preset.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {preset.width}x{preset.height}
                      </Typography>
                      <Chip
                        label={preset.fit}
                        size="small"
                        sx={{ mt: 1, height: 20, fontSize: 10 }}
                      />
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
