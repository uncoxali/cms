"use client";

import { use, useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Divider from '@mui/material/Divider';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Tooltip from '@mui/material/Tooltip';
import Grid from '@mui/material/Grid';
import NextLink from 'next/link';
import { useRolesStore } from '@/store/roles';
import { useActivityStore } from '@/store/activity';
import { useNotificationsStore } from '@/store/notifications';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import {
  Save, ArrowLeft, Trash2, Shield, Mail, Key, Clock, User, Users,
  Monitor, Smartphone, MapPin, LogOut, ShieldCheck, ShieldOff,
  RefreshCw, Send, Check, X, Eye, EyeOff, Upload, Camera,
  ChevronRight, Plus, PenTool, LogIn, Database, Activity
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────
interface UserForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  roleId: string;
  status: 'active' | 'suspended' | 'invited' | 'archived';
  phone: string;
  jobTitle: string;
  locale: string;
  timezone: string;
  twoFactorEnabled: boolean;
  avatar: string;
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: '#22C55E' },
  { value: 'suspended', label: 'Suspended', color: '#EF4444' },
  { value: 'invited', label: 'Invited', color: '#F59E0B' },
  { value: 'archived', label: 'Archived', color: '#6B7280' },
];

const MOCK_SESSIONS = [
  { id: 's1', device: 'Chrome on macOS', location: 'Tehran, Iran', lastSeen: new Date(Date.now() - 300000).toISOString(), current: true },
  { id: 's2', device: 'Safari on iPhone', location: 'Tehran, Iran', lastSeen: new Date(Date.now() - 7200000).toISOString(), current: false },
  { id: 's3', device: 'Firefox on Windows', location: 'Dubai, UAE', lastSeen: new Date(Date.now() - 86400000).toISOString(), current: false },
];

const ACTION_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  create: { label: 'CREATE', color: '#22C55E', icon: Plus },
  update: { label: 'UPDATE', color: '#3B82F6', icon: PenTool },
  delete: { label: 'DELETE', color: '#EF4444', icon: Trash2 },
  login: { label: 'LOGIN', color: '#8B5CF6', icon: LogIn },
  logout: { label: 'LOGOUT', color: '#6B7280', icon: LogOut },
  'flow.run': { label: 'FLOW', color: '#F59E0B', icon: Activity },
};

// ─── Component ──────────────────────────────────────────────
export default function UserEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === 'new';
  const router = useRouter();
  const { roles } = useRolesStore();
  const { logs, addLog } = useActivityStore();
  const { addNotification } = useNotificationsStore();
  const currentUser = useAuthStore((s) => s.user);
  const theme = useTheme();

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [activityPage, setActivityPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<UserForm>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    roleId: 'role_editor',
    status: isNew ? 'active' : 'active',
    phone: '',
    jobTitle: '',
    locale: 'en-US',
    timezone: 'Asia/Tehran',
    twoFactorEnabled: false,
    avatar: '',
  });

  const [originalData, setOriginalData] = useState<any>(null);

  // Load user data for edit mode
  useEffect(() => {
    if (!isNew) {
      loadUser();
    }
  }, [id, isNew]);

  const loadUser = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: any }>(`/users/${id}`);
      const u = res.data;
      setForm({
        firstName: u.first_name || '',
        lastName: u.last_name || '',
        email: u.email || '',
        password: '',
        confirmPassword: '',
        roleId: u.role_id || u.role || 'role_editor',
        status: u.status || 'active',
        phone: u.phone || '',
        jobTitle: u.job_title || '',
        locale: u.locale || 'en-US',
        timezone: u.timezone || 'Asia/Tehran',
        twoFactorEnabled: !!u.tfa_secret,
        avatar: u.avatar || '',
      });
      setOriginalData(u);
    } catch (err: any) {
      setError(err.message || 'Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  const userName = form.firstName && form.lastName
    ? `${form.firstName} ${form.lastName}`
    : form.email || 'New User';

  // Activity logs for this user
  const userLogs = useMemo(() => {
    return logs.filter(l => l.user === userName || l.user === form.email);
  }, [logs, userName, form.email]);

  const currentRole = roles.find(r => r.id === form.roleId);

  // ─── Handlers ──────────────────────────────
  const updateField = (field: keyof UserForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.email) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Invalid email format';
    if (!form.roleId) errors.roleId = 'Role is required';
    if (isNew && form.password && form.password.length < 6) errors.password = 'Password must be at least 6 characters';
    if (isNew && form.password && form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError(Object.values(errors)[0]);
      return false;
    }
    return true;
  };

  const handleSave = async (stay = false) => {
    if (!validate()) return;
    setError(null);
    setFieldErrors({});
    setSaving(true);

    try {
      const roleNameMap: Record<string, string> = {
        'role_admin': 'Administrator',
        'role_editor': 'Editor',
        'role_viewer': 'Viewer',
      };

      const payload: any = {
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        role: form.roleId,
        status: form.status,
      };

      if (form.password) {
        payload.password = form.password;
      }

      if (isNew) {
        if (!form.password) {
          payload.status = 'invited';
        }
        const createRes = await api.post<{ data?: { id?: number } }>('/users', payload);
        const newUserId = createRes?.data?.id;
        addLog({ action: 'create', collection: 'neurofy_users', item: form.email, user: currentUser?.name || 'Admin' });
        addNotification({ title: 'User Created', message: `${form.firstName || form.email} has been created.` });

        if (!form.password) {
          // Trigger mock invite flow
          try { await api.post('/flows/run/invite-user', { email: form.email }); } catch {}
          addNotification({ title: 'Invite Sent', message: `Invitation email sent to ${form.email}.` });
        }

        if (stay && newUserId) {
          router.push(`/admin/users/${newUserId}`);
          return;
        }
      } else {
        await api.patch(`/users/${id}`, payload);

        // Log specific changes
        if (originalData) {
          const roleMap: Record<string, string> = { 'Administrator': 'role_admin', 'Editor': 'role_editor', 'Viewer': 'role_viewer' };
          if ((roleMap[originalData.role_name] || originalData.role) !== form.roleId) {
            addLog({ action: 'update', collection: 'neurofy_users', item: id, user: currentUser?.name || 'Admin', meta: { field: 'role', from: originalData.role_name, to: roleNameMap[form.roleId] } });
          }
          if (originalData.status !== form.status) {
            addLog({ action: 'update', collection: 'neurofy_users', item: id, user: currentUser?.name || 'Admin', meta: { field: 'status', from: originalData.status, to: form.status } });
          }
          if (originalData.email !== form.email) {
            addLog({ action: 'update', collection: 'neurofy_users', item: id, user: currentUser?.name || 'Admin', meta: { field: 'email', from: originalData.email, to: form.email } });
          }
        }

        addNotification({ title: 'User Updated', message: `${userName} has been updated.` });
      }

      if (stay) {
        loadUser();
      } else {
        router.push('/admin/users');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.del(`/users/${id}`);
      addLog({ action: 'delete', collection: 'neurofy_users', item: id, user: currentUser?.name || 'Admin' });
      addNotification({ title: 'User Deleted', message: `${userName} has been removed.` });
      router.push('/admin/users');
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
    }
    setDeleteConfirmOpen(false);
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmNewPassword) { setError('Passwords do not match'); return; }
    try {
      await api.patch(`/users/${id}`, { password: newPassword });
      addLog({ action: 'update', collection: 'neurofy_users', item: id, user: currentUser?.name || 'Admin', meta: { field: 'password' } });
      addNotification({ title: 'Password Reset', message: `Password for ${userName} has been changed.` });
      setResetPasswordOpen(false);
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    }
  };

  const timeAgo = (iso: string) => {
    if (!iso) return '—';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const statusColor = STATUS_OPTIONS.find(s => s.value === form.status)?.color || '#6B7280';

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Typography color="text.secondary">Loading user...</Typography>
      </Box>
    );
  }

  // ─── Render ──────────────────────────────
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Breadcrumb + Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Breadcrumbs sx={{ mb: 1, '& a': { textDecoration: 'none' } }}>
            <Link component={NextLink} href="/admin/users" color="text.secondary" underline="hover" fontSize={13}>
              Users
            </Link>
            <Typography fontSize={13} color="text.primary" fontWeight={600}>
              {isNew ? 'New User' : userName}
            </Typography>
          </Breadcrumbs>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => router.push('/admin/users')} size="small" sx={{ bgcolor: 'action.hover' }}>
              <ArrowLeft size={18} />
            </IconButton>
            <Typography variant="h5" fontWeight={700}>
              {isNew ? 'Create New User' : userName}
            </Typography>
            {!isNew && (
              <Chip
                label={form.status}
                size="small"
                sx={{ bgcolor: `${statusColor}18`, color: statusColor, fontWeight: 700, textTransform: 'capitalize' }}
              />
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
          <Button variant="outlined" color="inherit" onClick={() => router.push('/admin/users')}
            sx={{ borderColor: 'divider' }}>
            Cancel
          </Button>
          {!isNew && (
            <Button variant="outlined" color="error" startIcon={<Trash2 size={16} />}
              onClick={() => setDeleteConfirmOpen(true)}
              sx={{ borderColor: (t) => `${t.palette.error.main}30` }}>
              Delete
            </Button>
          )}
          <Button variant="outlined" onClick={() => handleSave(true)} disabled={saving}
            sx={{ borderColor: (t) => `${t.palette.primary.main}40`, color: 'primary.main' }}>
            {saving ? 'Saving...' : isNew ? 'Create & Continue Editing' : 'Save & Stay'}
          </Button>
          <Button variant="contained" startIcon={isNew ? <Plus size={16} /> : <Save size={16} />} onClick={() => handleSave(false)} disabled={saving}
            sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}>
            {saving ? 'Saving...' : isNew ? 'Create User' : 'Save'}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2, borderRadius: '12px' }}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3, minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0.5, fontSize: 13 } }}>
        <Tab icon={<User size={14} />} iconPosition="start" label="General" />
        <Tab icon={<Shield size={14} />} iconPosition="start" label="Access" />
        {!isNew && <Tab icon={<Key size={14} />} iconPosition="start" label="Security" />}
        {!isNew && <Tab icon={<Activity size={14} />} iconPosition="start" label="Activity" />}
      </Tabs>

      {/* Content */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <Grid container spacing={3}>
          {/* Main Column */}
          <Grid size={{ xs: 12, md: 8 }}>
            {/* ═══ TAB 0: General ═══ */}
            {activeTab === 0 && (
              <Paper sx={{ p: 3 }}>
                {/* Avatar Row */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
                  <Box sx={{ position: 'relative' }}>
                    <Avatar sx={{
                      width: 80, height: 80, fontSize: 28, fontWeight: 700,
                      bgcolor: `${statusColor}25`, color: statusColor,
                      border: `3px solid ${statusColor}40`,
                    }}>
                      {form.firstName?.[0]?.toUpperCase() || form.email?.[0]?.toUpperCase() || 'U'}
                      {form.lastName?.[0]?.toUpperCase() || ''}
                    </Avatar>
                    <Tooltip title="Upload avatar">
                      <IconButton size="small" sx={{
                        position: 'absolute', bottom: -4, right: -4,
                        bgcolor: 'primary.main', color: 'white', width: 28, height: 28,
                        '&:hover': { bgcolor: 'primary.dark' },
                      }}>
                        <Camera size={14} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>{userName}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {currentRole?.name || 'No role'} • {form.email || 'No email'}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Name Fields */}
                <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="First Name" value={form.firstName}
                      onChange={e => updateField('firstName', e.target.value)} size="small" />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Last Name" value={form.lastName}
                      onChange={e => updateField('lastName', e.target.value)} size="small" />
                  </Grid>
                </Grid>

                {/* Email */}
                <TextField fullWidth label="Email Address" value={form.email} required
                  onChange={e => { updateField('email', e.target.value); setFieldErrors(prev => ({ ...prev, email: '' })); }}
                  size="small" type="email" sx={{ mb: 2.5 }}
                  error={!!fieldErrors.email} helperText={fieldErrors.email}
                  slotProps={{ input: { startAdornment: <Mail size={16} style={{ marginRight: 8, opacity: 0.4 }} /> } }} />

                {/* Password (New mode) */}
                {isNew && (
                  <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label="Password" size="small"
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={e => { updateField('password', e.target.value); setFieldErrors(prev => ({ ...prev, password: '' })); }}
                        error={!!fieldErrors.password}
                        helperText={fieldErrors.password || 'Leave empty to send invitation'}
                        slotProps={{ input: {
                          endAdornment: (
                            <IconButton size="small" onClick={() => setShowPassword(!showPassword)}>
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </IconButton>
                          )
                        }}} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label="Confirm Password" size="small"
                        type={showPassword ? 'text' : 'password'}
                        value={form.confirmPassword}
                        onChange={e => { updateField('confirmPassword', e.target.value); setFieldErrors(prev => ({ ...prev, confirmPassword: '' })); }}
                        error={!!fieldErrors.confirmPassword}
                        helperText={fieldErrors.confirmPassword} />
                    </Grid>
                  </Grid>
                )}

                {/* Password Reset (Edit mode) */}
                {!isNew && (
                  <Box sx={{ mb: 2.5 }}>
                    <Button variant="outlined" startIcon={<Key size={16} />}
                      onClick={() => setResetPasswordOpen(true)}
                      sx={{ borderColor: 'divider', color: 'text.secondary' }}>
                      Reset Password
                    </Button>
                  </Box>
                )}

                {/* Role & Status */}
                <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField select fullWidth label="Role" value={form.roleId} required
                      onChange={e => { updateField('roleId', e.target.value); setFieldErrors(prev => ({ ...prev, roleId: '' })); }}
                      size="small" error={!!fieldErrors.roleId} helperText={fieldErrors.roleId}>
                      {roles.map(r => (
                        <MenuItem key={r.id} value={r.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Shield size={14} color={r.adminAccess ? '#e74c3c' : r.appAccess ? '#3498db' : '#7f8c8d'} />
                            {r.name}
                          </Box>
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField select fullWidth label="Status" value={form.status} required
                      onChange={e => updateField('status', e.target.value as any)} size="small">
                      {STATUS_OPTIONS.map(s => (
                        <MenuItem key={s.value} value={s.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color }} />
                            {s.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, color: 'text.secondary', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Additional Info
                </Typography>

                {/* Custom Fields */}
                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Phone" value={form.phone}
                      onChange={e => updateField('phone', e.target.value)} size="small" />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Job Title" value={form.jobTitle}
                      onChange={e => updateField('jobTitle', e.target.value)} size="small" />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField select fullWidth label="Locale" value={form.locale}
                      onChange={e => updateField('locale', e.target.value)} size="small">
                      <MenuItem value="en-US">English (US)</MenuItem>
                      <MenuItem value="fa-IR">فارسی</MenuItem>
                      <MenuItem value="de-DE">Deutsch</MenuItem>
                      <MenuItem value="fr-FR">Français</MenuItem>
                      <MenuItem value="ar-SA">العربية</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField select fullWidth label="Timezone" value={form.timezone}
                      onChange={e => updateField('timezone', e.target.value)} size="small">
                      <MenuItem value="Asia/Tehran">Asia/Tehran (UTC+3:30)</MenuItem>
                      <MenuItem value="UTC">UTC</MenuItem>
                      <MenuItem value="America/New_York">America/New_York (UTC-5)</MenuItem>
                      <MenuItem value="Europe/London">Europe/London (UTC+0)</MenuItem>
                      <MenuItem value="Asia/Dubai">Asia/Dubai (UTC+4)</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
              </Paper>
            )}

            {/* ═══ TAB 1: Access ═══ */}
            {activeTab === 1 && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={700} mb={2}>Role & Permissions</Typography>
                {currentRole ? (
                  <Box>
                    <Paper variant="outlined" sx={{ p: 2.5, mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{
                            width: 44, height: 44, borderRadius: '12px',
                            bgcolor: currentRole.adminAccess ? 'rgba(231,76,60,0.12)' : 'rgba(52,152,219,0.12)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Shield size={22} color={currentRole.adminAccess ? '#e74c3c' : '#3498db'} />
                          </Box>
                          <Box>
                            <Typography variant="h6" fontWeight={700}>{currentRole.name}</Typography>
                            <Typography variant="body2" color="text.secondary">{currentRole.description}</Typography>
                          </Box>
                        </Box>
                        <Button component={NextLink} href="/admin/settings/roles" variant="text" endIcon={<ChevronRight size={16} />}
                          sx={{ color: 'primary.main', fontSize: 13 }}>
                          Manage Role
                        </Button>
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <Grid container spacing={2}>
                        <Grid size={{ xs: 6 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            {currentRole.appAccess ? <ShieldCheck size={18} color={theme.palette.success.main} /> : <ShieldOff size={18} color={theme.palette.error.main} />}
                            <Box>
                              <Typography variant="body2" fontWeight={600}>App Access</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {currentRole.appAccess ? 'Can access the application' : 'No app access'}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            {currentRole.adminAccess ? <ShieldCheck size={18} color={theme.palette.success.main} /> : <ShieldOff size={18} color={theme.palette.error.main} />}
                            <Box>
                              <Typography variant="body2" fontWeight={600}>Admin Access</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {currentRole.adminAccess ? 'Full admin privileges' : 'Limited access'}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>

                    {/* Permission Summary */}
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: 'text.secondary', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
                      Collection Permissions
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Collection</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: 12 }} align="center">Create</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: 12 }} align="center">Read</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: 12 }} align="center">Update</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: 12 }} align="center">Delete</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {currentRole.permissions.map(p => (
                            <TableRow key={p.collection}>
                              <TableCell sx={{ fontSize: 13 }}>{p.collection}</TableCell>
                              {(['create', 'read', 'update', 'delete'] as const).map(action => (
                                <TableCell key={action} align="center">
                                  <Chip
                                    label={p[action]}
                                    size="small"
                                    sx={{
                                      fontSize: 10, height: 22, fontWeight: 700,
                                      bgcolor: p[action] === 'full' ? `${theme.palette.success.main}12` : p[action] === 'none' ? `${theme.palette.error.main}12` : `${theme.palette.warning.main}12`,
                                      color: p[action] === 'full' ? 'success.main' : p[action] === 'none' ? 'error.main' : 'warning.main',
                                    }}
                                  />
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                ) : (
                  <Alert severity="warning">No role assigned to this user.</Alert>
                )}
              </Paper>
            )}

            {/* ═══ TAB 2: Security ═══ */}
            {activeTab === 2 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Two-Factor */}
                <Paper sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: form.twoFactorEnabled ? `${theme.palette.success.main}12` : 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShieldCheck size={22} color={form.twoFactorEnabled ? theme.palette.success.main : theme.palette.text.secondary} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700}>Two-Factor Authentication</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Adds an extra layer of security using TOTP codes.
                        </Typography>
                      </Box>
                    </Box>
                    <FormControlLabel
                      control={<Switch checked={form.twoFactorEnabled} onChange={e => updateField('twoFactorEnabled', e.target.checked)} />}
                      label={form.twoFactorEnabled ? 'Enabled' : 'Disabled'} labelPlacement="start"
                    />
                  </Box>
                </Paper>

                {/* Password Actions */}
                <Paper sx={{ p: 3 }}>
                  <Typography variant="subtitle1" fontWeight={700} mb={2}>Password & Account</Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {!isNew && (
                      <Button variant="outlined" startIcon={<Key size={16} />}
                        onClick={() => setResetPasswordOpen(true)}
                        sx={{ borderColor: 'divider' }}>
                        Reset Password
                      </Button>
                    )}
                    <Button variant="outlined" startIcon={<Send size={16} />}
                      onClick={() => addNotification({ title: 'Email Sent', message: `Password reset email sent to ${form.email}.` })}
                      sx={{ borderColor: 'divider' }}>
                      Send Password Reset Email
                    </Button>
                  </Box>
                </Paper>

                {/* Sessions */}
                <Paper sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight={700}>Active Sessions</Typography>
                    <Button variant="text" color="error" startIcon={<LogOut size={14} />} sx={{ fontSize: 12 }}
                      onClick={() => addNotification({ title: 'Sessions Cleared', message: 'All sessions have been terminated.' })}>
                      Sign out all devices
                    </Button>
                  </Box>
                  {MOCK_SESSIONS.map(session => (
                    <Paper key={session.id} variant="outlined" sx={{ p: 2, mb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ width: 36, height: 36, borderRadius: '8px', bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {session.device.includes('iPhone') ? <Smartphone size={18} /> : <Monitor size={18} />}
                        </Box>
                        <Box>
                          <Typography variant="body2" fontWeight={600} component="div">
                            {session.device} {session.current && <Chip label="Current" size="small" color="success" sx={{ ml: 1, height: 18, fontSize: 10 }} />}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
                            <MapPin size={10} style={{ marginRight: 4 }} />{session.location} • {timeAgo(session.lastSeen)}
                          </Typography>
                        </Box>
                      </Box>
                      {!session.current && (
                        <IconButton size="small" color="error" title="Sign out"
                          onClick={() => addNotification({ title: 'Session Ended', message: `Signed out from ${session.device}.` })}>
                          <LogOut size={16} />
                        </IconButton>
                      )}
                    </Paper>
                  ))}
                </Paper>
              </Box>
            )}

            {/* ═══ TAB 3: Activity ═══ */}
            {activeTab === 3 && (
              <Paper sx={{ p: 0 }}>
                <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" fontWeight={700}>User Activity ({userLogs.length})</Typography>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Action</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Collection</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Item</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Time</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {userLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                            <Activity size={28} style={{ opacity: 0.15, marginBottom: 8 }} />
                            <Typography color="text.secondary" variant="body2">No activity recorded for this user.</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        userLogs.slice(activityPage * 10, activityPage * 10 + 10).map(log => {
                          const cfg = ACTION_CONFIG[log.action] || ACTION_CONFIG.create;
                          return (
                            <TableRow key={log.id} hover>
                              <TableCell>
                                <Chip icon={<cfg.icon size={12} />} label={cfg.label} size="small"
                                  sx={{ fontWeight: 700, fontSize: 10, bgcolor: cfg.color + '18', color: cfg.color }} />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontSize={13}>{log.collection || 'System'}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontSize={13} color="text.secondary">
                                  {log.item || '—'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontSize={13} color="text.secondary">{timeAgo(log.timestamp)}</Typography>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                {userLogs.length > 10 && (
                  <TablePagination
                    component="div" count={userLogs.length} page={activityPage}
                    onPageChange={(_, p) => setActivityPage(p)} rowsPerPage={10}
                    rowsPerPageOptions={[10]}
                    sx={{ borderTop: 1, borderColor: 'divider' }}
                  />
                )}
              </Paper>
            )}
          </Grid>

          {/* ─── Sidebar ─── */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Metadata Card */}
              <Paper sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, color: 'text.secondary', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Metadata
                </Typography>
                {[
                  { label: 'ID', value: isNew ? 'Auto-generated' : id, icon: <Database size={14} /> },
                  { label: 'Created', value: originalData?.date_created ? new Date(originalData.date_created).toLocaleDateString() : (isNew ? 'On save' : '—'), icon: <Clock size={14} /> },
                  { label: 'Last Login', value: originalData?.last_access ? timeAgo(originalData.last_access) : '—', icon: <LogIn size={14} /> },
                ].map(item => (
                  <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: 1, borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                      {item.icon}
                      <Typography variant="caption">{item.label}</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={500} fontSize={12} sx={{ fontFamily: 'monospace' }}>{item.value}</Typography>
                  </Box>
                ))}
              </Paper>

              {/* Status Card */}
              <Paper sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, color: 'text.secondary', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Account Status
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: statusColor, boxShadow: `0 0 8px ${statusColor}60` }} />
                  <Typography variant="body1" fontWeight={600} sx={{ textTransform: 'capitalize' }}>{form.status}</Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {form.status === 'active' && 'This user can log in and access the application.'}
                  {form.status === 'suspended' && 'This user account has been suspended and cannot log in.'}
                  {form.status === 'invited' && 'This user has been invited but hasn\'t set up their account yet.'}
                  {form.status === 'archived' && 'This user account has been archived and is read-only.'}
                </Typography>
              </Paper>

              {/* Quick Role Info */}
              {currentRole && (
                <Paper sx={{ p: 2.5 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, color: 'text.secondary', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Role
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <Shield size={16} color={currentRole.adminAccess ? theme.palette.error.main : theme.palette.info.main} />
                    <Typography variant="body2" fontWeight={600}>{currentRole.name}</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">{currentRole.description}</Typography>
                </Paper>
              )}

              {/* Recent Activity (Sidebar mini) */}
              {!isNew && userLogs.length > 0 && (
                <Paper sx={{ p: 2.5 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: 'text.secondary', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Recent Activity
                  </Typography>
                  {userLogs.slice(0, 5).map(log => {
                    const cfg = ACTION_CONFIG[log.action] || ACTION_CONFIG.create;
                    return (
                      <Box key={log.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: cfg.color, flexShrink: 0 }} />
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ flexGrow: 1 }}>
                          {cfg.label} {log.collection || ''} 
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontSize={10}>{timeAgo(log.timestamp)}</Typography>
                      </Box>
                    );
                  })}
                </Paper>
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* ─── Reset Password Dialog ─── */}
      <Dialog open={resetPasswordOpen} onClose={() => setResetPasswordOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Set a new password for <strong>{userName}</strong>.
          </Typography>
          <TextField fullWidth label="New Password" type="password" size="small" sx={{ mb: 2 }}
            value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          <TextField fullWidth label="Confirm Password" type="password" size="small"
            value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setResetPasswordOpen(false)} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleResetPassword} disabled={!newPassword || !confirmNewPassword}
            sx={{ bgcolor: '#6644ff' }}>Reset</Button>
        </DialogActions>
      </Dialog>

      {/* ─── Delete Confirm Dialog ─── */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to permanently delete <strong>{userName}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} startIcon={<Trash2 size={16} />}>
            Delete User
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
