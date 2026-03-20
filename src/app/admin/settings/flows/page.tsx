'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import { alpha, useTheme } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import { useFlowsStore, Flow } from '@/store/flows';
import { useActivityStore } from '@/store/activity';
import { useNotificationsStore } from '@/store/notifications';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import { Modal, FormField } from '@/components/admin/Modal';
import { StatusToggle } from '@/components/admin/Toggle';
import { api } from '@/lib/api';
import {
  Plus,
  Zap,
  Play,
  Pause,
  Trash2,
  MoreVertical,
  GitBranch,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Webhook,
  CalendarClock,
  MousePointerClick,
  Database,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';

const TRIGGER_CONFIG: Record<string, { label: string; color: string; icon: any; bgColor: string }> = {
  hook: { label: 'Event Hook', color: '#6644ff', bgColor: 'rgba(102, 68, 255, 0.1)', icon: GitBranch },
  webhook: { label: 'Webhook', color: '#e67e22', bgColor: 'rgba(230, 126, 34, 0.1)', icon: Webhook },
  schedule: { label: 'Schedule', color: '#2ecc71', bgColor: 'rgba(46, 204, 113, 0.1)', icon: CalendarClock },
  operation: { label: 'Operation', color: '#3498db', bgColor: 'rgba(52, 152, 219, 0.1)', icon: RefreshCw },
  manual: { label: 'Manual', color: '#9b59b6', bgColor: 'rgba(155, 89, 182, 0.1)', icon: MousePointerClick },
};

const STATUS_CONFIG = {
  active: { label: 'Active', color: '#22C55E', bgColor: 'rgba(34, 197, 94, 0.1)', icon: CheckCircle },
  inactive: { label: 'Inactive', color: '#6B7280', bgColor: 'rgba(107, 114, 128, 0.1)', icon: Pause },
  error: { label: 'Error', color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.1)', icon: XCircle },
};

export default function FlowsListPage() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const { flows, runLogs, loading, updateFlow, addFlow, deleteFlow, fetchFlows } = useFlowsStore();
  const { addLog } = useActivityStore();
  const { addNotification } = useNotificationsStore();
  const confirm = useConfirm();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [newFlow, setNewFlow] = useState({
    name: '',
    description: '',
    triggerType: 'manual',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchFlows();
  }, []);

  const filteredFlows = flows.filter(flow => {
    const matchSearch = !search || flow.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || flow.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCreate = async () => {
    if (!newFlow.name.trim()) {
      addNotification({ title: 'Error', message: 'Flow name is required.' });
      return;
    }
    setCreating(true);
    try {
      const flowId = await addFlow({
        name: newFlow.name,
        description: newFlow.description,
        icon: 'Zap',
        color: TRIGGER_CONFIG[newFlow.triggerType]?.color || '#6644ff',
        status: 'inactive',
        triggerType: newFlow.triggerType as any,
        triggerOptions: {},
        permission: '$trigger',
        operations: [],
      });
      if (flowId) {
        addLog({ action: 'create', collection: 'neurofy_flows', item: flowId, user: 'Admin', meta: { name: newFlow.name } });
        setCreateOpen(false);
        setNewFlow({ name: '', description: '', triggerType: 'manual' });
        router.push(`/admin/settings/flows/${flowId}`);
      }
    } catch (err) {
      addNotification({ title: 'Error', message: 'Failed to create flow.' });
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (flowId: string, active: boolean) => {
    await updateFlow(flowId, { status: active ? 'active' : 'inactive' });
    addLog({ action: 'update', collection: 'neurofy_flows', item: flowId, user: 'Admin', meta: { status: active ? 'active' : 'inactive' } });
    addNotification({ title: active ? 'Flow Activated' : 'Flow Deactivated', message: `Flow has been ${active ? 'activated' : 'deactivated'}.` });
  };

  const handleDelete = async (flowId: string, flowName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await confirm({
      title: 'Delete Flow',
      message: `Delete flow "${flowName}"? This action cannot be undone.`,
      confirmText: 'Delete',
      severity: 'error',
    });
    if (!ok) return;
    await deleteFlow(flowId);
    addLog({ action: 'delete', collection: 'neurofy_flows', item: flowId, user: 'Admin', meta: { name: flowName } });
    addNotification({ title: 'Flow Deleted', message: `"${flowName}" has been deleted.` });
  };

  const getLastRun = (flowId: string) => {
    const log = runLogs.find(l => l.flowId === flowId);
    if (!log) return null;
    return new Date(log.timestamp);
  };

  const stats = {
    total: flows.length,
    active: flows.filter(f => f.status === 'active').length,
    operations: flows.reduce((sum, f) => sum + (f.operations?.length || 0), 0),
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', px: 3, py: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                bgcolor: alpha('#8B5CF6', 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Zap size={22} color='#8B5CF6' />
            </Box>
            <Box>
              <Typography variant='h5' fontWeight={700}>
                Flows
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Automate workflows with event-driven triggers
              </Typography>
            </Box>
          </Box>
          <Button variant='contained' startIcon={<Plus size={18} />} onClick={() => setCreateOpen(true)}>
            Create Flow
          </Button>
        </Box>

        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
          <Paper
            variant='outlined'
            sx={{
              px: 2,
              py: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              cursor: 'pointer',
              transition: 'all 200ms',
              '&:hover': { bgcolor: alpha('#8B5CF6', 0.05) },
            }}
            onClick={() => setStatusFilter('all')}
          >
            <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: alpha('#8B5CF6', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={16} color='#8B5CF6' />
            </Box>
            <Box>
              <Typography variant='h6' fontWeight={700}>{stats.total}</Typography>
              <Typography variant='caption' color='text.secondary'>Total Flows</Typography>
            </Box>
          </Paper>
          <Paper
            variant='outlined'
            sx={{
              px: 2,
              py: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              cursor: 'pointer',
              transition: 'all 200ms',
              '&:hover': { bgcolor: alpha('#22C55E', 0.05) },
            }}
            onClick={() => setStatusFilter('active')}
          >
            <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: alpha('#22C55E', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Play size={16} color='#22C55E' />
            </Box>
            <Box>
              <Typography variant='h6' fontWeight={700}>{stats.active}</Typography>
              <Typography variant='caption' color='text.secondary'>Active</Typography>
            </Box>
          </Paper>
          <Paper
            variant='outlined'
            sx={{
              px: 2,
              py: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: alpha('#F59E0B', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GitBranch size={16} color='#F59E0B' />
            </Box>
            <Box>
              <Typography variant='h6' fontWeight={700}>{stats.operations}</Typography>
              <Typography variant='caption' color='text.secondary'>Operations</Typography>
            </Box>
          </Paper>
        </Box>

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size='small'
            placeholder='Search flows...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: 280 }}
            slotProps={{
              input: {
                startAdornment: (
                  <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                    <Search size={16} />
                  </Box>
                ),
              },
            }}
          />
          <TextField
            select
            size='small'
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ width: 140 }}
          >
            <MenuItem value='all'>All Status</MenuItem>
            <MenuItem value='active'>Active</MenuItem>
            <MenuItem value='inactive'>Inactive</MenuItem>
          </TextField>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : filteredFlows.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <Zap size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
            <Typography variant='h6' color='text.secondary' gutterBottom>
              {search || statusFilter !== 'all' ? 'No flows found' : 'No flows yet'}
            </Typography>
            <Typography variant='body2' color='text.disabled' sx={{ mb: 3 }}>
              {search || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Create your first flow to get started'}
            </Typography>
            {!search && statusFilter === 'all' && (
              <Button variant='contained' startIcon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
                Create Flow
              </Button>
            )}
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {filteredFlows.map((flow) => {
              const triggerConfig = TRIGGER_CONFIG[flow.triggerType] || TRIGGER_CONFIG.manual;
              const TriggerIcon = triggerConfig.icon;
              const statusConfig = STATUS_CONFIG[flow.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.inactive;
              const StatusIcon = statusConfig.icon;
              const lastRun = getLastRun(flow.id);

              return (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={flow.id}>
                  <Paper
                    sx={{
                      p: 0,
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'all 200ms',
                      border: '1px solid',
                      borderColor: 'divider',
                      overflow: 'hidden',
                      '&:hover': {
                        borderColor: '#8B5CF6',
                        boxShadow: `0 4px 20px ${alpha('#8B5CF6', 0.15)}`,
                        transform: 'translateY(-2px)',
                      },
                    }}
                    onClick={() => router.push(`/admin/settings/flows/${flow.id}`)}
                  >
                    {/* Header */}
                    <Box sx={{ p: 2, pb: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: '10px',
                              bgcolor: triggerConfig.bgColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <TriggerIcon size={20} color={triggerConfig.color} />
                          </Box>
                          <Box>
                            <Typography variant='subtitle1' fontWeight={700} noWrap sx={{ maxWidth: 180 }}>
                              {flow.name}
                            </Typography>
                            <Typography variant='caption' color='text.secondary'>
                              {triggerConfig.label}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box onClick={(e: any) => e.stopPropagation()}>
                            <StatusToggle
                              active={flow.status === 'active'}
                              onToggle={(active) => handleToggle(flow.id, active)}
                            />
                          </Box>
                          <Tooltip title='Delete'>
                            <IconButton
                              size='small'
                              onClick={(e) => handleDelete(flow.id, flow.name, e)}
                            >
                              <Trash2 size={16} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>

                      {flow.description && (
                        <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {flow.description}
                        </Typography>
                      )}
                    </Box>

                    {/* Footer */}
                    <Box
                      sx={{
                        px: 2,
                        py: 1.5,
                        borderTop: 1,
                        borderColor: 'divider',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        bgcolor: isDark ? alpha('#fff', 0.02) : alpha('#000', 0.02),
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          icon={<GitBranch size={12} />}
                          label={`${flow.operations?.length || 0} operations`}
                          size='small'
                          variant='outlined'
                          sx={{ height: 24 }}
                        />
                      </Box>
                      {lastRun ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Clock size={12} color='#6B7280' />
                          <Typography variant='caption' color='text.secondary'>
                            {lastRun.toLocaleDateString()}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant='caption' color='text.disabled'>
                          Never run
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>

      {/* Create Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title='Create New Flow'
        subtitle='Automate workflows with event-driven triggers'
        icon={<Zap size={20} />}
        onSave={handleCreate}
        saveText='Create Flow'
        saving={creating}
        saveDisabled={!newFlow.name.trim()}
        width='sm'
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormField label='Flow Name' required>
            <TextField
              fullWidth
              value={newFlow.name}
              onChange={(e) => setNewFlow({ ...newFlow, name: e.target.value })}
              placeholder='e.g., Send Welcome Email'
              autoFocus
            />
          </FormField>
          <FormField label='Description'>
            <TextField
              fullWidth
              multiline
              rows={2}
              value={newFlow.description}
              onChange={(e) => setNewFlow({ ...newFlow, description: e.target.value })}
              placeholder='What does this flow do?'
            />
          </FormField>
          <FormField label='Trigger Type'>
            <TextField
              fullWidth
              select
              value={newFlow.triggerType}
              onChange={(e) => setNewFlow({ ...newFlow, triggerType: e.target.value })}
            >
              {Object.entries(TRIGGER_CONFIG).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <MenuItem key={key} value={key}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ width: 28, height: 28, borderRadius: '6px', bgcolor: config.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={14} color={config.color} />
                      </Box>
                      <Box>
                        <Typography variant='body2' fontWeight={600}>{config.label}</Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                );
              })}
            </TextField>
          </FormField>
        </Box>
      </Modal>
    </Box>
  );
}
