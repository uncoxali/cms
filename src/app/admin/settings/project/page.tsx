"use client";

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import { Save, Palette, Globe, Shield, Eye, LayoutDashboard, FolderOpen, Zap, Activity, Blocks } from 'lucide-react';
import { useProjectStore } from '@/store/project';
import { useActivityStore } from '@/store/activity';
import { useNotificationsStore } from '@/store/notifications';

const TIMEZONE_OPTIONS = [
  'UTC', 'Asia/Tehran', 'Asia/Dubai', 'Asia/Tokyo', 'Asia/Shanghai',
  'America/New_York', 'America/Chicago', 'America/Los_Angeles',
  'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'Europe/Istanbul',
  'Australia/Sydney',
];

const LOCALE_OPTIONS = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'fa-IR', label: 'فارسی (ایران)' },
  { value: 'ar-SA', label: 'العربية (السعودية)' },
  { value: 'fr-FR', label: 'Français' },
  { value: 'de-DE', label: 'Deutsch' },
  { value: 'tr-TR', label: 'Türkçe' },
  { value: 'zh-CN', label: '中文 (简体)' },
  { value: 'ja-JP', label: '日本語' },
];

const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Nunito', label: 'Nunito' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Raleway', label: 'Raleway' },
  { value: 'Fira Sans', label: 'Fira Sans' },
  { value: 'Ubuntu', label: 'Ubuntu' },
  { value: 'Source Sans 3', label: 'Source Sans 3' },
  { value: 'Noto Sans', label: 'Noto Sans' },
  { value: 'Vazirmatn', label: 'Vazirmatn (فارسی)' },
  { value: 'Yekan Bakh', label: 'Yekan Bakh (فارسی)' },
  { value: 'Noto Sans Arabic', label: 'Noto Sans Arabic (عربی)' },
  { value: 'system-ui', label: 'System Default' },
  { value: 'monospace', label: 'Monospace' },
];

const DATE_FORMAT_OPTIONS = [
  'YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY', 'DD.MM.YYYY', 'YYYY/MM/DD',
];

const FEATURE_MODULES = [
  { key: 'insights' as const, label: 'Dashboard / Insights', description: 'Analytics dashboards and data visualization panels.', icon: LayoutDashboard },
  { key: 'files' as const, label: 'File Library', description: 'File uploads, management, and asset library.', icon: FolderOpen },
  { key: 'flows' as const, label: 'Automations / Flows', description: 'Event-driven automation workflows.', icon: Zap },
  { key: 'activity' as const, label: 'Activity Logs', description: 'Track all system events and user actions.', icon: Activity },
  { key: 'extensions' as const, label: 'Extensions', description: 'Module and plugin management.', icon: Blocks },
];

export default function ProjectSettingsPage() {
  const { settings, fetchSettings, updateSettings, updateFeatureFlag } = useProjectStore();
  const { addLog } = useActivityStore();
  const { addNotification } = useNotificationsStore();

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const [form, setForm] = useState({ ...settings });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateSettings(form);
    addLog({ action: 'update', collection: 'projectSettings', user: 'Admin User', meta: { section: 'all', changes: form } });
    addNotification({ title: 'Project Settings Saved', message: 'All project settings have been updated successfully.' });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleFeatureToggle = (flag: keyof typeof settings.featureFlags, val: boolean) => {
    updateFeatureFlag(flag, val);
    setForm({ ...form, featureFlags: { ...form.featureFlags, [flag]: val } });
    const mod = FEATURE_MODULES.find(m => m.key === flag);
    addLog({ action: 'update', collection: 'projectSettings', user: 'Admin User', meta: { featureFlag: flag, enabled: val } });
    addNotification({
      title: val ? 'Module Enabled' : 'Module Disabled',
      message: `${mod?.label || flag} has been ${val ? 'enabled' : 'disabled'}.`
    });
  };

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={600}>Project Settings</Typography>
          <Typography variant="body2" color="text.secondary">Configure your project's identity, defaults, appearance, and security.</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Save size={18} />}
          onClick={handleSave}
          color={saved ? 'success' : 'primary'}
        >
          {saved ? 'Saved ✓' : 'Save All Changes'}
        </Button>
      </Box>

      <Grid container spacing={4}>
        {/* ═══ Section 1: General ═══ */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={1} display="flex" alignItems="center" gap={1}>
              <Palette size={20} /> General
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>Project identity and branding.</Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Project Name"
                  value={form.projectName}
                  onChange={(e) => setForm({ ...form, projectName: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Project URL"
                  value={form.projectUrl}
                  onChange={(e) => setForm({ ...form, projectUrl: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Project Description"
                  value={form.projectDescription}
                  onChange={(e) => setForm({ ...form, projectDescription: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Project Logo URL"
                  value={form.logoUrl}
                  onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                  helperText="A direct URL to your project logo image."
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <TextField
                    fullWidth
                    label="Primary Color"
                    value={form.primaryColor}
                    onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  />
                  <Box sx={{ width: 56, height: 56, borderRadius: 1, bgcolor: form.primaryColor, flexShrink: 0, border: '2px solid', borderColor: 'divider', mt: '0px' }} />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <TextField
                    fullWidth
                    label="Accent Color"
                    value={form.accentColor}
                    onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                  />
                  <Box sx={{ width: 56, height: 56, borderRadius: 1, bgcolor: form.accentColor, flexShrink: 0, border: '2px solid', borderColor: 'divider', mt: '0px' }} />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Timezone"
                  value={form.timezone}
                  onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                >
                  {TIMEZONE_OPTIONS.map(tz => <MenuItem key={tz} value={tz}>{tz}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Default Locale"
                  value={form.defaultLanguage}
                  onChange={(e) => setForm({ ...form, defaultLanguage: e.target.value })}
                >
                  {LOCALE_OPTIONS.map(loc => <MenuItem key={loc.value} value={loc.value}>{loc.label}</MenuItem>)}
                </TextField>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* ═══ Section 2: Content & UI Defaults ═══ */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={600} mb={1} display="flex" alignItems="center" gap={1}>
              <Globe size={20} /> Content & UI Defaults
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>Default values applied when no preset or bookmark overrides them.</Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12,sm: 6 }}>
                <TextField
                  type="number"
                  fullWidth
                  label="Default Page Size"
                  value={form.defaultPageSize}
                  onChange={(e) => setForm({ ...form, defaultPageSize: Number(e.target.value) })}
                  helperText="Items per page in Explore views."
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Default Sort Field"
                  value={form.defaultSortField}
                  onChange={(e) => setForm({ ...form, defaultSortField: e.target.value })}
                  helperText="e.g. date_created, title"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Default Sort Order"
                  value={form.defaultSortOrder}
                  onChange={(e) => setForm({ ...form, defaultSortOrder: e.target.value as 'asc' | 'desc' })}
                >
                  <MenuItem value="asc">Ascending ↑</MenuItem>
                  <MenuItem value="desc">Descending ↓</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Date Format"
                  value={form.dateFormat}
                  onChange={(e) => setForm({ ...form, dateFormat: e.target.value })}
                >
                  {DATE_FORMAT_OPTIONS.map(df => <MenuItem key={df} value={df}>{df}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Time Format"
                  value={form.timeFormat}
                  onChange={(e) => setForm({ ...form, timeFormat: e.target.value })}
                >
                  <MenuItem value="HH:mm:ss">24-hour (HH:mm:ss)</MenuItem>
                  <MenuItem value="hh:mm A">12-hour (hh:mm AM/PM)</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Number Format"
                  value={form.numberFormat}
                  onChange={(e) => setForm({ ...form, numberFormat: e.target.value })}
                >
                  <MenuItem value="1,000.00">1,000.00 (English)</MenuItem>
                  <MenuItem value="1.000,00">1.000,00 (European)</MenuItem>
                  <MenuItem value="1 000.00">1 000.00 (French)</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* ═══ Section 3: Appearance ═══ */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={600} mb={1} display="flex" alignItems="center" gap={1}>
              <Eye size={20} /> Appearance
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>Customize the look and feel of the admin panel.</Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" fontWeight={600} mb={1}>Theme Mode</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {(['light', 'dark', 'system'] as const).map(t => (
                    <Paper
                      key={t}
                      onClick={() => setForm({ ...form, theme: t })}
                      sx={{
                        p: 2,
                        flex: 1,
                        textAlign: 'center',
                        cursor: 'pointer',
                        border: '2px solid',
                        borderColor: form.theme === t ? 'primary.main' : 'divider',
                        bgcolor: form.theme === t ? 'action.selected' : 'background.paper',
                        transition: 'all 0.2s',
                        '&:hover': { borderColor: 'primary.light' }
                      }}
                    >
                      <Typography variant="body2" fontWeight={form.theme === t ? 700 : 400} textTransform="capitalize">
                        {t === 'system' ? '🖥 System' : t === 'dark' ? '🌙 Dark' : '☀️ Light'}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  select
                  fullWidth
                  label="Font Family"
                  value={form.fontFamily}
                  onChange={(e) => setForm({ ...form, fontFamily: e.target.value })}
                >
                  {FONT_OPTIONS.map(f => (
                    <MenuItem key={f.value} value={f.value}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <Typography>{f.label}</Typography>
                        <Typography variant="caption" sx={{ fontFamily: `'${f.value}', sans-serif`, color: 'text.secondary', ml: 2 }}>
                          Aa Bb Cc 123
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Theme and font changes take effect immediately after saving.
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* ═══ Section 4: Features & Modules ═══ */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={1}>Features & Modules</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Enable or disable major platform modules. Disabled modules are hidden from the sidebar and navigation.
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
              {FEATURE_MODULES.map(mod => {
                const isEnabled = form.featureFlags[mod.key];
                return (
                  <Paper
                    key={mod.key}
                    variant="outlined"
                    sx={{
                      p: 2,
                      opacity: isEnabled ? 1 : 0.55,
                      transition: 'opacity 0.3s',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <mod.icon size={18} />
                        <Typography variant="body1" fontWeight={600}>{mod.label}</Typography>
                      </Box>
                      <Switch
                        checked={isEnabled}
                        onChange={(e) => handleFeatureToggle(mod.key, e.target.checked)}
                        size="small"
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">{mod.description}</Typography>
                  </Paper>
                );
              })}
            </Box>
          </Paper>
        </Grid>

        {/* ═══ Section 5: Security ═══ */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={1} display="flex" alignItems="center" gap={1}>
              <Shield size={20} /> Security
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>Basic security and session settings.</Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  type="number"
                  fullWidth
                  label="Session Timeout (minutes)"
                  value={form.sessionTimeout}
                  onChange={(e) => setForm({ ...form, sessionTimeout: Number(e.target.value) })}
                  helperText="Auto-logout after inactivity."
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  type="number"
                  fullWidth
                  label="Min Password Length"
                  value={form.minPasswordLength}
                  onChange={(e) => setForm({ ...form, minPasswordLength: Number(e.target.value) })}
                  helperText="Minimum characters for passwords."
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Allowed Origins (CORS)"
                  value={form.allowedOrigins}
                  onChange={(e) => setForm({ ...form, allowedOrigins: e.target.value })}
                  helperText="Comma-separated list. Use * for all."
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
