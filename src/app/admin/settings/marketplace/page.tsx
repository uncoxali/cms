'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Rating from '@mui/material/Rating';
import { alpha } from '@mui/material/styles';
import { useNotificationsStore } from '@/store/notifications';
import {
  Puzzle,
  Plus,
  Download,
  Trash2,
  Star,
  Search,
  Grid3X3,
  List,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Zap,
} from 'lucide-react';

interface Extension {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  icon: string;
  category: 'interface' | 'layout' | 'panel' | 'module' | 'hook';
  rating: number;
  downloads: number;
  installed: boolean;
  featured: boolean;
}

const MOCK_EXTENSIONS: Extension[] = [
  {
    id: '1',
    name: 'Advanced Charts',
    description: 'Add beautiful interactive charts to your collections with ECharts integration.',
    author: 'Neurofy Team',
    version: '2.1.0',
    icon: '📊',
    category: 'interface',
    rating: 4.8,
    downloads: 12500,
    installed: true,
    featured: true,
  },
  {
    id: '2',
    name: 'Kanban Board',
    description: 'Visualize your items in a Kanban-style board with drag and drop support.',
    author: 'Neurofy Team',
    version: '1.5.0',
    icon: '📋',
    category: 'layout',
    rating: 4.6,
    downloads: 8900,
    installed: false,
    featured: true,
  },
  {
    id: '3',
    name: 'Export to PDF',
    description: 'Generate PDF reports and documents from your collections.',
    author: 'Community',
    version: '1.0.0',
    icon: '📄',
    category: 'module',
    rating: 4.2,
    downloads: 5600,
    installed: false,
    featured: false,
  },
  {
    id: '4',
    name: 'Custom Dashboard Widgets',
    description: 'Add custom widgets to your dashboard with drag and drop.',
    author: 'Community',
    version: '0.9.0',
    icon: '📈',
    category: 'panel',
    rating: 4.4,
    downloads: 3200,
    installed: false,
    featured: false,
  },
  {
    id: '5',
    name: 'Slack Integration',
    description: 'Send notifications and updates directly to your Slack channels.',
    author: 'Community',
    version: '1.2.0',
    icon: '💬',
    category: 'hook',
    rating: 4.5,
    downloads: 7800,
    installed: true,
    featured: true,
  },
  {
    id: '6',
    name: 'Data Import Pro',
    description: 'Import data from CSV, Excel, and JSON files with field mapping.',
    author: 'Neurofy Team',
    version: '3.0.0',
    icon: '📥',
    category: 'module',
    rating: 4.9,
    downloads: 15000,
    installed: false,
    featured: true,
  },
];

export default function MarketplacePage() {
  const { addNotification } = useNotificationsStore();

  const [extensions, setExtensions] = useState<Extension[]>(MOCK_EXTENSIONS);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [tab, setTab] = useState(0);

  const filteredExtensions = extensions.filter(ext => {
    const matchSearch = !search || 
      ext.name.toLowerCase().includes(search.toLowerCase()) ||
      ext.description.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === 'all' || ext.category === category;
    return matchSearch && matchCategory;
  });

  const installedExtensions = extensions.filter(e => e.installed);
  const featuredExtensions = extensions.filter(e => e.featured);

  const handleInstall = (ext: Extension) => {
    setExtensions(prev => prev.map(e => 
      e.id === ext.id ? { ...e, installed: true } : e
    ));
    addNotification({ title: 'Installed', message: `${ext.name} has been installed.` });
  };

  const handleUninstall = (ext: Extension) => {
    setExtensions(prev => prev.map(e => 
      e.id === ext.id ? { ...e, installed: false } : e
    ));
    addNotification({ title: 'Uninstalled', message: `${ext.name} has been uninstalled.` });
  };

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      interface: '#8B5CF6',
      layout: '#22C55E',
      panel: '#F59E0B',
      module: '#3B82F6',
      hook: '#EC4899',
    };
    return colors[cat] || '#8B5CF6';
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', px: 3, py: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant='h5' fontWeight={700}>
              Extension Marketplace
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Extend your CMS with custom plugins and integrations
            </Typography>
          </Box>
          <Button variant='outlined' startIcon={<Plus size={16} />}>
            Upload Extension
          </Button>
        </Box>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label='Browse All' />
          <Tab label={`Installed (${installedExtensions.length})`} />
          <Tab label='Featured' />
        </Tabs>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size='small'
            placeholder='Search extensions...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <Search size={16} style={{ marginRight: 8 }} /> }}
            sx={{ width: 280 }}
          />
          <TextField
            select
            size='small'
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            sx={{ width: 160 }}
          >
            <option value='all'>All Categories</option>
            <option value='interface'>Interfaces</option>
            <option value='layout'>Layouts</option>
            <option value='panel'>Panels</option>
            <option value='module'>Modules</option>
            <option value='hook'>Hooks</option>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton onClick={() => setViewMode('grid')}>
            <Grid3X3 size={18} />
          </IconButton>
          <IconButton onClick={() => setViewMode('list')}>
            <List size={18} />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
        {tab === 1 && (
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            Showing {installedExtensions.length} installed extensions
          </Typography>
        )}

        {viewMode === 'grid' ? (
          <Grid container spacing={3}>
            {(tab === 1 ? installedExtensions : tab === 2 ? featuredExtensions : filteredExtensions).map(ext => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={ext.id}>
                <Paper
                  sx={{
                    p: 3,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 200ms',
                    '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant='h4'>{ext.icon}</Typography>
                    {ext.featured && (
                      <Chip label='Featured' size='small' color='warning' icon={<Zap size={12} />} />
                    )}
                  </Box>

                  <Typography variant='subtitle1' fontWeight={700} gutterBottom>
                    {ext.name}
                  </Typography>
                  <Typography variant='caption' color='text.secondary' sx={{ mb: 2, display: 'block' }}>
                    by {ext.author} · v{ext.version}
                  </Typography>

                  <Typography variant='body2' color='text.secondary' sx={{ mb: 2, flexGrow: 1 }}>
                    {ext.description}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip
                      label={ext.category}
                      size='small'
                      sx={{ bgcolor: alpha(getCategoryColor(ext.category), 0.1), color: getCategoryColor(ext.category) }}
                    />
                    <Chip
                      icon={<Star size={12} />}
                      label={ext.rating}
                      size='small'
                      variant='outlined'
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant='caption' color='text.secondary'>
                      {ext.downloads.toLocaleString()} downloads
                    </Typography>
                    {ext.installed ? (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip label='Installed' size='small' color='success' icon={<CheckCircle size={12} />} />
                        <IconButton size='small' color='error' onClick={() => handleUninstall(ext)}>
                          <Trash2 size={16} />
                        </IconButton>
                      </Box>
                    ) : (
                      <Button
                        size='small'
                        variant='contained'
                        onClick={() => handleInstall(ext)}
                        startIcon={<Download size={14} />}
                      >
                        Install
                      </Button>
                    )}
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {(tab === 1 ? installedExtensions : tab === 2 ? featuredExtensions : filteredExtensions).map(ext => (
              <Paper key={ext.id} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Typography variant='h4'>{ext.icon}</Typography>
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant='subtitle1' fontWeight={700}>{ext.name}</Typography>
                    <Chip label={ext.category} size='small' sx={{ fontSize: 10 }} />
                    {ext.featured && <Zap size={14} color='#F59E0B' />}
                  </Box>
                  <Typography variant='body2' color='text.secondary'>
                    {ext.description}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant='caption' color='text.secondary'>
                    v{ext.version} · {ext.downloads.toLocaleString()} downloads
                  </Typography>
                  <Rating value={ext.rating} readOnly size='small' precision={0.1} />
                  {ext.installed ? (
                    <Button size='small' color='error' onClick={() => handleUninstall(ext)}>
                      Uninstall
                    </Button>
                  ) : (
                    <Button size='small' variant='contained' onClick={() => handleInstall(ext)}>
                      Install
                    </Button>
                  )}
                </Box>
              </Paper>
            ))}
          </Box>
        )}

        {filteredExtensions.length === 0 && (
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <Puzzle size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
            <Typography variant='h6' color='text.secondary'>
              No extensions found
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );
}
