"use client";

import { use, useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import { useSchemaStore } from '@/store/schema';
import { useActivityStore } from '@/store/activity';
import { useNotificationsStore } from '@/store/notifications';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import { api } from '@/lib/api';
import { notFound, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, Edit2, Trash2, GripVertical, Settings2, Link2, ArrowRight, ArrowLeftRight, ExternalLink } from 'lucide-react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

export default function CollectionConfigPage({ params }: { params: Promise<{ collection: string }> }) {
  const resolvedParams = use(params);
  const collectionKey = resolvedParams.collection;
  const router = useRouter();
  
  const { collections, updateCollection, addField, addFieldApi, updateField, deleteField, deleteFieldApi } = useSchemaStore();
  const { addLog } = useActivityStore();
  const { addNotification } = useNotificationsStore();
  const confirm = useConfirm();
  const config = collections[collectionKey];

  if (!config) {
    notFound();
  }

  const [activeTab, setActiveTab] = useState(0);

  // General Settings State
  const [generalConfig, setGeneralConfig] = useState({
    label: config.label,
    icon: config.icon || 'Database',
    description: '',
    primaryField: 'id',
    sortField: 'id',
    searchFields: config.fields.filter(f => f.searchable).map(f => f.name).join(', '),
  });

  const handleSaveGeneral = () => {
    updateCollection(collectionKey, { label: generalConfig.label, icon: generalConfig.icon });
    addLog({ action: 'update', collection: 'neurofy_collections', item: collectionKey, user: 'Admin User', meta: generalConfig });
    addNotification({ title: 'Collection Updated', message: `"${generalConfig.label}" settings have been saved.` });
  };

  // Preset State
  const [presetConfig, setPresetConfig] = useState({
    layout: config.preset?.layout || 'table',
    pageSize: config.preset?.pageSize || 20,
    sortField: config.preset?.sort?.field || 'id',
    sortOrder: config.preset?.sort?.order || 'asc',
    visibleColumns: config.preset?.visibleColumns || config.fields.slice(0, 5).map(f => f.name),
  });

  const handleSavePreset = () => {
    updateCollection(collectionKey, {
      preset: {
        ...config.preset,
        layout: presetConfig.layout,
        pageSize: presetConfig.pageSize,
        sort: { field: presetConfig.sortField, order: presetConfig.sortOrder as any },
        visibleColumns: presetConfig.visibleColumns,
      } as any
    });
    addLog({ action: 'update', collection: 'neurofy_presets', item: collectionKey, user: 'Admin User', meta: presetConfig });
  };

  // Enhanced Field Editor Dialog State
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<any>(null);
  const [fieldFormData, setFieldFormData] = useState({
    name: '',
    label: '',
    type: 'string',
    interface: 'input',
    display: 'formatted-value',
    required: false,
    group: 'General',
    // Schema properties
    length: 255,
    defaultValue: '',
    nullable: true,
    unique: false,
    indexed: false,
    searchable: false,
    // Validation
    validationMin: '',
    validationMax: '',
    validationRegex: '',
    // Conditions
    readOnly: false,
    hidden: false,
    // Relation
    relatedCollection: '',
    relatedDisplayField: 'id',
  });

  const otherCollections = Object.entries(collections).filter(([k]) => k !== collectionKey);

  const handleOpenFieldDialog = (field?: any) => {
    if (field) {
      setEditingField(field);
      setFieldFormData({
        name: field.name || '',
        label: field.label || '',
        type: field.type || 'string',
        interface: 'input',
        display: 'formatted-value',
        required: field.required || false,
        group: field.group || 'General',
        length: 255,
        defaultValue: '',
        nullable: true,
        unique: false,
        indexed: false,
        searchable: field.searchable || false,
        validationMin: field.validation?.min?.toString() || '',
        validationMax: field.validation?.max?.toString() || '',
        validationRegex: field.validation?.regex || '',
        readOnly: false,
        hidden: false,
        relatedCollection: field.relationInfo?.collection || '',
        relatedDisplayField: field.relationInfo?.displayField || 'id',
      });
    } else {
      setEditingField(null);
      setFieldFormData({
        name: '', label: '', type: 'string', interface: 'input', display: 'formatted-value',
        required: false, group: 'General', length: 255, defaultValue: '', nullable: true,
        unique: false, indexed: false, searchable: false, validationMin: '', validationMax: '',
        validationRegex: '', readOnly: false, hidden: false, relatedCollection: '', relatedDisplayField: 'id',
      });
    }
    setFieldDialogOpen(true);
  };

  const [savingField, setSavingField] = useState(false);

  const handleSaveField = async () => {
    const fieldPayload: any = {
      name: fieldFormData.name,
      label: fieldFormData.label,
      type: fieldFormData.type,
      required: fieldFormData.required,
      group: fieldFormData.group,
      searchable: fieldFormData.searchable,
      sortable: true,
    };

    if (fieldFormData.type === 'relation') {
      if (!fieldFormData.relatedCollection) {
        addNotification({ title: 'Error', message: 'Please select a related collection.' });
        return;
      }
      fieldPayload.relation = {
        related_collection: fieldFormData.relatedCollection,
        related_field: 'id',
        display_field: fieldFormData.relatedDisplayField || 'id',
        required: fieldFormData.required,
      };
      fieldPayload.relationInfo = {
        collection: fieldFormData.relatedCollection,
        type: 'many-to-one',
        displayField: fieldFormData.relatedDisplayField || 'id',
      };
    }

    if (fieldFormData.validationMin || fieldFormData.validationMax || fieldFormData.validationRegex) {
      fieldPayload.validation = {};
      if (fieldFormData.validationMin) fieldPayload.validation.min = Number(fieldFormData.validationMin);
      if (fieldFormData.validationMax) fieldPayload.validation.max = Number(fieldFormData.validationMax);
      if (fieldFormData.validationRegex) fieldPayload.validation.regex = fieldFormData.validationRegex;
    }

    if (editingField) {
      updateField(collectionKey, editingField.name, fieldPayload);
      addNotification({ title: 'Field Updated', message: `Field "${fieldFormData.label}" has been updated.` });
      setFieldDialogOpen(false);
    } else {
      if (config.fields.find(f => f.name === fieldFormData.name)) {
        addNotification({ title: 'Error', message: `Field "${fieldFormData.name}" already exists.` });
        return;
      }
      setSavingField(true);
      try {
        await addFieldApi(collectionKey, fieldPayload);
        addNotification({ title: 'Field Created', message: `Field "${fieldFormData.label}" added to database.` });
        setFieldDialogOpen(false);
      } catch (err: any) {
        addNotification({ title: 'Error', message: err.message || 'Failed to add field' });
      } finally {
        setSavingField(false);
      }
    }
  };

  const handleDeleteField = async (fieldName: string) => {
    const PROTECTED = ['id', 'date_created', 'date_updated'];
    if (PROTECTED.includes(fieldName)) {
      addNotification({ title: 'Error', message: 'Cannot delete system fields.' });
      return;
    }
    const ok = await confirm({ title: 'Delete Field', message: `Are you sure you want to remove field "${fieldName}"? Existing data in this field will be lost.`, confirmText: 'Delete Field', severity: 'error' });
    if (!ok) return;
    try {
      await deleteFieldApi(collectionKey, fieldName);
      addNotification({ title: 'Field Deleted', message: `Field "${fieldName}" has been removed from database.` });
    } catch (err: any) {
      addNotification({ title: 'Error', message: err.message || 'Failed to delete field' });
    }
  };

  // Relations data (live from API)
  const relations = config.fields.filter(f => f.relationInfo);
  const [allRelations, setAllRelations] = useState<any[]>([]);
  const [incomingRelations, setIncomingRelations] = useState<any[]>([]);
  const [relationsLoading, setRelationsLoading] = useState(false);
  const [relationDialogOpen, setRelationDialogOpen] = useState(false);
  const [savingRelation, setSavingRelation] = useState(false);
  const [relationForm, setRelationForm] = useState({
    fieldName: '',
    relatedCollection: '',
    displayField: 'id',
    required: false,
  });

  const fetchRelations = useCallback(async () => {
    setRelationsLoading(true);
    try {
      const res = await api.get<{ data: any[] }>('/relations');
      const all = res.data || [];
      setAllRelations(all);
      setIncomingRelations(all.filter((r: any) => r.related_collection === collectionKey));
    } catch { /* ignore */ }
    finally { setRelationsLoading(false); }
  }, [collectionKey]);

  useEffect(() => { fetchRelations(); }, [fetchRelations]);

  const outgoingRelations = allRelations.filter(r => r.collection === collectionKey);

  const handleCreateRelation = async () => {
    if (!relationForm.fieldName || !relationForm.relatedCollection) {
      addNotification({ title: 'Error', message: 'Field name and related collection are required.' });
      return;
    }
    setSavingRelation(true);
    try {
      await addFieldApi(collectionKey, {
        name: relationForm.fieldName,
        label: relationForm.fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        type: 'relation',
        required: relationForm.required,
        relation: {
          related_collection: relationForm.relatedCollection,
          related_field: 'id',
          display_field: relationForm.displayField || 'id',
          required: relationForm.required,
        },
      } as any);
      addNotification({ title: 'Relation Created', message: `Relation "${relationForm.fieldName}" → ${relationForm.relatedCollection} created.` });
      setRelationDialogOpen(false);
      setRelationForm({ fieldName: '', relatedCollection: '', displayField: 'id', required: false });
      await fetchRelations();
    } catch (err: any) {
      addNotification({ title: 'Error', message: err.message || 'Failed to create relation' });
    } finally {
      setSavingRelation(false);
    }
  };

  const handleDeleteRelation = async (fieldName: string) => {
    const ok = await confirm({
      title: 'Delete Relation',
      message: `This will remove the relation field "${fieldName}" and all its data. Are you sure?`,
      confirmText: 'Delete Relation',
      severity: 'error',
    });
    if (!ok) return;
    try {
      await deleteFieldApi(collectionKey, fieldName);
      addNotification({ title: 'Relation Deleted', message: `Relation "${fieldName}" has been removed.` });
      await fetchRelations();
    } catch (err: any) {
      addNotification({ title: 'Error', message: err.message || 'Failed to delete relation' });
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 4, overflow: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => router.push('/admin/settings/data-model')}><ArrowLeft size={20} /></IconButton>
          <Typography variant="h4" fontWeight={600}>{generalConfig.label}</Typography>
          <Chip label={collectionKey} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" startIcon={<Save size={18} />} onClick={handleSaveGeneral}>
            Save
          </Button>
        </Box>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={activeTab} onChange={(_, nv) => setActiveTab(nv)}>
          <Tab label="Fields & Layout" />
          <Tab label="General" />
          <Tab label="Relations" />
          <Tab label="Presets" />
        </Tabs>
      </Box>

      {/* General Tab */}
      {activeTab === 1 && (
        <Paper sx={{ p: 4, maxWidth: 800 }}>
          <Typography variant="h6" mb={3}>Collection Details</Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Collection Label" value={generalConfig.label} onChange={e => setGeneralConfig({ ...generalConfig, label: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="System Name" value={collectionKey} disabled helperText="Cannot be changed after creation." />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Icon Name" value={generalConfig.icon} onChange={e => setGeneralConfig({ ...generalConfig, icon: e.target.value })} helperText="Lucide icon name" />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth multiline rows={3} label="Description" value={generalConfig.description} onChange={e => setGeneralConfig({ ...generalConfig, description: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField select fullWidth label="Primary Field" value={generalConfig.primaryField} onChange={e => setGeneralConfig({ ...generalConfig, primaryField: e.target.value })}>
                {config.fields.map(f => <MenuItem key={f.name} value={f.name}>{f.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField select fullWidth label="Sort Field" value={generalConfig.sortField} onChange={e => setGeneralConfig({ ...generalConfig, sortField: e.target.value })}>
                {config.fields.filter(f => f.sortable).map(f => <MenuItem key={f.name} value={f.name}>{f.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Searchable Fields (comma separated)" value={generalConfig.searchFields} onChange={e => setGeneralConfig({ ...generalConfig, searchFields: e.target.value })} helperText="e.g. title, description, slug" />
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Fields Tab */}
      {activeTab === 0 && (
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Fields ({config.fields.length})</Typography>
            <Button variant="outlined" startIcon={<Plus size={16} />} onClick={() => handleOpenFieldDialog()}>
              Create Field
            </Button>
          </Box>
          <TableContainer component={Paper} sx={{ flexGrow: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" />
                  <TableCell>Field</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Group</TableCell>
                  <TableCell>Required</TableCell>
                  <TableCell>Searchable</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {config.fields.map((field) => (
                  <TableRow key={field.name} hover>
                    <TableCell padding="checkbox">
                      <IconButton size="small" sx={{ cursor: 'grab' }}><GripVertical size={16} /></IconButton>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>{field.label}</Typography>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{field.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={field.type === 'relation' ? `relation → ${field.relationInfo?.collection || '?'}` : field.type} 
                        size="small" 
                        variant="outlined" 
                        color={field.type === 'relation' ? 'info' : 'default'}
                        sx={{ fontFamily: 'monospace' }} 
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{field.group || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={field.required ? 'Yes' : 'No'} size="small" color={field.required ? 'error' : 'default'} />
                    </TableCell>
                    <TableCell>
                      <Chip label={field.searchable ? 'Yes' : 'No'} size="small" color={field.searchable ? 'primary' : 'default'} />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleOpenFieldDialog(field)}>
                        <Edit2 size={16} />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteField(field.name)} color="error">
                        <Trash2 size={16} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Relations Tab */}
      {activeTab === 2 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Outgoing Relations (M2O) */}
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(102,68,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowRight size={18} color="#6644ff" />
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>Outgoing Relations (Many-to-One)</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Fields in <strong>{collectionKey}</strong> that reference other collections
                  </Typography>
                </Box>
              </Box>
              <Button variant="outlined" startIcon={<Plus size={16} />} onClick={() => setRelationDialogOpen(true)}>
                Add Relation
              </Button>
            </Box>

            {relationsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>
            ) : outgoingRelations.length === 0 && relations.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', bgcolor: 'transparent' }}>
                <Link2 size={32} style={{ opacity: 0.15, marginBottom: 8 }} />
                <Typography variant="body2" color="text.secondary" mb={1}>No outgoing relations defined.</Typography>
                <Typography variant="caption" color="text.disabled">
                  Click "Add Relation" to create a foreign key field that links to another collection.
                </Typography>
              </Paper>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Field</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Related Collection</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Display Field</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Required</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }} align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(outgoingRelations.length > 0 ? outgoingRelations : relations.map(f => ({
                      field: f.name,
                      related_collection: f.relationInfo?.collection,
                      display_field: f.relationInfo?.displayField,
                      required: f.required,
                      _label: f.label,
                    }))).map((rel: any) => (
                      <TableRow key={rel.field} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{rel._label || rel.field.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</Typography>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{rel.field}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label="Many-to-One" size="small" variant="outlined" color="info" sx={{ fontSize: 11 }} />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={rel.related_collection}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ fontFamily: 'monospace', fontWeight: 600 }}
                            onClick={() => router.push(`/admin/settings/data-model/${rel.related_collection}`)}
                            clickable
                            icon={<ExternalLink size={12} />}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip label={rel.display_field || 'id'} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: 11 }} />
                        </TableCell>
                        <TableCell>
                          <Chip label={rel.required ? 'Yes' : 'No'} size="small" color={rel.required ? 'error' : 'default'} />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Delete this relation field">
                            <IconButton size="small" color="error" onClick={() => handleDeleteRelation(rel.field)}>
                              <Trash2 size={15} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

          {/* Incoming Relations */}
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowLeftRight size={18} color="#22C55E" />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>Incoming Relations</Typography>
                <Typography variant="caption" color="text.secondary">
                  Other collections that have foreign keys pointing to <strong>{collectionKey}</strong>
                </Typography>
              </Box>
            </Box>

            {relationsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>
            ) : incomingRelations.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', bgcolor: 'transparent' }}>
                <Typography variant="body2" color="text.secondary">No other collections reference this collection.</Typography>
              </Paper>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Source Collection</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>FK Field</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Display Field</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Required</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {incomingRelations.map((rel: any) => (
                      <TableRow key={`${rel.collection}.${rel.field}`} hover>
                        <TableCell>
                          <Chip
                            label={rel.collection}
                            size="small"
                            color="success"
                            variant="outlined"
                            sx={{ fontFamily: 'monospace', fontWeight: 600 }}
                            onClick={() => router.push(`/admin/settings/data-model/${rel.collection}`)}
                            clickable
                            icon={<ExternalLink size={12} />}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{rel.field}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={rel.display_field || 'id'} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: 11 }} />
                        </TableCell>
                        <TableCell>
                          <Chip label={rel.required ? 'Yes' : 'No'} size="small" color={rel.required ? 'error' : 'default'} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

          {/* Visual Summary */}
          {(outgoingRelations.length > 0 || incomingRelations.length > 0 || relations.length > 0) && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={2} display="flex" alignItems="center" gap={1}>
                <Link2 size={18} /> Relation Map
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', py: 2 }}>
                {/* Incoming */}
                {incomingRelations.map((rel: any) => (
                  <Box key={`in-${rel.collection}-${rel.field}`} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label={rel.collection} size="small" color="success" variant="outlined" sx={{ fontWeight: 600 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>.{rel.field}</Typography>
                    <ArrowRight size={16} style={{ opacity: 0.4 }} />
                  </Box>
                ))}

                {/* Current collection */}
                <Chip
                  label={collectionKey}
                  color="primary"
                  sx={{ fontWeight: 700, fontSize: 14, px: 2, height: 36 }}
                />

                {/* Outgoing */}
                {(outgoingRelations.length > 0 ? outgoingRelations : relations.map(f => ({
                  field: f.name,
                  related_collection: f.relationInfo?.collection,
                }))).map((rel: any) => (
                  <Box key={`out-${rel.field}`} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ArrowRight size={16} style={{ opacity: 0.4 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>.{rel.field}</Typography>
                    <Chip label={rel.related_collection} size="small" color="info" variant="outlined" sx={{ fontWeight: 600 }} />
                  </Box>
                ))}
              </Box>
            </Paper>
          )}

          {/* Add Relation Dialog */}
          <Dialog open={relationDialogOpen} onClose={() => setRelationDialogOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Add Relation Field</DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3} sx={{ pt: 1 }}>
                <Grid size={{ xs: 12 }}>
                  <Alert severity="info" sx={{ mb: 1 }}>
                    This creates a Many-to-One relation: a foreign key field in <strong>{collectionKey}</strong> pointing to another collection.
                  </Alert>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth label="Field Name" required
                    value={relationForm.fieldName}
                    onChange={e => setRelationForm({ ...relationForm, fieldName: e.target.value })}
                    helperText="e.g. category_id, author_id"
                    placeholder="category_id"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth select label="Related Collection" required
                    value={relationForm.relatedCollection}
                    onChange={e => setRelationForm({ ...relationForm, relatedCollection: e.target.value, displayField: 'id' })}
                  >
                    {otherCollections.map(([key, col]) => (
                      <MenuItem key={key} value={key}>{col.label || key}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth select label="Display Field"
                    value={relationForm.displayField}
                    onChange={e => setRelationForm({ ...relationForm, displayField: e.target.value })}
                    helperText="Shown in dropdowns instead of ID"
                  >
                    <MenuItem value="id">ID</MenuItem>
                    {relationForm.relatedCollection && collections[relationForm.relatedCollection]?.fields
                      .filter(f => !['id', 'date_created', 'date_updated'].includes(f.name))
                      .map(f => <MenuItem key={f.name} value={f.name}>{f.label || f.name}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <FormControlLabel
                    control={<Switch checked={relationForm.required} onChange={e => setRelationForm({ ...relationForm, required: e.target.checked })} />}
                    label="Required (must always have a related item)"
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setRelationDialogOpen(false)} color="inherit">Cancel</Button>
              <Button
                variant="contained"
                onClick={handleCreateRelation}
                disabled={!relationForm.fieldName || !relationForm.relatedCollection || savingRelation}
                startIcon={savingRelation ? <CircularProgress size={16} color="inherit" /> : <Link2 size={16} />}
              >
                {savingRelation ? 'Creating...' : 'Create Relation'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}

      {/* Presets Tab */}
      {activeTab === 3 && (
        <Paper sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6">Explore & Editor Presets</Typography>
            <Button variant="contained" onClick={handleSavePreset} startIcon={<Save size={18} />}>Save Presets</Button>
          </Box>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>Explore View Default</Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField select fullWidth label="Default Layout" value={presetConfig.layout} onChange={(e) => setPresetConfig({ ...presetConfig, layout: e.target.value })}>
                    <MenuItem value="table">Table</MenuItem>
                    <MenuItem value="cards">Cards</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField type="number" fullWidth label="Items Per Page" value={presetConfig.pageSize} onChange={(e) => setPresetConfig({ ...presetConfig, pageSize: Number(e.target.value) })} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField select fullWidth label="Sort Field" value={presetConfig.sortField} onChange={(e) => setPresetConfig({ ...presetConfig, sortField: e.target.value })}>
                    {config.fields.map(f => <MenuItem key={f.name} value={f.name}>{f.label}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField select fullWidth label="Sort Order" value={presetConfig.sortOrder} onChange={(e) => setPresetConfig({ ...presetConfig, sortOrder: e.target.value as 'asc' | 'desc' })}>
                    <MenuItem value="asc">Ascending</MenuItem>
                    <MenuItem value="desc">Descending</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField select fullWidth label="Visible Columns" SelectProps={{ multiple: true, renderValue: (selected: any) => selected.join(', ') }} value={presetConfig.visibleColumns} onChange={(e) => setPresetConfig({ ...presetConfig, visibleColumns: e.target.value as any })}>
                    {config.fields.map(f => <MenuItem key={f.name} value={f.name}>{f.label}</MenuItem>)}
                  </TextField>
                </Grid>
              </Grid>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={2} mt={2}>Editor View Configuration</Typography>
              <Typography variant="body2" color="text.secondary">Modify the "Group" property of individual fields to arrange them into tabs or sections in the Editor.</Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Enhanced Field Editor Dialog */}
      <Dialog open={fieldDialogOpen} onClose={() => setFieldDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingField ? 'Edit' : 'Create'} Field</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3} sx={{ pt: 1 }}>
            {/* Identity */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" fontWeight={600} color="primary">Identity</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label="Field Key" value={fieldFormData.name} onChange={e => setFieldFormData({ ...fieldFormData, name: e.target.value })} disabled={!!editingField} required helperText="e.g. 'first_name'" />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label="Label" value={fieldFormData.label} onChange={e => setFieldFormData({ ...fieldFormData, label: e.target.value })} required />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label="Group (Tab/Panel)" value={fieldFormData.group} onChange={e => setFieldFormData({ ...fieldFormData, group: e.target.value })} helperText="e.g. Basic, SEO" />
            </Grid>

            <Grid size={{ xs: 12 }}><Divider /></Grid>

            {/* Schema */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" fontWeight={600} color="primary">Schema</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth select label="Type" value={fieldFormData.type} onChange={e => setFieldFormData({ ...fieldFormData, type: e.target.value })} disabled={!!editingField}>
                <MenuItem value="string">String</MenuItem>
                <MenuItem value="text">Text (Long)</MenuItem>
                <MenuItem value="integer">Integer</MenuItem>
                <MenuItem value="float">Float</MenuItem>
                <MenuItem value="boolean">Boolean</MenuItem>
                <MenuItem value="timestamp">Timestamp</MenuItem>
                <MenuItem value="uuid">UUID</MenuItem>
                <MenuItem value="json">JSON</MenuItem>
                <MenuItem value="relation">Relation (Many-to-One)</MenuItem>
              </TextField>
            </Grid>
            {fieldFormData.type === 'relation' ? (
              <>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField fullWidth select label="Related Collection" value={fieldFormData.relatedCollection} onChange={e => setFieldFormData({ ...fieldFormData, relatedCollection: e.target.value })} required disabled={!!editingField}>
                    {otherCollections.map(([key, col]) => (
                      <MenuItem key={key} value={key}>{col.label || key}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField fullWidth select label="Display Field" value={fieldFormData.relatedDisplayField} onChange={e => setFieldFormData({ ...fieldFormData, relatedDisplayField: e.target.value })} helperText="Field shown instead of ID">
                    <MenuItem value="id">ID</MenuItem>
                    {fieldFormData.relatedCollection && collections[fieldFormData.relatedCollection]?.fields
                      .filter(f => !['id', 'date_created', 'date_updated'].includes(f.name))
                      .map(f => <MenuItem key={f.name} value={f.name}>{f.label || f.name}</MenuItem>)}
                  </TextField>
                </Grid>
              </>
            ) : (
              <>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField type="number" fullWidth label="Length" value={fieldFormData.length} onChange={e => setFieldFormData({ ...fieldFormData, length: Number(e.target.value) })} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField fullWidth label="Default Value" value={fieldFormData.defaultValue} onChange={e => setFieldFormData({ ...fieldFormData, defaultValue: e.target.value })} />
                </Grid>
              </>
            )}
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <FormControlLabel control={<Switch checked={fieldFormData.nullable} onChange={e => setFieldFormData({ ...fieldFormData, nullable: e.target.checked })} />} label="Nullable" />
                <FormControlLabel control={<Switch checked={fieldFormData.unique} onChange={e => setFieldFormData({ ...fieldFormData, unique: e.target.checked })} />} label="Unique" />
                <FormControlLabel control={<Switch checked={fieldFormData.indexed} onChange={e => setFieldFormData({ ...fieldFormData, indexed: e.target.checked })} />} label="Indexed" />
                <FormControlLabel control={<Switch checked={fieldFormData.searchable} onChange={e => setFieldFormData({ ...fieldFormData, searchable: e.target.checked })} />} label="Searchable" />
              </Box>
            </Grid>

            <Grid size={{ xs: 12 }}><Divider /></Grid>

            {/* Interface & Display */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" fontWeight={600} color="primary">Interface & Display</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth select label="Interface" value={fieldFormData.interface} onChange={e => setFieldFormData({ ...fieldFormData, interface: e.target.value })}>
                <MenuItem value="input">Text Input</MenuItem>
                <MenuItem value="textarea">Textarea</MenuItem>
                <MenuItem value="wysiwyg">WYSIWYG Editor</MenuItem>
                <MenuItem value="boolean">Toggle / Switch</MenuItem>
                <MenuItem value="datetime">Datetime Picker</MenuItem>
                <MenuItem value="select-dropdown">Dropdown</MenuItem>
                <MenuItem value="file">File Picker</MenuItem>
                <MenuItem value="relation">Relation Picker</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth select label="Display" value={fieldFormData.display} onChange={e => setFieldFormData({ ...fieldFormData, display: e.target.value })}>
                <MenuItem value="formatted-value">Formatted Value</MenuItem>
                <MenuItem value="raw">Raw</MenuItem>
                <MenuItem value="color">Color</MenuItem>
                <MenuItem value="datetime">Datetime</MenuItem>
                <MenuItem value="boolean">Boolean (Dot)</MenuItem>
                <MenuItem value="image">Image Thumbnail</MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12 }}><Divider /></Grid>

            {/* Validation */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" fontWeight={600} color="primary">Validation</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label="Min Value / Length" value={fieldFormData.validationMin} onChange={e => setFieldFormData({ ...fieldFormData, validationMin: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label="Max Value / Length" value={fieldFormData.validationMax} onChange={e => setFieldFormData({ ...fieldFormData, validationMax: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label="Regex Pattern" value={fieldFormData.validationRegex} onChange={e => setFieldFormData({ ...fieldFormData, validationRegex: e.target.value })} helperText="e.g. ^[a-z]+$" />
            </Grid>

            <Grid size={{ xs: 12 }}><Divider /></Grid>

            {/* Conditions */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" fontWeight={600} color="primary">Conditions</Typography>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <FormControlLabel control={<Switch checked={fieldFormData.required} onChange={e => setFieldFormData({ ...fieldFormData, required: e.target.checked })} />} label="Required" />
                <FormControlLabel control={<Switch checked={fieldFormData.readOnly} onChange={e => setFieldFormData({ ...fieldFormData, readOnly: e.target.checked })} />} label="Read-Only" />
                <FormControlLabel control={<Switch checked={fieldFormData.hidden} onChange={e => setFieldFormData({ ...fieldFormData, hidden: e.target.checked })} />} label="Hidden" />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setFieldDialogOpen(false)} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleSaveField} disabled={!fieldFormData.name || !fieldFormData.label || savingField}>
            {savingField ? 'Creating...' : editingField ? 'Update Field' : 'Create Field'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
