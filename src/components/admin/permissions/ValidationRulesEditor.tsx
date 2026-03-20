'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import { Plus, Trash2, Edit2, AlertTriangle, Info } from 'lucide-react';
import { useSchemaStore } from '@/store/schema';
import { usePermissionsStore, type ValidationRule } from '@/store/permissions';

interface ValidationRulesEditorProps {
  roleId: string;
  collection: string;
  disabled?: boolean;
}

const VALIDATION_TYPES = [
  { value: 'required', label: 'Required' },
  { value: 'min_length', label: 'Minimum Length' },
  { value: 'max_length', label: 'Maximum Length' },
  { value: 'min', label: 'Minimum Value' },
  { value: 'max', label: 'Maximum Value' },
  { value: 'pattern', label: 'Pattern (Regex)' },
  { value: 'email', label: 'Email Format' },
  { value: 'url', label: 'URL Format' },
  { value: 'alpha', label: 'Alphabetic Only' },
  { value: 'alphanumeric', label: 'Alphanumeric Only' },
  { value: 'numeric', label: 'Numeric Only' },
  { value: 'json', label: 'Valid JSON' },
];

interface RuleFormData {
  field: string;
  type: string;
  value: string;
  errorMessage: string;
}

export default function ValidationRulesEditor({
  roleId,
  collection,
  disabled = false,
}: ValidationRulesEditorProps) {
  const collections = useSchemaStore((state) => state.collections);
  const collectionConfig = collections[collection];
  const fields = collectionConfig?.fields || [];

  const {
    validationRules,
    isLoading,
    fetchRolePermissions,
    addValidationRule,
    updateValidationRule,
    deleteValidationRule,
  } = usePermissionsStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ValidationRule | null>(null);
  const [formData, setFormData] = useState<RuleFormData>({
    field: '',
    type: 'required',
    value: '',
    errorMessage: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (roleId) {
      fetchRolePermissions(roleId);
    }
  }, [roleId, fetchRolePermissions]);

  const collectionRules = validationRules.filter((r) => r.collection === collection);

  const openAddDialog = () => {
    setEditingRule(null);
    setFormData({
      field: fields[0]?.name || '',
      type: 'required',
      value: '',
      errorMessage: '',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (rule: ValidationRule) => {
    setEditingRule(rule);
    setFormData({
      field: rule.field,
      type: (rule.rule?.type as string) || 'required',
      value: (rule.rule?.value as string) || '',
      errorMessage: rule.errorMessage,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingRule(null);
  };

  const handleSave = async () => {
    if (!formData.field || !formData.errorMessage) return;

    setSaving(true);
    try {
      const ruleData: Omit<ValidationRule, 'id'> = {
        collection,
        field: formData.field,
        rule: {
          type: formData.type,
          ...(formData.value && { value: formData.value }),
        },
        errorMessage: formData.errorMessage,
      };

      if (editingRule) {
        await updateValidationRule({
          ...editingRule,
          ...ruleData,
        });
      } else {
        await addValidationRule(ruleData);
      }
      closeDialog();
    } catch (error) {
      console.error('Failed to save validation rule:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this validation rule?')) return;

    try {
      await deleteValidationRule(ruleId, collection);
    } catch (error) {
      console.error('Failed to delete validation rule:', error);
    }
  };

  const getValidationType = (rule: ValidationRule) => {
    return VALIDATION_TYPES.find((t) => t.value === rule.rule?.type) || VALIDATION_TYPES[0];
  };

  const getFieldLabel = (fieldName: string) => {
    const field = fields.find((f) => f.name === fieldName);
    return field?.label || fieldName;
  };

  const needsValue = (type: string) => {
    return ['min_length', 'max_length', 'min', 'max', 'pattern'].includes(type);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Info size={18} style={{ marginTop: 2, flexShrink: 0 }} />
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              Field Validation Rules
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Define validation rules to enforce data integrity. Users will see an error message
              when they enter invalid data.
            </Typography>
          </Box>
        </Box>
      </Alert>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<Plus size={16} />}
          onClick={openAddDialog}
          disabled={disabled || fields.length === 0}
          size="small"
        >
          Add Validation Rule
        </Button>
      </Box>

      {collectionRules.length === 0 ? (
        <Alert severity="warning">
          No validation rules defined for this collection. Add rules to enforce data quality.
        </Alert>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Field</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Rule Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Value</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Error Message</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 100 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {collectionRules.map((rule) => {
                const validationType = getValidationType(rule);
                return (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <Chip label={getFieldLabel(rule.field)} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<AlertTriangle size={12} />}
                        label={validationType.label}
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {typeof rule.rule?.value === 'string' ? rule.rule.value : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={rule.errorMessage}>
                        <Typography
                          variant="body2"
                          sx={{
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {rule.errorMessage}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => openEditDialog(rule)}
                          disabled={disabled}
                        >
                          <Edit2 size={14} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(rule.id)}
                          disabled={disabled}
                          color="error"
                        >
                          <Trash2 size={14} />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingRule ? 'Edit Validation Rule' : 'Add Validation Rule'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Field</InputLabel>
              <Select
                value={formData.field}
                label="Field"
                onChange={(e) => setFormData({ ...formData, field: e.target.value })}
              >
                {fields.map((field) => (
                  <MenuItem key={field.name} value={field.name}>
                    {field.label || field.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Validation Type</InputLabel>
              <Select
                value={formData.type}
                label="Validation Type"
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                {VALIDATION_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {needsValue(formData.type) && (
              <TextField
                label={
                  formData.type === 'pattern'
                    ? 'Regex Pattern'
                    : formData.type.includes('length')
                    ? 'Length Value'
                    : 'Numeric Value'
                }
                size="small"
                fullWidth
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder={
                  formData.type === 'pattern' ? '^[a-zA-Z]+$' : formData.type.includes('length') ? '10' : '0'
                }
              />
            )}

            <TextField
              label="Error Message"
              size="small"
              fullWidth
              multiline
              rows={2}
              value={formData.errorMessage}
              onChange={(e) => setFormData({ ...formData, errorMessage: e.target.value })}
              placeholder="This field is required"
              helperText="The message shown to users when validation fails"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !formData.field || !formData.errorMessage}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
