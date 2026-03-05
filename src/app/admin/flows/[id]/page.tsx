"use client";

import { use, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import { useFlowsStore, Flow, TriggerType, OperationType } from '@/store/flows';
import { useRouter } from 'next/navigation';
import { Check, X, Plus, Trash2 } from 'lucide-react';

export default function FlowEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { id } = resolvedParams;
  const isNew = id === 'new';

  const store = useFlowsStore();
  const existingFlow = store.flows.find(f => f.id === id);

  const [flow, setFlow] = useState<Flow>(existingFlow || {
    id: `flow_${Date.now()}`,
    name: '',
    description: '',
    icon: 'Play',
    color: '#6644ff',
    status: 'active',
    triggerType: 'hook',
    triggerOptions: { collection: 'products', event: 'items.create' },
    permission: '$trigger',
    operations: [],
    dateCreated: new Date().toISOString(),
    userCreated: 'Admin User',
    dateUpdated: new Date().toISOString(),
    userUpdated: 'Admin User',
  });

  const handleSave = () => {
    if (isNew) {
      store.addFlow(flow);
    } else {
      store.updateFlow(id, flow);
    }
    router.push('/admin/settings/flows');
  };

  const addOp = () => {
    setFlow(prev => ({
      ...prev,
      operations: [
        ...prev.operations,
        { id: `op_${Date.now()}`, key: `step_${prev.operations.length + 1}`, name: 'New Operation', type: 'create-item' as OperationType, options: {} }
      ]
    }));
  };

  const removeOp = (opId: string) => {
    setFlow(prev => ({
      ...prev,
      operations: prev.operations.filter(o => o.id !== opId)
    }));
  };

  const updateOp = (opId: string, updates: any) => {
    setFlow(prev => ({
      ...prev,
      operations: prev.operations.map(o => o.id === opId ? { ...o, ...updates } : o)
    }));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight={600}>{isNew ? 'Create Flow' : `Edit: ${flow.name}`}</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" color="inherit" onClick={() => router.back()} startIcon={<X size={18} />}>Cancel</Button>
          <Button variant="contained" startIcon={<Check size={18} />} onClick={handleSave} disabled={!flow.name}>Save</Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 4, flexGrow: 1, overflow: 'auto' }}>
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 800 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>General</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}><TextField fullWidth label="Flow Name" value={flow.name} onChange={e => setFlow({ ...flow, name: e.target.value })} required /></Grid>
              <Grid size={{ xs: 12 }}><TextField fullWidth multiline rows={2} label="Description" value={flow.description} onChange={e => setFlow({ ...flow, description: e.target.value })} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Icon" value={flow.icon} onChange={e => setFlow({ ...flow, icon: e.target.value })} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Color" value={flow.color} onChange={e => setFlow({ ...flow, color: e.target.value })} type="color" /></Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>Trigger</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField select fullWidth label="Trigger Type" value={flow.triggerType} onChange={e => setFlow({ ...flow, triggerType: e.target.value as TriggerType })}>
                  <MenuItem value="hook">Event Hook</MenuItem>
                  <MenuItem value="webhook">Webhook</MenuItem>
                  <MenuItem value="schedule">Schedule (CRON)</MenuItem>
                  <MenuItem value="operation">Operation</MenuItem>
                  <MenuItem value="manual">Manual</MenuItem>
                </TextField>
              </Grid>
              {flow.triggerType === 'hook' && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="Collection" value={flow.triggerOptions.collection || ''} onChange={e => setFlow({ ...flow, triggerOptions: { ...flow.triggerOptions, collection: e.target.value } })} />
                </Grid>
              )}
            </Grid>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>Operations</Typography>
              <Button size="small" variant="outlined" startIcon={<Plus size={16} />} onClick={addOp}>Add</Button>
            </Box>
            {flow.operations.length === 0 ? (
              <Typography color="text.secondary" align="center" py={2}>No operations.</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {flow.operations.map((op, idx) => (
                  <Paper key={op.id} variant="outlined" sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: 'text.secondary', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'background.paper', fontSize: 14, fontWeight: 'bold' }}>{idx + 1}</Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField fullWidth size="small" label="Name" value={op.name} onChange={e => updateOp(op.id, { name: e.target.value })} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField select fullWidth size="small" label="Type" value={op.type} onChange={e => updateOp(op.id, { type: e.target.value })}>
                            <MenuItem value="create-item">Create Item</MenuItem>
                            <MenuItem value="update-item">Update Item</MenuItem>
                            <MenuItem value="delete-item">Delete Item</MenuItem>
                            <MenuItem value="send-request">Send Request</MenuItem>
                            <MenuItem value="send-email">Send Email</MenuItem>
                            <MenuItem value="transform-data">Transform Data</MenuItem>
                            <MenuItem value="run-flow">Run Flow</MenuItem>
                          </TextField>
                        </Grid>
                      </Grid>
                    </Box>
                    <IconButton color="error" size="small" onClick={() => removeOp(op.id)}><Trash2 size={18} /></IconButton>
                  </Paper>
                ))}
              </Box>
            )}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
