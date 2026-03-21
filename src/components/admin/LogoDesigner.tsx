"use client";

import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { alpha, useTheme } from '@mui/material/styles';
import { Image as ImageIcon, Sparkles, Type, Palette } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import IconPicker from './IconPicker';

const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Nunito', label: 'Nunito' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Vazirmatn', label: 'Vazirmatn' },
  { value: 'Yekan Bakh', label: 'Yekan Bakh' },
];

const PRESET_COLORS = [
  '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#EF4444',
  '#14B8A6', '#F97316', '#6366F1', '#84CC16', '#06B6D4', '#A855F7',
];

interface LogoSettings {
  type: 'image' | 'custom';
  text?: string;
  icon?: string;
  color?: string;
  font?: string;
}

interface LogoDesignerProps {
  settings: LogoSettings;
  logoUrl: string;
  onChange: (settings: LogoSettings) => void;
  onLogoUrlChange: (url: string) => void;
}

export default function LogoDesigner({ settings, logoUrl, onChange, onLogoUrlChange }: LogoDesignerProps) {
  const theme = useTheme();
  
  const IconComponent = useMemo(() => {
    if (!settings.icon) return null;
    return (LucideIcons as any)[settings.icon] || null;
  }, [settings.icon]);

  return (
    <Paper sx={{ p: 3, borderRadius: '16px' }}>
      <Typography variant="h6" fontWeight={700} mb={3}>Project Logo</Typography>
      
      <Grid container spacing={4}>
        {/* Preview Section */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Typography variant="subtitle2" fontWeight={600} mb={1.5} color="text.secondary">
            Logo Preview
          </Typography>
          <Box sx={{ 
            p: 3, 
            borderRadius: '12px', 
            bgcolor: theme.palette.mode === 'dark' ? alpha('#fff', 0.03) : alpha('#000', 0.02),
            border: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 160,
            transition: 'all 200ms ease'
          }}>
            {settings.type === 'image' ? (
              logoUrl ? (
                <Box 
                  component="img" 
                  src={logoUrl} 
                  alt="Logo" 
                  sx={{ maxHeight: 64, maxWidth: '100%', objectFit: 'contain' }} 
                />
              ) : (
                <Box sx={{ textAlign: 'center', opacity: 0.5 }}>
                  <ImageIcon size={40} strokeWidth={1.5} />
                  <Typography variant="caption" display="block">No Image URL</Typography>
                </Box>
              )
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {IconComponent && (
                  <Box sx={{ 
                    width: 44, 
                    height: 44, 
                    borderRadius: '10px', 
                    bgcolor: alpha(settings.color || '#8B5CF6', 0.1),
                    color: settings.color || '#8B5CF6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <IconComponent size={24} />
                  </Box>
                )}
                <Typography sx={{ 
                  fontWeight: 800, 
                  fontSize: 22, 
                  fontFamily: settings.font || 'Inter',
                  color: theme.palette.text.primary,
                  letterSpacing: '-0.02em'
                }}>
                  {settings.text || 'Project'}
                </Typography>
              </Box>
            )}
            
            <Box sx={{ mt: 3, width: '100%' }}>
              {/* Fake Sidebar/Header context preview */}
              <Box sx={{ 
                p: 1.5, 
                borderRadius: '8px', 
                bgcolor: theme.palette.mode === 'dark' ? '#111' : '#fff',
                border: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                {settings.type === 'image' ? (
                  <Box component="img" src={logoUrl} sx={{ width: 24, height: 24, objectFit: 'contain' }} />
                ) : (
                  IconComponent && <IconComponent size={18} color={settings.color} />
                )}
                <Typography variant="caption" fontWeight={700} sx={{ 
                  fontFamily: settings.font,
                  fontSize: 12
                }}>
                  {settings.text}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" display="block" align="center" sx={{ mt: 0.5 }}>
                Context Preview (Sidebar)
              </Typography>
            </Box>
          </Box>
        </Grid>

        {/* Controls Section */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle2" fontWeight={600} mb={1.5}>Logo Type</Typography>
            <ToggleButtonGroup
              value={settings.type}
              exclusive
              onChange={(_, v) => v && onChange({ ...settings, type: v })}
              size="small"
              fullWidth
            >
              <ToggleButton value="image" sx={{ gap: 1 }}>
                <ImageIcon size={16} /> Image URL
              </ToggleButton>
              <ToggleButton value="custom" sx={{ gap: 1 }}>
                <Sparkles size={16} /> Designed Logo
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {settings.type === 'image' ? (
            <TextField
              fullWidth
              label="Logo Image URL"
              placeholder="https://example.com/logo.png"
              value={logoUrl}
              onChange={(e) => onLogoUrlChange(e.target.value)}
              helperText="Provide a direct URL to your project logo image"
            />
          ) : (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Project Text"
                  value={settings.text}
                  onChange={(e) => onChange({ ...settings, text: e.target.value })}
                  placeholder="e.g. NexDirect"
                  slotProps={{ input: { startAdornment: <Type size={16} style={{ marginRight: 8, opacity: 0.5 }} /> } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <IconPicker 
                  value={settings.icon || ''} 
                  onChange={(v) => onChange({ ...settings, icon: v })}
                  label="Project Icon"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Brand Font"
                  value={settings.font}
                  onChange={(e) => onChange({ ...settings, font: e.target.value })}
                >
                  {FONT_OPTIONS.map(f => (
                    <MenuItem key={f.value} value={f.value}>
                      <Typography sx={{ fontFamily: f.value }}>{f.label}</Typography>
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary" display="block" mb={1} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Palette size={14} /> Brand Color
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {PRESET_COLORS.map(color => (
                    <Box 
                      key={color}
                      onClick={() => onChange({ ...settings, color })}
                      sx={{ 
                        width: 28, 
                        height: 28, 
                        borderRadius: '6px', 
                        bgcolor: color, 
                        cursor: 'pointer',
                        border: settings.color === color ? '2px solid' : '2px solid transparent',
                        borderColor: theme.palette.mode === 'dark' ? '#fff' : '#000',
                        transition: 'all 150ms ease',
                        '&:hover': { transform: 'scale(1.1)' }
                      }} 
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          )}
        </Grid>
      </Grid>
    </Paper>
  );
}
