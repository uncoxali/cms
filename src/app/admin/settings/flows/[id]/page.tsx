"use client";

import { use, useState, useCallback, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import Tooltip from '@mui/material/Tooltip';
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
import { alpha, useTheme } from '@mui/material/styles';
import {
  ArrowLeft, Save, Trash2, Plus, Play, Edit2, Settings, Zap,
  ChevronRight, CheckCircle2, XCircle, Clock, Activity, History,
  Webhook, CalendarClock, MousePointerClick, GitBranch, Mail, Code,
  Send, RefreshCw, Database, FileEdit, FileX, ArrowDown,
} from 'lucide-react';
import { notFound, useRouter } from 'next/navigation';
import { useFlowsStore, FlowOperation, FlowRunLog, OperationType, TriggerType } from '@/store/flows';
import { useSchemaStore } from '@/store/schema';
import { useActivityStore } from '@/store/activity';
import { useNotificationsStore } from '@/store/notifications';
import { useConfirm } from '@/components/admin/ConfirmDialog';

const TRIGGER_INFO: Record<string, { label: string; desc: string; color: string; icon: any }> = {
  hook:      { label: 'Event Hook',  desc: 'Triggered by CRUD events on collections.',          color: '#6644ff', icon: Zap },
  webhook:   { label: 'Webhook',     desc: 'Triggered by an incoming HTTP request.',             color: '#e67e22', icon: Webhook },
  schedule:  { label: 'Schedule',    desc: 'Triggered on a CRON schedule.',                      color: '#2ecc71', icon: CalendarClock },
  operation: { label: 'Operation',   desc: 'Triggered by another flow.',                         color: '#3498db', icon: GitBranch },
  manual:    { label: 'Manual',      desc: 'Triggered manually via button or API.',              color: '#9b59b6', icon: MousePointerClick },
};

const OPERATION_META: Record<string, { label: string; color: string; icon: any }> = {
  'create-item':    { label: 'Create Item',       color: '#27ae60', icon: Database },
  'update-item':    { label: 'Update Item',        color: '#2980b9', icon: FileEdit },
  'delete-item':    { label: 'Delete Item',        color: '#e74c3c', icon: FileX },
  'send-request':   { label: 'Send Request',       color: '#e67e22', icon: Send },
  'send-email':     { label: 'Send Email',         color: '#8e44ad', icon: Mail },
  'transform-data': { label: 'Transform Data',     color: '#16a085', icon: Code },
  'run-flow':       { label: 'Run Flow',           color: '#2c3e50', icon: RefreshCw },
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
  const theme = useTheme();

  const { flows, updateFlow, deleteFlow, addOperation, updateOperation, deleteOperation, addRunLog, runLogs } = useFlowsStore();
  const { collections } = useSchemaStore();
  const { addLog } = useActivityStore();
  const { addNotification } = useNotificationsStore();
  const confirm = useConfirm();

  const flow = flows.find(f => f.id === flowId);
  if (!flow) { notFound(); }

  // Panel state: which panel is open on the right
  type PanelMode = 'none' | 'trigger' | 'operation' | 'settings' | 'history';
  const [panelMode, setPanelMode] = useState<PanelMode>('none');
  const [editingOp, setEditingOp] = useState<FlowOperation | null>(null);

  // General settings
  const [general, setGeneral] = useState({
    name: flow.name || '',
    description: flow.description || '',
    icon: flow.icon || 'Zap',
    color: flow.color || '#6644ff',
    status: flow.status || 'inactive',
    permission: flow.permission || '$trigger',
  });

  // Trigger state
  const [trigger, setTrigger] = useState<any>({
    triggerType: flow.triggerType,
    ...flow.triggerOptions,
  });

  // Operation form
  const [opForm, setOpForm] = useState({ key: '', name: '', type: 'create-item' as OperationType, options: '{}' });

  // New operation dialog
  const [addOpDialogOpen, setAddOpDialogOpen] = useState(false);
  const [insertAfterIdx, setInsertAfterIdx] = useState(-1);

  // Run History
  const [selectedRun, setSelectedRun] = useState<FlowRunLog | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'error'>('all');
  const flowLogs = runLogs
    .filter(l => l.flowId === flowId)
    .filter(l => statusFilter === 'all' || l.status === statusFilter);

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
    addLog({ action: 'update', collection: 'neurofy_flows', item: flowId, user: 'Admin User', meta: { name: general.name } });
    addNotification({ title: 'Flow Saved', message: `"${general.name}" has been updated.` });
  };

  const handleDelete = async () => {
    const ok = await confirm({ title: 'Delete Flow', message: `Delete flow "${flow.name}"? All operations and history will be lost.`, confirmText: 'Delete Flow', severity: 'error' });
    if (!ok) return;
    deleteFlow(flowId);
    addLog({ action: 'delete', collection: 'neurofy_flows', item: flowId, user: 'Admin User', meta: { name: flow.name } });
    router.push('/admin/settings/flows');
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
    addLog({ action: 'flow.run' as any, collection: 'neurofy_flows', item: flowId, user: 'Admin User', meta: { status: 'success', duration: log.duration } });
    addNotification({ title: 'Flow Executed', message: `"${flow.name}" ran successfully in ${log.duration}ms.` });
  };

  const openTriggerPanel = () => { setPanelMode('trigger'); setEditingOp(null); };
  const openOperationPanel = (op: FlowOperation) => { setEditingOp(op); setOpForm({ key: op.key, name: op.name, type: op.type, options: JSON.stringify(op.options, null, 2) }); setPanelMode('operation'); };
  const openSettingsPanel = () => { setPanelMode('settings'); setEditingOp(null); };
  const openHistoryPanel = () => { setPanelMode('history'); setEditingOp(null); };
  const closePanel = () => { setPanelMode('none'); setEditingOp(null); };

  const handleOpenAddOp = (afterIdx: number) => {
    setInsertAfterIdx(afterIdx);
    setOpForm({ key: '', name: '', type: 'create-item', options: '{}' });
    setAddOpDialogOpen(true);
  };

  const handleAddOp = () => {
    let parsedOptions: any = {};
    try { parsedOptions = JSON.parse(opForm.options); } catch { parsedOptions = {}; }
    const newOp: FlowOperation = { id: `op_${Date.now()}`, key: opForm.key, name: opForm.name, type: opForm.type, options: parsedOptions };
    addOperation(flowId, newOp);
    addLog({ action: 'create', collection: 'neurofy_operations', item: newOp.id, user: 'Admin User', meta: { name: opForm.name, flowId } });
    setAddOpDialogOpen(false);
  };

  const handleSaveOp = () => {
    if (!editingOp) return;
    let parsedOptions: any = {};
    try { parsedOptions = JSON.parse(opForm.options); } catch { parsedOptions = {}; }
    updateOperation(flowId, editingOp.id, { key: opForm.key, name: opForm.name, type: opForm.type, options: parsedOptions });
    addLog({ action: 'update', collection: 'neurofy_operations', item: editingOp.id, user: 'Admin User', meta: { name: opForm.name } });
    addNotification({ title: 'Operation Updated', message: `"${opForm.name}" has been updated.` });
  };

  const handleDeleteOp = async (opId: string) => {
    const ok = await confirm({ title: 'Delete Operation', message: 'Remove this operation from the flow?', confirmText: 'Delete', severity: 'warning' });
    if (!ok) return;
    deleteOperation(flowId, opId);
    if (editingOp?.id === opId) closePanel();
    addLog({ action: 'delete', collection: 'neurofy_operations', item: opId, user: 'Admin User' });
  };

  const triggerMeta = TRIGGER_INFO[flow.triggerType] || TRIGGER_INFO.manual;
  const TriggerIcon = triggerMeta.icon;
  const isDark = theme.palette.mode === 'dark';

  const NODE_W = 280;
  const NODE_H = 80;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* ── Top Bar ── */}
      <Paper
        elevation={0}
        sx={{
          px: 3, py: 1.5,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid', borderColor: 'divider',
          bgcolor: 'background.paper', flexShrink: 0, zIndex: 10,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => router.push('/admin/settings/flows')} size="small"><ArrowLeft size={20} /></IconButton>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: general.color }} />
          <Typography variant="h6" fontWeight={700}>{general.name}</Typography>
          <Chip label={general.status} size="small" color={general.status === 'active' ? 'success' : 'default'} sx={{ fontWeight: 600 }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Tooltip title="Settings"><IconButton size="small" onClick={openSettingsPanel}><Settings size={18} /></IconButton></Tooltip>
          <Tooltip title="Run History"><IconButton size="small" onClick={openHistoryPanel}><History size={18} /></IconButton></Tooltip>
          {flow.triggerType === 'manual' && (
            <Button variant="outlined" color="success" size="small" startIcon={<Play size={14} />} onClick={handleManualRun}>Run</Button>
          )}
          <Button variant="outlined" color="error" size="small" startIcon={<Trash2 size={14} />} onClick={handleDelete}>Delete</Button>
          <Button variant="contained" size="small" startIcon={<Save size={14} />} onClick={handleSave}>Save</Button>
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {/* ── Flowchart Canvas ── */}
        <Box
          sx={{
            flexGrow: 1, overflow: 'auto', position: 'relative',
            bgcolor: isDark ? '#0d1117' : '#f0f2f5',
            backgroundImage: isDark
              ? 'radial-gradient(circle, #21262d 1px, transparent 1px)'
              : 'radial-gradient(circle, #d0d7de 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            pt: 6, pb: 10,
          }}
        >
          {/* ── Trigger Node ── */}
          <Box
            onClick={openTriggerPanel}
            sx={{
              width: NODE_W, minHeight: NODE_H,
              bgcolor: 'background.paper',
              border: '2px solid',
              borderColor: panelMode === 'trigger' ? triggerMeta.color : 'divider',
              borderRadius: 3,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 2,
              px: 2.5, py: 2,
              boxShadow: panelMode === 'trigger'
                ? `0 0 0 3px ${alpha(triggerMeta.color, 0.25)}`
                : '0 2px 8px rgba(0,0,0,0.08)',
              transition: 'all 0.2s',
              '&:hover': { borderColor: triggerMeta.color, transform: 'translateY(-1px)', boxShadow: `0 4px 16px rgba(0,0,0,0.12)` },
            }}
          >
            <Box sx={{
              width: 44, height: 44, borderRadius: 2,
              bgcolor: alpha(triggerMeta.color, 0.12),
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <TriggerIcon size={22} color={triggerMeta.color} />
            </Box>
            <Box sx={{ overflow: 'hidden' }}>
              <Typography variant="caption" sx={{ color: triggerMeta.color, fontWeight: 700, textTransform: 'uppercase', fontSize: 10, letterSpacing: 1 }}>
                Trigger
              </Typography>
              <Typography variant="body2" fontWeight={600} noWrap>{triggerMeta.label}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: 11 }}>
                {flow.triggerType === 'hook' && flow.triggerOptions?.collection
                  ? `${flow.triggerOptions.event || 'event'} on ${flow.triggerOptions.collection}`
                  : triggerMeta.desc}
              </Typography>
            </Box>
          </Box>

          {/* ── Connector + Add button after trigger ── */}
          <FlowConnector onAdd={() => handleOpenAddOp(-1)} color={triggerMeta.color} />

          {/* ── Operation Nodes ── */}
          {(flow.operations || []).map((op, idx) => {
            const meta = OPERATION_META[op.type] || { label: op.type, color: '#888', icon: Code };
            const OpIcon = meta.icon;
            const isSelected = panelMode === 'operation' && editingOp?.id === op.id;

            return (
              <Box key={op.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box
                  onClick={() => openOperationPanel(op)}
                  sx={{
                    width: NODE_W, minHeight: NODE_H,
                    bgcolor: 'background.paper',
                    border: '2px solid',
                    borderColor: isSelected ? meta.color : 'divider',
                    borderRadius: 3,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 2,
                    px: 2.5, py: 2,
                    position: 'relative',
                    boxShadow: isSelected
                      ? `0 0 0 3px ${alpha(meta.color, 0.25)}`
                      : '0 2px 8px rgba(0,0,0,0.08)',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: meta.color, transform: 'translateY(-1px)', boxShadow: `0 4px 16px rgba(0,0,0,0.12)` },
                  }}
                >
                  <Box sx={{
                    width: 44, height: 44, borderRadius: 2,
                    bgcolor: alpha(meta.color, 0.12),
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <OpIcon size={22} color={meta.color} />
                  </Box>
                  <Box sx={{ overflow: 'hidden', flexGrow: 1 }}>
                    <Typography variant="caption" sx={{ color: meta.color, fontWeight: 700, textTransform: 'uppercase', fontSize: 10, letterSpacing: 1 }}>
                      {meta.label}
                    </Typography>
                    <Typography variant="body2" fontWeight={600} noWrap>{op.name}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: 11, fontFamily: 'monospace' }}>
                      key: {op.key}
                    </Typography>
                  </Box>
                  <Chip label={`#${idx + 1}`} size="small" sx={{ position: 'absolute', top: -10, right: 12, fontWeight: 700, fontSize: 11, bgcolor: meta.color, color: '#fff' }} />
                </Box>

                {/* Connector after each operation */}
                <FlowConnector onAdd={() => handleOpenAddOp(idx)} color={meta.color} />
              </Box>
            );
          })}

          {/* ── End Node ── */}
          <Box sx={{
            width: 120, height: 40,
            bgcolor: isDark ? '#21262d' : '#e2e5e9',
            borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px dashed', borderColor: 'divider',
          }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>END</Typography>
          </Box>
        </Box>

        {/* ── Right Side Panel ── */}
        {panelMode !== 'none' && (
          <Paper
            elevation={4}
            sx={{
              width: { xs: '100%', md: 420 }, flexShrink: 0,
              borderLeft: '1px solid', borderColor: 'divider',
              overflow: 'auto', display: 'flex', flexDirection: 'column',
            }}
          >
            {/* ── TRIGGER PANEL ── */}
            {panelMode === 'trigger' && (
              <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" fontWeight={700}>Trigger Configuration</Typography>
                  <IconButton size="small" onClick={closePanel}><XCircle size={18} /></IconButton>
                </Box>

                <TextField
                  select fullWidth label="Trigger Type" value={trigger.triggerType}
                  onChange={e => setTrigger({ ...trigger, triggerType: e.target.value })}
                >
                  {Object.entries(TRIGGER_INFO).map(([key, info]) => (
                    <MenuItem key={key} value={key}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: info.color }} />
                        {info.label}
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>

                <Divider />

                {trigger.triggerType === 'hook' && (
                  <>
                    <TextField
                      select fullWidth label="Collection" value={trigger.collection || ''}
                      onChange={e => setTrigger({ ...trigger, collection: e.target.value })}
                    >
                      {Object.keys(collections).map(c => <MenuItem key={c} value={c}>{collections[c].label}</MenuItem>)}
                    </TextField>
                    <TextField
                      select fullWidth label="Event" value={trigger.event || ''}
                      onChange={e => setTrigger({ ...trigger, event: e.target.value })}
                    >
                      {EVENT_OPTIONS.map(ev => <MenuItem key={ev} value={ev}>{ev}</MenuItem>)}
                    </TextField>
                  </>
                )}

                {trigger.triggerType === 'webhook' && (
                  <>
                    <TextField fullWidth label="Webhook Endpoint" value={`/api/flows/webhook/${flowId}`} disabled helperText="Auto-generated unique URL." />
                    <TextField fullWidth label="Secret / Token" value={trigger.webhookSecret || ''} onChange={e => setTrigger({ ...trigger, webhookSecret: e.target.value })} />
                  </>
                )}

                {trigger.triggerType === 'schedule' && (
                  <>
                    <TextField fullWidth label="CRON Expression" value={trigger.cronExpression || ''} onChange={e => setTrigger({ ...trigger, cronExpression: e.target.value })} helperText="e.g. 0 0 * * * (midnight daily)" />
                    <TextField
                      select fullWidth label="Timezone" value={trigger.cronTimezone || 'UTC'}
                      onChange={e => setTrigger({ ...trigger, cronTimezone: e.target.value })}
                    >
                      {['UTC', 'Asia/Tehran', 'America/New_York', 'Europe/London', 'Europe/Berlin'].map(tz => <MenuItem key={tz} value={tz}>{tz}</MenuItem>)}
                    </TextField>
                  </>
                )}

                {trigger.triggerType === 'operation' && (
                  <TextField
                    select fullWidth label="Source Flow" value={trigger.sourceFlowId || ''}
                    onChange={e => setTrigger({ ...trigger, sourceFlowId: e.target.value })}
                  >
                    {flows.filter(f => f.id !== flowId).map(f => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
                  </TextField>
                )}

                {trigger.triggerType === 'manual' && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" mb={2}>This flow can be executed manually via &quot;Run&quot; button or API.</Typography>
                    <Button variant="outlined" color="success" startIcon={<Play size={16} />} onClick={handleManualRun}>Run Now</Button>
                  </Box>
                )}

                <Divider />
                <Typography variant="caption" color="text.secondary" fontWeight={600}>Payload Preview</Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: isDark ? '#161b22' : '#f6f8fa', borderRadius: 1 }}>
                  <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace', color: 'text.secondary', whiteSpace: 'pre-wrap', m: 0, fontSize: 11 }}>
{`{
  "$trigger": { /* data */ },
  "$accountability": {
    "user": "...",
    "role": "..."
  }
}`}
                  </Typography>
                </Paper>
              </Box>
            )}

            {/* ── OPERATION PANEL ── */}
            {panelMode === 'operation' && editingOp && (
              <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" fontWeight={700}>Edit Operation</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Delete operation">
                      <IconButton size="small" color="error" onClick={() => handleDeleteOp(editingOp.id)}><Trash2 size={16} /></IconButton>
                    </Tooltip>
                    <IconButton size="small" onClick={closePanel}><XCircle size={18} /></IconButton>
                  </Box>
                </Box>

                <TextField fullWidth label="Name" value={opForm.name} onChange={e => setOpForm({ ...opForm, name: e.target.value })} />
                <TextField fullWidth label="Key (identifier)" value={opForm.key} onChange={e => setOpForm({ ...opForm, key: e.target.value })} helperText="Unique key, e.g. send_welcome_email" />
                <TextField
                  select fullWidth label="Type" value={opForm.type}
                  onChange={e => setOpForm({ ...opForm, type: e.target.value as OperationType })}
                >
                  {OPERATION_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </TextField>

                <Divider />
                <Typography variant="subtitle2" fontWeight={600}>Options (JSON)</Typography>
                <TextField
                  fullWidth multiline rows={10} value={opForm.options}
                  onChange={e => setOpForm({ ...opForm, options: e.target.value })}
                  sx={{ '& textarea': { fontFamily: 'monospace', fontSize: 12 } }}
                  helperText="Use {{$trigger.field}} for dynamic values."
                />

                <Button variant="contained" fullWidth startIcon={<Save size={16} />} onClick={handleSaveOp} disabled={!opForm.key || !opForm.name}>
                  Save Operation
                </Button>
              </Box>
            )}

            {/* ── SETTINGS PANEL ── */}
            {panelMode === 'settings' && (
              <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" fontWeight={700}>Flow Settings</Typography>
                  <IconButton size="small" onClick={closePanel}><XCircle size={18} /></IconButton>
                </Box>

                <TextField fullWidth label="Name" value={general.name} onChange={e => setGeneral({ ...general, name: e.target.value })} />
                <TextField fullWidth multiline rows={3} label="Description" value={general.description} onChange={e => setGeneral({ ...general, description: e.target.value })} />
                <TextField fullWidth label="Icon (Lucide name)" value={general.icon} onChange={e => setGeneral({ ...general, icon: e.target.value })} />

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <TextField fullWidth label="Color" value={general.color} onChange={e => setGeneral({ ...general, color: e.target.value })} />
                  <Box sx={{ width: 48, height: 48, borderRadius: 1, bgcolor: general.color, flexShrink: 0, border: '2px solid', borderColor: 'divider' }} />
                </Box>

                <FormControlLabel
                  control={<Switch checked={general.status === 'active'} onChange={e => setGeneral({ ...general, status: e.target.checked ? 'active' : 'inactive' })} />}
                  label={general.status === 'active' ? 'Active' : 'Inactive'}
                />

                <TextField
                  select fullWidth label="Permission" value={general.permission}
                  onChange={e => setGeneral({ ...general, permission: e.target.value })}
                >
                  <MenuItem value="$public">$public — Anyone</MenuItem>
                  <MenuItem value="$trigger">$trigger — Triggering User</MenuItem>
                  <MenuItem value="$full">$full — Full Access</MenuItem>
                </TextField>

                <Divider />
                <Typography variant="subtitle2" fontWeight={600}>Metadata</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">Created</Typography>
                    <Typography variant="caption">{new Date(flow.dateCreated).toLocaleString()}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">Created By</Typography>
                    <Typography variant="caption">{flow.userCreated}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">Last Updated</Typography>
                    <Typography variant="caption">{new Date(flow.dateUpdated).toLocaleString()}</Typography>
                  </Box>
                </Box>
              </Box>
            )}

            {/* ── HISTORY PANEL ── */}
            {panelMode === 'history' && !selectedRun && (
              <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" fontWeight={700}>Run History</Typography>
                  <IconButton size="small" onClick={closePanel}><XCircle size={18} /></IconButton>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {(['all', 'success', 'error'] as const).map(s => (
                    <Chip
                      key={s} label={s === 'all' ? 'All' : s} size="small"
                      onClick={() => setStatusFilter(s)}
                      variant={statusFilter === s ? 'filled' : 'outlined'}
                      color={s === 'success' ? 'success' : s === 'error' ? 'error' : 'default'}
                      sx={{ textTransform: 'capitalize', cursor: 'pointer' }}
                    />
                  ))}
                </Box>
                {flowLogs.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>No runs recorded yet.</Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {flowLogs.map(log => (
                      <Paper
                        key={log.id} variant="outlined"
                        sx={{ p: 2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                        onClick={() => setSelectedRun(log)}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{new Date(log.timestamp).toLocaleString()}</Typography>
                            <Typography variant="caption" color="text.secondary">{log.duration}ms — {log.operationsRun} ops</Typography>
                          </Box>
                          <Chip
                            icon={log.status === 'success' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                            label={log.status} size="small"
                            color={log.status === 'success' ? 'success' : 'error'}
                          />
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                )}
              </Box>
            )}

            {/* ── RUN DETAIL ── */}
            {panelMode === 'history' && selectedRun && (
              <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton size="small" onClick={() => setSelectedRun(null)}><ArrowLeft size={16} /></IconButton>
                    <Typography variant="h6" fontWeight={700}>Run Detail</Typography>
                  </Box>
                  <Chip icon={selectedRun.status === 'success' ? <CheckCircle2 size={14} /> : <XCircle size={14} />} label={selectedRun.status} color={selectedRun.status === 'success' ? 'success' : 'error'} />
                </Box>

                <Box sx={{ display: 'flex', gap: 3 }}>
                  <Box><Typography variant="caption" color="text.secondary">Date</Typography><Typography variant="body2">{new Date(selectedRun.timestamp).toLocaleString()}</Typography></Box>
                  <Box><Typography variant="caption" color="text.secondary">Duration</Typography><Typography variant="body2">{selectedRun.duration}ms</Typography></Box>
                </Box>

                <Divider />
                <Typography variant="subtitle2" fontWeight={600}>$trigger Payload</Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: isDark ? '#161b22' : '#f6f8fa', borderRadius: 1 }}>
                  <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace', color: 'text.secondary', whiteSpace: 'pre-wrap', m: 0, fontSize: 11 }}>
                    {JSON.stringify(selectedRun.triggerPayload, null, 2)}
                  </Typography>
                </Paper>

                <Typography variant="subtitle2" fontWeight={600}>Operation Results</Typography>
                {selectedRun.operationResults?.map((r, i) => (
                  <Paper key={i} variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>{r.operationKey}</Typography>
                      <Chip label={r.status} size="small" color={r.status === 'success' ? 'success' : 'error'} />
                    </Box>
                    {r.output && (
                      <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace', color: 'text.secondary', whiteSpace: 'pre-wrap', m: 0, fontSize: 11 }}>
                        {JSON.stringify(r.output, null, 2)}
                      </Typography>
                    )}
                    {r.error && <Typography variant="caption" color="error">{r.error}</Typography>}
                  </Paper>
                ))}

                {selectedRun.errorMessage && (
                  <Box sx={{ p: 2, bgcolor: 'error.main', borderRadius: 1, color: 'white' }}>
                    <Typography variant="body2" fontWeight={600}>Error</Typography>
                    <Typography variant="body2">{selectedRun.errorMessage}</Typography>
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        )}
      </Box>

      {/* ── Add Operation Dialog ── */}
      <Dialog open={addOpDialogOpen} onClose={() => setAddOpDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Operation</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <TextField fullWidth label="Name" value={opForm.name} onChange={e => setOpForm({ ...opForm, name: e.target.value })} placeholder="e.g. Send Welcome Email" />
            <TextField fullWidth label="Key (identifier)" value={opForm.key} onChange={e => setOpForm({ ...opForm, key: e.target.value })} placeholder="e.g. send_welcome_email" />
            <TextField
              select fullWidth label="Type" value={opForm.type}
              onChange={e => setOpForm({ ...opForm, type: e.target.value as OperationType })}
            >
              {OPERATION_TYPES.map(t => (
                <MenuItem key={t.value} value={t.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: OPERATION_META[t.value]?.color || '#888' }} />
                    {t.label}
                  </Box>
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth multiline rows={6} label="Options (JSON)" value={opForm.options}
              onChange={e => setOpForm({ ...opForm, options: e.target.value })}
              sx={{ '& textarea': { fontFamily: 'monospace', fontSize: 12 } }}
              helperText="Use {{$trigger.field}} for dynamic values."
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAddOpDialogOpen(false)} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleAddOp} disabled={!opForm.key || !opForm.name}>Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function FlowConnector({ onAdd, color }: { onAdd: () => void; color: string }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 0.5 }}>
      <Box sx={{ width: 2, height: 20, bgcolor: alpha(color, 0.35) }} />
      <Tooltip title="Add operation here">
        <IconButton
          size="small"
          onClick={(e) => { e.stopPropagation(); onAdd(); }}
          sx={{
            width: 28, height: 28,
            bgcolor: 'background.paper',
            border: '2px dashed', borderColor: 'divider',
            '&:hover': { borderColor: color, bgcolor: alpha(color, 0.08) },
            transition: 'all 0.2s',
          }}
        >
          <Plus size={14} />
        </IconButton>
      </Tooltip>
      <Box sx={{ width: 2, height: 20, bgcolor: alpha(color, 0.35) }} />
      <ArrowDown size={14} style={{ color: alpha(color, 0.5), marginTop: -4 }} />
    </Box>
  );
}
