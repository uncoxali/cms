"use client";

import { use, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { notFound, useRouter } from 'next/navigation';
import { useRolesStore, PermissionAccess } from '@/store/roles';
import { useSchemaStore } from '@/store/schema';
import { useActivityStore } from '@/store/activity';
import { useNotificationsStore } from '@/store/notifications';

const ACCESS_OPTIONS: { value: PermissionAccess; label: string; color: string }[] = [
  { value: 'full', label: 'Full', color: '#2ecc71' },
  { value: 'filter', label: 'Filtered', color: '#f39c12' },
  { value: 'none', label: 'None', color: '#e74c3c' },
];

export default function RoleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const roleId = resolvedParams.id;
  const router = useRouter();

  const { roles, updateRole, deleteRole, updatePermission } = useRolesStore();
  const { collections } = useSchemaStore();
  const { addLog } = useActivityStore();
  const { addNotification } = useNotificationsStore();

  const role = roles.find(r => r.id === roleId);
  if (!role) {
    notFound();
  }

  const [activeTab, setActiveTab] = useState(0);
  const [form, setForm] = useState({
    name: role.name,
    description: role.description,
    appAccess: role.appAccess,
    adminAccess: role.adminAccess,
  });

  const handleSave = () => {
    updateRole(roleId, form);
    addLog({ action: 'update', collection: 'roles', item: roleId, user: 'Admin User', meta: form });
    addNotification({ title: 'Role Updated', message: `Role "${form.name}" has been saved.` });
  };

  const handleDelete = () => {
    if (confirm(`Delete role "${role.name}"? This cannot be undone.`)) {
      deleteRole(roleId);
      addLog({ action: 'delete', collection: 'roles', item: roleId, user: 'Admin User', meta: { name: role.name } });
      router.push('/admin/settings/roles');
    }
  };

  const getPermission = (collection: string, action: string): PermissionAccess => {
    const perm = role.permissions.find(p => p.collection === collection);
    if (!perm) return 'none';
    return (perm as any)[action] || 'none';
  };

  const handlePermissionChange = (collection: string, action: string, value: PermissionAccess) => {
    updatePermission(roleId, collection, { [action]: value } as any);
    addLog({ action: 'update', collection: 'permissions', item: roleId, user: 'Admin User', meta: { collection, action, value } });
  };

  const collectionKeys = Object.keys(collections);
  const actions = ['create', 'read', 'update', 'delete', 'share'];

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => router.push('/admin/settings/roles')}><ArrowLeft size={20} /></IconButton>
          <Typography variant="h4" fontWeight={600}>{form.name}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" color="error" startIcon={<Trash2 size={18} />} onClick={handleDelete}>Delete</Button>
          <Button variant="contained" startIcon={<Save size={18} />} onClick={handleSave}>Save</Button>
        </Box>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={activeTab} onChange={(_, nv) => setActiveTab(nv)}>
          <Tab label="Details" />
          <Tab label="Permissions" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <Paper sx={{ p: 4, maxWidth: 800 }}>
          <Typography variant="h6" mb={3}>Role Configuration</Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Role Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth multiline rows={3} label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={<Switch checked={form.appAccess} onChange={(e) => setForm({ ...form, appAccess: e.target.checked })} />}
                label="App Access"
              />
              <Typography variant="caption" color="text.secondary" display="block" ml={6}>Allow users with this role to log into the admin panel.</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={<Switch checked={form.adminAccess} onChange={(e) => setForm({ ...form, adminAccess: e.target.checked })} />}
                label="Admin Access"
              />
              <Typography variant="caption" color="text.secondary" display="block" ml={6}>Grant full unrestricted access. Overrides all permissions.</Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {activeTab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" mb={2}>Permissions Matrix</Typography>
          <Typography variant="body2" color="text.secondary" mb={3} component="div">
            Configure access for each collection. <Chip label="Full" size="small" sx={{ bgcolor: '#2ecc7130', color: '#2ecc71', mx: 0.5 }} />
            / <Chip label="Filtered" size="small" sx={{ bgcolor: '#f39c1230', color: '#f39c12', mx: 0.5 }} />
            / <Chip label="None" size="small" sx={{ bgcolor: '#e74c3c30', color: '#e74c3c', mx: 0.5 }} />
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Collection</TableCell>
                  {actions.map(a => (
                    <TableCell key={a} sx={{ fontWeight: 700, textTransform: 'capitalize' }}>{a}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {collectionKeys.map(col => (
                  <TableRow key={col} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{collections[col].label}</Typography>
                      <Typography variant="caption" color="text.secondary">{col}</Typography>
                    </TableCell>
                    {actions.map(action => (
                      <TableCell key={action}>
                        <TextField
                          select
                          size="small"
                          value={getPermission(col, action)}
                          onChange={(e) => handlePermissionChange(col, action, e.target.value as PermissionAccess)}
                          sx={{ minWidth: 100 }}
                        >
                          {ACCESS_OPTIONS.map(opt => (
                            <MenuItem key={opt.value} value={opt.value}>
                              <Typography variant="body2" sx={{ color: opt.color }}>{opt.label}</Typography>
                            </MenuItem>
                          ))}
                        </TextField>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
}
