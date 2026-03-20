'use client';

import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import { useTheme, alpha } from '@mui/material/styles';
import { Table2, LayoutGrid, Calendar, Columns3 } from 'lucide-react';

export type LayoutType = 'table' | 'kanban' | 'calendar' | 'cards';

interface LayoutSelectorProps {
  value: LayoutType;
  onChange: (layout: LayoutType) => void;
  disabled?: boolean;
}

const LAYOUT_OPTIONS: { value: LayoutType; icon: React.ElementType; label: string }[] = [
  { value: 'table', icon: Table2, label: 'Table' },
  { value: 'kanban', icon: Columns3, label: 'Kanban' },
  { value: 'calendar', icon: Calendar, label: 'Calendar' },
  { value: 'cards', icon: LayoutGrid, label: 'Cards' },
];

export default function LayoutSelector({ value, onChange, disabled }: LayoutSelectorProps) {
  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mr: 1, fontSize: 13 }}>
        View:
      </Typography>
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={(_, newLayout) => {
          if (newLayout !== null) onChange(newLayout);
        }}
        disabled={disabled}
        size="small"
        sx={{
          '& .MuiToggleButton-root': {
            border: `1px solid ${theme.palette.divider}`,
            px: 1.5,
            py: 0.5,
            '&.Mui-selected': {
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              borderColor: alpha(theme.palette.primary.main, 0.5),
              color: theme.palette.primary.main,
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.18),
              },
            },
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.06),
            },
          },
        }}
      >
        {LAYOUT_OPTIONS.map((option) => (
          <ToggleButton key={option.value} value={option.value} aria-label={option.label}>
            <Tooltip title={option.label} arrow>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <option.icon size={16} />
              </Box>
            </Tooltip>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}
