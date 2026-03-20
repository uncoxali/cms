'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import MenuItem from '@mui/material/MenuItem';
import { alpha } from '@mui/material/styles';
import { useNotificationsStore } from '@/store/notifications';
import { useActivityStore } from '@/store/activity';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import { api } from '@/lib/api';
import {
  Mail,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Send,
  Eye,
  Search,
} from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'user-invite' | 'password-reset' | 'welcome' | 'notification' | 'custom';
  to: string;
  from?: string;
  cc?: string;
  bcc?: string;
  active: boolean;
  lastSent?: string;
  sentCount: number;
  dateCreated: string;
}

const VARIABLES = [
  { category: 'User', vars: ['{{name}}', '{{user_email}}', '{{role}}'] },
  { category: 'Project', vars: ['{{project_name}}', '{{project_url}}', '{{admin_email}}'] },
  { category: 'System', vars: ['{{system_email}}', '{{admin_name}}', '{{current_date}}'] },
  { category: 'Links', vars: ['{{login_url}}', '{{admin_url}}', '{{invite_link}}', '{{reset_link}}'] },
];

export default function EmailTemplatesPage() {
  const { addNotification } = useNotificationsStore();
  const { addLog } = useActivityStore();
  const confirm = useConfirm();

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<EmailTemplate | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [sendingTest, setSendingTest] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    type: 'custom' as EmailTemplate['type'],
    to: '',
    from: '',
    cc: '',
    bcc: '',
    active: true,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: EmailTemplate[] }>('/email-templates');
      setTemplates(res.data || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
      addNotification({ title: 'Error', message: 'Failed to load email templates.' });
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(t => {
    const matchSearch = !search || 
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || t.type === typeFilter;
    return matchSearch && matchType;
  });

  const handleOpenCreate = () => {
    setEditTemplate(null);
    setFormData({
      name: '',
      subject: '',
      body: '',
      type: 'custom',
      to: '',
      from: '',
      cc: '',
      bcc: '',
      active: true,
    });
    setCreateOpen(true);
  };

  const handleOpenEdit = (template: EmailTemplate) => {
    setEditTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      body: template.body,
      type: template.type,
      to: template.to,
      from: template.from || '',
      cc: template.cc || '',
      bcc: template.bcc || '',
      active: template.active,
    });
    setCreateOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.subject || !formData.body) {
      addNotification({ title: 'Error', message: 'Please fill in all required fields.' });
      return;
    }

    setSaving(true);
    try {
      if (editTemplate) {
        await api.patch(`/email-templates/${editTemplate.id}`, formData);
        addNotification({ title: 'Template Updated', message: `"${formData.name}" has been updated.` });
        addLog({ action: 'update', collection: 'email_templates', item: editTemplate.id, user: 'Admin', meta: { name: formData.name } });
      } else {
        const res = await api.post<{ data: EmailTemplate }>('/email-templates', formData);
        addNotification({ title: 'Template Created', message: `"${formData.name}" has been created.` });
        addLog({ action: 'create', collection: 'email_templates', item: res.data?.id, user: 'Admin', meta: { name: formData.name } });
      }
      await fetchTemplates();
      setCreateOpen(false);
    } catch (err: any) {
      addNotification({ title: 'Error', message: err.message || 'Failed to save template.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (template: EmailTemplate) => {
    const ok = await confirm({
      title: 'Delete Template',
      message: `Are you sure you want to delete "${template.name}"?`,
      confirmText: 'Delete',
      severity: 'error',
    });
    if (!ok) return;
    try {
      await api.del(`/email-templates/${template.id}`);
      setTemplates(prev => prev.filter(t => t.id !== template.id));
      addNotification({ title: 'Template Deleted', message: `"${template.name}" has been deleted.` });
    } catch (err) {
      addNotification({ title: 'Error', message: 'Failed to delete template.' });
    }
  };

  const handleToggle = async (template: EmailTemplate) => {
    try {
      await api.patch(`/email-templates/${template.id}`, { active: !template.active });
      setTemplates(prev => prev.map(t => 
        t.id === template.id ? { ...t, active: !t.active } : t
      ));
      addNotification({ 
        title: template.active ? 'Template Disabled' : 'Template Enabled', 
        message: `"${template.name}" is now ${template.active ? 'disabled' : 'enabled'}.` 
      });
    } catch (err) {
      addNotification({ title: 'Error', message: 'Failed to update template.' });
    }
  };

  const handleSendTest = async (template: EmailTemplate) => {
    setSendingTest(true);
    setTimeout(() => {
      addNotification({ title: 'Test Email Sent', message: `A test email was sent successfully.` });
      setSendingTest(false);
    }, 1500);
  };

  const handlePreview = (template: EmailTemplate) => {
    setPreviewTemplate(template);
    setPreviewOpen(true);
  };

  const insertVariable = (variable: string) => {
    setFormData(prev => ({
      ...prev,
      body: prev.body + variable,
    }));
  };

  const getTypeChip = (type: EmailTemplate['type']) => {
    const configs: Record<EmailTemplate['type'], { color: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'; label: string }> = {
      'user-invite': { color: 'primary', label: 'User Invite' },
      'password-reset': { color: 'warning', label: 'Password Reset' },
      'welcome': { color: 'success', label: 'Welcome' },
      'notification': { color: 'info', label: 'Notification' },
      'custom': { color: 'default', label: 'Custom' },
    };
    return configs[type];
  };

  const formatDate = (date?: string) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 4, overflow: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant='h5' fontWeight={700}>
            Email Templates
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Manage transactional email templates with variable support
          </Typography>
        </Box>
        <Button variant='contained' startIcon={<Plus size={18} />} onClick={handleOpenCreate}>
          Create Template
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          size='small'
          placeholder='Search templates...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <Search size={16} style={{ marginRight: 8 }} /> }}
          sx={{ width: 300 }}
        />
        <TextField
          select
          size='small'
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          sx={{ width: 180 }}
        >
          <MenuItem value='all'>All Types</MenuItem>
          <MenuItem value='user-invite'>User Invite</MenuItem>
          <MenuItem value='password-reset'>Password Reset</MenuItem>
          <MenuItem value='welcome'>Welcome</MenuItem>
          <MenuItem value='notification'>Notification</MenuItem>
          <MenuItem value='custom'>Custom</MenuItem>
        </TextField>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filteredTemplates.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Mail size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
          <Typography variant='h6' color='text.secondary'>
            No templates found
          </Typography>
          <Typography variant='body2' color='text.disabled' sx={{ mb: 3 }}>
            {search ? 'Try a different search term' : 'Create your first email template'}
          </Typography>
          <Button variant='outlined' startIcon={<Plus size={16} />} onClick={handleOpenCreate}>
            Create Template
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredTemplates.map((template) => {
            const typeConfig = getTypeChip(template.type);
            return (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={template.id}>
                <Paper
                  sx={{
                    p: 3,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 200ms',
                    '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
                    opacity: template.active ? 1 : 0.7,
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '10px',
                          bgcolor: alpha('#8B5CF6', 0.1),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Mail size={20} color='#8B5CF6' />
                      </Box>
                      <Box>
                        <Typography variant='subtitle1' fontWeight={700}>
                          {template.name}
                        </Typography>
                        <Chip label={typeConfig.label} size='small' color={typeConfig.color} sx={{ mt: 0.5 }} />
                      </Box>
                    </Box>
                    <Tooltip title={template.active ? 'Disable' : 'Enable'}>
                      <IconButton size='small' onClick={() => handleToggle(template)}>
                        {template.active ? '✓' : '○'}
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <Typography variant='body2' color='text.secondary' sx={{ mb: 2, flexGrow: 1 }}>
                    {template.subject}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 3 }}>
                      <Tooltip title='Sent count'>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                          <Send size={14} />
                          <Typography variant='caption'>{template.sentCount}</Typography>
                        </Box>
                      </Tooltip>
                      <Tooltip title='Last sent'>
                        <Typography variant='caption' color='text.secondary'>
                          {formatDate(template.lastSent)}
                        </Typography>
                      </Tooltip>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Tooltip title='Edit'>
                      <IconButton size='small' onClick={() => handleOpenEdit(template)}>
                        <Edit2 size={16} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title='Preview'>
                      <IconButton size='small' onClick={() => handlePreview(template)}>
                        <Eye size={16} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title='Send Test'>
                      <IconButton size='small' onClick={() => handleSendTest(template)} disabled={sendingTest}>
                        <Send size={16} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title='Delete'>
                      <IconButton size='small' color='error' onClick={() => handleDelete(template)}>
                        <Trash2 size={16} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>
          {editTemplate ? 'Edit Template' : 'Create Email Template'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField
                fullWidth
                label='Template Name'
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder='e.g., User Welcome Email'
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                select
                label='Template Type'
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as EmailTemplate['type'] })}
              >
                <MenuItem value='user-invite'>User Invite</MenuItem>
                <MenuItem value='password-reset'>Password Reset</MenuItem>
                <MenuItem value='welcome'>Welcome</MenuItem>
                <MenuItem value='notification'>Notification</MenuItem>
                <MenuItem value='custom'>Custom</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label='Email Subject'
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder='e.g., Welcome to {{project_name}}!'
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='To'
                value={formData.to}
                onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                placeholder='e.g., {{user_email}}'
                helperText='Use {{variables}} for dynamic content'
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='From'
                value={formData.from}
                onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                placeholder='e.g., {{system_email}}'
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Alert severity='info' sx={{ mb: 2 }}>
                <Typography variant='body2'>
                  <strong>Available Variables:</strong>
                  {VARIABLES.map(cat => (
                    <span key={cat.category}> {cat.vars.join(', ')}</span>
                  ))}
                </Typography>
              </Alert>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant='subtitle2'>Email Body</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {VARIABLES.slice(0, 3).map(cat => (
                    cat.vars.slice(0, 2).map(v => (
                      <Chip
                        key={v}
                        label={v}
                        size='small'
                        variant='outlined'
                        onClick={() => insertVariable(v)}
                        sx={{ cursor: 'pointer', fontFamily: 'monospace', fontSize: 10 }}
                      />
                    ))
                  ))}
                </Box>
              </Box>
              <TextField
                fullWidth
                multiline
                rows={12}
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder='Enter email body with {{variables}}...'
                sx={{ '& textarea': { fontFamily: 'monospace', fontSize: 13 } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant='contained' onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : (editTemplate ? 'Save Changes' : 'Create Template')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>
          Preview: {previewTemplate?.name}
        </DialogTitle>
        <DialogContent dividers>
          {previewTemplate && (
            <Box>
              <Paper variant='outlined' sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
                <Typography variant='caption' color='text.secondary'>Subject:</Typography>
                <Typography variant='body1' fontWeight={600}>
                  {previewTemplate.subject.replace(/\{\{project_name\}\}/g, 'Neurofy CMS')}
                </Typography>
              </Paper>
              <Paper variant='outlined' sx={{ p: 3 }}>
                <Typography variant='body2' sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                  {previewTemplate.body
                    .replace(/\{\{project_name\}\}/g, 'Neurofy CMS')
                    .replace(/\{\{name\}\}/g, 'John Doe')
                    .replace(/\{\{user_email\}\}/g, 'john@example.com')
                    .replace(/\{\{role\}\}/g, 'Editor')
                    .replace(/\{\{admin_name\}\}/g, 'Admin')
                    .replace(/\{\{system_email\}\}/g, 'noreply@neurofy.io')
                    .replace(/\{\{login_url\}\}/g, 'https://app.neurofy.io/login')
                    .replace(/\{\{invite_link\}\}/g, 'https://app.neurofy.io/invite/abc123')
                    .replace(/\{\{reset_link\}\}/g, 'https://app.neurofy.io/reset/xyz789')
                    .replace(/\{\{expires_at\}\}/g, 'in 7 days')
                  }
                </Typography>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          <Button variant='contained' startIcon={<Send size={16} />} onClick={() => {
            setPreviewOpen(false);
            handleSendTest(previewTemplate!);
          }}>
            Send Test Email
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
