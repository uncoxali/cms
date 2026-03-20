"use client";

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import { alpha } from '@mui/material/styles';
import { FieldConfig } from '@/lib/meta/collections';
import {
  X, Columns3, GripVertical, Eye, EyeOff, RotateCcw, Search
} from 'lucide-react';

interface ColumnConfig {
  field: string;
  label: string;
  visible: boolean;
  width?: number;
  order: number;
}

interface ColumnCustomizerProps {
  open: boolean;
  onClose: () => void;
  fields: FieldConfig[];
  currentColumns: string[];
  onApply: (columns: string[]) => void;
}

export function ColumnCustomizer({
  open,
  onClose,
  fields,
  currentColumns,
  onApply,
}: ColumnCustomizerProps) {
  const [search, setSearch] = useState('');
  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    return fields
      .filter(f => f.type !== 'relation' && f.type !== 'file' && f.type !== 'chart')
      .map((f, i) => ({
        field: f.name,
        label: f.label,
        visible: currentColumns.includes(f.name),
        order: currentColumns.indexOf(f.name) !== -1 ? currentColumns.indexOf(f.name) : i,
      }))
      .sort((a, b) => a.order - b.order);
  });

  const filteredColumns = columns.filter(c =>
    c.label.toLowerCase().includes(search.toLowerCase()) ||
    c.field.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleVisibility = (field: string) => {
    setColumns(columns.map(c =>
      c.field === field ? { ...c, visible: !c.visible } : c
    ));
  };

  const handleToggleAll = (visible: boolean) => {
    setColumns(columns.map(c => ({ ...c, visible })));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newColumns = [...columns];
    [newColumns[index - 1], newColumns[index]] = [newColumns[index], newColumns[index - 1]];
    setColumns(newColumns);
  };

  const handleMoveDown = (index: number) => {
    if (index === columns.length - 1) return;
    const newColumns = [...columns];
    [newColumns[index], newColumns[index + 1]] = [newColumns[index + 1], newColumns[index]];
    setColumns(newColumns);
  };

  const handleReset = () => {
    setColumns(fields
      .filter(f => f.type !== 'relation' && f.type !== 'file' && f.type !== 'chart')
      .map((f, i) => ({
        field: f.name,
        label: f.label,
        visible: true,
        order: i,
      })));
  };

  const handleApply = () => {
    const visibleColumns = columns
      .filter(c => c.visible)
      .sort((a, b) => a.order - b.order)
      .map(c => c.field);
    onApply(visibleColumns);
    onClose();
  };

  const visibleCount = columns.filter(c => c.visible).length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: alpha('#8B5CF6', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Columns3 size={18} color="#8B5CF6" />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>Customize Columns</Typography>
            <Typography variant="caption" color="text.secondary">
              {visibleCount} of {columns.length} columns visible
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose}><X size={18} /></IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            size="small"
            placeholder="Search columns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1 }}
            slotProps={{ input: { startAdornment: <Search size={16} style={{ marginRight: 8, opacity: 0.5 }} /> } }}
          />
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Button size="small" onClick={() => handleToggleAll(true)}>Show All</Button>
            <Button size="small" onClick={() => handleToggleAll(false)}>Hide All</Button>
          </Box>
        </Box>

        <Paper variant="outlined" sx={{ maxHeight: 400, overflow: 'auto' }}>
          <List dense>
            {filteredColumns.length === 0 ? (
              <ListItem>
                <ListItemText primary="No columns found" />
              </ListItem>
            ) : (
              filteredColumns.map((col, index) => {
                const originalIndex = columns.findIndex(c => c.field === col.field);
                return (
                  <ListItem
                    key={col.field}
                    sx={{
                      bgcolor: col.visible ? 'transparent' : alpha('#8B5CF6', 0.03),
                      '&:hover': { bgcolor: alpha('#8B5CF6', 0.06) },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <GripVertical size={16} style={{ opacity: 0.4, cursor: 'grab' }} />
                    </ListItemIcon>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Checkbox
                        edge="start"
                        checked={col.visible}
                        onChange={() => handleToggleVisibility(col.field)}
                        size="small"
                        sx={{ p: 0.5 }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={col.label}
                      secondary={col.field}
                      slotProps={{
                        primary: { fontWeight: 500, fontSize: 14 },
                        secondary: { fontSize: 12 },
                      }}
                    />
                    <ListItemSecondaryAction sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Move up">
                        <IconButton
                          size="small"
                          onClick={() => handleMoveUp(originalIndex)}
                          disabled={originalIndex === 0}
                        >
                          <Typography sx={{ fontSize: 14, lineHeight: 1 }}>↑</Typography>
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Move down">
                        <IconButton
                          size="small"
                          onClick={() => handleMoveDown(originalIndex)}
                          disabled={originalIndex === columns.length - 1}
                        >
                          <Typography sx={{ fontSize: 14, lineHeight: 1 }}>↓</Typography>
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                );
              })
            )}
          </List>
        </Paper>

        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {columns.filter(c => c.visible).map(col => (
            <Chip
              key={col.field}
              label={col.label}
              size="small"
              onDelete={() => handleToggleVisibility(col.field)}
              sx={{ bgcolor: alpha('#8B5CF6', 0.1), color: '#8B5CF6' }}
            />
          ))}
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Button size="small" startIcon={<RotateCcw size={14} />} onClick={handleReset}>
          Reset to Default
        </Button>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button onClick={onClose} variant="outlined">Cancel</Button>
          <Button onClick={handleApply} variant="contained">Apply</Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
