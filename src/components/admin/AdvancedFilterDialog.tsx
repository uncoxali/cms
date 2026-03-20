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
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { alpha } from '@mui/material/styles';
import { FieldConfig } from '@/lib/meta/collections';
import {
  X, Plus, Trash2, Filter, GripVertical
} from 'lucide-react';

export interface FilterCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
}

export interface FilterGroup {
  id: string;
  logic: 'and' | 'or';
  conditions: FilterCondition[];
}

interface AdvancedFilterDialogProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: FilterGroup[]) => void;
  fields: FieldConfig[];
  currentFilters?: FilterGroup[];
}

const OPERATORS: Record<string, { label: string; value: string }[]> = {
  string: [
    { label: 'Contains', value: 'contains' },
    { label: 'Equals', value: 'eq' },
    { label: 'Not equals', value: 'neq' },
    { label: 'Starts with', value: 'starts' },
    { label: 'Ends with', value: 'ends' },
    { label: 'Is empty', value: 'empty' },
    { label: 'Is not empty', value: 'nempty' },
  ],
  text: [
    { label: 'Contains', value: 'contains' },
    { label: 'Equals', value: 'eq' },
    { label: 'Not equals', value: 'neq' },
    { label: 'Is empty', value: 'empty' },
    { label: 'Is not empty', value: 'nempty' },
  ],
  number: [
    { label: 'Equals', value: 'eq' },
    { label: 'Not equals', value: 'neq' },
    { label: 'Greater than', value: 'gt' },
    { label: 'Less than', value: 'lt' },
    { label: 'Greater or equal', value: 'gte' },
    { label: 'Less or equal', value: 'lte' },
    { label: 'Is empty', value: 'empty' },
    { label: 'Is not empty', value: 'nempty' },
  ],
  integer: [
    { label: 'Equals', value: 'eq' },
    { label: 'Not equals', value: 'neq' },
    { label: 'Greater than', value: 'gt' },
    { label: 'Less than', value: 'lt' },
    { label: 'Greater or equal', value: 'gte' },
    { label: 'Less or equal', value: 'lte' },
    { label: 'Is empty', value: 'empty' },
    { label: 'Is not empty', value: 'nempty' },
  ],
  select: [
    { label: 'Equals', value: 'eq' },
    { label: 'Not equals', value: 'neq' },
    { label: 'Contains', value: 'contains' },
    { label: 'Is empty', value: 'empty' },
    { label: 'Is not empty', value: 'nempty' },
  ],
  boolean: [
    { label: 'Is true', value: 'true' },
    { label: 'Is false', value: 'false' },
  ],
  datetime: [
    { label: 'Equals', value: 'eq' },
    { label: 'Before', value: 'lt' },
    { label: 'After', value: 'gt' },
    { label: 'Between', value: 'between' },
    { label: 'Is empty', value: 'empty' },
    { label: 'Is not empty', value: 'nempty' },
  ],
  file: [
    { label: 'Has file', value: 'nempty' },
    { label: 'No file', value: 'empty' },
  ],
};

const getOperatorsForField = (field: Partial<FieldConfig>): { label: string; value: string }[] => {
  return OPERATORS[field.type || 'string'] || OPERATORS.string;
};

const generateId = () => Math.random().toString(36).substring(2, 9);

export function AdvancedFilterDialog({
  open,
  onClose,
  onApply,
  fields,
  currentFilters = [],
}: AdvancedFilterDialogProps) {
  const [groups, setGroups] = useState<FilterGroup[]>(
    currentFilters.length > 0
      ? currentFilters
      : [{ id: generateId(), logic: 'and', conditions: [] }]
  );

  const activeFiltersCount = groups.reduce((sum, g) => sum + g.conditions.length, 0);

  const handleAddGroup = () => {
    setGroups([...groups, { id: generateId(), logic: 'and', conditions: [] }]);
  };

  const handleRemoveGroup = (groupId: string) => {
    setGroups(groups.filter(g => g.id !== groupId));
  };

  const handleGroupLogicChange = (groupId: string, logic: 'and' | 'or') => {
    setGroups(groups.map(g => g.id === groupId ? { ...g, logic } : g));
  };

  const handleAddCondition = (groupId: string) => {
    setGroups(groups.map(g => {
      if (g.id !== groupId) return g;
      const firstField = fields[0];
      return {
        ...g,
        conditions: [
          ...g.conditions,
          {
            id: generateId(),
            field: firstField?.name || '',
            operator: getOperatorsForField(firstField || { name: '', type: 'string' })[0]?.value || 'contains',
            value: '',
          },
        ],
      };
    }));
  };

  const handleRemoveCondition = (groupId: string, conditionId: string) => {
    setGroups(groups.map(g => {
      if (g.id !== groupId) return g;
      return { ...g, conditions: g.conditions.filter(c => c.id !== conditionId) };
    }));
  };

  const handleConditionChange = (groupId: string, conditionId: string, updates: Partial<FilterCondition>) => {
    setGroups(groups.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        conditions: g.conditions.map(c => c.id === conditionId ? { ...c, ...updates } : c),
      };
    }));
  };

  const handleClearAll = () => {
    setGroups([{ id: generateId(), logic: 'and', conditions: [] }]);
  };

  const handleApply = () => {
    const validFilters = groups.filter(g => g.conditions.length > 0);
    onApply(validFilters);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { maxHeight: '80vh' } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: alpha('#8B5CF6', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Filter size={18} color="#8B5CF6" />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>Advanced Filters</Typography>
            <Typography variant="caption" color="text.secondary">
              {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose}><X size={18} /></IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 3 }}>
        {groups.map((group, groupIndex) => (
          <Paper key={group.id} variant="outlined" sx={{ p: 2, mb: groupIndex < groups.length - 1 ? 2 : 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                Filter Group {groupIndex + 1}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <ToggleButtonGroup
                  value={group.logic}
                  exclusive
                  onChange={(_, v) => v && handleGroupLogicChange(group.id, v)}
                  size="small"
                >
                  <ToggleButton value="and" sx={{ px: 2, textTransform: 'none' }}>AND</ToggleButton>
                  <ToggleButton value="or" sx={{ px: 2, textTransform: 'none' }}>OR</ToggleButton>
                </ToggleButtonGroup>
                {groups.length > 1 && (
                  <IconButton size="small" color="error" onClick={() => handleRemoveGroup(group.id)}>
                    <Trash2 size={14} />
                  </IconButton>
                )}
              </Box>
            </Box>

            {group.conditions.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                No conditions. Add one below.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {group.conditions.map((condition, condIndex) => {
                  const field = fields.find(f => f.name === condition.field);
                  const operators = getOperatorsForField(field || { name: '', type: 'string' });
                  const showValue = !['empty', 'nempty', 'true', 'false'].includes(condition.operator);

                  return (
                    <Box key={condition.id} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                      <Box sx={{ pt: 1, color: 'text.secondary' }}>
                        <GripVertical size={16} />
                      </Box>
                      <FormControl size="small" sx={{ minWidth: 150 }}>
                        <Select
                          value={condition.field}
                          onChange={(e) => {
                            const newField = fields.find(f => f.name === e.target.value);
                            const newOperators = getOperatorsForField(newField || { name: '', type: 'string' });
                            handleConditionChange(group.id, condition.id, {
                              field: e.target.value,
                              operator: newOperators[0]?.value || 'contains',
                            });
                          }}
                        >
                          {fields.filter(f => f.type !== 'relation' && f.type !== 'file').map(f => (
                            <MenuItem key={f.name} value={f.name}>{f.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl size="small" sx={{ minWidth: 140 }}>
                        <Select
                          value={condition.operator}
                          onChange={(e) => handleConditionChange(group.id, condition.id, { operator: e.target.value })}
                        >
                          {operators.map(op => (
                            <MenuItem key={op.value} value={op.value}>{op.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      {showValue && (
                        <TextField
                          size="small"
                          placeholder="Value..."
                          value={condition.value}
                          onChange={(e) => handleConditionChange(group.id, condition.id, { value: e.target.value })}
                          sx={{ flex: 1, minWidth: 150 }}
                          type={field?.type === 'number' || field?.type === 'integer' || field?.type === 'float' ? 'number' : 'text'}
                        />
                      )}
                      <IconButton size="small" color="error" onClick={() => handleRemoveCondition(group.id, condition.id)} sx={{ mt: 0.5 }}>
                        <Trash2 size={14} />
                      </IconButton>
                    </Box>
                  );
                })}
              </Box>
            )}

            <Button
              size="small"
              startIcon={<Plus size={14} />}
              onClick={() => handleAddCondition(group.id)}
              sx={{ mt: 2 }}
            >
              Add Condition
            </Button>
          </Paper>
        ))}

        <Button
          size="small"
          variant="outlined"
          startIcon={<Plus size={14} />}
          onClick={handleAddGroup}
          sx={{ mt: 2 }}
        >
          Add Filter Group
        </Button>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" color="error" onClick={handleClearAll}>
            Clear All
          </Button>
          {activeFiltersCount > 0 && (
            <Chip
              label={`${activeFiltersCount} active`}
              size="small"
              sx={{ bgcolor: alpha('#8B5CF6', 0.1), color: '#8B5CF6' }}
              onDelete={handleClearAll}
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button onClick={onClose} variant="outlined">Cancel</Button>
          <Button onClick={handleApply} variant="contained">
            Apply Filters
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
