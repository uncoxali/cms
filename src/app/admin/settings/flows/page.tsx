"use client";

import { useEffect } from 'react';
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
import Switch from '@mui/material/Switch';
import { useRouter } from 'next/navigation';
import { useFlowsStore } from '@/store/flows';
import { useActivityStore } from '@/store/activity';
import { useNotificationsStore } from '@/store/notifications';
import { Plus, Zap } from 'lucide-react';

const TRIGGER_LABELS: Record<string, { label: string; color: string }> = {
  hook: { label: 'Event Hook', color: '#6644ff' },
  webhook: { label: 'Webhook', color: '#e67e22' },
  schedule: { label: 'Schedule', color: '#2ecc71' },
  operation: { label: 'Operation', color: '#3498db' },
  manual: { label: 'Manual', color: '#9b59b6' },
};

export default function FlowsListPage() {
  const router = useRouter();
  const { flows, runLogs, updateFlow, addFlow, fetchFlows } = useFlowsStore();
  const { addLog } = useActivityStore();
  const { addNotification } = useNotificationsStore();

  useEffect(() => { fetchFlows(); }, [fetchFlows]);

  const handleCreate = () => {
    const newFlow = {
      id: `flow_${Date.now()}`,
      name: 'New Flow',
      description: '',
      icon: 'Zap',
      color: '#6644ff',
      status: 'inactive' as const,
      triggerType: 'manual' as const,
      triggerOptions: {},
      permission: '$trigger',
      operations: [],
      dateCreated: new Date().toISOString(),
      userCreated: 'Admin User',
      dateUpdated: new Date().toISOString(),
      userUpdated: 'Admin User',
    };
    addFlow(newFlow);
    addLog({ action: 'create', collection: 'neurofy_flows', item: newFlow.id, user: 'Admin User', meta: { name: newFlow.name } });
    router.push(`/admin/settings/flows/${newFlow.id}`);
  };

  const handleToggle = (flowId: string, active: boolean) => {
    updateFlow(flowId, { status: active ? 'active' : 'inactive' });
    addLog({ action: 'update', collection: 'neurofy_flows', item: flowId, user: 'Admin User', meta: { status: active ? 'active' : 'inactive' } });
    addNotification({ title: active ? 'Flow Activated' : 'Flow Deactivated', message: `Flow has been ${active ? 'activated' : 'deactivated'}.` });
  };

  const getLastRun = (flowId: string) => {
    const log = runLogs.find(l => l.flowId === flowId);
    if (!log) return '—';
    return new Date(log.timestamp).toLocaleString();
  };

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={600} display="flex" alignItems="center" gap={1}>
            <Zap size={28} /> Flows & Automations
          </Typography>
          <Typography variant="body2" color="text.secondary">Create and manage event-driven automation workflows.</Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={handleCreate}>New Flow</Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Trigger</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Operations</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Last Run</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Active</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {flows.map(flow => {
              const trigger = TRIGGER_LABELS[flow.triggerType] || { label: flow.triggerType, color: '#888' };
              return (
                <TableRow
                  key={flow.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => router.push(`/admin/settings/flows/${flow.id}`)}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: flow.color, flexShrink: 0 }} />
                      <Typography variant="body2" fontWeight={600}>{flow.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 250 }}>{flow.description || '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={trigger.label} size="small" sx={{ bgcolor: `${trigger.color}20`, color: trigger.color, fontWeight: 600 }} />
                  </TableCell>
                  <TableCell align="center">{(flow.operations || []).length}</TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">{getLastRun(flow.id)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={flow.status} size="small" color={flow.status === 'active' ? 'success' : 'default'} />
                  </TableCell>
                  <TableCell align="right" onClick={e => e.stopPropagation()}>
                    <Switch checked={flow.status === 'active'} onChange={(e) => handleToggle(flow.id, e.target.checked)} size="small" />
                  </TableCell>
                </TableRow>
              );
            })}
            {flows.length === 0 && (
              <TableRow><TableCell colSpan={7}><Typography color="text.secondary" textAlign="center" py={4}>No flows configured yet.</Typography></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
