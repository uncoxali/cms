"use client";

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import { alpha, useTheme } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import {
  Plus, Search, Trash2, Edit2, ExternalLink, FileText,
  Globe, Eye, EyeOff, ArrowUpDown, Copy, MoreVertical,
  Layout, ChevronRight,
} from 'lucide-react';

interface Page {
  id: number;
  title: string;
  path: string;
  slug: string;
  status: string;
  layout: string;
  parent_id: string | null;
  sort_order: number;
  show_in_nav: boolean;
  icon: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

const STATUS_MAP: Record<string, { label: string; color: 'success' | 'warning' | 'default' }> = {
  published: { label: 'Published', color: 'success' },
  draft: { label: 'Draft', color: 'warning' },
  archived: { label: 'Archived', color: 'default' },
};

const LAYOUT_MAP: Record<string, string> = {
  default: 'Default',
  'full-width': 'Full Width',
  sidebar: 'With Sidebar',
  blank: 'Blank',
};

export default function PagesListPage() {
  const router = useRouter();
  const theme = useTheme();
  const confirm = useConfirm();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchPages = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Page[] }>('/pages', statusFilter !== 'all' ? { status: statusFilter } : undefined);
      setPages(res.data || []);
    } catch (err) {
      console.error('Failed to fetch pages:', err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchPages(); }, [statusFilter]);

  const handleDelete = async (page: Page) => {
    const ok = await confirm({
      title: 'Delete Page',
      message: `Are you sure you want to delete "${page.title}" (${page.path})?`,
      confirmText: 'Delete',
      severity: 'error',
    });
    if (!ok) return;
    try {
      await api.del(`/pages/${page.id}`);
      setPages(prev => prev.filter(p => p.id !== page.id));
    } catch (err) {
      console.error('Failed to delete page:', err);
    }
  };

  const handleDuplicate = async (page: Page) => {
    try {
      const res = await api.post<{ data: Page }>('/pages', {
        title: `${page.title} (Copy)`,
        path: `${page.path}-copy-${Date.now()}`,
        slug: `${page.slug}-copy`,
        status: 'draft',
        layout: page.layout,
      });
      if (res.data) setPages(prev => [...prev, res.data]);
    } catch (err) {
      console.error('Failed to duplicate:', err);
    }
  };

  const filtered = pages.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.path.toLowerCase().includes(search.toLowerCase())
  );

  const rootPages = filtered.filter(p => !p.parent_id);
  const childrenOf = (parentId: number) => filtered.filter(p => String(p.parent_id) === String(parentId));

  const renderRow = (page: Page, depth = 0): React.ReactNode[] => {
    const st = STATUS_MAP[page.status] || STATUS_MAP.draft;
    const children = childrenOf(page.id);
    return [
      <TableRow
        key={page.id}
        hover
        sx={{ cursor: 'pointer', '&:hover .actions': { opacity: 1 } }}
        onClick={() => router.push(`/admin/pages/${page.id}`)}
      >
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pl: depth * 3 }}>
            {depth > 0 && <ChevronRight size={14} style={{ opacity: 0.4 }} />}
            <Box sx={{
              width: 36, height: 36, borderRadius: 1.5,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FileText size={18} color={theme.palette.primary.main} />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight={600}>{page.title}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: 11 }}>{page.path}</Typography>
            </Box>
          </Box>
        </TableCell>
        <TableCell><Chip label={st.label} size="small" color={st.color} variant="outlined" /></TableCell>
        <TableCell><Typography variant="caption">{LAYOUT_MAP[page.layout] || page.layout}</Typography></TableCell>
        <TableCell>
          {page.show_in_nav
            ? <Chip icon={<Eye size={12} />} label="Visible" size="small" color="info" variant="outlined" />
            : <Chip icon={<EyeOff size={12} />} label="Hidden" size="small" variant="outlined" />
          }
        </TableCell>
        <TableCell><Typography variant="caption" color="text.secondary">{page.sort_order}</Typography></TableCell>
        <TableCell><Typography variant="caption" color="text.secondary">{new Date(page.updated_at).toLocaleDateString()}</Typography></TableCell>
        <TableCell align="right" onClick={e => e.stopPropagation()}>
          <Box className="actions" sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', opacity: 0, transition: 'opacity 0.2s' }}>
            <Tooltip title="Edit"><IconButton size="small" onClick={() => router.push(`/admin/pages/${page.id}`)}><Edit2 size={15} /></IconButton></Tooltip>
            <Tooltip title="Duplicate"><IconButton size="small" onClick={() => handleDuplicate(page)}><Copy size={15} /></IconButton></Tooltip>
            <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(page)}><Trash2 size={15} /></IconButton></Tooltip>
          </Box>
        </TableCell>
      </TableRow>,
      ...children.map(c => renderRow(c, depth + 1)),
    ];
  };

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} display="flex" alignItems="center" gap={1.5}>
            <Globe size={28} /> Pages & Routes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage frontend pages, routes, and navigation structure.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => router.push('/admin/pages/new')}>
          New Page
        </Button>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          size="small" placeholder="Search pages..." value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ minWidth: 280 }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment> } }}
        />
        <TextField
          select size="small" value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="all">All Status</MenuItem>
          <MenuItem value="published">Published</MenuItem>
          <MenuItem value="draft">Draft</MenuItem>
          <MenuItem value="archived">Archived</MenuItem>
        </TextField>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        {[
          { label: 'Total', value: pages.length, color: theme.palette.primary.main },
          { label: 'Published', value: pages.filter(p => p.status === 'published').length, color: '#27ae60' },
          { label: 'Draft', value: pages.filter(p => p.status === 'draft').length, color: '#e67e22' },
        ].map(s => (
          <Paper key={s.label} variant="outlined" sx={{ px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color }} />
            <Typography variant="body2" color="text.secondary">{s.label}</Typography>
            <Typography variant="h6" fontWeight={700}>{s.value}</Typography>
          </Paper>
        ))}
      </Box>

      {/* Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : filtered.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <FileText size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <Typography variant="h6" color="text.secondary" mb={1}>No pages found</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>Create your first page to get started.</Typography>
          <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => router.push('/admin/pages/new')}>Create Page</Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Page</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Layout</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Navigation</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Order</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Updated</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {rootPages.flatMap(p => renderRow(p))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
