"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@mui/material/styles';
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
import { useRolesStore } from '@/store/roles';
import { useActivityStore } from '@/store/activity';
import { useNotificationsStore } from '@/store/notifications';
import { api } from '@/lib/api';
import {
  Search, Plus, Mail, Shield, Edit2, Trash2, Users,
  MoreHorizontal, ChevronDown, UserCheck, UserX
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

const STATUS_COLORS: Record<string, { color: 'success' | 'error' | 'warning'; hex: string }> = {
  active: { color: 'success', hex: '#22C55E' },
  suspended: { color: 'error', hex: '#EF4444' },
  invited: { color: 'warning', hex: '#F59E0B' },
};

export default function UsersPage() {
  const router = useRouter();
  const theme = useTheme();
  const { roles } = useRolesStore();
  const { addLog } = useActivityStore();
  const { addNotification } = useNotificationsStore();

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

  // Fetch users from API
  useEffect(() => {
    fetchUsers();
  }, []);

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
    if (roleId === 'role_admin') return theme.palette.error.main;
    if (roleId === 'role_editor') return theme.palette.info.main;
    return theme.palette.text.secondary;
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
      addLog({ action: 'create', collection: 'directus_users', item: inviteForm.email, user: 'Admin User' });
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
    if (confirm(`Remove user "${user?.firstName} ${user?.lastName}"?`)) {
      try {
        await api.del(`/users/${userId}`);
        addLog({ action: 'delete', collection: 'directus_users', item: userId, user: 'Admin User' });
        addNotification({ title: 'User Removed', message: `${user?.email} has been removed.` });
        fetchUsers();
      } catch {}
    }
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

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} display="flex" alignItems="center" gap={1.5}>
            <Users size={28} /> User Directory
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {users.length} users total — {users.filter(u => u.status === 'active').length} active
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {selectedIds.length > 0 && (
            <>
              <Button variant="outlined" endIcon={<ChevronDown size={14} />}
                onClick={(e) => setBulkMenuAnchor(e.currentTarget)}
                sx={{ borderColor: 'divider' }}>
                {selectedIds.length} Selected
              </Button>
              <Menu anchorEl={bulkMenuAnchor} open={!!bulkMenuAnchor} onClose={() => setBulkMenuAnchor(null)}>
                <MenuItem onClick={() => handleBulkAction('activate')}>
                  <UserCheck size={16} style={{ marginRight: 8 }} /> Activate
                </MenuItem>
                <MenuItem onClick={() => handleBulkAction('suspend')}>
                  <UserX size={16} style={{ marginRight: 8 }} /> Suspend
                </MenuItem>
                <MenuItem onClick={() => handleBulkAction('delete')} sx={{ color: 'error.main' }}>
                  <Trash2 size={16} style={{ marginRight: 8 }} /> Delete
                </MenuItem>
              </Menu>
            </>
          )}
          <Button variant="contained" startIcon={<Plus size={18} />}
            onClick={() => router.push('/admin/users/new')}
            sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}>
            Add User
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
        <TextField
          size="small" placeholder="Search by name or email..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
          sx={{ width: 300 }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment> } }}
        />
        <TextField select size="small" label="Role" value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(0); }}
          sx={{ minWidth: 140 }}>
          <MenuItem value="all">All Roles</MenuItem>
          {roles.map(r => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Status" value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
          sx={{ minWidth: 140 }}>
          <MenuItem value="all">All Statuses</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="suspended">Suspended</MenuItem>
          <MenuItem value="invited">Invited</MenuItem>
        </TextField>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        {roles.map(role => {
          const count = users.filter(u => u.roleId === role.id).length;
          return (
            <Paper key={role.id} variant="outlined" sx={{
              px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5,
              cursor: 'pointer', transition: 'all 200ms',
              border: roleFilter === role.id ? `1px solid ${getRoleColor(role.id)}` : undefined,
              '&:hover': { borderColor: getRoleColor(role.id) },
            }} onClick={() => setRoleFilter(roleFilter === role.id ? 'all' : role.id)}>
              <Shield size={16} style={{ color: getRoleColor(role.id) }} />
              <Box>
                <Typography variant="caption" color="text.secondary">{role.name}</Typography>
                <Typography variant="body2" fontWeight={700}>{count}</Typography>
              </Box>
            </Paper>
          );
        })}
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{ flexGrow: 1 }}>
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
              <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                <Typography color="text.secondary">Loading users...</Typography>
              </TableCell></TableRow>
            ) : pageItems.length === 0 ? (
              <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                <Typography color="text.secondary">No users found.</Typography>
              </TableCell></TableRow>
            ) : (
              pageItems.map(user => (
                <TableRow key={user.id} hover sx={{ cursor: 'pointer' }}
                  onClick={() => router.push(`/admin/users/${user.id}`)}>
                  <TableCell padding="checkbox" onClick={e => e.stopPropagation()}>
                    <Checkbox checked={selectedIds.includes(user.id)}
                      onChange={() => handleToggleSelect(user.id)} />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, fontSize: 13, bgcolor: getRoleColor(user.roleId), fontWeight: 700 }}>
                        {user.firstName?.[0] || ''}{user.lastName?.[0] || ''}
                      </Avatar>
                      <Typography variant="body2" fontWeight={600}>
                        {user.firstName} {user.lastName}
                      </Typography>
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
                      sx={{ bgcolor: `${getRoleColor(user.roleId)}18`, color: getRoleColor(user.roleId), fontWeight: 600 }} />
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
                    <IconButton size="small" onClick={() => router.push(`/admin/users/${user.id}`)} title="Edit">
                      <Edit2 size={15} />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(user.id)} title="Delete">
                      <Trash2 size={15} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div" count={filteredUsers.length} page={page}
        onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage}
        onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        rowsPerPageOptions={[5, 10, 25, 50]}
        sx={{ borderTop: 1, borderColor: 'divider' }}
      />

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
            disabled={!inviteForm.email || !inviteForm.firstName}
            sx={{ bgcolor: 'primary.main' }}>
            Send Invitation
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
