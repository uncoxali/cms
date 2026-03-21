"use client";

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Chip from '@mui/material/Chip';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import { alpha, useTheme } from '@mui/material/styles';
import { useTemplatesStore, Template } from '@/store/templates';
import { useSchemaStore } from '@/store/schema';
import { useNotificationsStore } from '@/store/notifications';
import {
  LayoutTemplate,
  Plus,
  Edit,
  Trash2,
  Copy,
  Database,
  Tag,
} from 'lucide-react';

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'blog', label: 'Blog' },
  { value: 'product', label: 'Product' },
  { value: 'page', label: 'Page' },
  { value: 'form', label: 'Form' },
];

export default function TemplatesSettingsPage() {
  const theme = useTheme();
  const { templates, loading, fetchTemplates, createTemplate, deleteTemplate } = useTemplatesStore();
  const { collections } = useSchemaStore();
  const { addNotification } = useNotificationsStore();

  const [createOpen, setCreateOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    collection: '',
    category: 'general',
    data: '',
  });

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const collectionOptions = Object.entries(collections).map(([key, val]) => ({
    value: key,
    label: val.label || key,
  }));

  const handleCreate = async () => {
    if (!newTemplate.name || !newTemplate.collection) {
      addNotification({ title: 'Error', message: 'Name and collection are required' });
      return;
    }

    let data = {};
    try {
      if (newTemplate.data) {
        data = JSON.parse(newTemplate.data);
      }
    } catch {
      addNotification({ title: 'Error', message: 'Invalid JSON data' });
      return;
    }

    const success = await createTemplate({
      name: newTemplate.name,
      description: newTemplate.description,
      collection: newTemplate.collection,
      category: newTemplate.category,
      data,
    });

    if (success) {
      addNotification({ title: 'Created', message: 'Template created successfully' });
      setCreateOpen(false);
      setNewTemplate({ name: '', description: '', collection: '', category: 'general', data: '' });
    } else {
      addNotification({ title: 'Error', message: 'Failed to create template' });
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteTemplate(id);
    if (success) {
      addNotification({ title: 'Deleted', message: 'Template deleted' });
    } else {
      addNotification({ title: 'Error', message: 'Failed to delete template' });
    }
  };

  const handleCreateFromTemplate = (template: Template) => {
    // Navigate to create item with template data
    const params = new URLSearchParams({
      collection: template.collection,
      template: template.id,
    });
    window.open(`/admin/content/${template.collection}/new?${params.toString()}`, '_blank');
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      general: '#6B7280',
      blog: '#8B5CF6',
      product: '#10B981',
      page: '#3B82F6',
      form: '#F59E0B',
    };
    return colors[category] || '#6B7280';
  };

  return (
    <Box sx={{ p: 4, overflow: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Templates
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create reusable content templates for faster content creation
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={() => setCreateOpen(true)}
          sx={{ borderRadius: '10px' }}
        >
          New Template
        </Button>
      </Box>

      {/* Templates Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : templates.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center', borderRadius: '20px' }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: alpha('#8B5CF6', 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}
          >
            <LayoutTemplate size={36} style={{ opacity: 0.4 }} />
          </Box>
          <Typography variant="h6" fontWeight={700} mb={1}>No templates yet</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Create templates to speed up content creation
          </Typography>
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => setCreateOpen(true)}
          >
            Create Template
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={2.5}>
          {templates.map((template) => {
            const color = getCategoryColor(template.category);
            return (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={template.id}>
                <Paper
                  sx={{
                    p: 0,
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 200ms',
                    '&:hover': {
                      borderColor: alpha(color, 0.3),
                      boxShadow: `0 4px 20px ${alpha(color, 0.1)}`,
                    },
                  }}
                >
                  {/* Top accent */}
                  <Box sx={{ height: 4, bgcolor: color }} />

                  <Box sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: '12px',
                          bgcolor: alpha(color, 0.1),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <LayoutTemplate size={22} color={color} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" fontWeight={700} noWrap>
                          {template.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap display="block">
                          {template.description || 'No description'}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        icon={<Database size={12} />}
                        label={collections[template.collection]?.label || template.collection}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: 11 }}
                      />
                      <Chip
                        icon={<Tag size={12} />}
                        label={template.category}
                        size="small"
                        sx={{
                          fontSize: 11,
                          bgcolor: alpha(color, 0.1),
                          color: color,
                          '& .MuiChip-icon': { color: 'inherit' },
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Actions */}
                  <Box
                    sx={{
                      p: 1.5,
                      borderTop: 1,
                      borderColor: 'divider',
                      display: 'flex',
                      justifyContent: 'space-between',
                      bgcolor: alpha('#000', 0.02),
                    }}
                  >
                    <Button
                      size="small"
                      startIcon={<Copy size={14} />}
                      onClick={() => handleCreateFromTemplate(template)}
                      sx={{ fontSize: 12 }}
                    >
                      Use Template
                    </Button>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(template.id)}
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Template</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Template Name"
            value={newTemplate.name}
            onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            value={newTemplate.description}
            onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />
          <TextField
            select
            fullWidth
            label="Collection"
            value={newTemplate.collection}
            onChange={(e) => setNewTemplate({ ...newTemplate, collection: e.target.value })}
            sx={{ mb: 2 }}
          >
            {collectionOptions.map((col) => (
              <MenuItem key={col.value} value={col.value}>{col.label}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            label="Category"
            value={newTemplate.category}
            onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
            sx={{ mb: 2 }}
          >
            {CATEGORIES.map((cat) => (
              <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Default Data (JSON)"
            value={newTemplate.data}
            onChange={(e) => setNewTemplate({ ...newTemplate, data: e.target.value })}
            multiline
            rows={4}
            placeholder='{"title": "Default Title", "status": "draft"}'
            helperText="Optional: Provide default values for fields"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
