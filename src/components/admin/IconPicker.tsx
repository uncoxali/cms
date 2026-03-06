"use client";

import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Tooltip from '@mui/material/Tooltip';
import InputAdornment from '@mui/material/InputAdornment';
import { Search, X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { ICON_CATEGORIES, ALL_ICONS } from '@/lib/icons';

type LucideIconComponent = React.ComponentType<{ size?: number; strokeWidth?: number }>;

function getIconComponent(name: string): LucideIconComponent | null {
  const icon = (LucideIcons as Record<string, unknown>)[name];
  if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null)) {
    return icon as LucideIconComponent;
  }
  return null;
}

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
  label?: string;
}

export default function IconPicker({ value, onChange, label = 'Icon' }: IconPickerProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState(0);
  const open = Boolean(anchorEl);

  const SelectedIcon = value ? getIconComponent(value) : null;

  const filteredIcons = useMemo(() => {
    const lowerSearch = search.toLowerCase();
    if (!search) {
      if (tab === 0) return ALL_ICONS;
      return ICON_CATEGORIES[tab - 1]?.icons || [];
    }
    const source = tab === 0 ? ALL_ICONS : (ICON_CATEGORIES[tab - 1]?.icons || []);
    return source.filter((name) => name.toLowerCase().includes(lowerSearch));
  }, [search, tab]);

  return (
    <>
      <TextField
        fullWidth
        label={label}
        value={value || ''}
        onClick={(e) => setAnchorEl(e.currentTarget as HTMLElement)}
        slotProps={{
          input: {
            readOnly: true,
            startAdornment: SelectedIcon ? (
              <InputAdornment position="start">
                <SelectedIcon size={18} />
              </InputAdornment>
            ) : undefined,
            endAdornment: value ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); onChange(''); }}
                >
                  <X size={14} />
                </IconButton>
              </InputAdornment>
            ) : undefined,
          },
        }}
        sx={{ cursor: 'pointer' }}
      />
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => { setAnchorEl(null); setSearch(''); }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        sx={{ mt: 1 }}
      >
        <Box sx={{ width: 380, maxHeight: 460, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search icons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start"><Search size={16} /></InputAdornment>
                  ),
                },
              }}
            />
          </Box>

          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ minHeight: 36, borderBottom: 1, borderColor: 'divider', px: 1 }}
          >
            <Tab label="All" sx={{ minHeight: 36, py: 0, fontSize: 12 }} />
            {ICON_CATEGORIES.map((cat) => (
              <Tab key={cat.name} label={cat.name} sx={{ minHeight: 36, py: 0, fontSize: 12 }} />
            ))}
          </Tabs>

          <Box
            sx={{
              p: 1.5,
              overflowY: 'auto',
              maxHeight: 320,
              display: 'grid',
              gridTemplateColumns: 'repeat(8, 1fr)',
              gap: 0.5,
            }}
          >
            {filteredIcons.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ gridColumn: '1 / -1', textAlign: 'center', py: 4 }}>
                No icons found
              </Typography>
            )}
            {filteredIcons.map((name) => {
              const Icon = getIconComponent(name);
              if (!Icon) return null;
              const isSelected = value === name;
              return (
                <Tooltip key={name} title={name} arrow placement="top">
                  <IconButton
                    size="small"
                    onClick={() => {
                      onChange(name);
                      setAnchorEl(null);
                      setSearch('');
                    }}
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: '8px',
                      border: isSelected ? '2px solid' : '1px solid transparent',
                      borderColor: isSelected ? 'primary.main' : 'transparent',
                      bgcolor: isSelected ? 'action.selected' : 'transparent',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Icon size={18} />
                  </IconButton>
                </Tooltip>
              );
            })}
          </Box>
        </Box>
      </Popover>
    </>
  );
}
