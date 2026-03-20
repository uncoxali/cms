'use client';

import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import MenuItem from '@mui/material/MenuItem';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Slider from '@mui/material/Slider';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import { alpha, useTheme } from '@mui/material/styles';
import { 
  Save, Palette, Globe, Shield, Eye, LayoutDashboard, FolderOpen, 
  Zap, Activity, Blocks, Sun, Moon, Monitor, Check, Upload, Image,
  Type, AlignLeft, Layout, Bell, Lock, Globe2, Sliders, Sparkles,
  Plus, Trash2
} from 'lucide-react';
import { useProjectStore } from '@/store/project';
import { useActivityStore } from '@/store/activity';
import { useNotificationsStore } from '@/store/notifications';
import { THEME_LIST, DARK_THEMES, LIGHT_THEMES, ThemePreset, THEME_PRESETS } from '@/lib/themes';
import CustomThemeCreator from '@/components/admin/CustomThemeCreator';

const TIMEZONE_OPTIONS = [
  'UTC', 'Asia/Tehran', 'Asia/Dubai', 'Asia/Tokyo', 'Asia/Shanghai',
  'America/New_York', 'America/Chicago', 'America/Los_Angeles',
  'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'Europe/Istanbul',
  'Australia/Sydney',
];

const LOCALE_OPTIONS = [
  { value: 'en-US', label: 'English (US)', flag: '🇺🇸' },
  { value: 'en-GB', label: 'English (UK)', flag: '🇬🇧' },
  { value: 'fa-IR', label: 'فارسی (ایران)', flag: '🇮🇷' },
  { value: 'ar-SA', label: 'العربية', flag: '🇸🇦' },
  { value: 'fr-FR', label: 'Français', flag: '🇫🇷' },
  { value: 'de-DE', label: 'Deutsch', flag: '🇩🇪' },
  { value: 'tr-TR', label: 'Türkçe', flag: '🇹🇷' },
  { value: 'zh-CN', label: '中文 (简体)', flag: '🇨🇳' },
  { value: 'ja-JP', label: '日本語', flag: '🇯🇵' },
];

const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter', preview: 'Aa Bb Cc 123' },
  { value: 'Poppins', label: 'Poppins', preview: 'Aa Bb Cc 123' },
  { value: 'Roboto', label: 'Roboto', preview: 'Aa Bb Cc 123' },
  { value: 'Open Sans', label: 'Open Sans', preview: 'Aa Bb Cc 123' },
  { value: 'Nunito', label: 'Nunito', preview: 'Aa Bb Cc 123' },
  { value: 'Montserrat', label: 'Montserrat', preview: 'Aa Bb Cc 123' },
  { value: 'Vazirmatn', label: 'Vazirmatn (فارسی)', preview: 'آ ب پ ۱۲۳' },
  { value: 'Yekan Bakh', label: 'Yekan Bakh (فارسی)', preview: 'آ ب پ ۱۲۳' },
  { value: 'system-ui', label: 'System Default', preview: 'Aa Bb Cc 123' },
  { value: 'monospace', label: 'Monospace', preview: 'Aa Bb Cc 123' },
];

const DATE_FORMAT_OPTIONS = [
  { value: 'YYYY-MM-DD', label: '2024-03-15' },
  { value: 'DD/MM/YYYY', label: '15/03/2024' },
  { value: 'MM/DD/YYYY', label: '03/15/2024' },
  { value: 'DD.MM.YYYY', label: '15.03.2024' },
  { value: 'YYYY/MM/DD', label: '2024/03/15' },
];

const PRESET_COLORS = [
  '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#EF4444',
  '#14B8A6', '#F97316', '#6366F1', '#84CC16', '#06B6D4', '#A855F7',
];

const FEATURE_MODULES = [
  { key: 'insights' as const, label: 'Dashboard', description: 'Analytics and insights', icon: LayoutDashboard, color: '#8B5CF6' },
  { key: 'files' as const, label: 'File Library', description: 'Media management', icon: FolderOpen, color: '#10B981' },
  { key: 'flows' as const, label: 'Automations', description: 'Workflow automation', icon: Zap, color: '#F59E0B' },
  { key: 'activity' as const, label: 'Activity', description: 'System logs', icon: Activity, color: '#3B82F6' },
  { key: 'extensions' as const, label: 'Extensions', description: 'Plugins & modules', icon: Blocks, color: '#EC4899' },
];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  if (value !== index) return null;
  return (
    <div role="tabpanel" {...other}>
      <Box sx={{ py: 3 }}>{children}</Box>
    </div>
  );
}

export default function ProjectSettingsPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { settings, fetchSettings, updateSettings, updateFeatureFlag, addCustomTheme, removeCustomTheme, applyCustomTheme } = useProjectStore();
  const { addLog } = useActivityStore();
  const { addNotification } = useNotificationsStore();

  const safeSettings = settings || {
    projectName: 'NexDirect CMS',
    projectDescription: '',
    projectUrl: 'http://localhost:3000',
    logoUrl: '',
    primaryColor: '#8B5CF6',
    accentColor: '#EC4899',
    defaultLanguage: 'en-US',
    timezone: 'UTC',
    defaultPageSize: 25,
    defaultSortField: 'date_created',
    defaultSortOrder: 'desc' as const,
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm:ss',
    numberFormat: '1,000.00',
    featureFlags: {
      insights: true,
      files: true,
      flows: true,
      activity: true,
      extensions: true,
    },
    theme: 'dark' as const,
    themePreset: 'midnight',
    fontFamily: 'Inter',
    sessionTimeout: 30,
    minPasswordLength: 8,
    allowedOrigins: '*',
    customThemes: [],
  };

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const [form, setForm] = useState({ ...safeSettings });
  const [activeTab, setActiveTab] = useState(0);
  const [saved, setSaved] = useState(false);
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('light');
  const [showThemeCreator, setShowThemeCreator] = useState(false);
  const [editingTheme, setEditingTheme] = useState<ThemePreset | null>(null);

  const handleSave = () => {
    updateSettings(form);
    addLog({ action: 'update', collection: 'projectSettings', user: 'Admin User', meta: { section: 'all', changes: form } });
    addNotification({ title: 'Settings Saved', message: 'All changes have been saved successfully.' });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleFeatureToggle = (flag: keyof typeof settings.featureFlags, val: boolean) => {
    updateFeatureFlag(flag, val);
    setForm({ ...form, featureFlags: { ...form.featureFlags, [flag]: val } });
    const mod = FEATURE_MODULES.find(m => m.key === flag);
    addNotification({ title: val ? 'Module Enabled' : 'Module Disabled', message: `${mod?.label} has been ${val ? 'enabled' : 'disabled'}.` });
  };

  const updateForm = (updates: Partial<typeof form>) => {
    setForm(prev => ({ ...prev, ...updates }));
    
    // Apply theme changes immediately for real-time preview
    if (updates.theme !== undefined || updates.themePreset !== undefined) {
      updateSettings(updates);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', animation: 'fadeIn 300ms ease-out', p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: '14px', bgcolor: alpha('#8B5CF6', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sliders size={22} color="#8B5CF6" />
            </Box>
            <Typography variant="h3" fontWeight={700}>Project Settings</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">Customize your CMS appearance and behavior</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={saved ? <Check size={18} /> : <Save size={18} />}
          onClick={handleSave}
          sx={{ borderRadius: '12px', px: 3, ...(saved && { bgcolor: '#10B981' }) }}
        >
          {saved ? 'Saved!' : 'Save Changes'}
        </Button>
      </Box>

      {/* Tabs */}
      <Paper sx={{ borderRadius: '16px', mb: 3, overflow: 'hidden' }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ px: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Tab icon={<Globe2 size={16} />} iconPosition="start" label="General" />
          <Tab icon={<Palette size={16} />} iconPosition="start" label="Appearance" />
          <Tab icon={<Sliders size={16} />} iconPosition="start" label="Defaults" />
          <Tab icon={<Shield size={16} />} iconPosition="start" label="Security" />
          <Tab icon={<Blocks size={16} />} iconPosition="start" label="Modules" />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {/* General Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, lg: 8 }}>
              <Paper sx={{ p: 3, borderRadius: '16px' }}>
                <Typography variant="h6" fontWeight={700} mb={3}>Project Identity</Typography>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField fullWidth label="Project Name" value={form.projectName}
                      onChange={(e) => updateForm({ projectName: e.target.value })} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField fullWidth label="Project URL" value={form.projectUrl}
                      onChange={(e) => updateForm({ projectUrl: e.target.value })} />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField fullWidth multiline rows={2} label="Project Description" value={form.projectDescription}
                      onChange={(e) => updateForm({ projectDescription: e.target.value })} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField fullWidth label="Logo URL" value={form.logoUrl}
                      onChange={(e) => updateForm({ logoUrl: e.target.value })} />
                  </Grid>
                </Grid>
              </Paper>

              <Paper sx={{ p: 3, borderRadius: '16px', mt: 3 }}>
                <Typography variant="h6" fontWeight={700} mb={3}>Localization</Typography>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField select fullWidth label="Default Language" value={form.defaultLanguage}
                      onChange={(e) => updateForm({ defaultLanguage: e.target.value })}>
                      {LOCALE_OPTIONS.map(loc => (
                        <MenuItem key={loc.value} value={loc.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Typography>{loc.flag}</Typography>
                            <Typography>{loc.label}</Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField select fullWidth label="Timezone" value={form.timezone}
                      onChange={(e) => updateForm({ timezone: e.target.value })}>
                      {TIMEZONE_OPTIONS.map(tz => <MenuItem key={tz} value={tz}>{tz}</MenuItem>)}
                    </TextField>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Live Preview */}
            <Grid size={{ xs: 12, lg: 4 }}>
              <Paper sx={{ p: 3, borderRadius: '16px', position: 'sticky', top: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" fontWeight={700}>Live Preview</Typography>
                  <ToggleButtonGroup value={previewMode} exclusive onChange={(_, v) => v && setPreviewMode(v)} size="small">
                    <ToggleButton value="light"><Sun size={14} /></ToggleButton>
                    <ToggleButton value="dark"><Moon size={14} /></ToggleButton>
                  </ToggleButtonGroup>
                </Box>
                <Box sx={{
                  p: 2, borderRadius: '12px', bgcolor: previewMode === 'dark' ? '#1A1A1A' : '#FAFAFA',
                  border: `1px solid ${theme.palette.divider}`, transition: 'all 300ms ease'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: form.primaryColor }} />
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: 13, color: previewMode === 'dark' ? '#FAFAFA' : '#18181B' }}>
                        {form.projectName || 'My Project'}
                      </Typography>
                      <Typography sx={{ fontSize: 11, color: previewMode === 'dark' ? '#A1A1AA' : '#71717A' }}>
                        Admin Panel
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {FEATURE_MODULES.filter(m => form.featureFlags[m.key]).map(m => (
                      <Chip key={m.key} label={m.label} size="small"
                        sx={{ bgcolor: alpha(m.color, 0.1), color: m.color, fontWeight: 600, fontSize: 10 }} />
                    ))}
                  </Box>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block" mb={1}>Primary Color</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {PRESET_COLORS.map(color => (
                      <Box key={color}
                        onClick={() => updateForm({ primaryColor: color })}
                        sx={{
                          width: 28, height: 28, borderRadius: '8px', bgcolor: color, cursor: 'pointer',
                          border: form.primaryColor === color ? '2px solid #000' : '2px solid transparent',
                          transition: 'all 150ms ease',
                          '&:hover': { transform: 'scale(1.1)' }
                        }} />
                    ))}
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Appearance Tab */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3} sx={{ minHeight: '100%' }}>
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 3, borderRadius: '16px' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>Theme Presets</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Choose from our curated themes or create your own
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip 
                      icon={<Moon size={14} />} 
                      label={`${DARK_THEMES.length} Dark`} 
                      size="small" 
                      onClick={() => {
                        const darkSection = document.getElementById('dark-themes-section');
                        darkSection?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      sx={{ cursor: 'pointer' }}
                    />
                    <Chip 
                      icon={<Sun size={14} />} 
                      label={`${LIGHT_THEMES.length} Light`} 
                      size="small" 
                      onClick={() => {
                        const lightSection = document.getElementById('light-themes-section');
                        lightSection?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      sx={{ cursor: 'pointer' }}
                    />
                    <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Plus size={14} />}
                      onClick={() => { setEditingTheme(null); setShowThemeCreator(true); }}
                      sx={{ borderRadius: '8px' }}
                    >
                      Custom
                    </Button>
                  </Box>
                </Box>

                {/* Dark Themes */}
                <Box id="dark-themes-section" sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Moon size={18} color={theme.palette.primary.main} />
                    <Typography variant="subtitle1" fontWeight={700}>Dark Themes</Typography>
                  </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2 }}>
                    {DARK_THEMES.map((preset) => (
                      <Paper
                        key={preset.id}
                        onClick={() => updateForm({ themePreset: preset.id, theme: 'dark' })}
                        sx={{
                          p: 0,
                          cursor: 'pointer',
                          borderRadius: '16px',
                          overflow: 'hidden',
                          border: `2px solid ${form.themePreset === preset.id ? preset.colors.primary : theme.palette.divider}`,
                          transition: 'all 200ms ease',
                          '&:hover': { 
                            transform: 'translateY(-4px)',
                            boxShadow: `0 12px 24px ${alpha(preset.colors.primary, 0.2)}`,
                          }
                        }}
                      >
                        {/* Theme Preview */}
                        <Box sx={{ height: 100, bgcolor: preset.colors.background.default, position: 'relative' }}>
                          {/* Header bar */}
                          <Box sx={{ height: 28, bgcolor: preset.colors.background.paper, display: 'flex', alignItems: 'center', px: 1.5, gap: 0.5 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#EF4444' }} />
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#FACC15' }} />
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22C55E' }} />
                            <Box sx={{ flex: 1, mx: 1, height: 14, bgcolor: preset.colors.background.default, borderRadius: 4 }} />
                          </Box>
                          {/* Content */}
                          <Box sx={{ p: 1.5 }}>
                            <Box sx={{ display: 'flex', gap: 0.75, mb: 1 }}>
                              <Box sx={{ width: 32, height: 8, bgcolor: preset.colors.primary, borderRadius: 2 }} />
                              <Box sx={{ width: 24, height: 8, bgcolor: preset.colors.secondary, borderRadius: 2 }} />
                            </Box>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              {[0, 1, 2].map(i => (
                                <Box key={i} sx={{ flex: 1, height: 24, bgcolor: preset.colors.background.paper, borderRadius: 1, border: `1px solid ${preset.colors.divider}` }} />
                              ))}
                            </Box>
                          </Box>
                          {/* Selection indicator */}
                          {form.themePreset === preset.id && (
                            <Box sx={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: '50%', bgcolor: preset.colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Check size={14} color="#fff" />
                            </Box>
                          )}
                        </Box>
                        {/* Theme Info */}
                        <Box sx={{ p: 1.5, bgcolor: preset.colors.background.paper, borderTop: `1px solid ${preset.colors.divider}` }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                              <Typography variant="body2" fontWeight={600} sx={{ color: preset.colors.text.primary }}>
                                {preset.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: preset.colors.text.secondary }}>
                                {preset.description}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: preset.colors.primary }} />
                              <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: preset.colors.secondary }} />
                            </Box>
                          </Box>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                </Box>

                {/* Light Themes */}
                <Box id="light-themes-section">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Sun size={18} color={theme.palette.warning.main} />
                    <Typography variant="subtitle1" fontWeight={700}>Light Themes</Typography>
                  </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2 }}>
                    {LIGHT_THEMES.map((preset) => (
                      <Paper
                        key={preset.id}
                        onClick={() => updateForm({ themePreset: preset.id, theme: 'light' })}
                        sx={{
                          p: 0,
                          cursor: 'pointer',
                          borderRadius: '16px',
                          overflow: 'hidden',
                          border: `2px solid ${form.themePreset === preset.id ? preset.colors.primary : theme.palette.divider}`,
                          transition: 'all 200ms ease',
                          '&:hover': { 
                            transform: 'translateY(-4px)',
                            boxShadow: `0 12px 24px ${alpha(preset.colors.primary, 0.2)}`,
                          }
                        }}
                      >
                        {/* Theme Preview */}
                        <Box sx={{ height: 100, bgcolor: preset.colors.background.default, position: 'relative' }}>
                          {/* Header bar */}
                          <Box sx={{ height: 28, bgcolor: preset.colors.background.paper, display: 'flex', alignItems: 'center', px: 1.5, gap: 0.5 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#EF4444' }} />
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#FACC15' }} />
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22C55E' }} />
                            <Box sx={{ flex: 1, mx: 1, height: 14, bgcolor: preset.colors.background.default, borderRadius: 4 }} />
                          </Box>
                          {/* Content */}
                          <Box sx={{ p: 1.5 }}>
                            <Box sx={{ display: 'flex', gap: 0.75, mb: 1 }}>
                              <Box sx={{ width: 32, height: 8, bgcolor: preset.colors.primary, borderRadius: 2 }} />
                              <Box sx={{ width: 24, height: 8, bgcolor: preset.colors.secondary, borderRadius: 2 }} />
                            </Box>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              {[0, 1, 2].map(i => (
                                <Box key={i} sx={{ flex: 1, height: 24, bgcolor: preset.colors.background.paper, borderRadius: 1, border: `1px solid ${preset.colors.divider}` }} />
                              ))}
                            </Box>
                          </Box>
                          {/* Selection indicator */}
                          {form.themePreset === preset.id && (
                            <Box sx={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: '50%', bgcolor: preset.colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Check size={14} color="#fff" />
                            </Box>
                          )}
                        </Box>
                        {/* Theme Info */}
                        <Box sx={{ p: 1.5, bgcolor: preset.colors.background.paper, borderTop: `1px solid ${preset.colors.divider}` }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                              <Typography variant="body2" fontWeight={600} sx={{ color: preset.colors.text.primary }}>
                                {preset.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: preset.colors.text.secondary }}>
                                {preset.description}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: preset.colors.primary }} />
                              <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: preset.colors.secondary }} />
                            </Box>
                          </Box>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                </Box>

                {/* Custom Themes */}
                {(safeSettings.customThemes || []).length > 0 && (
                  <Box sx={{ mt: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                      <Sparkles size={18} color={theme.palette.secondary.main} />
                      <Typography variant="subtitle1" fontWeight={700}>Custom Themes</Typography>
                      <Chip label={`${safeSettings.customThemes.length}`} size="small" color="secondary" />
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2 }}>
                      {safeSettings.customThemes.map((preset) => (
                        <Paper
                          key={preset.id}
                          onClick={() => { updateForm({ themePreset: preset.id, theme: preset.mode }); }}
                          sx={{
                            p: 0,
                            cursor: 'pointer',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            border: `2px solid ${form.themePreset === preset.id ? preset.colors.primary : theme.palette.divider}`,
                            transition: 'all 200ms ease',
                            '&:hover': { 
                              transform: 'translateY(-4px)',
                              boxShadow: `0 12px 24px ${alpha(preset.colors.primary, 0.2)}`,
                            }
                          }}
                        >
                          <Box sx={{ height: 100, bgcolor: preset.colors.background.default, position: 'relative' }}>
                            <Box sx={{ height: 28, bgcolor: preset.colors.background.paper, display: 'flex', alignItems: 'center', px: 1.5, gap: 0.5 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#EF4444' }} />
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#FACC15' }} />
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22C55E' }} />
                              <Box sx={{ flex: 1, mx: 1, height: 14, bgcolor: preset.colors.background.default, borderRadius: 4 }} />
                            </Box>
                            <Box sx={{ p: 1.5 }}>
                              <Box sx={{ display: 'flex', gap: 0.75, mb: 1 }}>
                                <Box sx={{ width: 32, height: 8, bgcolor: preset.colors.primary, borderRadius: 2 }} />
                                <Box sx={{ width: 24, height: 8, bgcolor: preset.colors.secondary, borderRadius: 2 }} />
                              </Box>
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                {[0, 1, 2].map(i => (
                                  <Box key={i} sx={{ flex: 1, height: 24, bgcolor: preset.colors.background.paper, borderRadius: 1, border: `1px solid ${preset.colors.divider}` }} />
                                ))}
                              </Box>
                            </Box>
                            {form.themePreset === preset.id && (
                              <Box sx={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: '50%', bgcolor: preset.colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Check size={14} color="#fff" />
                              </Box>
                            )}
                          </Box>
                          <Box sx={{ p: 1.5, bgcolor: preset.colors.background.paper, borderTop: `1px solid ${preset.colors.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="body2" fontWeight={600} sx={{ color: preset.colors.text.primary }}>
                                {preset.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: preset.colors.text.secondary }}>
                                {preset.mode === 'dark' ? 'Dark' : 'Light'} mode
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <IconButton size="small" onClick={(e) => { e.stopPropagation(); setEditingTheme(preset); setShowThemeCreator(true); }}>
                                <Palette size={14} />
                              </IconButton>
                              <IconButton size="small" onClick={(e) => { e.stopPropagation(); removeCustomTheme(preset.id); }}>
                                <Trash2 size={14} />
                              </IconButton>
                            </Box>
                          </Box>
                        </Paper>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Create Custom Theme Button */}
                <Box sx={{ mt: 4, textAlign: 'center' }}>
                  <Button
                    variant="contained"
                    startIcon={<Plus size={18} />}
                    onClick={() => { setEditingTheme(null); setShowThemeCreator(true); }}
                    sx={{ 
                      borderRadius: '12px', 
                      px: 4,
                      background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #7C3AED 0%, #DB2777 100%)',
                      }
                    }}
                  >
                    Create Custom Theme
                  </Button>
                </Box>
              </Paper>
            </Grid>

            {/* Theme Settings */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper sx={{ p: 3, borderRadius: '16px', position: 'sticky', top: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Sparkles size={18} color={theme.palette.primary.main} />
                  <Typography variant="h6" fontWeight={700}>Theme Settings</Typography>
                </Box>

                <Typography variant="subtitle2" fontWeight={600} mb={2}>Display Mode</Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                  {([
                    { value: 'light', label: 'Light', icon: Sun },
                    { value: 'dark', label: 'Dark', icon: Moon },
                    { value: 'system', label: 'System', icon: Monitor },
                  ] as const).map(mode => (
                    <Paper
                      key={mode.value}
                      onClick={() => updateForm({ theme: mode.value })}
                      sx={{
                        flex: 1, p: 1.5, textAlign: 'center', cursor: 'pointer', borderRadius: '12px',
                        border: `2px solid ${form.theme === mode.value ? theme.palette.primary.main : theme.palette.divider}`,
                        bgcolor: form.theme === mode.value ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                        transition: 'all 150ms ease',
                        '&:hover': { borderColor: theme.palette.primary.main }
                      }}
                    >
                      <mode.icon size={18} color={form.theme === mode.value ? theme.palette.primary.main : theme.palette.text.secondary} />
                      <Typography variant="caption" fontWeight={600} sx={{ display: 'block', mt: 0.5 }}>
                        {mode.label}
                      </Typography>
                    </Paper>
                  ))}
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" fontWeight={600} mb={2}>Typography</Typography>
                <TextField select fullWidth size="small" label="Font Family" value={form.fontFamily}
                  onChange={(e) => updateForm({ fontFamily: e.target.value })}>
                  {FONT_OPTIONS.map(f => (
                    <MenuItem key={f.value} value={f.value}>
                      <Typography sx={{ fontFamily: `'${f.value}', sans-serif` }}>{f.label}</Typography>
                    </MenuItem>
                  ))}
                </TextField>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" fontWeight={600} mb={2}>Current Theme</Typography>
                <Box sx={{ p: 2, borderRadius: '12px', bgcolor: alpha(theme.palette.primary.main, 0.05), border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: theme.palette.primary.main, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Palette size={16} color="#fff" />
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {THEME_LIST.find(t => t.id === form.themePreset)?.name || 'Custom'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {THEME_LIST.find(t => t.id === form.themePreset)?.mode === 'dark' ? 'Dark' : 'Light'} mode
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Defaults Tab */}
        <TabPanel value={activeTab} index={2}>
          <Paper sx={{ p: 3, borderRadius: '16px', maxWidth: 800 }}>
            <Typography variant="h6" fontWeight={700} mb={3}>Content Defaults</Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth type="number" label="Default Page Size" value={form.defaultPageSize}
                  onChange={(e) => updateForm({ defaultPageSize: Number(e.target.value) })}
                  helperText="Items per page in collection views" />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth label="Default Sort Field" value={form.defaultSortField}
                  onChange={(e) => updateForm({ defaultSortField: e.target.value })}
                  helperText="e.g. date_created, title, sort" />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField select fullWidth label="Default Sort Order" value={form.defaultSortOrder}
                  onChange={(e) => updateForm({ defaultSortOrder: e.target.value as 'asc' | 'desc' })}>
                  <MenuItem value="asc">↑ Ascending (A-Z, 0-9)</MenuItem>
                  <MenuItem value="desc">↓ Descending (Z-A, 9-0)</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField select fullWidth label="Date Format" value={form.dateFormat}
                  onChange={(e) => updateForm({ dateFormat: e.target.value })}>
                  {DATE_FORMAT_OPTIONS.map(df => (
                    <MenuItem key={df.value} value={df.value}>{df.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField select fullWidth label="Time Format" value={form.timeFormat}
                  onChange={(e) => updateForm({ timeFormat: e.target.value })}>
                  <MenuItem value="HH:mm:ss">24-hour (14:30:00)</MenuItem>
                  <MenuItem value="hh:mm A">12-hour (02:30 PM)</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField select fullWidth label="Number Format" value={form.numberFormat}
                  onChange={(e) => updateForm({ numberFormat: e.target.value })}>
                  <MenuItem value="1,000.00">1,000.00 (English)</MenuItem>
                  <MenuItem value="1.000,00">1.000,00 (European)</MenuItem>
                  <MenuItem value="1 000.00">1 000.00 (French)</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Paper>
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={activeTab} index={3}>
          <Paper sx={{ p: 3, borderRadius: '16px', maxWidth: 800 }}>
            <Typography variant="h6" fontWeight={700} mb={3}>Security Settings</Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth type="number" label="Session Timeout" value={form.sessionTimeout}
                  onChange={(e) => updateForm({ sessionTimeout: Number(e.target.value) })}
                  helperText="Minutes before auto-logout" />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth type="number" label="Min Password Length" value={form.minPasswordLength}
                  onChange={(e) => updateForm({ minPasswordLength: Number(e.target.value) })}
                  helperText="Minimum characters" />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth label="Allowed Origins" value={form.allowedOrigins}
                  onChange={(e) => updateForm({ allowedOrigins: e.target.value })}
                  helperText="Comma-separated domains" />
              </Grid>
            </Grid>
          </Paper>
        </TabPanel>

        {/* Modules Tab */}
        <TabPanel value={activeTab} index={4}>
          <Paper sx={{ p: 3, borderRadius: '16px' }}>
            <Typography variant="h6" fontWeight={700} mb={1}>Feature Modules</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Enable or disable platform modules. Disabled modules are hidden from the sidebar.
            </Typography>
            <Grid container spacing={2}>
              {FEATURE_MODULES.map(mod => {
                const isEnabled = form.featureFlags[mod.key];
                return (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={mod.key}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2.5, borderRadius: '16px', transition: 'all 200ms ease',
                        borderColor: isEnabled ? mod.color : theme.palette.divider,
                        bgcolor: isEnabled ? alpha(mod.color, 0.04) : 'transparent',
                        '&:hover': { borderColor: mod.color }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{
                          width: 44, height: 44, borderRadius: '12px',
                          bgcolor: alpha(mod.color, 0.1), display: 'flex',
                          alignItems: 'center', justifyContent: 'center'
                        }}>
                          <mod.icon size={22} color={mod.color} />
                        </Box>
                        <Switch checked={isEnabled} onChange={(e) => handleFeatureToggle(mod.key, e.target.checked)} />
                      </Box>
                      <Typography variant="subtitle1" fontWeight={700} mb={0.5}>{mod.label}</Typography>
                      <Typography variant="caption" color="text.secondary">{mod.description}</Typography>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>
        </TabPanel>
      </Box>

      {/* Custom Theme Creator Modal */}
      {showThemeCreator && (
        <Paper 
          sx={{ 
            position: 'fixed', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            width: '90vw',
            maxWidth: 800,
            height: '90vh',
            maxHeight: '90vh',
            zIndex: 1300,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <CustomThemeCreator
            basePreset={editingTheme || undefined}
            onSave={async (newTheme) => {
              await addCustomTheme(newTheme);
              await applyCustomTheme(newTheme.id);
              updateForm({ themePreset: newTheme.id, theme: newTheme.mode });
              setShowThemeCreator(false);
              setEditingTheme(null);
            }}
            onCancel={() => {
              setShowThemeCreator(false);
              setEditingTheme(null);
            }}
            existingThemes={safeSettings.customThemes}
          />
        </Paper>
      )}
      
      {/* Modal Backdrop */}
      {showThemeCreator && (
        <Box 
          onClick={() => { setShowThemeCreator(false); setEditingTheme(null); }}
          sx={{ 
            position: 'fixed', 
            inset: 0, 
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 1299,
          }} 
        />
      )}
    </Box>
  );
}
