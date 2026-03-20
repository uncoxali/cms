'use client';

import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { alpha, useTheme } from '@mui/material/styles';
import { Palette, Sun, Moon, RotateCcw, Plus } from 'lucide-react';
import { ThemePreset, THEME_PRESETS } from '@/lib/themes';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>{label}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '10px',
            bgcolor: value,
            border: '2px solid',
            borderColor: 'divider',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 150ms ease',
            '&:hover': {
              transform: 'scale(1.05)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }
          }}
        >
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '150%',
              height: '150%',
              cursor: 'pointer',
              opacity: 0,
            }}
          />
        </Box>
        <TextField
          size="small"
          value={value}
          onChange={(e) => {
            const val = e.target.value;
            if (/^#[0-9A-Fa-f]{6}$/.test(val) || /^#[0-9A-Fa-f]{3}$/.test(val)) {
              onChange(val);
            }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              fontFamily: 'monospace',
              fontSize: '0.875rem',
            }
          }}
        />
      </Box>
    </Box>
  );
}

interface CustomThemeCreatorProps {
  basePreset?: ThemePreset;
  onSave: (theme: ThemePreset) => void;
  onCancel: () => void;
  existingThemes?: ThemePreset[];
}

export default function CustomThemeCreator({ 
  basePreset, 
  onSave, 
  onCancel,
  existingThemes = [] 
}: CustomThemeCreatorProps) {
  const theme = useTheme();

  const getModeDefaults = (mode: 'light' | 'dark') => {
    const isDark = mode === 'dark';
    return {
      primary: '#8B5CF6',
      secondary: '#EC4899',
      background: { default: isDark ? '#0F0F14' : '#FAFAFA', paper: isDark ? '#1A1A24' : '#FFFFFF' },
      text: { primary: isDark ? '#F8FAFC' : '#1F2937', secondary: isDark ? '#94A3B8' : '#6B7280' },
      divider: isDark ? 'rgba(139, 92, 246, 0.12)' : 'rgba(139, 92, 246, 0.08)',
      success: '#10B981',
      error: '#EF4444',
      warning: '#F59E0B',
      info: '#3B82F6',
    };
  };

  const appIsDark = theme.palette.mode === 'dark';
  const initialMode = (basePreset?.mode || (appIsDark ? 'dark' : 'light')) as 'light' | 'dark';
  const initialModeDefaults = getModeDefaults(initialMode);
  const defaultColors = basePreset?.colors || initialModeDefaults;

  const [form, setForm] = useState({
    name: '',
    mode: initialMode,
    primary: defaultColors.primary,
    secondary: defaultColors.secondary,
    bgDefault: defaultColors.background.default,
    bgPaper: defaultColors.background.paper,
    textPrimary: defaultColors.text.primary,
    textSecondary: defaultColors.text.secondary,
    divider: defaultColors.divider,
    success: defaultColors.success,
    error: defaultColors.error,
    warning: defaultColors.warning,
    info: defaultColors.info,
  });

  const [saved, setSaved] = useState(false);

  const updateField = useCallback((field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  }, []);

  const handleModeChange = (nextMode: 'light' | 'dark') => {
    setForm((prev) => {
      const nextDefaults = getModeDefaults(nextMode);

      return {
        ...prev,
        mode: nextMode,
        bgDefault: nextDefaults.background.default,
        bgPaper: nextDefaults.background.paper,
        textPrimary: nextDefaults.text.primary,
        textSecondary: nextDefaults.text.secondary,
        divider: nextDefaults.divider,
      };
    });
    setSaved(false);
  };

  const handleSave = () => {
    const id = form.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString(36);
    const newTheme: ThemePreset = {
      id,
      name: form.name || 'Custom Theme',
      description: 'Custom theme created by user',
      mode: form.mode,
      colors: {
        primary: form.primary,
        secondary: form.secondary,
        background: { default: form.bgDefault, paper: form.bgPaper },
        text: { primary: form.textPrimary, secondary: form.textSecondary },
        divider: form.divider,
        success: form.success,
        error: form.error,
        warning: form.warning,
        info: form.info,
      },
    };
    onSave(newTheme);
    setSaved(true);
  };

  const handleReset = () => {
    const defaults = getModeDefaults(form.mode);
    setForm({
      name: '',
      mode: form.mode,
      primary: defaults.primary,
      secondary: defaults.secondary,
      bgDefault: defaults.background.default,
      bgPaper: defaults.background.paper,
      textPrimary: defaults.text.primary,
      textSecondary: defaults.text.secondary,
      divider: defaults.divider,
      success: defaults.success,
      error: defaults.error,
      warning: defaults.warning,
      info: defaults.info,
    });
    setSaved(false);
  };

  const handleDuplicate = (preset: ThemePreset) => {
    setForm({
      name: `${preset.name} Copy`,
      mode: preset.mode,
      primary: preset.colors.primary,
      secondary: preset.colors.secondary,
      bgDefault: preset.colors.background.default,
      bgPaper: preset.colors.background.paper,
      textPrimary: preset.colors.text.primary,
      textSecondary: preset.colors.text.secondary,
      divider: preset.colors.divider,
      success: preset.colors.success,
      error: preset.colors.error,
      warning: preset.colors.warning,
      info: preset.colors.info,
    });
  };

  const createThemeFromPreset = (preset: ThemePreset) => {
    const nextMode = form.mode;
    const modeDefaults = getModeDefaults(nextMode);
    const usePresetModeColors = preset.mode === nextMode;

    const baseName = `${preset.name} Copy`;
    const id = baseName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString(36);

    const newTheme: ThemePreset = {
      id,
      name: baseName,
      description: 'Custom theme created by user',
      mode: nextMode,
      colors: {
        primary: preset.colors.primary,
        secondary: preset.colors.secondary,
        background: {
          default: usePresetModeColors ? preset.colors.background.default : modeDefaults.background.default,
          paper: usePresetModeColors ? preset.colors.background.paper : modeDefaults.background.paper,
        },
        text: {
          primary: usePresetModeColors ? preset.colors.text.primary : modeDefaults.text.primary,
          secondary: usePresetModeColors ? preset.colors.text.secondary : modeDefaults.text.secondary,
        },
        divider: usePresetModeColors ? preset.colors.divider : modeDefaults.divider,
        success: preset.colors.success,
        error: preset.colors.error,
        warning: preset.colors.warning,
        info: preset.colors.info,
      },
    };

    onSave(newTheme);
    setSaved(true);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3, minHeight: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Palette size={20} color={theme.palette.primary.main} />
            <Typography variant="h6" fontWeight={700}>Create Custom Theme</Typography>
          </Box>
          <ToggleButtonGroup
            value={form.mode}
            exclusive
              onChange={(_, v) => v && handleModeChange(v as 'light' | 'dark')}
            size="small"
          >
            <ToggleButton value="light"><Sun size={14} /></ToggleButton>
            <ToggleButton value="dark"><Moon size={14} /></ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <TextField
          fullWidth
          label="Theme Name"
          value={form.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="My Custom Theme"
          sx={{ mb: 3 }}
        />

        <Typography variant="subtitle2" fontWeight={700} mb={2}>Brand Colors</Typography>
        <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: '12px' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5 }}>
            <ColorPicker label="Primary Color" value={form.primary} onChange={(v) => updateField('primary', v)} />
            <ColorPicker label="Secondary Color" value={form.secondary} onChange={(v) => updateField('secondary', v)} />
          </Box>
        </Paper>

        <Typography variant="subtitle2" fontWeight={700} mb={2}>Background Colors</Typography>
        <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: '12px' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5 }}>
            <ColorPicker label="Default Background" value={form.bgDefault} onChange={(v) => updateField('bgDefault', v)} />
            <ColorPicker label="Paper Background" value={form.bgPaper} onChange={(v) => updateField('bgPaper', v)} />
          </Box>
        </Paper>

        <Typography variant="subtitle2" fontWeight={700} mb={2}>Text Colors</Typography>
        <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: '12px' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5 }}>
            <ColorPicker label="Primary Text" value={form.textPrimary} onChange={(v) => updateField('textPrimary', v)} />
            <ColorPicker label="Secondary Text" value={form.textSecondary} onChange={(v) => updateField('textSecondary', v)} />
          </Box>
          <Box sx={{ mt: 2.5 }}>
            <ColorPicker label="Divider Color" value={form.divider} onChange={(v) => updateField('divider', v)} />
          </Box>
        </Paper>

        <Typography variant="subtitle2" fontWeight={700} mb={2}>Status Colors</Typography>
        <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: '12px' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
            <ColorPicker label="Success" value={form.success} onChange={(v) => updateField('success', v)} />
            <ColorPicker label="Error" value={form.error} onChange={(v) => updateField('error', v)} />
            <ColorPicker label="Warning" value={form.warning} onChange={(v) => updateField('warning', v)} />
            <ColorPicker label="Info" value={form.info} onChange={(v) => updateField('info', v)} />
          </Box>
        </Paper>

        <Typography variant="subtitle2" fontWeight={700} mb={2}>Quick Start from Preset</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
          {Object.values(THEME_PRESETS).slice(0, 8).map((preset) => (
            <Paper
              key={preset.id}
              onClick={() => {
                // اگر کاربر هنوز چیزی برای تم وارد نکرده، انتخاب preset باعث ساخت و اضافه‌شدن تم می‌شود.
                if (!form.name.trim()) createThemeFromPreset(preset);
                else handleDuplicate(preset);
              }}
              sx={{
                p: 1.5,
                cursor: 'pointer',
                borderRadius: '10px',
                border: `2px solid transparent`,
                transition: 'all 150ms ease',
                '&:hover': {
                  borderColor: preset.colors.primary,
                  transform: 'translateY(-2px)',
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ display: 'flex', gap: 0.25 }}>
                  <Box sx={{ width: 14, height: 14, borderRadius: '4px', bgcolor: preset.colors.primary }} />
                  <Box sx={{ width: 14, height: 14, borderRadius: '4px', bgcolor: preset.colors.secondary }} />
                </Box>
                <Typography variant="caption" fontWeight={500}>{preset.name}</Typography>
                <Box sx={{ flex: 1 }} />
                <IconButton
                  size="small"
                  aria-label={`Add preset ${preset.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    createThemeFromPreset(preset);
                  }}
                  sx={{
                    bgcolor: alpha(preset.colors.primary, 0.08),
                    color: preset.colors.primary,
                    border: `1px solid ${alpha(preset.colors.primary, 0.25)}`,
                    '&:hover': {
                      bgcolor: alpha(preset.colors.primary, 0.14),
                    }
                  }}
                >
                  <Plus size={14} />
                </IconButton>
              </Box>
            </Paper>
          ))}
        </Box>

        <Paper 
          sx={{ 
            p: 2, 
            borderRadius: '12px',
            bgcolor: form.mode === 'dark' ? form.bgDefault : form.bgDefault,
            border: `1px solid ${form.divider}`,
            transition: 'all 200ms ease'
          }}
        >
          <Typography variant="subtitle2" fontWeight={700} mb={2} sx={{ color: form.textPrimary }}>Live Preview</Typography>
          <Box sx={{ 
            p: 2, 
            borderRadius: '8px', 
            bgcolor: form.bgPaper,
            border: `1px solid ${form.divider}`
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: form.primary }} />
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: 13, color: form.textPrimary }}>
                  Theme Preview
                </Typography>
                <Typography sx={{ fontSize: 11, color: form.textSecondary }}>
                  Sample text in {form.mode} mode
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Box sx={{ px: 1.5, py: 0.5, borderRadius: '6px', bgcolor: alpha(form.success, 0.1), color: form.success, fontSize: 11, fontWeight: 600 }}>Success</Box>
              <Box sx={{ px: 1.5, py: 0.5, borderRadius: '6px', bgcolor: alpha(form.error, 0.1), color: form.error, fontSize: 11, fontWeight: 600 }}>Error</Box>
              <Box sx={{ px: 1.5, py: 0.5, borderRadius: '6px', bgcolor: alpha(form.warning, 0.1), color: form.warning, fontSize: 11, fontWeight: 600 }}>Warning</Box>
              <Box sx={{ px: 1.5, py: 0.5, borderRadius: '6px', bgcolor: alpha(form.info, 0.1), color: form.info, fontSize: 11, fontWeight: 600 }}>Info</Box>
            </Box>
          </Box>
        </Paper>
      </Box>

      <Box sx={{ 
        p: 3, 
        borderTop: `1px solid ${theme.palette.divider}`,
        display: 'flex', 
        gap: 2, 
        justifyContent: 'space-between',
        alignItems: 'center',
        bgcolor: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(8px)',
      }}>
        <Button
          variant="text"
          startIcon={<RotateCcw size={16} />}
          onClick={handleReset}
          color="inherit"
        >
          Reset
        </Button>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={onCancel}
            sx={{ borderRadius: '10px', minWidth: 100 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={handleSave}
            disabled={!form.name}
            sx={{ 
              borderRadius: '10px', 
              minWidth: 150,
              background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #7C3AED 0%, #DB2777 100%)',
              },
              '&:disabled': {
                opacity: 0.5,
              },
              ...(saved ? { background: 'linear-gradient(135deg, #10B981 0%, #22C55E 100%)' } : {})
            }}
          >
            {saved ? 'Added!' : 'Add'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
