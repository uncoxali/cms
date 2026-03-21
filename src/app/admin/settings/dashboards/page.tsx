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
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import { alpha, useTheme } from '@mui/material/styles';
import { useNotificationsStore } from '@/store/notifications';
import {
  LayoutDashboard,
  Plus,
  Settings,
  Trash2,
  Edit,
  GripVertical,
  BarChart3,
  List,
  FileText,
  Hash,
  TrendingUp,
} from 'lucide-react';

interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'list' | 'markdown' | 'activity';
  title: string;
  config: Record<string, any>;
  position: { x: number; y: number; w: number; h: number };
}

interface Dashboard {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  widgets: DashboardWidget[];
  createdAt: string;
  updatedAt: string;
}

const WIDGET_TYPES = [
  { type: 'metric', label: 'Metric Card', icon: Hash, description: 'Display a single value with trend' },
  { type: 'chart', label: 'Chart', icon: BarChart3, description: 'Line, bar, or pie chart' },
  { type: 'list', label: 'List', icon: List, description: 'List of items or records' },
  { type: 'activity', label: 'Activity Feed', icon: TrendingUp, description: 'Recent activity stream' },
  { type: 'markdown', label: 'Note', icon: FileText, description: 'Markdown content block' },
];

const STORAGE_KEY = 'neurofy-custom-dashboards';

export default function DashboardsSettingsPage() {
  const theme = useTheme();
  const { addNotification } = useNotificationsStore();

  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null);
  const [newDashboard, setNewDashboard] = useState({ name: '', description: '' });

  useEffect(() => {
    loadDashboards();
  }, []);

  const loadDashboards = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setDashboards(JSON.parse(stored));
      } else {
        // Create default dashboard
        const defaultDash: Dashboard = {
          id: 'default',
          name: 'Main Dashboard',
          description: 'Default dashboard with overview widgets',
          isDefault: true,
          widgets: [
            { id: 'w1', type: 'metric', title: 'Total Items', config: { metric: 'totalItems' }, position: { x: 0, y: 0, w: 3, h: 1 } },
            { id: 'w2', type: 'metric', title: 'Total Users', config: { metric: 'totalUsers' }, position: { x: 3, y: 0, w: 3, h: 1 } },
            { id: 'w3', type: 'activity', title: 'Recent Activity', config: { limit: 10 }, position: { x: 6, y: 0, w: 6, h: 2 } },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setDashboards([defaultDash]);
        saveDashboards([defaultDash]);
      }
    } catch (err) {
      console.error('Failed to load dashboards:', err);
    }
  };

  const saveDashboards = (data: Dashboard[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Failed to save dashboards:', err);
    }
  };

  const handleCreate = () => {
    if (!newDashboard.name.trim()) {
      addNotification({ title: 'Error', message: 'Dashboard name is required' });
      return;
    }

    const dashboard: Dashboard = {
      id: `dash_${Date.now()}`,
      name: newDashboard.name,
      description: newDashboard.description,
      isDefault: false,
      widgets: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...dashboards, dashboard];
    setDashboards(updated);
    saveDashboards(updated);
    setCreateOpen(false);
    setNewDashboard({ name: '', description: '' });
    addNotification({ title: 'Created', message: `Dashboard "${dashboard.name}" created` });
  };

  const handleDelete = (id: string) => {
    const dashboard = dashboards.find(d => d.id === id);
    if (dashboard?.isDefault) {
      addNotification({ title: 'Error', message: 'Cannot delete default dashboard' });
      return;
    }

    const updated = dashboards.filter(d => d.id !== id);
    setDashboards(updated);
    saveDashboards(updated);
    addNotification({ title: 'Deleted', message: 'Dashboard deleted' });
  };

  const handleSetDefault = (id: string) => {
    const updated = dashboards.map(d => ({
      ...d,
      isDefault: d.id === id,
      updatedAt: new Date().toISOString(),
    }));
    setDashboards(updated);
    saveDashboards(updated);
    addNotification({ title: 'Updated', message: 'Default dashboard changed' });
  };

  const handleAddWidget = (dashboardId: string, type: string) => {
    const widgetType = WIDGET_TYPES.find(w => w.type === type);
    if (!widgetType) return;

    const updated = dashboards.map(d => {
      if (d.id !== dashboardId) return d;
      const newWidget: DashboardWidget = {
        id: `widget_${Date.now()}`,
        type: type as any,
        title: widgetType.label,
        config: {},
        position: { x: 0, y: d.widgets.length * 2, w: 6, h: 2 },
      };
      return { ...d, widgets: [...d.widgets, newWidget], updatedAt: new Date().toISOString() };
    });
    setDashboards(updated);
    saveDashboards(updated);
  };

  const handleRemoveWidget = (dashboardId: string, widgetId: string) => {
    const updated = dashboards.map(d => {
      if (d.id !== dashboardId) return d;
      return { ...d, widgets: d.widgets.filter(w => w.id !== widgetId), updatedAt: new Date().toISOString() };
    });
    setDashboards(updated);
    saveDashboards(updated);
  };

  return (
    <Box sx={{ p: 4, overflow: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Custom Dashboards
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create and manage personalized dashboard layouts
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={() => setCreateOpen(true)}
          sx={{ borderRadius: '10px' }}
        >
          New Dashboard
        </Button>
      </Box>

      {/* Dashboard List */}
      <Grid container spacing={3}>
        {dashboards.map((dashboard) => (
          <Grid size={{ xs: 12, md: 6, lg: 4 }} key={dashboard.id}>
            <Paper
              sx={{
                p: 0,
                borderRadius: '16px',
                overflow: 'hidden',
                border: dashboard.isDefault ? `2px solid ${alpha('#8B5CF6', 0.3)}` : '1px solid',
                borderColor: 'divider',
              }}
            >
              {/* Header */}
              <Box
                sx={{
                  p: 2.5,
                  pb: 2,
                  borderBottom: 1,
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '12px',
                    bgcolor: alpha('#8B5CF6', 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <LayoutDashboard size={22} color="#8B5CF6" />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {dashboard.name}
                    </Typography>
                    {dashboard.isDefault && (
                      <Chip
                        label="Default"
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: 10,
                          fontWeight: 600,
                          bgcolor: alpha('#8B5CF6', 0.1),
                          color: '#8B5CF6',
                        }}
                      />
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {dashboard.description || 'No description'}
                  </Typography>
                </Box>
              </Box>

              {/* Widgets Preview */}
              <Box sx={{ p: 2.5 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={1}>
                  Widgets ({dashboard.widgets.length})
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {dashboard.widgets.slice(0, 4).map((widget) => {
                    const widgetType = WIDGET_TYPES.find(w => w.type === widget.type);
                    const Icon = widgetType?.icon || Hash;
                    return (
                      <Chip
                        key={widget.id}
                        icon={<Icon size={12} />}
                        label={widget.title}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: 11 }}
                        onDelete={() => handleRemoveWidget(dashboard.id, widget.id)}
                      />
                    );
                  })}
                  {dashboard.widgets.length > 4 && (
                    <Chip
                      label={`+${dashboard.widgets.length - 4} more`}
                      size="small"
                      sx={{ fontSize: 11 }}
                    />
                  )}
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
                  alignItems: 'center',
                  bgcolor: alpha('#000', 0.02),
                }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={dashboard.isDefault}
                      onChange={() => handleSetDefault(dashboard.id)}
                    />
                  }
                  label={<Typography variant="caption">Default</Typography>}
                  sx={{ ml: 0.5 }}
                />
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <TextField
                    select
                    size="small"
                    label="Add Widget"
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddWidget(dashboard.id, e.target.value);
                      }
                    }}
                    sx={{ width: 140 }}
                  >
                    <MenuItem value="" disabled>
                      <Typography variant="caption" color="text.secondary">Select...</Typography>
                    </MenuItem>
                    {WIDGET_TYPES.map((type) => (
                      <MenuItem key={type.type} value={type.type}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <type.icon size={14} />
                          {type.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </TextField>
                  {!dashboard.isDefault && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(dashboard.id)}
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  )}
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Dashboard</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Dashboard Name"
            value={newDashboard.name}
            onChange={(e) => setNewDashboard({ ...newDashboard, name: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            value={newDashboard.description}
            onChange={(e) => setNewDashboard({ ...newDashboard, description: e.target.value })}
            multiline
            rows={2}
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
