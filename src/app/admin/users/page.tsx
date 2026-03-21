"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Grid from '@mui/material/Grid';
import { alpha, useTheme } from '@mui/material/styles';
import { useRolesStore } from '@/store/roles';
import { useActivityStore } from '@/store/activity';
import { useNotificationsStore } from '@/store/notifications';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import {
  Search, Plus, Mail, Edit2, Trash2, Users,
  ChevronDown, UserCheck, UserX
} from 'lucide-react';

interface UserRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  roleId: string;
  roleName?: string;
  status: 'active' | 'suspended' | 'invited';
  lastAccess: string;
  dateCreated: string;
}

const STATUS_COLORS: Record<string, { color: 'success' | 'error' | 'warning'; bg: string }> = {
  active: { color: 'success', bg: '#10B981' },
  suspended: { color: 'error', bg: '#EF4444' },
  invited: { color: 'warning', bg: '#F59E0B' },
};

export default function UsersPage() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const role = useAuthStore((s) => s.role);
  const { roles, fetchRoles } = useRolesStore();
  const { addLog } = useActivityStore();
  const { addNotification } = useNotificationsStore();
  const confirm = useConfirm();

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ firstName: '', lastName: '', email: '', roleId: 'role_editor' });
  const [bulkMenuAnchor, setBulkMenuAnchor] = useState<null | HTMLElement>(null);

  // Fetch roles on mount
  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    if (role === 'admin') {
      fetchUsers();
    }
  }, [role]);

  useEffect(() => {
    if (role && role !== 'admin') {
      router.replace('/admin/dashboard');
    }
  }, [role, router]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: any[] }>('/users');
      const roleMap: Record<string, string> = {
        'Administrator': 'role_admin',
        'Editor': 'role_editor',
        'Viewer': 'role_viewer',
      };
      const mapped: UserRecord[] = (res.data || []).map((u: any) => ({
        id: String(u.id),
        firstName: u.first_name || '',
        lastName: u.last_name || '',
        email: u.email || '',
        avatar: u.avatar || undefined,
        roleId: roleMap[u.role_name] || 'role_viewer',
        roleName: u.role_name || '',
        status: u.status || 'active',
        lastAccess: u.last_access || '',
        dateCreated: u.date_created || '',
      }));
      setUsers(mapped);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRoleName = (roleId: string) => roles.find(r => r.id === roleId)?.name || roleId;
  const getRoleColor = (roleId: string) => {
    if (roleId === 'role_admin') return '#EF4444';
    if (roleId === 'role_editor') return '#3B82F6';
    return '#8B5CF6';
  };

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.firstName.toLowerCase().includes(q) || u.lastName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchRole = roleFilter === 'all' || u.roleId === roleFilter;
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const handleSelectAll = (checked: boolean) => {
    const pageItems = filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    setSelectedIds(checked ? pageItems.map(u => u.id) : []);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBulkAction = async (action: 'activate' | 'suspend' | 'delete') => {
    setBulkMenuAnchor(null);
    if (action === 'delete') {
      for (const uid of selectedIds) {
        try { await api.del(`/users/${uid}`); } catch {}
      }
      addNotification({ title: 'Users Deleted', message: `${selectedIds.length} users have been removed.` });
    } else {
      const newStatus = action === 'activate' ? 'active' : 'suspended';
      for (const uid of selectedIds) {
        try { await api.patch(`/users/${uid}`, { status: newStatus }); } catch {}
      }
      addNotification({ title: 'Status Updated', message: `${selectedIds.length} users ${action === 'activate' ? 'activated' : 'suspended'}.` });
    }
    setSelectedIds([]);
    fetchUsers();
  };

  const handleInvite = async () => {
    try {
      await api.post('/users', {
        first_name: inviteForm.firstName,
        last_name: inviteForm.lastName,
        email: inviteForm.email,
        role: inviteForm.roleId,
        status: 'invited',
      });
      addLog({ action: 'create', collection: 'users', item: inviteForm.email, user: 'Admin User' });
      addNotification({ title: 'User Invited', message: `Invitation sent to ${inviteForm.email}.` });
      setInviteOpen(false);
      setInviteForm({ firstName: '', lastName: '', email: '', roleId: 'role_editor' });
      fetchUsers();
    } catch (err: any) {
      addNotification({ title: 'Error', message: err.message || 'Failed to create user' });
    }
  };

  const handleDelete = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    const ok = await confirm({ title: 'Remove User', message: `Are you sure you want to remove "${user?.firstName} ${user?.lastName}"?`, confirmText: 'Remove', severity: 'error' });
    if (!ok) return;
    try {
      await api.del(`/users/${userId}`);
      addLog({ action: 'delete', collection: 'users', item: userId, user: 'Admin User' });
      addNotification({ title: 'User Removed', message: `${user?.email} has been removed.` });
      fetchUsers();
    } catch {}
  };

  const timeAgo = (iso: string) => {
    if (!iso) return '—';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const pageItems = filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const allPageSelected = pageItems.length > 0 && pageItems.every(u => selectedIds.includes(u.id));

  if (!role) return null;
  if (role !== 'admin') return null;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', animation: 'fadeIn 300ms ease-out' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 48, height: 48, borderRadius: '14px', bgcolor: alpha('#EC4899', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={24} color="#EC4899" />
          </Box>
          <Box>
            <Typography variant="h3" fontWeight={700}>User Directory</Typography>
            <Typography variant="body2" color="text.secondary">
              {users.length} users total — {users.filter(u => u.status === 'active').length} active
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {selectedIds.length > 0 && (
            <>
              <Button variant="outlined" endIcon={<ChevronDown size={14} />} onClick={(e) => setBulkMenuAnchor(e.currentTarget)} sx={{ borderRadius: '10px' }}>
                {selectedIds.length} Selected
              </Button>
              <Menu anchorEl={bulkMenuAnchor} open={!!bulkMenuAnchor} onClose={() => setBulkMenuAnchor(null)}>
                <MenuItem onClick={() => handleBulkAction('activate')}><UserCheck size={16} style={{ marginRight: 8 }} /> Activate</MenuItem>
                <MenuItem onClick={() => handleBulkAction('suspend')}><UserX size={16} style={{ marginRight: 8 }} /> Suspend</MenuItem>
                <MenuItem onClick={() => handleBulkAction('delete')} sx={{ color: 'error.main' }}><Trash2 size={16} style={{ marginRight: 8 }} /> Delete</MenuItem>
              </Menu>
            </>
          )}
          <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => router.push('/admin/users/new')} sx={{ borderRadius: '10px' }}>
            Add User
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField size="small" placeholder="Search by name or email..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }} sx={{ width: 300 }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment> } }} />
        <TextField select size="small" label="Role" value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(0); }} sx={{ minWidth: 140 }}>
          <MenuItem value="all">All Roles</MenuItem>
          {roles.map(r => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Status" value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(0); }} sx={{ minWidth: 140 }}>
          <MenuItem value="all">All Statuses</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="suspended">Suspended</MenuItem>
          <MenuItem value="invited">Invited</MenuItem>
        </TextField>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {roles.map(r => {
          const count = users.filter(u => u.roleId === r.id).length;
          const color = getRoleColor(r.id);
          return (
            <Paper key={r.id} sx={{
              px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5,
              cursor: 'pointer', borderRadius: '12px', transition: 'all 150ms',
              border: roleFilter === r.id ? `2px solid ${color}` : `1px solid ${theme.palette.divider}`,
              '&:hover': { borderColor: color, bgcolor: alpha(color, 0.04) },
            }} onClick={() => setRoleFilter(roleFilter === r.id ? 'all' : r.id)}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color }} />
              <Box>
                <Typography variant="caption" color="text.secondary">{r.name}</Typography>
                <Typography variant="body2" fontWeight={700}>{count}</Typography>
              </Box>
            </Paper>
          );
        })}
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{ flexGrow: 1, borderRadius: '16px' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox checked={allPageSelected} onChange={(_, c) => handleSelectAll(c)}
                  indeterminate={selectedIds.length > 0 && !allPageSelected} />
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Last Access</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}><Typography color="text.secondary">Loading users...</Typography></TableCell></TableRow>
            ) : pageItems.length === 0 ? (
              <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No users found.</Typography></TableCell></TableRow>
            ) : (
              pageItems.map(user => (
                <TableRow key={user.id} hover sx={{ cursor: 'pointer' }} onClick={() => router.push(`/admin/users/${user.id}`)}>
                  <TableCell padding="checkbox" onClick={e => e.stopPropagation()}>
                    <Checkbox checked={selectedIds.includes(user.id)} onChange={() => handleToggleSelect(user.id)} />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar src={user.avatar || undefined} sx={{
                        width: 36, height: 36, fontSize: 14, fontWeight: 700,
                        background: `linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)`, color: '#fff',
                      }}>
                        {!user.avatar && <>{user.firstName?.[0]}{user.lastName?.[0]}</>}
                      </Avatar>
                      <Typography variant="body2" fontWeight={600}>{user.firstName} {user.lastName}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Mail size={14} style={{ opacity: 0.4 }} />
                      <Typography variant="body2" color="text.secondary">{user.email}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={getRoleName(user.roleId)} size="small"
                      sx={{ bgcolor: alpha(getRoleColor(user.roleId), 0.1), color: getRoleColor(user.roleId), fontWeight: 600 }} />
                  </TableCell>
                  <TableCell>
                    <Chip label={user.status} size="small" color={STATUS_COLORS[user.status]?.color || 'default'}
                      sx={{ textTransform: 'capitalize' }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" fontSize={13}>{timeAgo(user.lastAccess)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" fontSize={13}>
                      {user.dateCreated ? new Date(user.dateCreated).toLocaleDateString() : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" onClick={e => e.stopPropagation()}>
                    <IconButton size="small" onClick={() => router.push(`/admin/users/${user.id}`)}><Edit2 size={15} /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(user.id)}><Trash2 size={15} /></IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination component="div" count={filteredUsers.length} page={page}
        onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage}
        onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        rowsPerPageOptions={[5, 10, 25, 50]} sx={{ borderTop: 1, borderColor: 'divider' }} />

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Invite New User</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3} sx={{ pt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="First Name" value={inviteForm.firstName}
                onChange={e => setInviteForm({ ...inviteForm, firstName: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Last Name" value={inviteForm.lastName}
                onChange={e => setInviteForm({ ...inviteForm, lastName: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Email Address" type="email" value={inviteForm.email}
                onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField select fullWidth label="Role" value={inviteForm.roleId}
                onChange={e => setInviteForm({ ...inviteForm, roleId: e.target.value })}>
                {roles.map(r => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setInviteOpen(false)} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleInvite}
            disabled={!inviteForm.email || !inviteForm.firstName}>Send Invitation</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
