"use client";

import { use, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import { alpha, useTheme } from '@mui/material/styles';
import { api } from '@/lib/api';
import { useSchemaStore } from '@/store/schema';
import {
  Database, Table, Image, Code, Layers, FormInput, ExternalLink,
} from 'lucide-react';

interface Block {
  id: string;
  type: string;
  props: Record<string, any>;
}

export default function PageViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { collections } = useSchemaStore();
  const [page, setPage] = useState<any>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: any }>(`/pages/${id}`)
      .then(res => {
        setPage(res.data);
        try { setBlocks(JSON.parse(res.data.content || '[]')); } catch { setBlocks([]); }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;
  if (!page) return <Typography color="error" textAlign="center" py={10}>Page not found</Typography>;

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto' }}>
      {blocks.map(block => (
        <RenderBlock key={block.id} block={block} isDark={isDark} />
      ))}
      {blocks.length === 0 && (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Typography color="text.secondary">This page has no content blocks.</Typography>
        </Paper>
      )}
    </Box>
  );
}

function RenderBlock({ block, isDark }: { block: Block; isDark: boolean }) {
  const p = block.props;

  switch (block.type) {
    case 'heading':
      return <Typography variant={p.level === 'h1' ? 'h3' : p.level === 'h2' ? 'h4' : 'h5'} fontWeight={700} textAlign={p.align} sx={{ color: p.color || 'text.primary', mb: 2 }}>{p.text}</Typography>;
    case 'text':
      return <Box dangerouslySetInnerHTML={{ __html: p.content }} sx={{ textAlign: p.align, mb: 2, '& p': { m: 0 }, fontSize: 14, lineHeight: 1.7 }} />;
    case 'image':
      return p.src ? <Box component="img" src={p.src} alt={p.alt} sx={{ width: p.width || '100%', height: p.height || 'auto', objectFit: p.objectFit || 'cover', display: 'block', borderRadius: p.borderRadius, mb: 2 }} /> : null;
    case 'button':
      return <Box sx={{ textAlign: p.align, mb: 2 }}><Button variant={p.variant} href={p.url} size={p.size} sx={{ bgcolor: p.variant === 'contained' ? p.color : 'transparent', color: p.variant === 'contained' ? '#fff' : p.color, borderColor: p.color }}>{p.text}</Button></Box>;
    case 'divider':
      return <Divider sx={{ borderStyle: p.style, borderColor: p.color, borderWidth: p.thickness, my: 2 }} />;
    case 'spacer':
      return <Box sx={{ height: p.height }} />;
    case 'hero':
      return (
        <Box sx={{ height: p.height, display: 'flex', flexDirection: 'column', alignItems: p.align === 'center' ? 'center' : p.align === 'right' ? 'flex-end' : 'flex-start', justifyContent: 'center', px: 5, position: 'relative', borderRadius: 2, overflow: 'hidden', bgcolor: p.bgColor, backgroundImage: p.bgImage ? `url(${p.bgImage})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', mb: 2 }}>
          {p.bgImage && <Box sx={{ position: 'absolute', inset: 0, bgcolor: `rgba(0,0,0,${p.overlay || 0.5})` }} />}
          <Typography variant="h3" fontWeight={800} sx={{ color: p.textColor, position: 'relative', zIndex: 1 }}>{p.title}</Typography>
          <Typography variant="h6" sx={{ color: alpha(p.textColor || '#fff', 0.8), position: 'relative', zIndex: 1, mt: 1 }}>{p.subtitle}</Typography>
        </Box>
      );
    case 'card':
      return (
        <Paper elevation={p.shadow ? 3 : 0} sx={{ p: `${p.padding || 24}px`, borderRadius: `${p.borderRadius || 12}px`, bgcolor: p.bgColor || 'background.paper', mb: 2 }}>
          {p.image && <Box component="img" src={p.image} alt="" sx={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 1, mb: 2 }} />}
          <Typography variant="h6" fontWeight={700} mb={1}>{p.title}</Typography>
          <Typography variant="body2" color="text.secondary">{p.content}</Typography>
        </Paper>
      );
    case 'columns':
      const cols = [p.col1, p.col2, p.col3, p.col4].slice(0, p.count || 2);
      return (
        <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${p.count || 2}, 1fr)`, gap: `${p.gap || 24}px`, mb: 2 }}>
          {cols.map((html: string, i: number) => <Box key={i} dangerouslySetInnerHTML={{ __html: html || '' }} sx={{ '& p': { m: 0 } }} />)}
        </Box>
      );
    case 'stats':
      return (
        <Paper sx={{ p: 3, bgcolor: p.bgColor || 'background.paper', mb: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${(p.items || []).length}, 1fr)`, gap: 3, textAlign: 'center' }}>
            {(p.items || []).map((item: any, i: number) => (
              <Box key={i}><Typography variant="h4" fontWeight={800} sx={{ color: p.textColor || 'text.primary' }}>{item.value}</Typography><Typography variant="body2" color="text.secondary">{item.label}</Typography></Box>
            ))}
          </Box>
        </Paper>
      );
    case 'collection-list':
      return <LiveCollectionData collection={p.collection} displayAs={p.displayAs} title={p.title} showTitle={p.showTitle} limit={p.limit} fields={p.fields} sort={p.sort} order={p.order} />;
    case 'collection-table':
      return <LiveCollectionTable collection={p.collection} title={p.title} limit={p.limit} fields={p.fields} sort={p.sort} order={p.order} />;
    case 'form':
      return <LiveForm collection={p.collection} fields={p.fields} submitLabel={p.submitLabel} successMessage={p.successMessage} />;
    case 'embed':
      return p.url ? <Box component="iframe" src={p.url} title={p.title} sx={{ width: '100%', height: p.height || 400, border: 'none', borderRadius: 2, mb: 2 }} /> : null;
    case 'code':
      return <Box sx={{ p: 2, bgcolor: isDark ? '#0d1117' : '#1e1e1e', borderRadius: 2, mb: 2 }}><Typography component="pre" sx={{ fontFamily: 'monospace', fontSize: 12, color: '#d4d4d4', whiteSpace: 'pre-wrap', m: 0 }}>{p.code}</Typography></Box>;
    case 'html':
      return <Box dangerouslySetInnerHTML={{ __html: p.html }} sx={{ mb: 2 }} />;
    default:
      return null;
  }
}

function LiveCollectionData({ collection, displayAs, title, showTitle, limit, fields, sort, order }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!collection) return;
    setLoading(true);
    api.get<{ data: any[] }>(`/items/${collection}`, { limit: String(limit || 10), sort: sort || 'id', order: order || 'asc', populate: '*' })
      .then(res => { setItems(res.data || []); setLoading(false); }).catch(() => setLoading(false));
  }, [collection, limit, sort, order]);
  if (!collection || loading) return <Skeleton variant="rectangular" height={120} sx={{ mb: 2, borderRadius: 2 }} />;
  const displayFields = fields?.length > 0 ? fields : Object.keys(items[0] || {}).filter((k: string) => !k.endsWith('_data'));
  return (
    <Box sx={{ mb: 2 }}>
      {showTitle && <Typography variant="h6" fontWeight={700} mb={2}>{title || collection}</Typography>}
      <Box sx={{ display: 'grid', gridTemplateColumns: displayAs === 'list' ? '1fr' : 'repeat(auto-fill, minmax(220px, 1fr))', gap: 2 }}>
        {items.map((item, i) => (
          <Paper key={i} variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            {displayFields.slice(0, 4).map((f: string) => (
              <Box key={f} mb={0.5}><Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontSize: 10 }}>{f}</Typography><Typography variant="body2" fontWeight={500} noWrap>{String(item[f] ?? '—')}</Typography></Box>
            ))}
          </Paper>
        ))}
      </Box>
    </Box>
  );
}

function LiveCollectionTable({ collection, title, limit, fields, sort, order }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!collection) return;
    setLoading(true);
    api.get<{ data: any[] }>(`/items/${collection}`, { limit: String(limit || 25), sort: sort || 'id', order: order || 'asc' })
      .then(res => { setItems(res.data || []); setLoading(false); }).catch(() => setLoading(false));
  }, [collection, limit, sort, order]);
  if (!collection || loading) return <Skeleton variant="rectangular" height={150} sx={{ mb: 2, borderRadius: 2 }} />;
  const cols = fields?.length > 0 ? fields : Object.keys(items[0] || {}).filter((k: string) => !k.endsWith('_data')).slice(0, 6);
  return (
    <Paper sx={{ p: 2, overflow: 'auto', mb: 2 }}>
      {title && <Typography variant="h6" fontWeight={700} mb={2}>{title}</Typography>}
      <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, '& th, & td': { px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider', textAlign: 'left' }, '& th': { fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: 'text.secondary' } }}>
        <thead><tr>{cols.map((c: string) => <th key={c}>{c}</th>)}</tr></thead>
        <tbody>{items.map((item, i) => <tr key={i}>{cols.map((c: string) => <td key={c}>{String(item[c] ?? '—')}</td>)}</tr>)}</tbody>
      </Box>
    </Paper>
  );
}

function LiveForm({ collection, fields, submitLabel, successMessage }: any) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    try {
      await api.post(`/items/${collection}`, formData);
      setSubmitted(true);
      setFormData({});
    } catch (err: any) {
      setError(err.message || 'Submit failed');
    }
  };

  if (submitted) return <Paper sx={{ p: 3, mb: 2, textAlign: 'center' }}><Typography color="success.main" fontWeight={600}>{successMessage || 'Submitted!'}</Typography></Paper>;

  const displayFields = fields?.length ? fields : [];
  return (
    <Paper sx={{ p: 3, mb: 2 }}>
      <Typography variant="h6" fontWeight={700} mb={2}>Submit to {collection}</Typography>
      {error && <Typography color="error" variant="body2" mb={2}>{error}</Typography>}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {displayFields.map((f: string) => (
          <TextField key={f} fullWidth label={f} size="small" value={formData[f] || ''} onChange={e => setFormData({ ...formData, [f]: e.target.value })} />
        ))}
        <Button variant="contained" onClick={handleSubmit} disabled={!collection}>{submitLabel || 'Submit'}</Button>
      </Box>
    </Paper>
  );
}
