"use client";

import { use, useState, useEffect } from 'react';
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
import Checkbox from '@mui/material/Checkbox';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import { alpha, useTheme } from '@mui/material/styles';
import {
  ArrowLeft, Save, Trash2, Shield, Globe, Database,
  LayoutDashboard, FolderOpen, Users, Settings, Activity,
  Zap, FileText, Eye, EyeOff, Lock, Unlock, Check, X,
} from 'lucide-react';
import { notFound, useRouter } from 'next/navigation';
import { useRolesStore, PermissionAccess } from '@/store/roles';
import { useSchemaStore } from '@/store/schema';
import { useActivityStore } from '@/store/activity';
import { useNotificationsStore } from '@/store/notifications';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import { api } from '@/lib/api';
import { ExtensionRegistry } from '@/lib/meta/registry';

const ACCESS_OPTIONS: { value: PermissionAccess; label: string; color: string }[] = [
  { value: 'full', label: 'Full', color: '#2ecc71' },
  { value: 'filter', label: 'Filtered', color: '#f39c12' },
  { value: 'none', label: 'None', color: '#e74c3c' },
];

const MODULE_ICONS: Record<string, any> = {
  dashboard: LayoutDashboard,
  content: Database,
  pages: Globe,
  files: FolderOpen,
  users: Users,
  flows: Zap,
  settings: Settings,
  activity: Activity,
};

export default function RoleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const roleId = resolvedParams.id;
  const router = useRouter();
  const theme = useTheme();

  const { roles, updateRole, deleteRole, updatePermission, fetchRoles } = useRolesStore();
  const { collections } = useSchemaStore();
  const { addLog } = useActivityStore();
  const { addNotification } = useNotificationsStore();
  const confirm = useConfirm();

  const role = roles.find(r => r.id === roleId);
  if (!role) { notFound(); }

  const [activeTab, setActiveTab] = useState(0);
  const [form, setForm] = useState({
    name: role.name,
    description: role.description,
    appAccess: role.appAccess,
    adminAccess: role.adminAccess,
  });

  // Pages state
  const [pages, setPages] = useState<any[]>([]);
  const [pageAccess, setPageAccess] = useState<Record<number, boolean>>({});
  const [pagesLoading, setPagesLoading] = useState(false);

  // Module access state
  const [moduleAccess, setModuleAccess] = useState<Record<string, boolean>>({});

  // API endpoint access
  const API_SECTIONS = [
    { key: 'items', label: 'Items / Content API', desc: '/api/items/* — CRUD on collections' },
    { key: 'files', label: 'Files API', desc: '/api/files/* — Upload, manage files' },
    { key: 'pages', label: 'Pages API', desc: '/api/pages/* — CRUD on pages' },
    { key: 'schema', label: 'Schema API', desc: '/api/schema/* — Read/modify data models' },
    { key: 'flows', label: 'Flows API', desc: '/api/flows/* — Manage automations' },
    { key: 'users', label: 'Users API', desc: '/api/users/* — Manage users' },
    { key: 'roles', label: 'Roles API', desc: '/api/roles/* — Manage roles' },
    { key: 'activity', label: 'Activity API', desc: '/api/activity — Read activity logs' },
    { key: 'dashboard', label: 'Dashboard API', desc: '/api/dashboard — Analytics data' },
    { key: 'relations', label: 'Relations API', desc: '/api/relations — Relation metadata' },
  ];
  const [apiAccess, setApiAccess] = useState<Record<string, boolean>>({});

  // Load existing access settings from role permissions
  useEffect(() => {
    const perms = role.permissions as any;
    // Module access — check _modules key
    const mods: Record<string, boolean> = {};
    const savedModules = (perms as any)?._modules || {};
    ExtensionRegistry.modules.forEach(m => {
      mods[m.id] = savedModules[m.id] !== undefined ? !!savedModules[m.id] : true;
    });
    setModuleAccess(mods);

    // API access — check _api key
    const savedApi = (perms as any)?._api || {};
    const apis: Record<string, boolean> = {};
    API_SECTIONS.forEach(s => {
      apis[s.key] = savedApi[s.key] !== undefined ? !!savedApi[s.key] : true;
    });
    setApiAccess(apis);

    // Page access — check _pages key
    const savedPages = (perms as any)?._pages || {};
    setPageAccess(savedPages);
  }, [role]);

  // Fetch pages
  useEffect(() => {
    setPagesLoading(true);
    api.get<{ data: any[] }>('/pages')
      .then(res => {
        setPages(res.data || []);
        // Initialize missing page access
        const pa: Record<number, boolean> = { ...pageAccess };
        (res.data || []).forEach((p: any) => {
          if (pa[p.id] === undefined) pa[p.id] = true;
        });
        setPageAccess(pa);
        setPagesLoading(false);
      })
      .catch(() => setPagesLoading(false));
  }, []);

  const handleSave = async () => {
    // Build unified permissions: collection permissions + _modules + _api + _pages
    const collectionPerms = role.permissions.filter((p: any) => !p.collection?.startsWith('_'));
    const fullPermissions: any = [...collectionPerms];
    (fullPermissions as any)._modules = moduleAccess;
    (fullPermissions as any)._api = apiAccess;
    (fullPermissions as any)._pages = pageAccess;

    await updateRole(roleId, {
      ...form,
      permissions: fullPermissions,
    });

    // Also update pages' roles field
    for (const page of pages) {
      const hasAccess = pageAccess[page.id] !== false;
      const currentRoles: string[] = Array.isArray(page.roles) ? page.roles : [];
      const roleName = deriveRoleName(form.adminAccess);

      let newRoles = [...currentRoles];
      if (hasAccess && !newRoles.includes(roleName)) {
        newRoles.push(roleName);
      } else if (!hasAccess) {
        newRoles = newRoles.filter(r => r !== roleName);
      }

      if (JSON.stringify(newRoles.sort()) !== JSON.stringify(currentRoles.sort())) {
        try { await api.patch(`/pages/${page.id}`, { roles: newRoles }); } catch {}
      }
    }

    addLog({ action: 'update', collection: 'roles', item: roleId, user: 'Admin User', meta: form });
    addNotification({ title: 'Role Updated', message: `Role "${form.name}" has been saved with all access settings.` });
    fetchRoles();
  };

  const deriveRoleName = (isAdmin: boolean) => {
    if (isAdmin) return 'admin';
    const hasWrite = role.permissions.some((p: any) =>
      p.create === 'full' || p.update === 'full' || p.delete === 'full'
    );
    return hasWrite ? 'editor' : 'viewer';
  };

  const handleDelete = async () => {
    const ok = await confirm({ title: 'Delete Role', message: `Delete role "${role.name}"? Users assigned will lose permissions.`, confirmText: 'Delete Role', severity: 'error' });
    if (!ok) return;
    deleteRole(roleId);
    addLog({ action: 'delete', collection: 'roles', item: roleId, user: 'Admin User', meta: { name: role.name } });
    router.push('/admin/settings/roles');
  };

  const getPermission = (collection: string, action: string): PermissionAccess => {
    const perm = role.permissions.find((p: any) => p.collection === collection);
    if (!perm) return 'none';
    return (perm as any)[action] || 'none';
  };

  const handlePermissionChange = (collection: string, action: string, value: PermissionAccess) => {
    updatePermission(roleId, collection, { [action]: value } as any);
  };

  const setAllModules = (val: boolean) => {
    const m: Record<string, boolean> = {};
    ExtensionRegistry.modules.forEach(mod => { m[mod.id] = val; });
    setModuleAccess(m);
  };

  const setAllApi = (val: boolean) => {
    const a: Record<string, boolean> = {};
    API_SECTIONS.forEach(s => { a[s.key] = val; });
    setApiAccess(a);
  };

  const setAllPages = (val: boolean) => {
    const pa: Record<number, boolean> = {};
    pages.forEach(p => { pa[p.id] = val; });
    setPageAccess(pa);
  };

  const collectionKeys = Object.keys(collections);
  const actions = ['create', 'read', 'update', 'delete'];
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => router.push('/admin/settings/roles')}><ArrowLeft size={20} /></IconButton>
          <Shield size={24} color={theme.palette.primary.main} />
          <Typography variant="h5" fontWeight={700}>{form.name}</Typography>
          {form.adminAccess && <Chip label="Admin" size="small" color="error" />}
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" color="error" startIcon={<Trash2 size={16} />} onClick={handleDelete}>Delete</Button>
          <Button variant="contained" startIcon={<Save size={16} />} onClick={handleSave}>Save All</Button>
        </Box>
      </Box>

      {form.adminAccess && (
        <Alert severity="info" sx={{ mb: 3 }}>
          This role has <strong>Admin Access</strong> — all permissions are automatically granted. The settings below only apply when Admin Access is disabled.
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, nv) => setActiveTab(nv)} variant="scrollable" scrollButtons="auto">
          <Tab icon={<Settings size={16} />} iconPosition="start" label="Details" sx={{ minHeight: 48 }} />
          <Tab icon={<Database size={16} />} iconPosition="start" label="Collections" sx={{ minHeight: 48 }} />
          <Tab icon={<Globe size={16} />} iconPosition="start" label="Pages" sx={{ minHeight: 48 }} />
          <Tab icon={<LayoutDashboard size={16} />} iconPosition="start" label="Modules" sx={{ minHeight: 48 }} />
          <Tab icon={<Zap size={16} />} iconPosition="start" label="APIs" sx={{ minHeight: 48 }} />
        </Tabs>
      </Box>

      {/* ── Details Tab ── */}
      {activeTab === 0 && (
        <Paper sx={{ p: 4, maxWidth: 800 }}>
          <Typography variant="h6" fontWeight={600} mb={3}>Role Configuration</Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Role Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth multiline rows={3} label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={<Switch checked={form.appAccess} onChange={e => setForm({ ...form, appAccess: e.target.checked })} />}
                label="App Access"
              />
              <Typography variant="caption" color="text.secondary" display="block" ml={6}>Allow login to admin panel.</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={<Switch checked={form.adminAccess} onChange={e => setForm({ ...form, adminAccess: e.target.checked })} />}
                label="Admin Access"
              />
              <Typography variant="caption" color="text.secondary" display="block" ml={6}>Full unrestricted access. Overrides all settings.</Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* ── Collections Permissions Tab ── */}
      {activeTab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h6" fontWeight={600}>Collection Permissions</Typography>
              <Typography variant="body2" color="text.secondary">Configure CRUD access for each collection.</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip label="Full" size="small" sx={{ bgcolor: '#2ecc7130', color: '#2ecc71' }} />
              <Chip label="Filtered" size="small" sx={{ bgcolor: '#f39c1230', color: '#f39c12' }} />
              <Chip label="None" size="small" sx={{ bgcolor: '#e74c3c30', color: '#e74c3c' }} />
            </Box>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Collection</TableCell>
                  {actions.map(a => <TableCell key={a} sx={{ fontWeight: 700, textTransform: 'capitalize' }}>{a}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {collectionKeys.map(col => (
                  <TableRow key={col} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{collections[col].label}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{col}</Typography>
                    </TableCell>
                    {actions.map(action => (
                      <TableCell key={action}>
                        <TextField
                          select size="small" value={getPermission(col, action)}
                          onChange={e => handlePermissionChange(col, action, e.target.value as PermissionAccess)}
                          sx={{ minWidth: 110 }}
                        >
                          {ACCESS_OPTIONS.map(opt => (
                            <MenuItem key={opt.value} value={opt.value}>
                              <Typography variant="body2" sx={{ color: opt.color, fontWeight: 600 }}>{opt.label}</Typography>
                            </MenuItem>
                          ))}
                        </TextField>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {collectionKeys.length === 0 && (
                  <TableRow><TableCell colSpan={5}><Typography color="text.secondary" textAlign="center" py={3}>No collections found.</Typography></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* ── Pages Access Tab ── */}
      {activeTab === 2 && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h6" fontWeight={600}>Pages Access</Typography>
              <Typography variant="body2" color="text.secondary">Choose which pages this role can see in the sidebar and view.</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" variant="outlined" startIcon={<Check size={14} />} onClick={() => setAllPages(true)}>Allow All</Button>
              <Button size="small" variant="outlined" color="error" startIcon={<X size={14} />} onClick={() => setAllPages(false)}>Deny All</Button>
            </Box>
          </Box>

          {pagesLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : pages.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={4}>No pages created yet. Go to Pages & Routes to create pages.</Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Page</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Path</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>In Nav</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Access</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pages.map(page => {
                    const hasAccess = pageAccess[page.id] !== false;
                    return (
                      <TableRow key={page.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <FileText size={16} color={hasAccess ? theme.palette.primary.main : theme.palette.text.disabled} />
                            <Typography variant="body2" fontWeight={500} sx={{ color: hasAccess ? 'text.primary' : 'text.disabled' }}>{page.title}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell><Typography variant="caption" sx={{ fontFamily: 'monospace', color: hasAccess ? 'text.secondary' : 'text.disabled' }}>{page.path}</Typography></TableCell>
                        <TableCell><Chip label={page.status} size="small" color={page.status === 'published' ? 'success' : 'default'} variant="outlined" /></TableCell>
                        <TableCell>
                          {page.show_in_nav ? <Chip icon={<Eye size={12} />} label="Yes" size="small" color="info" variant="outlined" /> : <Chip icon={<EyeOff size={12} />} label="No" size="small" variant="outlined" />}
                        </TableCell>
                        <TableCell align="center">
                          <Switch
                            checked={hasAccess}
                            onChange={e => setPageAccess({ ...pageAccess, [page.id]: e.target.checked })}
                            color="success"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* ── Modules Access Tab ── */}
      {activeTab === 3 && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h6" fontWeight={600}>Module Access</Typography>
              <Typography variant="body2" color="text.secondary">Control which sidebar modules are visible for this role.</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" variant="outlined" startIcon={<Check size={14} />} onClick={() => setAllModules(true)}>Allow All</Button>
              <Button size="small" variant="outlined" color="error" startIcon={<X size={14} />} onClick={() => setAllModules(false)}>Deny All</Button>
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
            {ExtensionRegistry.modules.map(mod => {
              const Icon = MODULE_ICONS[mod.id] || Settings;
              const allowed = moduleAccess[mod.id] !== false;
              return (
                <Paper
                  key={mod.id}
                  variant="outlined"
                  sx={{
                    p: 2.5, display: 'flex', alignItems: 'center', gap: 2,
                    borderColor: allowed ? alpha(theme.palette.success.main, 0.3) : 'divider',
                    bgcolor: allowed ? alpha(theme.palette.success.main, 0.03) : 'transparent',
                    transition: 'all 0.2s',
                  }}
                >
                  <Box sx={{
                    width: 40, height: 40, borderRadius: 1.5,
                    bgcolor: allowed ? alpha(theme.palette.primary.main, 0.1) : alpha(theme.palette.text.disabled, 0.08),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={20} color={allowed ? theme.palette.primary.main : theme.palette.text.disabled} />
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" fontWeight={600} sx={{ color: allowed ? 'text.primary' : 'text.disabled' }}>{mod.name}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{mod.path}</Typography>
                  </Box>
                  <Switch
                    checked={allowed}
                    onChange={e => setModuleAccess({ ...moduleAccess, [mod.id]: e.target.checked })}
                    color="success"
                  />
                </Paper>
              );
            })}
          </Box>
        </Paper>
      )}

      {/* ── API Access Tab ── */}
      {activeTab === 4 && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h6" fontWeight={600}>API Endpoints Access</Typography>
              <Typography variant="body2" color="text.secondary">Control which API endpoints this role can access.</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" variant="outlined" startIcon={<Check size={14} />} onClick={() => setAllApi(true)}>Allow All</Button>
              <Button size="small" variant="outlined" color="error" startIcon={<X size={14} />} onClick={() => setAllApi(false)}>Deny All</Button>
            </Box>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>API Section</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Endpoint</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Access</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {API_SECTIONS.map(sec => {
                  const allowed = apiAccess[sec.key] !== false;
                  return (
                    <TableRow key={sec.key} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          {allowed ? <Unlock size={16} color={theme.palette.success.main} /> : <Lock size={16} color={theme.palette.error.main} />}
                          <Typography variant="body2" fontWeight={600} sx={{ color: allowed ? 'text.primary' : 'text.disabled' }}>{sec.label}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{sec.desc}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Switch
                          checked={allowed}
                          onChange={e => setApiAccess({ ...apiAccess, [sec.key]: e.target.checked })}
                          color="success"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
}
