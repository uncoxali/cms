"use client";

import { use, useEffect, useState, useCallback, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Drawer from '@mui/material/Drawer';
import Tooltip from '@mui/material/Tooltip';
import Slider from '@mui/material/Slider';
import Autocomplete from '@mui/material/Autocomplete';
import Skeleton from '@mui/material/Skeleton';
import { alpha, useTheme } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useSchemaStore } from '@/store/schema';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import {
  ArrowLeft, Save, Trash2, Eye, Globe, Code, Settings, FileText,
  Layout, Navigation, Search, Plus, ChevronUp, ChevronDown, Copy,
  Type, Image, Columns, Square, BarChart3, Table, List, FormInput,
  Minus, Link2, Database, MousePointerClick, Palette, AlignLeft,
  AlignCenter, AlignRight, GripVertical, X, Monitor, Smartphone,
  Tablet, Heading1, Heading2, Heading3, MessageSquare, MapPin,
  SeparatorHorizontal, MoveVertical, Layers, ExternalLink,
} from 'lucide-react';

// ─── Block Type Definitions ───

interface Block {
  id: string;
  type: string;
  props: Record<string, any>;
}

const uid = () => `b_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

interface BlockDef {
  type: string;
  label: string;
  icon: any;
  category: string;
  defaultProps: Record<string, any>;
}

const BLOCK_DEFS: BlockDef[] = [
  { type: 'heading', label: 'Heading', icon: Heading1, category: 'Basic', defaultProps: { text: 'Heading', level: 'h2', align: 'left', color: '', fontSize: '' } },
  { type: 'text', label: 'Text', icon: Type, category: 'Basic', defaultProps: { content: '<p>Write your text here...</p>', align: 'left' } },
  { type: 'image', label: 'Image', icon: Image, category: 'Basic', defaultProps: { src: '', alt: '', width: '100%', height: 'auto', objectFit: 'cover', borderRadius: '8px' } },
  { type: 'button', label: 'Button', icon: MousePointerClick, category: 'Basic', defaultProps: { text: 'Click Me', url: '#', variant: 'contained', color: '#6644ff', size: 'medium', align: 'left', fullWidth: false } },
  { type: 'divider', label: 'Divider', icon: SeparatorHorizontal, category: 'Basic', defaultProps: { style: 'solid', color: '#e0e0e0', thickness: 1 } },
  { type: 'spacer', label: 'Spacer', icon: MoveVertical, category: 'Basic', defaultProps: { height: 40 } },
  { type: 'hero', label: 'Hero Section', icon: Layers, category: 'Sections', defaultProps: { title: 'Welcome', subtitle: 'Build something amazing.', bgColor: '#6644ff', textColor: '#ffffff', height: 400, align: 'center', bgImage: '', overlay: 0.5 } },
  { type: 'card', label: 'Card', icon: Square, category: 'Sections', defaultProps: { title: 'Card Title', content: 'Card description goes here.', image: '', bgColor: '', shadow: true, padding: 24, borderRadius: 12 } },
  { type: 'columns', label: 'Columns', icon: Columns, category: 'Layout', defaultProps: { count: 2, gap: 24, col1: '<p>Column 1 content</p>', col2: '<p>Column 2 content</p>', col3: '', col4: '' } },
  { type: 'stats', label: 'Stats', icon: BarChart3, category: 'Sections', defaultProps: { items: [{ label: 'Users', value: '1,200' }, { label: 'Revenue', value: '$48K' }, { label: 'Growth', value: '+24%' }], bgColor: '', textColor: '' } },
  { type: 'collection-list', label: 'Collection Data', icon: Database, category: 'Data', defaultProps: { collection: '', fields: [], limit: 10, displayAs: 'cards', sort: 'id', order: 'asc', showTitle: true, title: 'Items' } },
  { type: 'collection-table', label: 'Collection Table', icon: Table, category: 'Data', defaultProps: { collection: '', fields: [], limit: 25, sort: 'id', order: 'asc', title: 'Data Table' } },
  { type: 'form', label: 'Form', icon: FormInput, category: 'Interactive', defaultProps: { collection: '', fields: [], submitLabel: 'Submit', successMessage: 'Submitted successfully!' } },
  { type: 'embed', label: 'Embed / iframe', icon: ExternalLink, category: 'Media', defaultProps: { url: '', height: 400, title: '' } },
  { type: 'code', label: 'Code Block', icon: Code, category: 'Media', defaultProps: { code: '', language: 'html' } },
  { type: 'html', label: 'Custom HTML', icon: Code, category: 'Media', defaultProps: { html: '<div>Custom HTML here</div>' } },
];

const CATEGORIES = ['Basic', 'Sections', 'Layout', 'Data', 'Interactive', 'Media'];

// ─── Page Editor ───

interface PageData {
  id?: number;
  title: string;
  path: string;
  slug: string;
  status: string;
  layout: string;
  content: string;
  meta_title: string;
  meta_description: string;
  parent_id: string;
  sort_order: number;
  icon: string;
  show_in_nav: boolean;
  redirect_url: string;
  roles: string[];
}

const EMPTY_PAGE: PageData = {
  title: '', path: '', slug: '', status: 'draft', layout: 'default',
  content: '', meta_title: '', meta_description: '', parent_id: '',
  sort_order: 0, icon: '', show_in_nav: false, redirect_url: '',
  roles: ['admin', 'editor', 'viewer'],
};

export default function PageEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const pageId = resolvedParams.id;
  const isNew = pageId === 'new';
  const router = useRouter();
  const theme = useTheme();
  const confirm = useConfirm();
  const isDark = theme.palette.mode === 'dark';

  const { collections } = useSchemaStore();

  const [form, setForm] = useState<PageData>(EMPTY_PAGE);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [allPages, setAllPages] = useState<any[]>([]);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  useEffect(() => {
    api.get<{ data: any[] }>('/pages').then(res => setAllPages(res.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (isNew) return;
    setLoading(true);
    api.get<{ data: any }>(`/pages/${pageId}`).then(res => {
      const p = res.data;
      const roles = Array.isArray(p.roles) ? p.roles : (() => { try { return JSON.parse(p.roles || '[]'); } catch { return ['admin', 'editor', 'viewer']; } })();
      setForm({
        id: p.id, title: p.title || '', path: p.path || '', slug: p.slug || '',
        status: p.status || 'draft', layout: p.layout || 'default', content: p.content || '',
        meta_title: p.meta_title || '', meta_description: p.meta_description || '',
        parent_id: p.parent_id || '', sort_order: p.sort_order ?? 0, icon: p.icon || '',
        show_in_nav: !!p.show_in_nav, redirect_url: p.redirect_url || '', roles,
      });
      try { setBlocks(JSON.parse(p.content || '[]')); } catch { setBlocks([]); }
      setLoading(false);
    }).catch(() => { setError('Page not found'); setLoading(false); });
  }, [pageId, isNew]);

  const handleTitleChange = (title: string) => {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const updates: Partial<PageData> = { title, slug };
    if (isNew || !form.path) updates.path = `/${slug}`;
    if (isNew || !form.meta_title) updates.meta_title = title;
    setForm(prev => ({ ...prev, ...updates }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!form.path.trim()) { setError('Path is required'); return; }
    setError('');
    setSaving(true);
    const payload = { ...form, content: JSON.stringify(blocks) };
    try {
      if (isNew) {
        const res = await api.post<{ data: any }>('/pages', payload);
        router.push(`/admin/pages/${res.data.id}`);
      } else {
        await api.patch(`/pages/${pageId}`, payload);
      }
    } catch (err: any) { setError(err.message || 'Failed to save'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    const ok = await confirm({ title: 'Delete Page', message: `Delete "${form.title}"?`, confirmText: 'Delete', severity: 'error' });
    if (!ok) return;
    try { await api.del(`/pages/${pageId}`); router.push('/admin/pages'); }
    catch (err: any) { setError(err.message); }
  };

  // Block operations
  const addBlock = (def: BlockDef) => {
    const newBlock: Block = { id: uid(), type: def.type, props: { ...def.defaultProps } };
    setBlocks(prev => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
    setPaletteOpen(false);
  };
  const updateBlock = (id: string, props: Record<string, any>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, props: { ...b.props, ...props } } : b));
  };
  const removeBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };
  const moveBlock = (id: string, dir: -1 | 1) => {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id);
      if (idx < 0) return prev;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
  };
  const duplicateBlock = (id: string) => {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id);
      if (idx < 0) return prev;
      const clone: Block = { ...prev[idx], id: uid(), props: { ...prev[idx].props } };
      const arr = [...prev];
      arr.splice(idx + 1, 0, clone);
      return arr;
    });
  };

  const selectedBlock = blocks.find(b => b.id === selectedBlockId) || null;

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* ── Top Bar ── */}
      <Paper elevation={0} sx={{ px: 3, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0, zIndex: 10 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton size="small" onClick={() => router.push('/admin/pages')}><ArrowLeft size={20} /></IconButton>
          <FileText size={20} color={theme.palette.primary.main} />
          <Typography variant="h6" fontWeight={700}>{isNew ? 'New Page' : form.title}</Typography>
          {!isNew && <Chip label={form.status} size="small" color={form.status === 'published' ? 'success' : form.status === 'draft' ? 'warning' : 'default'} />}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mr: 1 }}>
            {([['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]] as const).map(([m, Icon]) => (
              <Tooltip key={m} title={m}><IconButton size="small" onClick={() => setPreviewMode(m)} sx={{ borderRadius: 0, bgcolor: previewMode === m ? alpha(theme.palette.primary.main, 0.1) : 'transparent' }}><Icon size={16} /></IconButton></Tooltip>
            ))}
          </Box>
          {!isNew && <Button variant="outlined" color="error" size="small" startIcon={<Trash2 size={14} />} onClick={handleDelete}>Delete</Button>}
          <Button variant="contained" size="small" startIcon={<Save size={14} />} onClick={handleSave} disabled={saving || !form.title}>
            {saving ? 'Saving...' : isNew ? 'Create' : 'Save'}
          </Button>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mx: 2, mt: 1 }} onClose={() => setError('')}>{error}</Alert>}

      {/* ── Tabs ── */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, flexShrink: 0 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab icon={<Layers size={16} />} iconPosition="start" label="Builder" sx={{ minHeight: 48 }} />
          <Tab icon={<Settings size={16} />} iconPosition="start" label="Settings" sx={{ minHeight: 48 }} />
          <Tab icon={<Search size={16} />} iconPosition="start" label="SEO" sx={{ minHeight: 48 }} />
        </Tabs>
      </Box>

      {/* ── Builder Tab ── */}
      {activeTab === 0 && (
        <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
          {/* Canvas */}
          <Box sx={{
            flexGrow: 1, overflow: 'auto', p: 3,
            bgcolor: isDark ? '#0d1117' : '#f0f2f5',
            backgroundImage: isDark
              ? 'radial-gradient(circle, #21262d 1px, transparent 1px)'
              : 'radial-gradient(circle, #d0d7de 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}>
            {/* Page Title Input */}
            <Paper sx={{
              width: '100%',
              maxWidth: previewMode === 'mobile' ? 375 : previewMode === 'tablet' ? 768 : 960,
              p: 3, mb: 2, transition: 'max-width 0.3s',
            }}>
              <TextField
                fullWidth variant="standard" placeholder="Page Title"
                value={form.title} onChange={e => handleTitleChange(e.target.value)}
                sx={{ '& input': { fontSize: 28, fontWeight: 700 } }}
                slotProps={{ input: { disableUnderline: true } }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{form.path || '/'}</Typography>
            </Paper>

            {/* Blocks */}
            <Box sx={{
              width: '100%',
              maxWidth: previewMode === 'mobile' ? 375 : previewMode === 'tablet' ? 768 : 960,
              display: 'flex', flexDirection: 'column', gap: 0, transition: 'max-width 0.3s',
            }}>
              {blocks.map((block, idx) => (
                <BlockWrapper
                  key={block.id}
                  block={block}
                  isSelected={selectedBlockId === block.id}
                  onSelect={() => setSelectedBlockId(block.id)}
                  onRemove={() => removeBlock(block.id)}
                  onMoveUp={() => moveBlock(block.id, -1)}
                  onMoveDown={() => moveBlock(block.id, 1)}
                  onDuplicate={() => duplicateBlock(block.id)}
                  isFirst={idx === 0}
                  isLast={idx === blocks.length - 1}
                  isDark={isDark}
                  collections={collections}
                />
              ))}

              {/* Add Block Button */}
              <Box
                onClick={() => setPaletteOpen(true)}
                sx={{
                  border: '2px dashed', borderColor: 'divider', borderRadius: 2,
                  p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                  cursor: 'pointer', transition: 'all 0.2s',
                  '&:hover': { borderColor: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.04) },
                }}
              >
                <Plus size={24} color={theme.palette.text.secondary} />
                <Typography variant="body2" color="text.secondary">Add Block</Typography>
              </Box>
            </Box>
          </Box>

          {/* Properties Panel */}
          {selectedBlock && (
            <Paper elevation={2} sx={{ width: 340, flexShrink: 0, overflow: 'auto', borderLeft: '1px solid', borderColor: 'divider' }}>
              <BlockPropertiesPanel
                block={selectedBlock}
                onUpdate={(props) => updateBlock(selectedBlock.id, props)}
                onClose={() => setSelectedBlockId(null)}
                collections={collections}
                isDark={isDark}
              />
            </Paper>
          )}
        </Box>
      )}

      {/* ── Settings Tab ── */}
      {activeTab === 1 && (
        <Box sx={{ overflow: 'auto', p: 3 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography variant="h6" fontWeight={600}>Page Settings</Typography>
                <TextField select fullWidth label="Status" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <MenuItem value="draft">Draft</MenuItem><MenuItem value="published">Published</MenuItem><MenuItem value="archived">Archived</MenuItem>
                </TextField>
                <TextField fullWidth label="Path" value={form.path} onChange={e => setForm({ ...form, path: e.target.value })} />
                <TextField fullWidth label="Slug" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} />
                <TextField select fullWidth label="Layout" value={form.layout} onChange={e => setForm({ ...form, layout: e.target.value })}>
                  <MenuItem value="default">Default</MenuItem><MenuItem value="full-width">Full Width</MenuItem><MenuItem value="sidebar">With Sidebar</MenuItem><MenuItem value="blank">Blank</MenuItem>
                </TextField>
                <TextField select fullWidth label="Parent Page" value={form.parent_id} onChange={e => setForm({ ...form, parent_id: e.target.value })}>
                  <MenuItem value="">None (Root)</MenuItem>
                  {allPages.filter(p => String(p.id) !== pageId).map(p => <MenuItem key={p.id} value={String(p.id)}>{p.title}</MenuItem>)}
                </TextField>
                <TextField fullWidth label="Sort Order" type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
                <TextField fullWidth label="Redirect URL" value={form.redirect_url} onChange={e => setForm({ ...form, redirect_url: e.target.value })} helperText="If set, page will redirect" />
                <FormControlLabel control={<Switch checked={form.show_in_nav} onChange={e => setForm({ ...form, show_in_nav: e.target.checked })} />} label="Show in sidebar navigation" />

                <Divider />
                <Typography variant="subtitle2" fontWeight={600}>Visible to Roles</Typography>
                <Typography variant="caption" color="text.secondary">Select which roles can see this page in the sidebar.</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {['admin', 'editor', 'viewer'].map(r => (
                    <FormControlLabel
                      key={r}
                      control={
                        <Switch
                          checked={form.roles.includes(r)}
                          onChange={e => {
                            const roles = e.target.checked
                              ? [...form.roles, r]
                              : form.roles.filter(x => x !== r);
                            setForm({ ...form, roles });
                          }}
                        />
                      }
                      label={<Chip label={r} size="small" variant="outlined" sx={{ textTransform: 'capitalize' }} />}
                    />
                  ))}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* ── SEO Tab ── */}
      {activeTab === 2 && (
        <Box sx={{ overflow: 'auto', p: 3 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography variant="h6" fontWeight={600}>SEO</Typography>
                <TextField fullWidth label="Meta Title" value={form.meta_title} onChange={e => setForm({ ...form, meta_title: e.target.value })} helperText={`${form.meta_title.length}/60`} />
                <TextField fullWidth multiline rows={4} label="Meta Description" value={form.meta_description} onChange={e => setForm({ ...form, meta_description: e.target.value })} helperText={`${form.meta_description.length}/160`} />
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="subtitle2" fontWeight={600} mb={2}>Google Preview</Typography>
                <Paper variant="outlined" sx={{ p: 2.5, bgcolor: '#fff', borderRadius: 2 }}>
                  <Typography sx={{ color: '#1a0dab', fontWeight: 500, fontSize: 16, mb: 0.5 }}>{form.meta_title || form.title || 'Page Title'}</Typography>
                  <Typography variant="caption" sx={{ color: '#006621', display: 'block', mb: 0.5 }}>yoursite.com{form.path || '/'}</Typography>
                  <Typography variant="caption" sx={{ color: '#545454' }}>{form.meta_description || 'No description.'}</Typography>
                </Paper>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* ── Block Palette Drawer ── */}
      <Drawer anchor="left" open={paletteOpen} onClose={() => setPaletteOpen(false)} PaperProps={{ sx: { width: 360, p: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight={700}>Add Block</Typography>
          <IconButton size="small" onClick={() => setPaletteOpen(false)}><X size={18} /></IconButton>
        </Box>
        {CATEGORIES.map(cat => {
          const defs = BLOCK_DEFS.filter(d => d.category === cat);
          if (!defs.length) return null;
          return (
            <Box key={cat} sx={{ mb: 3 }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, mb: 1.5, display: 'block' }}>{cat}</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                {defs.map(def => {
                  const Icon = def.icon;
                  return (
                    <Paper
                      key={def.type} variant="outlined"
                      onClick={() => addBlock(def)}
                      sx={{
                        p: 2, cursor: 'pointer', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', gap: 1, transition: 'all 0.2s', borderRadius: 2,
                        '&:hover': { borderColor: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.05), transform: 'translateY(-1px)' },
                      }}
                    >
                      <Icon size={22} />
                      <Typography variant="caption" fontWeight={600}>{def.label}</Typography>
                    </Paper>
                  );
                })}
              </Box>
            </Box>
          );
        })}
      </Drawer>
    </Box>
  );
}

// ─── Block Wrapper (on canvas) ───

function BlockWrapper({ block, isSelected, onSelect, onRemove, onMoveUp, onMoveDown, onDuplicate, isFirst, isLast, isDark, collections }: {
  block: Block; isSelected: boolean; onSelect: () => void; onRemove: () => void;
  onMoveUp: () => void; onMoveDown: () => void; onDuplicate: () => void;
  isFirst: boolean; isLast: boolean; isDark: boolean; collections: any;
}) {
  const def = BLOCK_DEFS.find(d => d.type === block.type);
  const Icon = def?.icon || Code;

  return (
    <Box
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      sx={{
        position: 'relative', mb: 1.5,
        border: '2px solid',
        borderColor: isSelected ? 'primary.main' : 'transparent',
        borderRadius: 2, overflow: 'hidden',
        transition: 'border-color 0.15s',
        '&:hover': { borderColor: isSelected ? 'primary.main' : 'divider' },
        '&:hover .block-toolbar': { opacity: 1 },
      }}
    >
      {/* Toolbar */}
      <Box className="block-toolbar" sx={{
        position: 'absolute', top: 4, right: 4, zIndex: 5,
        display: 'flex', gap: 0.3, opacity: isSelected ? 1 : 0, transition: 'opacity 0.15s',
        bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)', p: 0.3,
      }}>
        <Tooltip title={def?.label || block.type}><Chip icon={<Icon size={12} />} label={def?.label || block.type} size="small" sx={{ fontSize: 11, height: 24 }} /></Tooltip>
        {!isFirst && <Tooltip title="Move up"><IconButton size="small" onClick={e => { e.stopPropagation(); onMoveUp(); }} sx={{ width: 24, height: 24 }}><ChevronUp size={14} /></IconButton></Tooltip>}
        {!isLast && <Tooltip title="Move down"><IconButton size="small" onClick={e => { e.stopPropagation(); onMoveDown(); }} sx={{ width: 24, height: 24 }}><ChevronDown size={14} /></IconButton></Tooltip>}
        <Tooltip title="Duplicate"><IconButton size="small" onClick={e => { e.stopPropagation(); onDuplicate(); }} sx={{ width: 24, height: 24 }}><Copy size={14} /></IconButton></Tooltip>
        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={e => { e.stopPropagation(); onRemove(); }} sx={{ width: 24, height: 24 }}><Trash2 size={14} /></IconButton></Tooltip>
      </Box>

      {/* Preview */}
      <BlockPreview block={block} isDark={isDark} collections={collections} />
    </Box>
  );
}

// ─── Block Preview (live visual) ───

function BlockPreview({ block, isDark, collections }: { block: Block; isDark: boolean; collections: any }) {
  const p = block.props;

  switch (block.type) {
    case 'heading':
      return <Paper sx={{ p: 3 }}><Typography variant={p.level === 'h1' ? 'h3' : p.level === 'h2' ? 'h4' : 'h5'} fontWeight={700} textAlign={p.align} sx={{ color: p.color || 'text.primary' }}>{p.text}</Typography></Paper>;

    case 'text':
      return <Paper sx={{ p: 3 }}><Box dangerouslySetInnerHTML={{ __html: p.content }} sx={{ textAlign: p.align, '& p': { m: 0 }, fontSize: 14, lineHeight: 1.7, color: 'text.primary' }} /></Paper>;

    case 'image':
      return (
        <Paper sx={{ p: p.src ? 0 : 3, overflow: 'hidden' }}>
          {p.src ? (
            <Box component="img" src={p.src} alt={p.alt} sx={{ width: p.width || '100%', height: p.height || 'auto', objectFit: p.objectFit || 'cover', display: 'block', borderRadius: p.borderRadius }} />
          ) : (
            <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: isDark ? '#161b22' : '#f0f2f5', borderRadius: 1 }}>
              <Image size={48} style={{ opacity: 0.2 }} />
            </Box>
          )}
        </Paper>
      );

    case 'button':
      return (
        <Paper sx={{ p: 3, textAlign: p.align }}>
          <Button variant={p.variant || 'contained'} size={p.size} sx={{ bgcolor: p.variant === 'contained' ? p.color : 'transparent', color: p.variant === 'contained' ? '#fff' : p.color, borderColor: p.color, ...(p.fullWidth ? { width: '100%' } : {}) }}>
            {p.text}
          </Button>
        </Paper>
      );

    case 'divider':
      return <Box sx={{ py: 1 }}><Divider sx={{ borderStyle: p.style, borderColor: p.color, borderWidth: p.thickness }} /></Box>;

    case 'spacer':
      return <Box sx={{ height: p.height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography variant="caption" color="text.disabled">{p.height}px</Typography></Box>;

    case 'hero':
      return (
        <Box sx={{
          height: p.height, display: 'flex', flexDirection: 'column', alignItems: p.align === 'center' ? 'center' : p.align === 'right' ? 'flex-end' : 'flex-start',
          justifyContent: 'center', px: 5, position: 'relative', borderRadius: 2, overflow: 'hidden',
          bgcolor: p.bgColor, backgroundImage: p.bgImage ? `url(${p.bgImage})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center',
        }}>
          {p.bgImage && <Box sx={{ position: 'absolute', inset: 0, bgcolor: `rgba(0,0,0,${p.overlay || 0.5})` }} />}
          <Typography variant="h3" fontWeight={800} sx={{ color: p.textColor, position: 'relative', zIndex: 1 }}>{p.title}</Typography>
          <Typography variant="h6" sx={{ color: alpha(p.textColor || '#fff', 0.8), position: 'relative', zIndex: 1, mt: 1 }}>{p.subtitle}</Typography>
        </Box>
      );

    case 'card':
      return (
        <Paper elevation={p.shadow ? 3 : 0} sx={{ p: `${p.padding || 24}px`, borderRadius: `${p.borderRadius || 12}px`, bgcolor: p.bgColor || 'background.paper' }}>
          {p.image && <Box component="img" src={p.image} alt="" sx={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 1, mb: 2 }} />}
          <Typography variant="h6" fontWeight={700} mb={1}>{p.title}</Typography>
          <Typography variant="body2" color="text.secondary">{p.content}</Typography>
        </Paper>
      );

    case 'columns':
      const cols = [p.col1, p.col2, p.col3, p.col4].slice(0, p.count || 2);
      return (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${p.count || 2}, 1fr)`, gap: `${p.gap || 24}px` }}>
            {cols.map((html: string, i: number) => (
              <Box key={i} sx={{ p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 1, minHeight: 60 }}>
                <Box dangerouslySetInnerHTML={{ __html: html || `<p style="opacity:0.4">Column ${i + 1}</p>` }} sx={{ fontSize: 14, '& p': { m: 0 } }} />
              </Box>
            ))}
          </Box>
        </Paper>
      );

    case 'stats':
      return (
        <Paper sx={{ p: 3, bgcolor: p.bgColor || 'background.paper' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${(p.items || []).length}, 1fr)`, gap: 3, textAlign: 'center' }}>
            {(p.items || []).map((item: any, i: number) => (
              <Box key={i}>
                <Typography variant="h4" fontWeight={800} sx={{ color: p.textColor || 'text.primary' }}>{item.value}</Typography>
                <Typography variant="body2" sx={{ color: p.textColor ? alpha(p.textColor, 0.7) : 'text.secondary' }}>{item.label}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      );

    case 'collection-list':
      return <CollectionDataPreview collection={p.collection} displayAs={p.displayAs} title={p.title} showTitle={p.showTitle} limit={p.limit} fields={p.fields} sort={p.sort} order={p.order} />;

    case 'collection-table':
      return <CollectionTablePreview collection={p.collection} title={p.title} limit={p.limit} fields={p.fields} sort={p.sort} order={p.order} />;

    case 'form':
      return <FormBlockPreview collection={p.collection} fields={p.fields} submitLabel={p.submitLabel} />;

    case 'embed':
      return (
        <Paper sx={{ p: 0, overflow: 'hidden', borderRadius: 2 }}>
          {p.url ? (
            <Box component="iframe" src={p.url} title={p.title} sx={{ width: '100%', height: p.height || 400, border: 'none' }} />
          ) : (
            <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: isDark ? '#161b22' : '#f0f2f5' }}>
              <Typography variant="body2" color="text.secondary">Set embed URL in properties</Typography>
            </Box>
          )}
        </Paper>
      );

    case 'code':
      return (
        <Paper sx={{ p: 0, overflow: 'hidden', borderRadius: 2 }}>
          <Box sx={{ p: 2, bgcolor: isDark ? '#0d1117' : '#1e1e1e', borderRadius: 2 }}>
            <Typography component="pre" sx={{ fontFamily: 'monospace', fontSize: 12, color: '#d4d4d4', whiteSpace: 'pre-wrap', m: 0 }}>{p.code || '// your code here'}</Typography>
          </Box>
        </Paper>
      );

    case 'html':
      return <Paper sx={{ p: 3 }}><Box dangerouslySetInnerHTML={{ __html: p.html }} /></Paper>;

    default:
      return <Paper sx={{ p: 3 }}><Typography color="text.secondary">Unknown block: {block.type}</Typography></Paper>;
  }
}

// ─── Collection Data Preview (live API fetch) ───

function CollectionDataPreview({ collection, displayAs, title, showTitle, limit, fields, sort, order }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!collection) return;
    setLoading(true);
    api.get<{ data: any[] }>(`/items/${collection}`, { limit: String(limit || 10), sort: sort || 'id', order: order || 'asc', populate: '*' })
      .then(res => { setItems(res.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [collection, limit, sort, order]);

  if (!collection) return <Paper sx={{ p: 4, textAlign: 'center' }}><Database size={32} style={{ opacity: 0.2 }} /><Typography variant="body2" color="text.secondary" mt={1}>Select a collection in properties</Typography></Paper>;
  if (loading) return <Paper sx={{ p: 3 }}><Skeleton variant="rectangular" height={120} /></Paper>;

  const displayFields = fields?.length > 0 ? fields : Object.keys(items[0] || {}).filter((k: string) => !k.endsWith('_data'));

  if (displayAs === 'list') {
    return (
      <Paper sx={{ p: 3 }}>
        {showTitle && <Typography variant="h6" fontWeight={700} mb={2}>{title || collection}</Typography>}
        {items.map((item, i) => (
          <Box key={i} sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 2 }}>
            {displayFields.slice(0, 3).map((f: string) => <Typography key={f} variant="body2">{String(item[f] ?? '')}</Typography>)}
          </Box>
        ))}
        {items.length === 0 && <Typography variant="body2" color="text.secondary">No items</Typography>}
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      {showTitle && <Typography variant="h6" fontWeight={700} mb={2}>{title || collection}</Typography>}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 2 }}>
        {items.map((item, i) => (
          <Paper key={i} variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            {displayFields.slice(0, 4).map((f: string) => (
              <Box key={f} sx={{ mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontSize: 10 }}>{f}</Typography>
                <Typography variant="body2" fontWeight={500} noWrap>{String(item[f] ?? '—')}</Typography>
              </Box>
            ))}
          </Paper>
        ))}
      </Box>
      {items.length === 0 && <Typography variant="body2" color="text.secondary" textAlign="center">No items in {collection}</Typography>}
    </Paper>
  );
}

function CollectionTablePreview({ collection, title, limit, fields, sort, order }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!collection) return;
    setLoading(true);
    api.get<{ data: any[] }>(`/items/${collection}`, { limit: String(limit || 25), sort: sort || 'id', order: order || 'asc' })
      .then(res => { setItems(res.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [collection, limit, sort, order]);

  if (!collection) return <Paper sx={{ p: 4, textAlign: 'center' }}><Table size={32} style={{ opacity: 0.2 }} /><Typography variant="body2" color="text.secondary" mt={1}>Select a collection</Typography></Paper>;
  if (loading) return <Paper sx={{ p: 3 }}><Skeleton variant="rectangular" height={150} /></Paper>;

  const cols = fields?.length > 0 ? fields : Object.keys(items[0] || {}).filter((k: string) => !k.endsWith('_data')).slice(0, 6);

  return (
    <Paper sx={{ p: 2, overflow: 'auto' }}>
      {title && <Typography variant="h6" fontWeight={700} mb={2}>{title}</Typography>}
      <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, '& th, & td': { px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider', textAlign: 'left' }, '& th': { fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: 'text.secondary' } }}>
        <thead><tr>{cols.map((c: string) => <th key={c}>{c}</th>)}</tr></thead>
        <tbody>{items.map((item, i) => <tr key={i}>{cols.map((c: string) => <td key={c}>{String(item[c] ?? '—')}</td>)}</tr>)}</tbody>
      </Box>
    </Paper>
  );
}

function FormBlockPreview({ collection, fields, submitLabel }: any) {
  if (!collection) return <Paper sx={{ p: 4, textAlign: 'center' }}><FormInput size={32} style={{ opacity: 0.2 }} /><Typography variant="body2" color="text.secondary" mt={1}>Select a collection</Typography></Paper>;
  const displayFields = fields?.length ? fields : ['field_1', 'field_2'];
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" fontWeight={700} mb={2}>Submit to {collection}</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {displayFields.map((f: string) => <TextField key={f} fullWidth label={f} size="small" disabled />)}
        <Button variant="contained" disabled>{submitLabel || 'Submit'}</Button>
      </Box>
    </Paper>
  );
}

// ─── Properties Panel ───

function BlockPropertiesPanel({ block, onUpdate, onClose, collections, isDark }: {
  block: Block; onUpdate: (props: Record<string, any>) => void; onClose: () => void;
  collections: any; isDark: boolean;
}) {
  const p = block.props;
  const def = BLOCK_DEFS.find(d => d.type === block.type);
  const Icon = def?.icon || Code;
  const collectionKeys = Object.keys(collections).filter(k => !k.startsWith('neurofy_'));

  const collectionFields = (col: string): string[] => {
    const c = collections[col];
    if (!c?.fields) return [];
    return c.fields.map((f: any) => f.name).filter((n: string) => n !== 'date_created' && n !== 'date_updated');
  };

  return (
    <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Icon size={18} />
          <Typography variant="subtitle1" fontWeight={700}>{def?.label || block.type}</Typography>
        </Box>
        <IconButton size="small" onClick={onClose}><X size={16} /></IconButton>
      </Box>
      <Divider />

      {/* ── Per-type property editors ── */}

      {block.type === 'heading' && <>
        <TextField fullWidth label="Text" value={p.text} onChange={e => onUpdate({ text: e.target.value })} />
        <TextField select fullWidth label="Level" value={p.level} onChange={e => onUpdate({ level: e.target.value })}>
          <MenuItem value="h1">H1</MenuItem><MenuItem value="h2">H2</MenuItem><MenuItem value="h3">H3</MenuItem><MenuItem value="h4">H4</MenuItem>
        </TextField>
        <AlignSelector value={p.align} onChange={v => onUpdate({ align: v })} />
        <TextField fullWidth label="Color" value={p.color} onChange={e => onUpdate({ color: e.target.value })} type="color" />
      </>}

      {block.type === 'text' && <>
        <TextField fullWidth multiline rows={8} label="Content (HTML)" value={p.content} onChange={e => onUpdate({ content: e.target.value })} sx={{ '& textarea': { fontFamily: 'monospace', fontSize: 12 } }} />
        <AlignSelector value={p.align} onChange={v => onUpdate({ align: v })} />
      </>}

      {block.type === 'image' && <>
        <TextField fullWidth label="Image URL" value={p.src} onChange={e => onUpdate({ src: e.target.value })} />
        <TextField fullWidth label="Alt Text" value={p.alt} onChange={e => onUpdate({ alt: e.target.value })} />
        <TextField fullWidth label="Width" value={p.width} onChange={e => onUpdate({ width: e.target.value })} />
        <TextField fullWidth label="Height" value={p.height} onChange={e => onUpdate({ height: e.target.value })} />
        <TextField select fullWidth label="Object Fit" value={p.objectFit} onChange={e => onUpdate({ objectFit: e.target.value })}>
          <MenuItem value="cover">Cover</MenuItem><MenuItem value="contain">Contain</MenuItem><MenuItem value="fill">Fill</MenuItem><MenuItem value="none">None</MenuItem>
        </TextField>
        <TextField fullWidth label="Border Radius" value={p.borderRadius} onChange={e => onUpdate({ borderRadius: e.target.value })} />
      </>}

      {block.type === 'button' && <>
        <TextField fullWidth label="Text" value={p.text} onChange={e => onUpdate({ text: e.target.value })} />
        <TextField fullWidth label="URL" value={p.url} onChange={e => onUpdate({ url: e.target.value })} />
        <TextField select fullWidth label="Variant" value={p.variant} onChange={e => onUpdate({ variant: e.target.value })}>
          <MenuItem value="contained">Contained</MenuItem><MenuItem value="outlined">Outlined</MenuItem><MenuItem value="text">Text</MenuItem>
        </TextField>
        <TextField fullWidth label="Color" value={p.color} onChange={e => onUpdate({ color: e.target.value })} type="color" />
        <TextField select fullWidth label="Size" value={p.size} onChange={e => onUpdate({ size: e.target.value })}>
          <MenuItem value="small">Small</MenuItem><MenuItem value="medium">Medium</MenuItem><MenuItem value="large">Large</MenuItem>
        </TextField>
        <AlignSelector value={p.align} onChange={v => onUpdate({ align: v })} />
        <FormControlLabel control={<Switch checked={p.fullWidth} onChange={e => onUpdate({ fullWidth: e.target.checked })} />} label="Full width" />
      </>}

      {block.type === 'divider' && <>
        <TextField select fullWidth label="Style" value={p.style} onChange={e => onUpdate({ style: e.target.value })}>
          <MenuItem value="solid">Solid</MenuItem><MenuItem value="dashed">Dashed</MenuItem><MenuItem value="dotted">Dotted</MenuItem>
        </TextField>
        <TextField fullWidth label="Color" value={p.color} onChange={e => onUpdate({ color: e.target.value })} type="color" />
        <Typography variant="caption">Thickness</Typography>
        <Slider value={p.thickness || 1} min={1} max={8} onChange={(_, v) => onUpdate({ thickness: v })} />
      </>}

      {block.type === 'spacer' && <>
        <Typography variant="caption">Height: {p.height}px</Typography>
        <Slider value={p.height || 40} min={8} max={200} onChange={(_, v) => onUpdate({ height: v })} />
      </>}

      {block.type === 'hero' && <>
        <TextField fullWidth label="Title" value={p.title} onChange={e => onUpdate({ title: e.target.value })} />
        <TextField fullWidth label="Subtitle" value={p.subtitle} onChange={e => onUpdate({ subtitle: e.target.value })} />
        <TextField fullWidth label="Background Color" value={p.bgColor} onChange={e => onUpdate({ bgColor: e.target.value })} type="color" />
        <TextField fullWidth label="Text Color" value={p.textColor} onChange={e => onUpdate({ textColor: e.target.value })} type="color" />
        <TextField fullWidth label="Background Image URL" value={p.bgImage} onChange={e => onUpdate({ bgImage: e.target.value })} />
        <Typography variant="caption">Height: {p.height}px</Typography>
        <Slider value={p.height || 400} min={200} max={800} onChange={(_, v) => onUpdate({ height: v })} />
        <Typography variant="caption">Overlay: {Math.round((p.overlay || 0.5) * 100)}%</Typography>
        <Slider value={p.overlay || 0.5} min={0} max={1} step={0.05} onChange={(_, v) => onUpdate({ overlay: v })} />
        <AlignSelector value={p.align} onChange={v => onUpdate({ align: v })} />
      </>}

      {block.type === 'card' && <>
        <TextField fullWidth label="Title" value={p.title} onChange={e => onUpdate({ title: e.target.value })} />
        <TextField fullWidth multiline rows={3} label="Content" value={p.content} onChange={e => onUpdate({ content: e.target.value })} />
        <TextField fullWidth label="Image URL" value={p.image} onChange={e => onUpdate({ image: e.target.value })} />
        <TextField fullWidth label="Background Color" value={p.bgColor} onChange={e => onUpdate({ bgColor: e.target.value })} type="color" />
        <FormControlLabel control={<Switch checked={p.shadow} onChange={e => onUpdate({ shadow: e.target.checked })} />} label="Shadow" />
        <Typography variant="caption">Padding: {p.padding}px</Typography>
        <Slider value={p.padding || 24} min={0} max={64} onChange={(_, v) => onUpdate({ padding: v })} />
        <Typography variant="caption">Border Radius: {p.borderRadius}px</Typography>
        <Slider value={p.borderRadius || 12} min={0} max={32} onChange={(_, v) => onUpdate({ borderRadius: v })} />
      </>}

      {block.type === 'columns' && <>
        <TextField select fullWidth label="Number of Columns" value={p.count} onChange={e => onUpdate({ count: parseInt(e.target.value) })}>
          <MenuItem value={2}>2 Columns</MenuItem><MenuItem value={3}>3 Columns</MenuItem><MenuItem value={4}>4 Columns</MenuItem>
        </TextField>
        <Typography variant="caption">Gap: {p.gap}px</Typography>
        <Slider value={p.gap || 24} min={0} max={64} onChange={(_, v) => onUpdate({ gap: v })} />
        {Array.from({ length: p.count || 2 }).map((_, i) => (
          <TextField key={i} fullWidth multiline rows={3} label={`Column ${i + 1} (HTML)`} value={p[`col${i + 1}`] || ''} onChange={e => onUpdate({ [`col${i + 1}`]: e.target.value })} sx={{ '& textarea': { fontFamily: 'monospace', fontSize: 11 } }} />
        ))}
      </>}

      {block.type === 'stats' && <>
        {(p.items || []).map((item: any, i: number) => (
          <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField size="small" label="Label" value={item.label} onChange={e => { const items = [...p.items]; items[i] = { ...items[i], label: e.target.value }; onUpdate({ items }); }} />
            <TextField size="small" label="Value" value={item.value} onChange={e => { const items = [...p.items]; items[i] = { ...items[i], value: e.target.value }; onUpdate({ items }); }} />
            <IconButton size="small" color="error" onClick={() => { const items = p.items.filter((_: any, j: number) => j !== i); onUpdate({ items }); }}><Trash2 size={14} /></IconButton>
          </Box>
        ))}
        <Button size="small" startIcon={<Plus size={14} />} onClick={() => onUpdate({ items: [...(p.items || []), { label: 'New', value: '0' }] })}>Add Stat</Button>
        <TextField fullWidth label="Background Color" value={p.bgColor} onChange={e => onUpdate({ bgColor: e.target.value })} type="color" />
        <TextField fullWidth label="Text Color" value={p.textColor} onChange={e => onUpdate({ textColor: e.target.value })} type="color" />
      </>}

      {(block.type === 'collection-list' || block.type === 'collection-table') && <>
        <TextField select fullWidth label="Collection" value={p.collection} onChange={e => onUpdate({ collection: e.target.value, fields: [] })}>
          <MenuItem value="">— Select —</MenuItem>
          {collectionKeys.map(k => <MenuItem key={k} value={k}>{collections[k]?.label || k}</MenuItem>)}
        </TextField>
        {p.collection && (
          <Autocomplete
            multiple size="small" options={collectionFields(p.collection)} value={p.fields || []}
            onChange={(_, v) => onUpdate({ fields: v })}
            renderInput={(params) => <TextField {...params} label="Fields to display" />}
          />
        )}
        <TextField fullWidth label="Title" value={p.title} onChange={e => onUpdate({ title: e.target.value })} />
        <TextField select fullWidth label="Sort by" value={p.sort} onChange={e => onUpdate({ sort: e.target.value })}>
          <MenuItem value="id">id</MenuItem>
          {p.collection && collectionFields(p.collection).map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
        </TextField>
        <TextField select fullWidth label="Order" value={p.order} onChange={e => onUpdate({ order: e.target.value })}>
          <MenuItem value="asc">Ascending</MenuItem><MenuItem value="desc">Descending</MenuItem>
        </TextField>
        <Typography variant="caption">Limit: {p.limit}</Typography>
        <Slider value={p.limit || 10} min={1} max={100} onChange={(_, v) => onUpdate({ limit: v })} />
        {block.type === 'collection-list' && <>
          <TextField select fullWidth label="Display As" value={p.displayAs} onChange={e => onUpdate({ displayAs: e.target.value })}>
            <MenuItem value="cards">Cards</MenuItem><MenuItem value="list">List</MenuItem>
          </TextField>
          <FormControlLabel control={<Switch checked={p.showTitle !== false} onChange={e => onUpdate({ showTitle: e.target.checked })} />} label="Show title" />
        </>}
      </>}

      {block.type === 'form' && <>
        <TextField select fullWidth label="Submit to Collection" value={p.collection} onChange={e => onUpdate({ collection: e.target.value, fields: [] })}>
          <MenuItem value="">— Select —</MenuItem>
          {collectionKeys.map(k => <MenuItem key={k} value={k}>{collections[k]?.label || k}</MenuItem>)}
        </TextField>
        {p.collection && (
          <Autocomplete
            multiple size="small" options={collectionFields(p.collection)} value={p.fields || []}
            onChange={(_, v) => onUpdate({ fields: v })}
            renderInput={(params) => <TextField {...params} label="Form fields" />}
          />
        )}
        <TextField fullWidth label="Submit Button Label" value={p.submitLabel} onChange={e => onUpdate({ submitLabel: e.target.value })} />
        <TextField fullWidth label="Success Message" value={p.successMessage} onChange={e => onUpdate({ successMessage: e.target.value })} />
      </>}

      {block.type === 'embed' && <>
        <TextField fullWidth label="URL" value={p.url} onChange={e => onUpdate({ url: e.target.value })} placeholder="https://..." />
        <TextField fullWidth label="Title" value={p.title} onChange={e => onUpdate({ title: e.target.value })} />
        <Typography variant="caption">Height: {p.height}px</Typography>
        <Slider value={p.height || 400} min={100} max={800} onChange={(_, v) => onUpdate({ height: v })} />
      </>}

      {block.type === 'code' && <>
        <TextField fullWidth multiline rows={12} label="Code" value={p.code} onChange={e => onUpdate({ code: e.target.value })} sx={{ '& textarea': { fontFamily: 'monospace', fontSize: 12 } }} />
        <TextField select fullWidth label="Language" value={p.language} onChange={e => onUpdate({ language: e.target.value })}>
          {['html', 'css', 'javascript', 'typescript', 'json', 'python', 'bash'].map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
        </TextField>
      </>}

      {block.type === 'html' && <>
        <TextField fullWidth multiline rows={12} label="HTML" value={p.html} onChange={e => onUpdate({ html: e.target.value })} sx={{ '& textarea': { fontFamily: 'monospace', fontSize: 12 } }} />
      </>}
    </Box>
  );
}

// ─── Align Selector ───

function AlignSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Box sx={{ display: 'flex', border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
      {[{ v: 'left', I: AlignLeft }, { v: 'center', I: AlignCenter }, { v: 'right', I: AlignRight }].map(({ v, I }) => (
        <IconButton key={v} size="small" onClick={() => onChange(v)} sx={{ borderRadius: 0, bgcolor: value === v ? 'action.selected' : 'transparent', flex: 1 }}><I size={16} /></IconButton>
      ))}
    </Box>
  );
}
