'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import { Plus, Trash2, Variable } from 'lucide-react';
import { useSchemaStore } from '@/store/schema';
import type { ItemFilter } from '@/store/permissions';

interface FilterBuilderProps {
  filters: ItemFilter[];
  onChange: (filters: ItemFilter[]) => void;
  collection: string;
  disabled?: boolean;
}

const OPERATORS = [
  { value: 'eq', label: 'Equals' },
  { value: 'neq', label: 'Not equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'starts_with', label: 'Starts with' },
  { value: 'ends_with', label: 'Ends with' },
  { value: 'gt', label: 'Greater than' },
  { value: 'gte', label: 'Greater than or equal' },
  { value: 'lt', label: 'Less than' },
  { value: 'lte', label: 'Less than or equal' },
  { value: 'in', label: 'In list (comma separated)' },
  { value: 'null', label: 'Is null' },
  { value: 'nnull', label: 'Is not null' },
];

const SYSTEM_VARIABLES = [
  { value: '$CURRENT_USER', label: '$CURRENT_USER', description: 'Current user ID' },
  { value: '$CURRENT_ROLE', label: '$CURRENT_ROLE', description: 'Current role ID' },
  { value: '$NOW', label: '$NOW', description: 'Current date/time' },
  { value: '$NOW(-1 day)', label: '$NOW(-1 day)', description: 'Yesterday' },
  { value: '$NOW(-1 week)', label: '$NOW(-1 week)', description: 'Last week' },
  { value: '$NOW(-1 month)', label: '$NOW(-1 month)', description: 'Last month' },
];

export default function FilterBuilder({
  filters,
  onChange,
  collection,
  disabled = false,
}: FilterBuilderProps) {
  const collections = useSchemaStore((state) => state.collections);
  const collectionConfig = collections[collection];
  const fields = collectionConfig?.fields || [];

  const [showVariablePicker, setShowVariablePicker] = useState<number | null>(null);

  const addFilter = () => {
    const newFilter: ItemFilter = {
      id: `filter_${Date.now()}`,
      field: fields[0]?.name || '',
      operator: 'eq',
      value: '',
      conjunction: filters.length > 0 ? 'and' : 'and',
    };
    onChange([...filters, newFilter]);
  };

  const updateFilter = (index: number, updates: Partial<ItemFilter>) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], ...updates };
    onChange(newFilters);
  };

  const removeFilter = (index: number) => {
    const newFilters = filters.filter((_, i) => i !== index);
    if (newFilters.length > 0 && index > 0) {
      newFilters[0].conjunction = 'and';
    }
    onChange(newFilters);
  };

  const insertVariable = (filterIndex: number, variable: string) => {
    const currentFilter = filters[filterIndex];
    updateFilter(filterIndex, { value: variable });
    setShowVariablePicker(null);
  };

  const needsValueField = (operator: string) => {
    return !['null', 'nnull'].includes(operator);
  };

  const getFieldType = (fieldName: string) => {
    const field = fields.find((f) => f.name === fieldName);
    return field?.type || 'string';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Alert severity="info" sx={{ mb: 1 }}>
        Use filters to restrict which items this role can access. Items not matching these filters will be hidden.
      </Alert>

      {filters.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {filters.map((filter, index) => (
            <Box key={filter.id}>
              {index > 0 && (
                <FormControl size="small" sx={{ minWidth: 80, mb: 1 }}>
                  <Select
                    value={filter.conjunction}
                    onChange={(e) =>
                      updateFilter(index, { conjunction: e.target.value as 'and' | 'or' })
                    }
                    disabled={disabled}
                    sx={{ fontSize: 12 }}
                  >
                    <MenuItem value="and">AND</MenuItem>
                    <MenuItem value="or">OR</MenuItem>
                  </Select>
                </FormControl>
              )}

              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Field</InputLabel>
                  <Select
                    value={filter.field}
                    label="Field"
                    onChange={(e) => updateFilter(index, { field: e.target.value })}
                    disabled={disabled}
                  >
                    {fields.map((field) => (
                      <MenuItem key={field.name} value={field.name}>
                        {field.label || field.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Operator</InputLabel>
                  <Select
                    value={filter.operator}
                    label="Operator"
                    onChange={(e) => updateFilter(index, { operator: e.target.value })}
                    disabled={disabled}
                  >
                    {OPERATORS.map((op) => (
                      <MenuItem key={op.value} value={op.value}>
                        {op.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {needsValueField(filter.operator) && (
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flex: 1 }}>
                    <TextField
                      size="small"
                      placeholder="Value"
                      value={filter.value}
                      onChange={(e) => updateFilter(index, { value: e.target.value })}
                      disabled={disabled}
                      sx={{ flex: 1, minWidth: 150 }}
                      type={getFieldType(filter.field) === 'integer' || getFieldType(filter.field) === 'float' ? 'number' : 'text'}
                    />
                    <IconButton
                      size="small"
                      onClick={() => setShowVariablePicker(showVariablePicker === index ? null : index)}
                      disabled={disabled}
                      title="Insert variable"
                    >
                      <Variable size={16} />
                    </IconButton>
                  </Box>
                )}

                <IconButton
                  size="small"
                  onClick={() => removeFilter(index)}
                  disabled={disabled || filters.length === 1}
                  color="error"
                >
                  <Trash2 size={16} />
                </IconButton>
              </Box>

              {showVariablePicker === index && (
                <Box
                  sx={{
                    mt: 1,
                    p: 1.5,
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                    display: 'flex',
                    gap: 1,
                    flexWrap: 'wrap',
                  }}
                >
                  {SYSTEM_VARIABLES.map((v) => (
                    <Chip
                      key={v.value}
                      label={v.label}
                      size="small"
                      onClick={() => insertVariable(index, v.value)}
                      sx={{ cursor: 'pointer', fontFamily: 'monospace' }}
                    />
                  ))}
                </Box>
              )}
            </Box>
          ))}
        </Box>
      )}

      <Button
        startIcon={<Plus size={16} />}
        onClick={addFilter}
        disabled={disabled || fields.length === 0}
        variant="outlined"
        size="small"
      >
        Add Filter
      </Button>

      {fields.length === 0 && (
        <Typography variant="caption" color="text.secondary">
          No fields available. Add fields to this collection first.
        </Typography>
      )}

      <Divider sx={{ my: 1 }} />

      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Available Variables:
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {SYSTEM_VARIABLES.map((v) => (
            <Chip
              key={v.value}
              label={`${v.label} - ${v.description}`}
              size="small"
              variant="outlined"
              sx={{ fontSize: 10 }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
