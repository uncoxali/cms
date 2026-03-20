'use client';

import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Checkbox from '@mui/material/Checkbox';
import Slide from '@mui/material/Slide';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import { alpha, useTheme } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import { useSchemaStore } from '@/store/schema';
import { useActivityStore } from '@/store/activity';
import { useNotificationsStore } from '@/store/notifications';
import { Database, Plus, Trash2, Search, Table2, Network, Layers, Copy, FileText, ShoppingCart, Users, Image, Calendar, ChevronRight, Edit2, Eye } from 'lucide-react';
import { useConfirm } from '@/components/admin/ConfirmDialog';

const COLLECTION_COLORS = [
  '#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#14B8A6', '#F97316', '#6366F1'
];

const COLLECTION_ICONS: Record<string, any> = {
  blog_post: FileText,
  product: ShoppingCart,
  user_profile: Users,
  event: Calendar,
  media: Image,
  blank: Database,
};

export default function DataModelListPage() {
  const router = useRouter();
  const theme = useTheme();
  const { collections, loading, createCollection, dropCollection, bulkDropCollections } = useSchemaStore();
  const { addLog } = useActivityStore();
  const { addNotification } = useNotificationsStore();
  const confirm = useConfirm();
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const collectionsList = useMemo(
    () => Object.keys(collections).map((key) => ({ key, ...collections[key] })),
    [collections],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return collectionsList;
    const q = search.toLowerCase();
    return collectionsList.filter(col =>
      col.key.toLowerCase().includes(q) ||
      (col.label || '').toLowerCase().includes(q) ||
      (col.name || '').toLowerCase().includes(q)
    );
  }, [collectionsList, search]);

  const stats = useMemo(() => ({
    total: collectionsList.length,
    fields: collectionsList.reduce((sum, col) => sum + (col.fields?.length || 0), 0),
    relations: collectionsList.reduce((sum, col) => sum + col.fields.filter((f: any) => f.relationInfo).length, 0),
  }), [collectionsList]);

  // Create Collection Dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Collection Templates (Directus-style)
  const COLLECTION_TEMPLATES = [
    {
      id: 'blank',
      name: 'Blank Collection',
      description: 'Start from scratch with an empty collection.',
      icon: Database,
      fields: [],
    },
    {
      id: 'blog_post',
      name: 'Blog Post',
      description: 'Title, content, author, categories, tags, featured image, publish date.',
      icon: FileText,
      fields: [
        { name: 'title', label: 'Title', type: 'string', required: true },
        { name: 'slug', label: 'Slug', type: 'string', required: true },
        { name: 'content', label: 'Content', type: 'text' },
        { name: 'excerpt', label: 'Excerpt', type: 'text' },
        { name: 'featured_image', label: 'Featured Image', type: 'file' },
        { name: 'published_at', label: 'Published At', type: 'datetime' },
        { name: 'status', label: 'Status', type: 'string' },
      ],
    },
    {
      id: 'product',
      name: 'Product',
      description: 'Name, description, price, SKU, inventory, images, categories.',
      icon: ShoppingCart,
      fields: [
        { name: 'name', label: 'Name', type: 'string', required: true },
        { name: 'slug', label: 'Slug', type: 'string', required: true },
        { name: 'description', label: 'Description', type: 'text' },
        { name: 'price', label: 'Price', type: 'float' },
        { name: 'sku', label: 'SKU', type: 'string' },
        { name: 'inventory', label: 'Inventory', type: 'integer' },
        { name: 'featured', label: 'Featured', type: 'boolean' },
      ],
    },
    {
      id: 'user_profile',
      name: 'User Profile',
      description: 'Name, email, avatar, bio, social links, phone.',
      icon: Users,
      fields: [
        { name: 'first_name', label: 'First Name', type: 'string', required: true },
        { name: 'last_name', label: 'Last Name', type: 'string', required: true },
        { name: 'avatar', label: 'Avatar', type: 'file' },
        { name: 'bio', label: 'Bio', type: 'text' },
        { name: 'phone', label: 'Phone', type: 'string' },
        { name: 'website', label: 'Website', type: 'string' },
      ],
    },
    {
      id: 'event',
      name: 'Event',
      description: 'Title, date, location, description, capacity, registration.',
      icon: Calendar,
      fields: [
        { name: 'title', label: 'Title', type: 'string', required: true },
        { name: 'description', label: 'Description', type: 'text' },
        { name: 'start_date', label: 'Start Date', type: 'datetime', required: true },
        { name: 'end_date', label: 'End Date', type: 'datetime' },
        { name: 'location', label: 'Location', type: 'string' },
        { name: 'capacity', label: 'Capacity', type: 'integer' },
        { name: 'registration_open', label: 'Registration Open', type: 'boolean' },
      ],
    },
    {
      id: 'media',
      name: 'Media Item',
      description: 'Title, file, type, alt text, caption, tags.',
      icon: Image,
      fields: [
        { name: 'title', label: 'Title', type: 'string', required: true },
        { name: 'file', label: 'File', type: 'file', required: true },
        { name: 'alt_text', label: 'Alt Text', type: 'string' },
        { name: 'caption', label: 'Caption', type: 'text' },
        { name: 'tags', label: 'Tags', type: 'text' },
      ],
    },
  ];

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const key = newName.toLowerCase().replace(/\s+/g, '_');
    if (collections[key]) {
      addNotification({ title: 'Error', message: `Collection "${key}" already exists.` });
      return;
    }
    setCreating(true);
    try {
      await createCollection(key, {
        id: key,
        name: newLabel || newName,
        label: newLabel || newName,
        icon: 'Database',
        fields: [
          {
            name: 'id',
            label: 'ID',
            type: 'number',
            group: 'Meta',
            sortable: true,
            searchable: true,
          },
        ],
        preset: { visibleColumns: ['id'], pageSize: 20 },
      });
      addNotification({
        title: 'Collection Created',
        message: `"${newLabel || newName}" table created in database.`,
      });
      setCreateOpen(false);
      setNewName('');
      setNewLabel('');
      router.push(`/admin/settings/data-model/${key}`);
    } catch (err: any) {
      addNotification({ title: 'Error', message: err.message || 'Failed to create collection' });
    } finally {
      setCreating(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelected(collectionsList.map((c) => c.key));
    } else {
      setSelected([]);
    }
  };

  const handleSelectOne = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const handleBulkDelete = async () => {
    const ok = await confirm({
      title: 'Bulk Delete Collections',
      message: `Are you sure you want to delete ${selected.length} collections? This will permanently delete all data and schema for these collections. This cannot be undone.`,
      confirmText: `Delete ${selected.length} Collections`,
      severity: 'error',
    });
    if (!ok) return;

    try {
      await bulkDropCollections(selected);
      addNotification({
        title: 'Success',
        message: `${selected.length} collections deleted successfully.`,
      });
      setSelected([]);
    } catch (err: any) {
      addNotification({
        title: 'Error',
        message: err.message || 'Failed to delete some collections',
      });
      // Refresh schema anyway to sync state
      useSchemaStore.getState().fetchSchema();
    } finally {
      // Done
    }
  };

  const handleDelete = async (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await confirm({
      title: 'Delete Collection',
      message: `Are you sure you want to delete collection "${key}"? All data in this collection will be lost. This cannot be undone.`,
      confirmText: 'Delete Collection',
      severity: 'error',
    });
    if (!ok) return;
    try {
      await dropCollection(key);
      addNotification({
        title: 'Collection Deleted',
        message: `"${key}" table dropped from database.`,
      });
    } catch (err: any) {
      addNotification({ title: 'Error', message: err.message || 'Failed to delete collection' });
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', animation: 'fadeIn 300ms ease-out' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 52, height: 52, borderRadius: '16px', bgcolor: alpha('#8B5CF6', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${alpha('#8B5CF6', 0.2)}` }}>
            <Database size={24} color="#8B5CF6" />
          </Box>
          <Box>
            <Typography variant="h3" fontWeight={700}>Data Model</Typography>
            <Typography variant="body2" color="text.secondary">Manage collections, fields, and relationships</Typography>
          </Box>
        </Box>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setCreateOpen(true)} sx={{ borderRadius: '12px' }}>
          New Collection
        </Button>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 3 }}>
        {[
          { label: 'Collections', value: stats.total, icon: Database, color: '#8B5CF6' },
          { label: 'Total Fields', value: stats.fields, icon: Table2, color: '#3B82F6' },
          { label: 'Relations', value: stats.relations, icon: Network, color: '#10B981' },
        ].map(stat => (
          <Paper key={stat.label} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, borderRadius: '14px', transition: 'all 200ms ease', '&:hover': { transform: 'translateY(-1px)' } }}>
            <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: alpha(stat.color, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <stat.icon size={18} color={stat.color} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={800} lineHeight={1.2}>{stat.value}</Typography>
              <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Search & Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: '16px', display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search collections..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 280 }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={16} style={{ opacity: 0.5 }} /></InputAdornment> } }}
        />
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {['All', 'With Relations'].map(label => (
            <Chip
              key={label}
              label={label}
              size="small"
              onClick={() => {}}
              sx={{ fontWeight: 500, cursor: 'pointer' }}
            />
          ))}
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
          {filtered.length} collection{filtered.length !== 1 ? 's' : ''}
        </Typography>
      </Paper>

      {/* Collections */}
      {filtered.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '16px' }}>
          <Box sx={{ width: 72, height: 72, borderRadius: '20px', bgcolor: alpha('#8B5CF6', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
            <Database size={32} color="#8B5CF6" style={{ opacity: 0.5 }} />
          </Box>
          <Typography variant="h6" fontWeight={600} mb={1}>No collections found</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>Create your first collection to start building your data model.</Typography>
          <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
            Create First Collection
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
          {filtered.map((col, index) => {
            const relationCount = col.fields.filter((f: any) => f.relationInfo).length;
            const color = COLLECTION_COLORS[index % COLLECTION_COLORS.length];
            const Icon = COLLECTION_ICONS[col.key] || Database;
            return (
              <Paper
                key={col.key}
                onClick={() => router.push(`/admin/settings/data-model/${col.key}`)}
                sx={{
                  p: 0, cursor: 'pointer', borderRadius: '14px', overflow: 'hidden',
                  transition: 'all 200ms ease', border: 1, borderColor: 'divider',
                  '&:hover': { borderColor: color, transform: 'translateY(-2px)', boxShadow: `0 8px 24px ${alpha(color, 0.15)}` },
                }}
              >
                <Box sx={{ height: 6, bgcolor: color }} />
                <Box sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                    <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: alpha(color, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={20} color={color} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle1" fontWeight={700} noWrap>{col.label || col.name || col.key}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{col.key}</Typography>
                    </Box>
                    <Checkbox
                      size="small"
                      checked={selected.includes(col.key)}
                      onClick={(e) => { e.stopPropagation(); handleSelectOne(col.key, e); }}
                      sx={{ mt: -1, mr: -1 }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label={`${col.fields.length} fields`} size="small" icon={<Table2 size={12} />} sx={{ fontSize: 11 }} />
                    {relationCount > 0 && <Chip label={`${relationCount} relations`} size="small" icon={<Network size={12} />} sx={{ fontSize: 11, bgcolor: alpha(color, 0.1), color }} />}
                  </Box>
                </Box>
                <Box sx={{ px: 2.5, pb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button size="small" endIcon={<ChevronRight size={14} />} sx={{ color: 'text.secondary' }}>
                    Edit
                  </Button>
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}

      {/* Bulk Action Toolbar */}
      <Slide direction='up' in={selected.length > 0} mountOnEnter unmountOnExit>
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            px: 3,
            py: 2,
            borderRadius: '14px',
            bgcolor: 'background.paper',
            border: 1, borderColor: 'divider',
            zIndex: 1200,
            minWidth: 400,
            display: 'flex', alignItems: 'center', gap: 2,
          }}
        >
          <Typography variant="subtitle2" fontWeight={600}>
            {selected.length} selected
          </Typography>
          <Divider orientation="vertical" flexItem />
          <Button size="small" onClick={() => setSelected([])} disabled={loading}>Clear</Button>
          <Button variant="contained" color="error" size="small" startIcon={<Trash2 size={14} />} onClick={handleBulkDelete} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </Paper>
      </Slide>

      {/* Create Collection Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 3 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: alpha('#8B5CF6', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={20} color="#8B5CF6" />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>Create New Collection</Typography>
            <Typography variant="caption" color="text.secondary">Start from a template or create blank</Typography>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} mb={2}>Templates</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 1.5, mb: 3 }}>
            {COLLECTION_TEMPLATES.map((template) => {
              const Icon = template.icon;
              const isSelected = selectedTemplate === template.id;
              return (
                <Paper
                  key={template.id}
                  variant="outlined"
                  onClick={() => {
                    setSelectedTemplate(template.id);
                    if (template.id !== 'blank') {
                      const key = template.name.toLowerCase().replace(/\s+/g, '_');
                      setNewName(key);
                      setNewLabel(template.name);
                    }
                  }}
                  sx={{
                    p: 2, cursor: 'pointer', borderRadius: '12px',
                    borderColor: isSelected ? '#8B5CF6' : 'divider',
                    bgcolor: isSelected ? alpha('#8B5CF6', 0.05) : 'transparent',
                    transition: 'all 150ms ease',
                    '&:hover': { borderColor: '#8B5CF6' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Icon size={16} />
                    <Typography variant="body2" fontWeight={600}>{template.name}</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>{template.description}</Typography>
                </Paper>
              );
            })}
          </Box>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Collection Key" value={newName} onChange={(e) => setNewName(e.target.value)}
                required helperText="e.g. blog_posts" placeholder="my_collection" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Display Name" value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
                helperText="e.g. Blog Posts" placeholder="My Collection" />
            </Grid>
          </Grid>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button onClick={() => { setCreateOpen(false); setSelectedTemplate(null); setNewName(''); setNewLabel(''); }} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!newName.trim() || creating} startIcon={<Plus size={16} />}>
            {creating ? 'Creating...' : 'Create Collection'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
