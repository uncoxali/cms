"use client";

import { use } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Skeleton from '@mui/material/Skeleton';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import { notFound, useRouter } from 'next/navigation';
import { Check, X, RotateCcw, Clock, Trash2, EyeOff, Lock } from 'lucide-react';
import { useRevisionsStore, Revision } from '@/store/revisions';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useSchemaStore } from '@/store/schema';
import { useAuthStore, hasCollectionAccess } from '@/store/auth';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import { usePermissionsStore } from '@/store/permissions';
import { useFilesStore, FileItem } from '@/store/files';
import { MediaItemField } from '@/components/admin/MediaItemField';
import { ChartField } from '@/components/admin/ChartField';
import { ChartConfig } from '@/components/admin/ChartBuilder';
import { api } from '@/lib/api';

export default function ItemEditorPage({ params }: { params: Promise<{ collection: string; id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const confirm = useConfirm();
  const { collection, id } = resolvedParams;
  
  const { collections } = useSchemaStore();
  const role = useAuthStore((s) => s.role);
  const user = useAuthStore((s) => s.user);
  const canEdit = hasCollectionAccess(user, collection, 'update') || hasCollectionAccess(user, collection, 'create');
  const config = collections[collection];

  // Permissions
  const { permissions, validationRules, fetchRolePermissions, checkFieldAccess } = usePermissionsStore();

  // Fetch role permissions
  useEffect(() => {
    if (role) {
      fetchRolePermissions(role);
    }
  }, [role, fetchRolePermissions]);

  // Get field permissions for current collection
  const fieldPerms = useMemo(() => {
    if (!role) return {};
    return permissions[role]?.collections?.[collection]?.fields || {};
  }, [permissions, role, collection]);

  // Get validation rules for current collection
  const collectionValidationRules = useMemo(() => {
    return validationRules.filter((r) => r.collection === collection);
  }, [validationRules, collection]);

  // Check if field should be hidden
  const isFieldHidden = (fieldName: string) => {
    if (!role || !canEdit) return false;
    return !checkFieldAccess(role, collection, fieldName, 'read');
  };

  // Check if field is read-only
  const isFieldReadOnly = (fieldName: string) => {
    if (!role || !canEdit) return false;
    const hasWrite = checkFieldAccess(role, collection, fieldName, 'write');
    return !hasWrite;
  };

  // Validate form data against validation rules
  const validateForm = () => {
    const errors: string[] = [];

    for (const rule of collectionValidationRules) {
      const fieldValue = formData[rule.field];
      const ruleType = rule.rule?.type as string;
      const ruleValue = rule.rule?.value as string | number;

      switch (ruleType) {
        case 'required':
          if (fieldValue === null || fieldValue === undefined || fieldValue === '') {
            errors.push(rule.errorMessage);
          }
          break;
        case 'min_length':
          if (typeof fieldValue === 'string' && fieldValue.length < (ruleValue as number)) {
            errors.push(rule.errorMessage);
          }
          break;
        case 'max_length':
          if (typeof fieldValue === 'string' && fieldValue.length > (ruleValue as number)) {
            errors.push(rule.errorMessage);
          }
          break;
        case 'min':
          if (typeof fieldValue === 'number' && fieldValue < (ruleValue as number)) {
            errors.push(rule.errorMessage);
          }
          break;
        case 'max':
          if (typeof fieldValue === 'number' && fieldValue > (ruleValue as number)) {
            errors.push(rule.errorMessage);
          }
          break;
        case 'pattern':
          if (typeof fieldValue === 'string' && !new RegExp(ruleValue as string).test(fieldValue)) {
            errors.push(rule.errorMessage);
          }
          break;
        case 'email':
          if (typeof fieldValue === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fieldValue)) {
            errors.push(rule.errorMessage);
          }
          break;
        case 'url':
          if (typeof fieldValue === 'string' && !/^https?:\/\/.+/.test(fieldValue)) {
            errors.push(rule.errorMessage);
          }
          break;
      }
    }

    return errors;
  };

  if (!config) {
    notFound();
  }

  const isNew = id === 'new';

  const { addRevision, getRevisionsForItem } = useRevisionsStore();
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [originalData, setOriginalData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null);

  // Relation options cache: { [collection]: { items: any[], displayField: string } }
  const [relationOptions, setRelationOptions] = useState<Record<string, { items: any[]; displayField: string; loading: boolean }>>({});
  const fetchedRelations = useRef<Set<string>>(new Set());

  // Fetch related collection items for all relation fields
  useEffect(() => {
    const relationFields = config.fields.filter(f => f.type === 'relation' && f.relationInfo);
    for (const field of relationFields) {
      const relCol = field.relationInfo!.collection;
      if (fetchedRelations.current.has(relCol)) continue;
      fetchedRelations.current.add(relCol);
      setRelationOptions(prev => ({ ...prev, [relCol]: { items: [], displayField: field.relationInfo!.displayField || 'id', loading: true } }));
      api.get<{ data: any[] }>(`/items/${relCol}`, { limit: '500' })
        .then(res => {
          setRelationOptions(prev => ({ ...prev, [relCol]: { items: res.data || [], displayField: field.relationInfo!.displayField || 'id', loading: false } }));
        })
        .catch(() => {
          setRelationOptions(prev => ({ ...prev, [relCol]: { ...prev[relCol], loading: false } }));
        });
    }
  }, [config.fields]);

  // Fetch item data from API
  useEffect(() => {
    if (!isNew) {
      setLoading(true);
      api.get<{ data: any }>(`/items/${collection}/${id}`)
        .then(res => {
          setFormData(res.data || {});
          setOriginalData(res.data || {});
          setRevisions(getRevisionsForItem(collection, id));
        })
        .catch(err => {
          setError(err.message || 'Failed to load item');
        })
        .finally(() => setLoading(false));
    }
  }, [collection, id, isNew, getRevisionsForItem]);

  const handleSave = async () => {
    // Run validation
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors[0]);
      setSnackbar({ open: true, message: validationErrors[0], severity: 'error' });
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = { ...formData };
      delete payload.id;

      if (isNew) {
        const res = await api.post<{ data: any }>(`/items/${collection}`, payload);
        setSnackbar({ open: true, message: 'Item created successfully', severity: 'success' });
        router.push(`/admin/content/${collection}/${res.data.id}`);
      } else {
        // Only send changed fields
        const changes: Record<string, any> = {};
        for (const key of Object.keys(payload)) {
          if (payload[key] !== originalData[key]) {
            changes[key] = payload[key];
          }
        }

        if (Object.keys(changes).length === 0) {
          setSnackbar({ open: true, message: 'No changes to save', severity: 'success' });
          setSaving(false);
          return;
        }

        await api.patch(`/items/${collection}/${id}`, changes);

        addRevision({
          collection,
          itemId: id,
          dataSnapshot: formData,
          createdBy: 'Admin User'
        });
        setRevisions(getRevisionsForItem(collection, id));
        setOriginalData(formData);
        setSnackbar({ open: true, message: 'Item updated successfully', severity: 'success' });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save');
      setSnackbar({ open: true, message: err.message || 'Save failed', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({ title: 'Delete Item', message: `Are you sure you want to delete this ${config.label} item? This action cannot be undone.`, confirmText: 'Delete', severity: 'error' });
    if (!ok) return;
    try {
      await api.del(`/items/${collection}/${id}`);
      setSnackbar({ open: true, message: 'Item deleted', severity: 'success' });
      router.push(`/admin/content/${collection}`);
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Delete failed', severity: 'error' });
    }
  };

  const handleRestore = (rev: Revision) => {
    setFormData(rev.dataSnapshot);
    setSelectedRevision(null);
    setActiveTab(0);
    addRevision({
      collection,
      itemId: id,
      dataSnapshot: rev.dataSnapshot,
      createdBy: 'Admin User (Restored)'
    });
    setRevisions(getRevisionsForItem(collection, id));
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton variant="text" width={300} height={48} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 4, flexGrow: 1 }}>
          <Paper sx={{ flexGrow: 1, p: 4 }}>
            <Grid container spacing={3}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Grid size={{ xs: 12, sm: 6 }} key={i}>
                  <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
                </Grid>
              ))}
            </Grid>
          </Paper>
          <Paper sx={{ width: 300, p: 3 }}>
            <Skeleton variant="text" width={120} height={32} />
            {[1, 2, 3].map(i => (
              <Box key={i} sx={{ mt: 2 }}>
                <Skeleton variant="text" width={80} height={16} />
                <Skeleton variant="text" width={150} height={24} />
              </Box>
            ))}
          </Paper>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={600}>
            {!canEdit ? 'View' : isNew ? 'Create' : 'Edit'} {config.label} {isNew ? '' : `#${id}`}
          </Typography>
          {canEdit && hasChanges && !isNew && (
            <Typography variant="caption" color="warning.main">Unsaved changes</Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {canEdit && !isNew && (
            <Button variant="outlined" color="error" onClick={handleDelete} startIcon={<Trash2 size={18} />}>
              Delete
            </Button>
          )}
          <Button variant="outlined" color="inherit" onClick={() => router.back()} startIcon={<X size={18} />}>
            {canEdit ? 'Cancel' : 'Back'}
          </Button>
          {canEdit && (
            <Button variant="contained" startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Check size={18} />} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>
      )}

      <Box sx={{ display: 'flex', gap: 4, flexGrow: 1, overflow: 'hidden' }}>
        <Paper sx={{ flexGrow: 1, p: 4, overflow: 'auto', backgroundColor: 'background.paper', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={(_, nv) => { setActiveTab(nv); setSelectedRevision(null); }}>
              <Tab label="Form" />
              {!isNew && <Tab label={`Revisions (${revisions.length})`} />}
            </Tabs>
          </Box>

          {activeTab === 0 && (
            <Grid container spacing={3}>
              {config.fields.filter(f => f.group !== 'Meta' && !isFieldHidden(f.name)).map(field => {
                const readOnly = isFieldReadOnly(field.name);
                const perm = fieldPerms[field.name];
                const hasPartialAccess = perm && (perm.read === 'partial' || perm.write === 'none');
                const fieldDisabled = !canEdit || readOnly;

                return (
                <Grid size={{ xs: 12, sm: field.type === 'textarea' || field.type === 'rich-text' || field.type === 'text' ? 12 : 6 }} key={field.name}>
                  {hasPartialAccess && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      <Chip 
                        icon={readOnly ? <Lock size={10} /> : <EyeOff size={10} />} 
                        label={readOnly ? 'Read-only' : 'View-only'} 
                        size="small" 
                        color="warning"
                        variant="outlined"
                        sx={{ height: 20, fontSize: 10 }}
                      />
                    </Box>
                  )}
                  {field.type === 'relation' && field.relationInfo ? (() => {
                    const relCol = field.relationInfo.collection;
                    const relOpts = relationOptions[relCol];
                    const displayField = field.relationInfo.displayField || 'id';
                    const currentValue = formData[field.name];
                    const selectedOption = relOpts?.items.find(item => item.id === currentValue) || null;

                    return (
                      <Autocomplete
                        options={relOpts?.items || []}
                        loading={relOpts?.loading}
                        getOptionLabel={(option: any) => option[displayField] ? `${option[displayField]} (#${option.id})` : `#${option.id}`}
                        value={selectedOption}
                        onChange={(_, newVal) => setFormData({ ...formData, [field.name]: newVal ? newVal.id : null })}
                        isOptionEqualToValue={(opt: any, val: any) => opt.id === val?.id}
                        disabled={fieldDisabled}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label={field.label}
                            required={field.required}
                            variant="outlined"
                            helperText={`→ ${relCol}`}
                            slotProps={{
                              input: {
                                ...params.InputProps,
                                endAdornment: (
                                  <>
                                    {relOpts?.loading ? <CircularProgress color="inherit" size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                  </>
                                ),
                              },
                            }}
                          />
                        )}
                        renderOption={(props, option: any) => (
                          <li {...props} key={option.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip label={`#${option.id}`} size="small" variant="outlined" />
                              <Typography variant="body2">{option[displayField] || '—'}</Typography>
                            </Box>
                          </li>
                        )}
                      />
                    );
                  })(                  ) : field.type === 'string' || field.type === 'number' || field.type === 'integer' || field.type === 'float' ? (
                    <TextField 
                      fullWidth 
                      label={field.label} 
                      type={['number', 'integer', 'float'].includes(field.type) ? 'number' : 'text'}
                      required={field.required}
                      variant="outlined" 
                      value={formData[field.name] ?? ''}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      slotProps={{ input: { readOnly: fieldDisabled } }}
                    />
                  ) : field.type === 'textarea' || field.type === 'rich-text' || field.type === 'text' ? (
                    <TextField 
                      fullWidth 
                      label={field.label} 
                      multiline 
                      rows={4} 
                      required={field.required}
                      variant="outlined" 
                      value={formData[field.name] ?? ''}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      slotProps={{ input: { readOnly: fieldDisabled } }}
                    />
                  ) : field.type === 'boolean' ? (
                    <FormControlLabel
                      control={<Switch color="primary" checked={!!formData[field.name]} onChange={(e) => setFormData({ ...formData, [field.name]: e.target.checked })} disabled={fieldDisabled} />}
                      label={field.label}
                    />
                  ) : field.type === 'datetime' ? (
                    <TextField
                      fullWidth
                      label={field.label}
                      type="datetime-local"
                      variant="outlined"
                      value={formData[field.name] ? String(formData[field.name]).slice(0, 16) : ''}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      slotProps={{ inputLabel: { shrink: true }, input: { readOnly: fieldDisabled } }}
                    />
                  ) : field.type === 'file' ? (
                    <MediaItemField
                      label={field.label}
                      value={formData[field.name] as FileItem | FileItem[] | string | null}
                      onChange={(value) => setFormData({ ...formData, [field.name]: value })}
                      disabled={fieldDisabled}
                      mode="single"
                      allowedTypes={['all']}
                    />
                  ) : field.type === 'chart' ? (
                    <ChartField
                      label={field.label}
                      value={formData[field.name] as ChartConfig | null}
                      onChange={(value) => setFormData({ ...formData, [field.name]: value })}
                      disabled={fieldDisabled}
                    />
                  ) : (
                    <TextField 
                      fullWidth 
                      label={field.label} 
                      variant="outlined" 
                      value={formData[field.name] ?? ''}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      slotProps={{ input: { readOnly: fieldDisabled } }}
                    />
                  )}
                </Grid>
                );
              })}
            </Grid>
          )}

          {activeTab === 1 && !isNew && (
            <Box>
              {selectedRevision ? (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box>
                      <Typography variant="h6">Viewing Revision</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(selectedRevision.createdAt).toLocaleString()} by {selectedRevision.createdBy}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button variant="outlined" onClick={() => setSelectedRevision(null)}>Back to List</Button>
                      <Button variant="contained" color="warning" startIcon={<RotateCcw size={18} />} onClick={() => handleRestore(selectedRevision)}>
                        Restore This Version
                      </Button>
                    </Box>
                  </Box>
                  <Divider sx={{ mb: 3 }} />
                  <Typography variant="subtitle1" fontWeight={600} mb={2}>Snapshot Data:</Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: '#1e1e1e', color: '#d4d4d4', fontFamily: 'monospace', overflow: 'auto' }}>
                    <pre style={{ margin: 0 }}>
                      {JSON.stringify(selectedRevision.dataSnapshot, null, 2)}
                    </pre>
                  </Paper>
                </Box>
              ) : (
                <List>
                  {revisions.length === 0 ? (
                    <Typography color="text.secondary" sx={{ p: 2 }}>No revisions found for this item.</Typography>
                  ) : revisions.map(rev => (
                    <ListItem 
                      key={rev.id} 
                      divider
                      secondaryAction={
                        <Button size="small" variant="outlined" onClick={() => setSelectedRevision(rev)}>View Snapshot</Button>
                      }
                    >
                      <Box sx={{ mr: 2, color: 'text.secondary' }}><Clock size={20} /></Box>
                      <ListItemText 
                        primary={`Saved by ${rev.createdBy}`}
                        secondary={new Date(rev.createdAt).toLocaleString()}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}
        </Paper>

        <Paper sx={{ width: 300, flexShrink: 0, p: 3, backgroundColor: 'background.paper', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6" fontWeight={600}>Metadata</Typography>
          <Divider />
          {config.fields.filter(f => f.group === 'Meta').map(field => (
            <Box key={field.name}>
              <Typography variant="caption" color="text.secondary">{field.label}</Typography>
              <Typography variant="body2">{formData[field.name] ?? (isNew ? '—' : '—')}</Typography>
            </Box>
          ))}
          {!isNew && formData.date_created && (
            <Box>
              <Typography variant="caption" color="text.secondary">Date Created</Typography>
              <Typography variant="body2">{new Date(formData.date_created).toLocaleString()}</Typography>
            </Box>
          )}
          {!isNew && formData.date_updated && (
            <Box>
              <Typography variant="caption" color="text.secondary">Last Updated</Typography>
              <Typography variant="body2">{new Date(formData.date_updated).toLocaleString()}</Typography>
            </Box>
          )}
        </Paper>
      </Box>

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
    </Box>
  );
}
