'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import { alpha, useTheme } from '@mui/material/styles';
import Link from 'next/link';
import {
  Plus, Shield, Settings, Trash2, Copy, Users, MoreVertical,
  LayoutDashboard, Database, FileText, FolderOpen, Activity, Zap,
  CheckCircle, XCircle, AlertCircle, Eye, Edit2, Key, Crown
} from 'lucide-react';
import { useRolesStore } from '@/store/roles';
import { useActivityStore } from '@/store/activity';
import { useNotificationsStore } from '@/store/notifications';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import { ExtensionRegistry } from '@/lib/meta/registry';

const ROLE_COLORS = [
  '#6644ff', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'
];

const ROLE_TEMPLATES = [
  {
    id: 'admin',
    name: 'Full Admin',
    description: 'Unrestricted access to all features and data.',
    icon: Crown,
    color: '#ef4444',
    adminAccess: true,
    appAccess: true,
  },
  {
    id: 'editor',
    name: 'Content Editor',
    description: 'Can create, edit, and publish content. Cannot manage settings.',
    icon: Edit2,
    color: '#22c55e',
    adminAccess: false,
    appAccess: true,
  },
  {
    id: 'author',
    name: 'Author',
    description: 'Can create and edit their own content.',
    icon: FileText,
    color: '#3b82f6',
    adminAccess: false,
    appAccess: true,
  },
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to content. Cannot modify anything.',
    icon: Eye,
    color: '#f59e0b',
    adminAccess: false,
    appAccess: true,
  },
  {
    id: 'api_only',
    name: 'API Only',
    description: 'No app access. Only API token authentication.',
    icon: Key,
    color: '#8b5cf6',
    adminAccess: false,
    appAccess: false,
  },
];

export default function RolesListPage() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { roles, loading, fetchRoles, addRole, deleteRole } = useRolesStore();
  const { addLog } = useActivityStore();
  const { addNotification } = useNotificationsStore();
  const confirm = useConfirm();

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', description: '' });
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuRole, setMenuRole] = useState<any>(null);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleCreate = async () => {
    if (!newRole.name.trim()) return;
    setCreating(true);
    try {
      const template = ROLE_TEMPLATES.find(t => t.id === selectedTemplate);
      await addRole({
        name: newRole.name,
        description: newRole.description || template?.description || '',
        adminAccess: template?.adminAccess || false,
        appAccess: template?.appAccess !== false,
        permissions: [],
      });
      addLog({ action: 'create', collection: 'roles', user: 'Admin User', meta: { name: newRole.name } });
      addNotification({ title: 'Role Created', message: `"${newRole.name}" has been created successfully.` });
      setCreateOpen(false);
      setNewRole({ name: '', description: '' });
      setSelectedTemplate(null);
    } catch (err: any) {
      addNotification({ title: 'Error', message: err.message || 'Failed to create role' });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (role: any) => {
    const ok = await confirm({
      title: 'Delete Role',
      message: `Are you sure you want to delete "${role.name}"? ${role.userCount > 0 ? `This role has ${role.userCount} users assigned. They will lose access.` : ''}`,
      confirmText: 'Delete Role',
      severity: 'error',
    });
    if (!ok) return;
    try {
      await deleteRole(role.id);
      addLog({ action: 'delete', collection: 'roles', user: 'Admin User', meta: { name: role.name } });
      addNotification({ title: 'Role Deleted', message: `"${role.name}" has been deleted.` });
    } catch (err: any) {
      addNotification({ title: 'Error', message: err.message || 'Failed to delete role' });
    }
    setAnchorEl(null);
  };

  const handleDuplicate = async (role: any) => {
    try {
      await addRole({
        name: `${role.name} (Copy)`,
        description: role.description,
        adminAccess: role.adminAccess,
        appAccess: role.appAccess,
        permissions: role.permissions || [],
      });
      addNotification({ title: 'Role Duplicated', message: `"${role.name} (Copy)" has been created.` });
    } catch (err: any) {
      addNotification({ title: 'Error', message: err.message || 'Failed to duplicate role' });
    }
    setAnchorEl(null);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, role: any) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setMenuRole(role);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuRole(null);
  };

  const getRoleIcon = (index: number) => {
    const icons = [Shield, Database, Users, Settings, Zap, Activity, FileText, FolderOpen];
    const Icon = icons[index % icons.length];
    return <Icon size={24} />;
  };

  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant='h4' fontWeight={700} display='flex' alignItems='center' gap={1.5}>
            <Shield size={32} color={theme.palette.primary.main} />
            Roles & Permissions
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
            Manage user roles and configure their access to content, features, and API.
          </Typography>
        </Box>
        <Button
          variant='contained'
          startIcon={<Plus size={18} />}
          onClick={() => setCreateOpen(true)}
        >
          Create Role
        </Button>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <Paper sx={{ p: 2, flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
            <Shield size={20} />
          </Avatar>
          <Box>
            <Typography variant='h6' fontWeight={700}>{roles.length}</Typography>
            <Typography variant='caption' color='text.secondary'>Total Roles</Typography>
          </Box>
        </Paper>
        <Paper sx={{ p: 2, flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: alpha('#22c55e', 0.1), color: '#22c55e' }}>
            <Users size={20} />
          </Avatar>
          <Box>
            <Typography variant='h6' fontWeight={700}>
              {roles.reduce((sum, r) => sum + (r.userCount || 0), 0)}
            </Typography>
            <Typography variant='caption' color='text.secondary'>Total Users</Typography>
          </Box>
        </Paper>
        <Paper sx={{ p: 2, flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: alpha('#ef4444', 0.1), color: '#ef4444' }}>
            <Crown size={20} />
          </Avatar>
          <Box>
            <Typography variant='h6' fontWeight={700}>
              {roles.filter(r => r.adminAccess).length}
            </Typography>
            <Typography variant='caption' color='text.secondary'>Admin Roles</Typography>
          </Box>
        </Paper>
      </Box>

      {/* Roles Grid */}
      {loading && roles.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : roles.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Shield size={48} style={{ opacity: 0.2 }} />
          <Typography variant='h6' sx={{ mt: 2 }}>No roles yet</Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
            Create your first role to start managing permissions.
          </Typography>
          <Button variant='contained' startIcon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
            Create First Role
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {roles.map((role, index) => {
            const roleColor = ROLE_COLORS[index % ROLE_COLORS.length];
            const hasAdmin = role.adminAccess;
            const hasApp = role.appAccess;

            return (
              <Grid key={role.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 0,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                    overflow: 'hidden',
                    transition: 'all 200ms ease',
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: roleColor,
                      boxShadow: `0 4px 20px ${alpha(roleColor, 0.15)}`,
                      transform: 'translateY(-2px)',
                    },
                  }}
                  onClick={() => router.push(`/admin/settings/roles/${role.id}`)}
                >
                  {/* Role Header */}
                  <Box
                    sx={{
                      p: 2.5,
                      bgcolor: alpha(roleColor, isDark ? 0.15 : 0.05),
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 2,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Avatar
                      sx={{
                        bgcolor: alpha(roleColor, 0.15),
                        color: roleColor,
                        width: 48,
                        height: 48,
                      }}
                    >
                      {getRoleIcon(index)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant='h6' fontWeight={700} noWrap>
                          {role.name}
                        </Typography>
                        {hasAdmin && (
                          <Chip
                            label='Admin'
                            size='small'
                            sx={{
                              height: 20,
                              fontSize: 10,
                              fontWeight: 700,
                              bgcolor: alpha('#ef4444', 0.1),
                              color: '#ef4444',
                            }}
                          />
                        )}
                      </Box>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        sx={{
                          mt: 0.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {role.description || 'No description'}
                      </Typography>
                    </Box>
                    <IconButton
                      size='small'
                      onClick={(e) => handleMenuOpen(e, role)}
                      sx={{ mt: -0.5 }}
                    >
                      <MoreVertical size={18} />
                    </IconButton>
                  </Box>

                  {/* Role Stats */}
                  <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      {hasApp ? (
                        <CheckCircle size={16} color='#22c55e' />
                      ) : (
                        <XCircle size={16} color='#94a3b8' />
                      )}
                      <Typography variant='caption' color='text.secondary'>
                        App Access
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      {hasAdmin ? (
                        <CheckCircle size={16} color='#22c55e' />
                      ) : (
                        <XCircle size={16} color='#94a3b8' />
                      )}
                      <Typography variant='caption' color='text.secondary'>
                        Admin
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Users size={16} color={(role.userCount || 0) > 0 ? '#f59e0b' : '#8b5cf6'} />
                      <Typography
                        variant='caption'
                        fontWeight={600}
                        color={(role.userCount || 0) > 0 ? 'warning.main' : 'text.primary'}
                      >
                        {role.userCount || 0} users
                      </Typography>
                      {(role.userCount || 0) > 0 && (
                        <Typography variant='caption' color='text.secondary' fontSize={10}>
                          (cannot delete)
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Action Buttons */}
                  <Box
                    sx={{
                      p: 1.5,
                      borderTop: `1px solid ${theme.palette.divider}`,
                      display: 'flex',
                      gap: 1,
                    }}
                  >
                    <Link href={`/admin/settings/roles/${role.id}`} style={{ flex: 1, textDecoration: 'none' }}>
                      <Button
                        fullWidth
                        variant='outlined'
                        size='small'
                        startIcon={<Settings size={14} />}
                        sx={{ borderColor: alpha(roleColor, 0.3) }}
                      >
                        Configure
                      </Button>
                    </Link>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Role Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon><Edit2 size={16} /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => menuRole && handleDuplicate(menuRole)}>
          <ListItemIcon><Copy size={16} /></ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => menuRole && handleDelete(menuRole)}
          sx={{ color: menuRole && menuRole.userCount > 0 ? 'text.disabled' : 'error.main' }}
          disabled={menuRole && menuRole.userCount > 0}
        >
          <ListItemIcon><Trash2 size={16} color="inherit" /></ListItemIcon>
          <ListItemText
            primary={menuRole && menuRole.userCount > 0 ? `Cannot delete (${menuRole.userCount} users)` : 'Delete'}
          />
        </MenuItem>
      </Menu>

      {/* Create Role Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Shield size={20} />
            Create New Role
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity='info' sx={{ mb: 3 }}>
            Start from a template or create a blank role with custom permissions.
          </Alert>

          {/* Templates */}
          <Typography variant='subtitle2' fontWeight={600} color='primary' mb={1.5}>
            Choose a Template
          </Typography>
          <Grid container spacing={1.5} sx={{ mb: 3 }}>
            {ROLE_TEMPLATES.map((template) => {
              const Icon = template.icon;
              const isSelected = selectedTemplate === template.id;
              return (
                <Grid key={template.id} size={{ xs: 12, sm: 6 }}>
                  <Paper
                    variant='outlined'
                    onClick={() => setSelectedTemplate(template.id)}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      borderColor: isSelected ? template.color : 'divider',
                      bgcolor: isSelected ? alpha(template.color, 0.05) : 'transparent',
                      transition: 'all 150ms ease',
                      '&:hover': { borderColor: template.color },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          bgcolor: alpha(template.color, 0.1),
                          color: template.color,
                        }}
                      >
                        <Icon size={18} />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant='body2' fontWeight={600}>
                          {template.name}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {template.description}
                        </Typography>
                      </Box>
                      {isSelected && (
                        <CheckCircle size={18} color={template.color} />
                      )}
                    </Box>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Role Details */}
          <Typography variant='subtitle2' fontWeight={600} color='primary' mb={1.5}>
            Role Details
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='Role Name'
                value={newRole.name}
                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                placeholder='e.g. Content Manager'
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='Description'
                value={newRole.description}
                onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                placeholder='Brief description of this role'
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setCreateOpen(false); setSelectedTemplate(null); }} color='inherit'>
            Cancel
          </Button>
          <Button
            variant='contained'
            onClick={handleCreate}
            disabled={!newRole.name.trim() || creating}
            startIcon={creating ? <CircularProgress size={16} color='inherit' /> : <Plus size={16} />}
          >
            {creating ? 'Creating...' : 'Create Role'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
