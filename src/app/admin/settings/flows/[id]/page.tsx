"use client";

import { use, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Drawer from '@mui/material/Drawer';
import { ArrowLeft, Save, Trash2, Plus, Play, Edit2, ChevronRight, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { notFound, useRouter } from 'next/navigation';
import { useFlowsStore, FlowOperation, FlowRunLog, OperationType, TriggerType } from '@/store/flows';
import { useSchemaStore } from '@/store/schema';
import { useActivityStore } from '@/store/activity';
import { useNotificationsStore } from '@/store/notifications';

const TRIGGER_INFO: Record<string, { label: string; desc: string; color: string }> = {
  hook:      { label: 'Event Hook',  desc: 'Triggered by CRUD events on collections or auth events.',         color: '#6644ff' },
  webhook:   { label: 'Webhook',     desc: 'Triggered by an incoming HTTP request to a unique endpoint.',      color: '#e67e22' },
  schedule:  { label: 'Schedule',    desc: 'Triggered on a recurring CRON schedule.',                          color: '#2ecc71' },
  operation: { label: 'Operation',   desc: 'Triggered by a "Run Flow" operation inside another flow.',         color: '#3498db' },
  manual:    { label: 'Manual',      desc: 'Triggered manually via the "Run Now" button or API call.',         color: '#9b59b6' },
};

const OPERATION_TYPES: { value: OperationType; label: string }[] = [
  { value: 'create-item',    label: 'Create Item' },
  { value: 'update-item',    label: 'Update Item' },
  { value: 'delete-item',    label: 'Delete Item' },
  { value: 'send-request',   label: 'Send Request (Webhook)' },
  { value: 'send-email',     label: 'Send Email' },
  { value: 'transform-data', label: 'Transform Data' },
  { value: 'run-flow',       label: 'Run Another Flow' },
];

const EVENT_OPTIONS = [
  'items.create', 'items.update', 'items.delete',
  'auth.login', 'auth.logout', 'server.error',
];

export default function FlowEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const flowId = resolvedParams.id;
  const router = useRouter();

  const { flows, updateFlow, deleteFlow, addOperation, updateOperation, deleteOperation, addRunLog, runLogs } = useFlowsStore();
  const { collections } = useSchemaStore();
  const { addLog } = useActivityStore();
  const { addNotification } = useNotificationsStore();

  const flow = flows.find(f => f.id === flowId);
  if (!flow) { notFound(); }

  const [activeTab, setActiveTab] = useState(0);

  // ═══ General State ═══
  const [general, setGeneral] = useState({
    name: flow.name || '',
    description: flow.description || '',
    icon: flow.icon || 'Zap',
    color: flow.color || '#6644ff',
    status: flow.status || 'inactive',
    permission: flow.permission || '$trigger',
  });

  // ═══ Trigger State ═══
  const [trigger, setTrigger] = useState({
    triggerType: flow.triggerType,
    ...flow.triggerOptions,
  });

  // ═══ Operation Dialog ═══
  const [opDialogOpen, setOpDialogOpen] = useState(false);
  const [editingOp, setEditingOp] = useState<FlowOperation | null>(null);
  const [opForm, setOpForm] = useState({ key: '', name: '', type: 'create-item' as OperationType, options: '{}' });

  // ═══ Run Detail Drawer ═══
  const [selectedRun, setSelectedRun] = useState<FlowRunLog | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'error'>('all');

  const flowLogs = runLogs
    .filter(l => l.flowId === flowId)
    .filter(l => statusFilter === 'all' || l.status === statusFilter);

  // ═══ Handlers ═══
  const handleSave = () => {
    updateFlow(flowId, {
      ...general,
      triggerType: trigger.triggerType as TriggerType,
      triggerOptions: {
        collection: trigger.collection,
        event: trigger.event,
        webhookUrl: trigger.webhookUrl,
        webhookSecret: trigger.webhookSecret,
        cronExpression: trigger.cronExpression,
        cronTimezone: trigger.cronTimezone,
        sourceFlowId: trigger.sourceFlowId,
      }
    });
    addLog({ action: 'update', collection: 'directus_flows', item: flowId, user: 'Admin User', meta: { name: general.name } });
    addNotification({ title: 'Flow Saved', message: `"${general.name}" has been updated.` });
  };

  const handleDelete = () => {
    if (confirm(`Delete flow "${flow.name}"?`)) {
      deleteFlow(flowId);
      addLog({ action: 'delete', collection: 'directus_flows', item: flowId, user: 'Admin User', meta: { name: flow.name } });
      router.push('/admin/settings/flows');
    }
  };

  const handleManualRun = () => {
    const log: FlowRunLog = {
      id: `run_${Date.now()}`,
      flowId,
      flowName: flow.name,
      triggerType: flow.triggerType,
      status: 'success',
      timestamp: new Date().toISOString(),
      duration: Math.floor(Math.random() * 500) + 50,
      operationsRun: (flow.operations || []).length,
      triggerPayload: { manual: true, user: 'Admin User' },
      accountability: { user: 'Admin User', role: 'admin' },
      operationResults: (flow.operations || []).map(op => ({ operationKey: op.key, status: 'success' as const, output: { mock: true } })),
    };
    addRunLog(log);
    addLog({ action: 'flow.run' as any, collection: 'directus_flows', item: flowId, user: 'Admin User', meta: { status: 'success', duration: log.duration } });
    addNotification({ title: 'Flow Executed', message: `"${flow.name}" ran successfully in ${log.duration}ms.` });
  };

  const openOpDialog = (op?: FlowOperation) => {
    if (op) {
      setEditingOp(op);
      setOpForm({ key: op.key, name: op.name, type: op.type, options: JSON.stringify(op.options, null, 2) });
    } else {
      setEditingOp(null);
      setOpForm({ key: '', name: '', type: 'create-item', options: '{}' });
    }
    setOpDialogOpen(true);
  };

  const handleSaveOp = () => {
    let parsedOptions: any = {};
    try { parsedOptions = JSON.parse(opForm.options); } catch { parsedOptions = {}; }
    if (editingOp) {
      updateOperation(flowId, editingOp.id, { key: opForm.key, name: opForm.name, type: opForm.type, options: parsedOptions });
      addLog({ action: 'update', collection: 'directus_operations', item: editingOp.id, user: 'Admin User', meta: { name: opForm.name } });
    } else {
      const newOp: FlowOperation = { id: `op_${Date.now()}`, key: opForm.key, name: opForm.name, type: opForm.type, options: parsedOptions };
      addOperation(flowId, newOp);
      addLog({ action: 'create', collection: 'directus_operations', item: newOp.id, user: 'Admin User', meta: { name: opForm.name, flowId } });
    }
    setOpDialogOpen(false);
  };

  const handleDeleteOp = (opId: string) => {
    if (confirm('Delete this operation?')) {
      deleteOperation(flowId, opId);
      addLog({ action: 'delete', collection: 'directus_operations', item: opId, user: 'Admin User' });
    }
  };

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => router.push('/admin/settings/flows')}><ArrowLeft size={20} /></IconButton>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: general.color }} />
          <Typography variant="h4" fontWeight={600}>{general.name}</Typography>
          <Chip label={general.status} size="small" color={general.status === 'active' ? 'success' : 'default'} />
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {flow.triggerType === 'manual' && (
            <Button variant="outlined" color="success" startIcon={<Play size={16} />} onClick={handleManualRun}>Run Now</Button>
          )}
          <Button variant="outlined" color="error" startIcon={<Trash2 size={16} />} onClick={handleDelete}>Delete</Button>
          <Button variant="contained" startIcon={<Save size={18} />} onClick={handleSave}>Save</Button>
        </Box>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={activeTab} onChange={(_, nv) => setActiveTab(nv)}>
          <Tab label="General" />
          <Tab label="Trigger" />
          <Tab label={`Operations (${(flow.operations || []).length})`} />
          <Tab label={`Run History (${flowLogs.length})`} />
        </Tabs>
      </Box>

      {/* ═══ TAB: General ═══ */}
      {activeTab === 0 && (
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} mb={3}>Flow Configuration</Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="Name" value={general.name} onChange={e => setGeneral({ ...general, name: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="Icon (Lucide name)" value={general.icon} onChange={e => setGeneral({ ...general, icon: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField fullWidth multiline rows={3} label="Description" value={general.description} onChange={e => setGeneral({ ...general, description: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <TextField fullWidth label="Color" value={general.color} onChange={e => setGeneral({ ...general, color: e.target.value })} />
                    <Box sx={{ width: 56, height: 56, borderRadius: 1, bgcolor: general.color, flexShrink: 0, border: '2px solid', borderColor: 'divider' }} />
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControlLabel
                    control={<Switch checked={general.status === 'active'} onChange={e => setGeneral({ ...general, status: e.target.checked ? 'active' : 'inactive' })} />}
                    label={general.status === 'active' ? 'Active' : 'Inactive'}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField select fullWidth label="Permission" value={general.permission} onChange={e => setGeneral({ ...general, permission: e.target.value })}>
                    <MenuItem value="$public">$public — Anyone</MenuItem>
                    <MenuItem value="$trigger">$trigger — Triggering User</MenuItem>
                    <MenuItem value="$full">$full — Full Access</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} mb={2}>Metadata</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box><Typography variant="caption" color="text.secondary">Created</Typography><Typography variant="body2">{new Date(flow.dateCreated).toLocaleString()}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Created By</Typography><Typography variant="body2">{flow.userCreated}</Typography></Box>
                <Divider />
                <Box><Typography variant="caption" color="text.secondary">Last Updated</Typography><Typography variant="body2">{new Date(flow.dateUpdated).toLocaleString()}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Updated By</Typography><Typography variant="body2">{flow.userUpdated}</Typography></Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* ═══ TAB: Trigger ═══ */}
      {activeTab === 1 && (
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} mb={2}>Trigger Type</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {(Object.keys(TRIGGER_INFO) as TriggerType[]).map(t => {
                  const info = TRIGGER_INFO[t];
                  const isSelected = trigger.triggerType === t;
                  return (
                    <Paper
                      key={t}
                      variant="outlined"
                      onClick={() => setTrigger({ ...trigger, triggerType: t })}
                      sx={{
                        p: 2, cursor: 'pointer',
                        border: '2px solid', borderColor: isSelected ? info.color : 'divider',
                        bgcolor: isSelected ? `${info.color}10` : 'transparent',
                        transition: 'all 0.2s',
                      }}
                    >
                      <Typography variant="body2" fontWeight={600} sx={{ color: isSelected ? info.color : 'text.primary' }}>{info.label}</Typography>
                      <Typography variant="caption" color="text.secondary">{info.desc}</Typography>
                    </Paper>
                  );
                })}
              </Box>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} mb={3}>Trigger Configuration</Typography>

              {trigger.triggerType === 'hook' && (
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField select fullWidth label="Collection" value={trigger.collection || ''} onChange={e => setTrigger({ ...trigger, collection: e.target.value })}>
                      {Object.keys(collections).map(c => <MenuItem key={c} value={c}>{collections[c].label}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField select fullWidth label="Event" value={trigger.event || ''} onChange={e => setTrigger({ ...trigger, event: e.target.value })}>
                      {EVENT_OPTIONS.map(ev => <MenuItem key={ev} value={ev}>{ev}</MenuItem>)}
                    </TextField>
                  </Grid>
                </Grid>
              )}

              {trigger.triggerType === 'webhook' && (
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12 }}>
                    <TextField fullWidth label="Webhook Endpoint" value={`/api/flows/webhook/${flowId}`} disabled helperText="This URL is auto-generated and unique to this flow." />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField fullWidth label="Secret / Token" value={trigger.webhookSecret || ''} onChange={e => setTrigger({ ...trigger, webhookSecret: e.target.value })} helperText="Used for request validation." />
                  </Grid>
                </Grid>
              )}

              {trigger.triggerType === 'schedule' && (
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="CRON Expression" value={trigger.cronExpression || ''} onChange={e => setTrigger({ ...trigger, cronExpression: e.target.value })} helperText="e.g. 0 0 * * * (every midnight)" />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField select fullWidth label="Timezone" value={trigger.cronTimezone || 'UTC'} onChange={e => setTrigger({ ...trigger, cronTimezone: e.target.value })}>
                      {['UTC', 'Asia/Tehran', 'America/New_York', 'Europe/London', 'Europe/Berlin'].map(tz => <MenuItem key={tz} value={tz}>{tz}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
                      <Typography variant="caption" color="text.secondary">Next Execution Preview</Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {trigger.cronExpression ? `Scheduled: ${trigger.cronExpression} (${trigger.cronTimezone || 'UTC'})` : 'Enter a CRON expression to see next run.'}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              )}

              {trigger.triggerType === 'operation' && (
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12 }}>
                    <TextField select fullWidth label="Source Flow" value={trigger.sourceFlowId || ''} onChange={e => setTrigger({ ...trigger, sourceFlowId: e.target.value })}>
                      {flows.filter(f => f.id !== flowId).map(f => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="body2" color="text.secondary">This flow will be executed when a &quot;Run Flow&quot; operation in the source flow targets it.</Typography>
                  </Grid>
                </Grid>
              )}

              {trigger.triggerType === 'manual' && (
                <Box>
                  <Typography variant="body2" color="text.secondary" mb={2}>This flow can be executed manually using the &quot;Run Now&quot; button in the toolbar, or via the API.</Typography>
                  <Button variant="outlined" color="success" startIcon={<Play size={16} />} onClick={handleManualRun}>Run Now</Button>
                </Box>
              )}

              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle2" fontWeight={600} mb={1}>Trigger Payload Preview (read-only)</Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: '#1a1a2e', borderRadius: 1 }}>
                <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace', color: '#a0a0c0', whiteSpace: 'pre-wrap', m: 0 }}>
{`{
  "$trigger": { /* incoming data from trigger */ },
  "$accountability": {
    "user": "current_user_id",
    "role": "current_role",
    "ip": "127.0.0.1"
  }
}`}
                </Typography>
              </Paper>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* ═══ TAB: Operations ═══ */}
      {activeTab === 2 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6" fontWeight={600}>Operations Pipeline</Typography>
            <Button variant="outlined" startIcon={<Plus size={16} />} onClick={() => openOpDialog()}>Add Operation</Button>
          </Box>

          {(flow.operations || []).length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <Typography color="text.secondary" mb={2}>No operations configured yet.</Typography>
              <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => openOpDialog()}>Add First Operation</Button>
            </Paper>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {(flow.operations || []).map((op, idx) => (
                <Box key={op.id}>
                  <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Chip label={`#${idx + 1}`} size="small" sx={{ fontWeight: 700 }} />
                        <Box>
                          <Typography variant="body1" fontWeight={600}>{op.name}</Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                            <Chip label={op.type} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: 11 }} />
                            <Chip label={`key: ${op.key}`} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: 11 }} />
                          </Box>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton size="small" onClick={() => openOpDialog(op)}><Edit2 size={16} /></IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteOp(op.id)}><Trash2 size={16} /></IconButton>
                      </Box>
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="caption" color="text.secondary">Options:</Typography>
                    <Paper variant="outlined" sx={{ p: 1.5, mt: 0.5, bgcolor: '#1a1a2e', borderRadius: 1 }}>
                      <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace', color: '#a0a0c0', whiteSpace: 'pre-wrap', m: 0, fontSize: 11 }}>
                        {JSON.stringify(op.options, null, 2)}
                      </Typography>
                    </Paper>
                  </Paper>
                  {idx < (flow.operations || []).length - 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Box sx={{ width: 2, height: 16, bgcolor: 'divider' }} />
                        <ChevronRight size={16} style={{ transform: 'rotate(90deg)', color: '#666' }} />
                        <Box sx={{ width: 2, height: 16, bgcolor: 'divider' }} />
                      </Box>
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* ═══ TAB: Run History ═══ */}
      {activeTab === 3 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>Execution Logs</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {(['all', 'success', 'error'] as const).map(s => (
                <Chip
                  key={s}
                  label={s === 'all' ? 'All' : s}
                  size="small"
                  onClick={() => setStatusFilter(s)}
                  variant={statusFilter === s ? 'filled' : 'outlined'}
                  color={s === 'success' ? 'success' : s === 'error' ? 'error' : 'default'}
                  sx={{ textTransform: 'capitalize', cursor: 'pointer' }}
                />
              ))}
            </Box>
          </Box>

          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Trigger</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Duration</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Ops Run</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {flowLogs.map(log => (
                  <TableRow key={log.id} hover sx={{ cursor: 'pointer' }} onClick={() => setSelectedRun(log)}>
                    <TableCell><Typography variant="body2">{new Date(log.timestamp).toLocaleString()}</Typography></TableCell>
                    <TableCell><Chip label={TRIGGER_INFO[log.triggerType]?.label || log.triggerType} size="small" variant="outlined" /></TableCell>
                    <TableCell>
                      <Chip
                        icon={log.status === 'success' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                        label={log.status}
                        size="small"
                        color={log.status === 'success' ? 'success' : 'error'}
                      />
                    </TableCell>
                    <TableCell><Typography variant="body2">{log.duration}ms</Typography></TableCell>
                    <TableCell><Typography variant="body2">{log.operationsRun}</Typography></TableCell>
                    <TableCell><ChevronRight size={16} /></TableCell>
                  </TableRow>
                ))}
                {flowLogs.length === 0 && (
                  <TableRow><TableCell colSpan={6}><Typography color="text.secondary" textAlign="center" py={4}>No runs recorded yet.</Typography></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* ═══ Operation Editor Dialog ═══ */}
      <Dialog open={opDialogOpen} onClose={() => setOpDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingOp ? 'Edit' : 'Add'} Operation</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3} sx={{ pt: 1 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label="Key (identifier)" value={opForm.key} onChange={e => setOpForm({ ...opForm, key: e.target.value })} helperText="e.g. create_order" disabled={!!editingOp} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label="Name" value={opForm.name} onChange={e => setOpForm({ ...opForm, name: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField select fullWidth label="Type" value={opForm.type} onChange={e => setOpForm({ ...opForm, type: e.target.value as OperationType })}>
                {OPERATION_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" fontWeight={600} mb={1}>Options (JSON)</Typography>
              <TextField
                fullWidth
                multiline
                rows={10}
                value={opForm.options}
                onChange={e => setOpForm({ ...opForm, options: e.target.value })}
                sx={{ '& textarea': { fontFamily: 'monospace', fontSize: 13 } }}
                helperText="Configure the operation parameters. Use {{$trigger.field}} for dynamic values."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpDialogOpen(false)} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleSaveOp} disabled={!opForm.key || !opForm.name}>{editingOp ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </Dialog>

      {/* ═══ Run Detail Drawer ═══ */}
      <Drawer anchor="right" open={!!selectedRun} onClose={() => setSelectedRun(null)} PaperProps={{ sx: { width: { xs: '100%', sm: 480 } } }}>
        {selectedRun && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" fontWeight={600}>Run Details</Typography>
              <Chip icon={selectedRun.status === 'success' ? <CheckCircle2 size={14} /> : <XCircle size={14} />} label={selectedRun.status} color={selectedRun.status === 'success' ? 'success' : 'error'} />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', gap: 4 }}>
                <Box><Typography variant="caption" color="text.secondary">Date</Typography><Typography variant="body2">{new Date(selectedRun.timestamp).toLocaleString()}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Duration</Typography><Typography variant="body2">{selectedRun.duration}ms</Typography></Box>
              </Box>
            </Box>

            <Typography variant="subtitle2" fontWeight={600} mb={1}>$trigger Payload</Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: '#1a1a2e', borderRadius: 1 }}>
              <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace', color: '#a0a0c0', whiteSpace: 'pre-wrap', m: 0, fontSize: 12 }}>
                {JSON.stringify(selectedRun.triggerPayload, null, 2)}
              </Typography>
            </Paper>

            {selectedRun.accountability && (
              <>
                <Typography variant="subtitle2" fontWeight={600} mb={1}>$accountability</Typography>
                <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: '#1a1a2e', borderRadius: 1 }}>
                  <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace', color: '#a0a0c0', whiteSpace: 'pre-wrap', m: 0, fontSize: 12 }}>
                    {JSON.stringify(selectedRun.accountability, null, 2)}
                  </Typography>
                </Paper>
              </>
            )}

            <Typography variant="subtitle2" fontWeight={600} mb={1}>Operation Results</Typography>
            {selectedRun.operationResults?.map((r, i) => (
              <Paper key={i} variant="outlined" sx={{ p: 2, mb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>{r.operationKey}</Typography>
                  <Chip label={r.status} size="small" color={r.status === 'success' ? 'success' : 'error'} />
                </Box>
                {r.output && (
                  <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace', color: 'text.secondary', whiteSpace: 'pre-wrap', m: 0 }}>
                    {JSON.stringify(r.output, null, 2)}
                  </Typography>
                )}
                {r.error && <Typography variant="caption" color="error">{r.error}</Typography>}
              </Paper>
            ))}

            {selectedRun.errorMessage && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'error.main', borderRadius: 1, color: 'white' }}>
                <Typography variant="body2" fontWeight={600}>Error</Typography>
                <Typography variant="body2">{selectedRun.errorMessage}</Typography>
              </Box>
            )}
          </Box>
        )}
      </Drawer>
    </Box>
  );
}
