"use client";

import { use, useState } from 'react';
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
import { useSchemaStore } from '@/store/schema';
import { useActivityStore } from '@/store/activity';
import { useNotificationsStore } from '@/store/notifications';
import { notFound, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, Edit2, Trash2, GripVertical, Settings2, Link2 } from 'lucide-react';
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
  
  const { collections, updateCollection, addField, updateField, deleteField } = useSchemaStore();
  const { addLog } = useActivityStore();
  const { addNotification } = useNotificationsStore();
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
    addLog({ action: 'update', collection: 'directus_collections', item: collectionKey, user: 'Admin User', meta: generalConfig });
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
    addLog({ action: 'update', collection: 'directus_presets', item: collectionKey, user: 'Admin User', meta: presetConfig });
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
  });

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
      });
    } else {
      setEditingField(null);
      setFieldFormData({
        name: '', label: '', type: 'string', interface: 'input', display: 'formatted-value',
        required: false, group: 'General', length: 255, defaultValue: '', nullable: true,
        unique: false, indexed: false, searchable: false, validationMin: '', validationMax: '',
        validationRegex: '', readOnly: false, hidden: false,
      });
    }
    setFieldDialogOpen(true);
  };

  const handleSaveField = () => {
    const fieldPayload: any = {
      name: fieldFormData.name,
      label: fieldFormData.label,
      type: fieldFormData.type,
      required: fieldFormData.required,
      group: fieldFormData.group,
      searchable: fieldFormData.searchable,
      sortable: true,
    };
    if (fieldFormData.validationMin || fieldFormData.validationMax || fieldFormData.validationRegex) {
      fieldPayload.validation = {};
      if (fieldFormData.validationMin) fieldPayload.validation.min = Number(fieldFormData.validationMin);
      if (fieldFormData.validationMax) fieldPayload.validation.max = Number(fieldFormData.validationMax);
      if (fieldFormData.validationRegex) fieldPayload.validation.regex = fieldFormData.validationRegex;
    }

    if (editingField) {
      updateField(collectionKey, editingField.name, fieldPayload);
      addLog({ action: 'update', collection: 'directus_fields', item: `${collectionKey}.${editingField.name}`, user: 'Admin User', meta: fieldPayload });
    } else {
      if (config.fields.find(f => f.name === fieldFormData.name)) {
        addNotification({ title: 'Error', message: `Field "${fieldFormData.name}" already exists.` });
        return;
      }
      addField(collectionKey, fieldPayload);
      addLog({ action: 'create', collection: 'directus_fields', item: `${collectionKey}.${fieldFormData.name}`, user: 'Admin User', meta: fieldPayload });
    }
    addNotification({ title: 'Field Saved', message: `Field "${fieldFormData.label}" has been saved.` });
    setFieldDialogOpen(false);
  };

  const handleDeleteField = (fieldName: string) => {
    if (confirm(`Are you sure you want to remove field: ${fieldName}?`)) {
      deleteField(collectionKey, fieldName);
      addLog({ action: 'delete', collection: 'directus_fields', item: `${collectionKey}.${fieldName}`, user: 'Admin User' });
      addNotification({ title: 'Field Deleted', message: `Field "${fieldName}" has been removed.` });
    }
  };

  // Relations data from fields
  const relations = config.fields.filter(f => f.relationInfo);

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
                      <Chip label={field.type} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} />
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
        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" mb={2} display="flex" alignItems="center" gap={1}>
            <Link2 size={20} /> Relational Schema
          </Typography>
          {relations.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No relations are defined for this collection.</Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Field</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Related Collection</TableCell>
                    <TableCell>Display Field</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {relations.map(field => (
                    <TableRow key={field.name} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>{field.label}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{field.name}</Typography>
                      </TableCell>
                      <TableCell><Chip label={field.relationInfo!.type} size="small" variant="outlined" /></TableCell>
                      <TableCell><Chip label={field.relationInfo!.collection} size="small" /></TableCell>
                      <TableCell>{field.relationInfo!.displayField || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
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
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField type="number" fullWidth label="Length" value={fieldFormData.length} onChange={e => setFieldFormData({ ...fieldFormData, length: Number(e.target.value) })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label="Default Value" value={fieldFormData.defaultValue} onChange={e => setFieldFormData({ ...fieldFormData, defaultValue: e.target.value })} />
            </Grid>
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
          <Button variant="contained" onClick={handleSaveField} disabled={!fieldFormData.name || !fieldFormData.label}>
            {editingField ? 'Update Field' : 'Create Field'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
