'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Collapse from '@mui/material/Collapse';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Shield, Eye, EyeOff, Lock, Unlock, Check, X } from 'lucide-react';
import { useSchemaStore } from '@/store/schema';
import { usePermissionsStore, type FieldPermission } from '@/store/permissions';

interface FieldPermissionsEditorProps {
  roleId: string;
  collection: string;
  disabled?: boolean;
}

type PermissionLevel = 'none' | 'partial' | 'full';

const READ_OPTIONS: { value: PermissionLevel; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'none', label: 'No Access', icon: <EyeOff size={14} />, color: 'error' },
  { value: 'partial', label: 'Read Only', icon: <Eye size={14} />, color: 'warning' },
  { value: 'full', label: 'Full Access', icon: <Check size={14} />, color: 'success' },
];

const WRITE_OPTIONS: { value: PermissionLevel; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'none', label: 'No Access', icon: <Lock size={14} />, color: 'error' },
  { value: 'partial', label: 'Read Only', icon: <Eye size={14} />, color: 'warning' },
  { value: 'full', label: 'Full Access', icon: <Unlock size={14} />, color: 'success' },
];

export default function FieldPermissionsEditor({
  roleId,
  collection,
  disabled = false,
}: FieldPermissionsEditorProps) {
  const collections = useSchemaStore((state) => state.collections);
  const collectionConfig = collections[collection];
  const fields = collectionConfig?.fields || [];

  const {
    permissions,
    isLoading,
    fetchRolePermissions,
    updateFieldPermission,
  } = usePermissionsStore();

  const [expandedSystem, setExpandedSystem] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (roleId) {
      fetchRolePermissions(roleId);
    }
  }, [roleId, fetchRolePermissions]);

  const collectionPerms = permissions[roleId]?.collections?.[collection];
  const fieldPerms = collectionPerms?.fields || {};

  const systemFields = ['id', 'created_at', 'updated_at', 'created_by', 'updated_by'];
  const dataFields = fields.filter((f) => !systemFields.includes(f.name));
  const systemOnlyFields = fields.filter((f) => systemFields.includes(f.name));

  const getFieldPermission = (fieldName: string): FieldPermission => {
    return (
      fieldPerms[fieldName] || {
        read: 'full' as PermissionLevel,
        write: 'full' as PermissionLevel,
      }
    );
  };

  const handlePermissionChange = async (
    fieldName: string,
    type: 'read' | 'write',
    value: PermissionLevel
  ) => {
    setSaving(fieldName);
    try {
      await updateFieldPermission(roleId, collection, fieldName, type, value);
    } catch {
      // Error is handled in store
    } finally {
      setSaving(null);
    }
  };

  const setAllFields = async (type: 'read' | 'write', value: PermissionLevel) => {
    for (const field of dataFields) {
      setSaving(field.name);
      try {
        await updateFieldPermission(roleId, collection, field.name, type, value);
      } catch {
        // Continue with other fields
      }
    }
    setSaving(null);
  };

  const renderPermissionSelect = (
    fieldName: string,
    type: 'read' | 'write',
    currentValue: PermissionLevel
  ) => {
    const options = type === 'read' ? READ_OPTIONS : WRITE_OPTIONS;
    const activeOption = options.find((o) => o.value === currentValue);

    return (
      <Tooltip title={activeOption?.label || 'Select'}>
        <FormControl size="small">
          <Select
            value={currentValue}
            onChange={(e) =>
              handlePermissionChange(fieldName, type, e.target.value as PermissionLevel)
            }
            disabled={disabled || saving === fieldName}
            sx={{
              minWidth: 120,
              '& .MuiSelect-select': {
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              },
            }}
            startAdornment={
              <Box sx={{ display: 'flex', alignItems: 'center', color: `${activeOption?.color}.main` }}>
                {activeOption?.icon}
              </Box>
            }
          >
            {options.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ color: `${opt.color}.main` }}>{opt.icon}</Box>
                  {opt.label}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Tooltip>
    );
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
        Configure field-level permissions for <strong>{collectionConfig?.label || collection}</strong>.
        By default, all fields have full access. Restrict access by changing the read/write permissions.
      </Alert>

      {fields.length === 0 ? (
        <Alert severity="warning">
          No fields defined for this collection. Add fields in the Data Model settings first.
        </Alert>
      ) : (
        <>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <Chip
              icon={<Shield size={14} />}
              label="Quick Set All (Read)"
              onClick={() => setAllFields('read', 'full')}
              disabled={disabled}
              variant="outlined"
            />
            <Chip
              icon={<Eye size={14} />}
              label="Quick Set All (Read Only)"
              onClick={() => setAllFields('read', 'partial')}
              disabled={disabled}
              variant="outlined"
            />
            <Chip
              icon={<Lock size={14} />}
              label="Quick Set All (No Access)"
              onClick={() => setAllFields('read', 'none')}
              disabled={disabled}
              variant="outlined"
              color="error"
            />
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, width: '30%' }}>Field</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: '35%' }}>Read Access</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: '35%' }}>Write Access</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dataFields.map((field) => {
                  const perm = getFieldPermission(field.name);
                  const isSaving = saving === field.name;

                  return (
                    <TableRow
                      key={field.name}
                      sx={{
                        opacity: isSaving ? 0.6 : 1,
                        transition: 'opacity 200ms',
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {isSaving && <CircularProgress size={14} />}
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {field.label || field.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {field.name} ({field.type})
                            </Typography>
                          </Box>
                          {field.required && (
                            <Chip label="Required" size="small" color="warning" sx={{ height: 18, fontSize: 10 }} />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {renderPermissionSelect(field.name, 'read', perm.read)}
                      </TableCell>
                      <TableCell>
                        {renderPermissionSelect(field.name, 'write', perm.write)}
                      </TableCell>
                    </TableRow>
                  );
                })}

                {systemOnlyFields.length > 0 && (
                  <>
                    <TableRow>
                      <TableCell colSpan={3} sx={{ py: 0 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            cursor: 'pointer',
                            py: 1,
                            '&:hover': { bgcolor: 'action.hover' },
                          }}
                          onClick={() => setExpandedSystem(!expandedSystem)}
                        >
                          {expandedSystem ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                          <Typography variant="body2" color="text.secondary">
                            System Fields ({systemOnlyFields.length})
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ p: 0 }} colSpan={3}>
                        <Collapse in={expandedSystem} timeout="auto" unmountOnExit>
                          <Table size="small" sx={{ width: '100%' }}>
                            <TableBody>
                              {systemOnlyFields.map((field) => {
                                const perm = getFieldPermission(field.name);
                                return (
                                  <TableRow key={field.name} sx={{ bgcolor: 'action.hover' }}>
                                    <TableCell sx={{ pl: 4 }}>
                                      <Typography variant="body2" color="text.secondary">
                                        {field.label || field.name}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      {renderPermissionSelect(field.name, 'read', perm.read)}
                                    </TableCell>
                                    <TableCell>
                                      {renderPermissionSelect(field.name, 'write', perm.write)}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}
