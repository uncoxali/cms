"use client";

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { alpha } from '@mui/material/styles';
import { FieldConfig } from '@/lib/meta/collections';
import {
  X, Plus, Trash2, Edit3, Check, Copy
} from 'lucide-react';

interface BulkEditDialogProps {
  open: boolean;
  onClose: () => void;
  selectedItems: string[];
  fields: FieldConfig[];
  onBulkEdit: (updates: Record<string, unknown>) => Promise<void>;
}

interface BulkUpdate {
  field: string;
  value: unknown;
  enabled: boolean;
}

export function BulkEditDialog({
  open,
  onClose,
  selectedItems,
  fields,
  onBulkEdit,
}: BulkEditDialogProps) {
  const [updates, setUpdates] = useState<BulkUpdate[]>([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const editableFields = fields.filter(f => 
    f.type !== 'relation' && f.type !== 'file' && f.type !== 'chart'
  );

  const handleAddField = () => {
    const firstField = editableFields[0];
    if (firstField) {
      setUpdates([...updates, { field: firstField.name, value: getDefaultValue(firstField.type), enabled: true }]);
    }
  };

  const handleRemoveField = (index: number) => {
    setUpdates(updates.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, field: string) => {
    const newUpdates = [...updates];
    const fieldConfig = editableFields.find(f => f.name === field);
    newUpdates[index] = {
      ...newUpdates[index],
      field,
      value: getDefaultValue(fieldConfig?.type || 'string'),
    };
    setUpdates(newUpdates);
  };

  const handleValueChange = (index: number, value: unknown) => {
    const newUpdates = [...updates];
    newUpdates[index] = { ...newUpdates[index], value };
    setUpdates(newUpdates);
  };

  const handleEnabledChange = (index: number, enabled: boolean) => {
    const newUpdates = [...updates];
    newUpdates[index] = { ...newUpdates[index], enabled };
    setUpdates(newUpdates);
  };

  const getDefaultValue = (type: string): unknown => {
    switch (type) {
      case 'string':
      case 'text':
      case 'textarea':
      case 'rich-text':
        return '';
      case 'number':
      case 'integer':
      case 'float':
        return 0;
      case 'boolean':
        return false;
      case 'datetime':
        return new Date().toISOString();
      case 'select':
        return '';
      default:
        return '';
    }
  };

  const getFieldComponent = (update: BulkUpdate, index: number) => {
    const field = editableFields.find(f => f.name === update.field);
    if (!field) return null;

    switch (field.type) {
      case 'boolean':
        return (
          <FormControlLabel
            control={
              <Switch
                checked={update.value as boolean}
                onChange={(e) => handleValueChange(index, e.target.checked)}
              />
            }
            label={update.value ? 'True' : 'False'}
          />
        );
      case 'select':
        return (
          <Select
            value={update.value as string}
            onChange={(e) => handleValueChange(index, e.target.value)}
            size="small"
            sx={{ width: '100%' }}
          >
            <MenuItem value="">— Keep existing —</MenuItem>
            {(field.options || []).map((opt: { label: string; value: string }) => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        );
      case 'datetime':
        return (
          <TextField
            type="datetime-local"
            value={update.value ? String(update.value).slice(0, 16) : ''}
            onChange={(e) => handleValueChange(index, e.target.value)}
            size="small"
            sx={{ width: '100%' }}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        );
      case 'number':
      case 'integer':
      case 'float':
        return (
          <TextField
            type="number"
            value={update.value as number}
            onChange={(e) => handleValueChange(index, Number(e.target.value))}
            size="small"
            sx={{ width: '100%' }}
            placeholder="Enter value or leave empty"
          />
        );
      default:
        return (
          <TextField
            value={update.value as string}
            onChange={(e) => handleValueChange(index, e.target.value)}
            size="small"
            sx={{ width: '100%' }}
            placeholder="Enter value or leave empty"
          />
        );
    }
  };

  const handleSubmit = async () => {
    const enabledUpdates = updates.filter(u => u.enabled);
    if (enabledUpdates.length === 0) {
      setSnackbar({ open: true, message: 'Please enable at least one field to update', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      const updateData: Record<string, unknown> = {};
      enabledUpdates.forEach(u => {
        updateData[u.field] = u.value;
      });

      await onBulkEdit(updateData);
      setSnackbar({ open: true, message: `Successfully updated ${selectedItems.length} items`, severity: 'success' });
      setUpdates([]);
      onClose();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to update items', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = () => {
    setUpdates([]);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <input type="hidden" />

      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: alpha('#8B5CF6', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Edit3 size={18} color="#8B5CF6" />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>Bulk Edit</Typography>
            <Typography variant="caption" color="text.secondary">
              Updating {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose}><X size={18} /></IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 3 }}>
        <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha('#8B5CF6', 0.02), mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Copy size={16} color="#8B5CF6" />
            <Typography variant="body2">
              Select which fields to update. Fields left empty will keep their existing values.
            </Typography>
          </Box>
        </Paper>

        {updates.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" mb={2}>
              No fields selected for update
            </Typography>
            <Button variant="outlined" startIcon={<Plus size={14} />} onClick={handleAddField}>
              Add Field to Update
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {updates.map((update, index) => {
              const field = editableFields.find(f => f.name === update.field);
              return (
                <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={update.enabled}
                          onChange={(e) => handleEnabledChange(index, e.target.checked)}
                        />
                      }
                      label=""
                      sx={{ mt: 0.5 }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                          <Select
                            value={update.field}
                            onChange={(e) => handleFieldChange(index, e.target.value)}
                          >
                            {editableFields.map(f => (
                              <MenuItem key={f.name} value={f.name}>{f.label}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveField(index)}
                          sx={{ mt: 0.5 }}
                        >
                          <Trash2 size={14} />
                        </IconButton>
                      </Box>
                      {update.enabled && getFieldComponent(update, index)}
                    </Box>
                  </Box>
                </Paper>
              );
            })}

            <Button
              size="small"
              variant="outlined"
              startIcon={<Plus size={14} />}
              onClick={handleAddField}
              sx={{ alignSelf: 'flex-start' }}
            >
              Add Another Field
            </Button>
          </Box>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Button size="small" color="error" onClick={handleClearAll} disabled={updates.length === 0}>
          Clear All
        </Button>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button onClick={onClose} variant="outlined" disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || updates.filter(u => u.enabled).length === 0}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Check size={16} />}
          >
            {loading ? 'Updating...' : `Update ${selectedItems.length} Items`}
          </Button>
        </Box>
      </DialogActions>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
}
