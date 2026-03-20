'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { alpha } from '@mui/material/styles';
import { useNotificationsStore } from '@/store/notifications';
import {
  Clock,
  Plus,
  Trash2,
  Edit2,
  Play,
  Pause,
  Calendar,
  Zap,
  CheckCircle,
} from 'lucide-react';

interface ScheduledTask {
  id: string;
  name: string;
  cron: string;
  collection: string;
  operation: string;
  payload: string;
  lastRun?: string;
  nextRun?: string;
  status: 'active' | 'paused' | 'error';
  runCount: number;
  errorCount: number;
}

const MOCK_TASKS: ScheduledTask[] = [
  {
    id: '1',
    name: 'Daily Data Cleanup',
    cron: '0 2 * * *',
    collection: 'logs',
    operation: 'delete_old',
    payload: '{"days": 30}',
    lastRun: '2024-03-15T02:00:00Z',
    nextRun: '2024-03-16T02:00:00Z',
    status: 'active',
    runCount: 45,
    errorCount: 0,
  },
  {
    id: '2',
    name: 'Hourly Cache Refresh',
    cron: '0 * * * *',
    collection: 'cache',
    operation: 'refresh',
    payload: '{"patterns": ["*"]}',
    lastRun: '2024-03-15T14:00:00Z',
    nextRun: '2024-03-15T15:00:00Z',
    status: 'active',
    runCount: 336,
    errorCount: 2,
  },
  {
    id: '3',
    name: 'Weekly Report Generation',
    cron: '0 9 * * 1',
    collection: 'reports',
    operation: 'generate',
    payload: '{"type": "weekly"}',
    lastRun: '2024-03-11T09:00:00Z',
    nextRun: '2024-03-18T09:00:00Z',
    status: 'active',
    runCount: 12,
    errorCount: 0,
  },
  {
    id: '4',
    name: 'User Notification Batch',
    cron: '0 8 * * *',
    collection: 'notifications',
    operation: 'send_batch',
    payload: '{"batch_size": 100}',
    status: 'paused',
    runCount: 28,
    errorCount: 1,
  },
];

const PRESET_CRONS = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every 5 minutes', value: '*/5 * * * *' },
  { label: 'Every 15 minutes', value: '*/15 * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Every day at midnight', value: '0 0 * * *' },
  { label: 'Every day at 2am', value: '0 2 * * *' },
  { label: 'Every week (Monday)', value: '0 9 * * 1' },
  { label: 'Every month (1st)', value: '0 0 1 * *' },
];

export default function ScheduledTasksPage() {
  const { addNotification } = useNotificationsStore();

  const [tasks, setTasks] = useState<ScheduledTask[]>(MOCK_TASKS);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ScheduledTask | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    cron: '',
    collection: '',
    operation: '',
    payload: '{}',
  });

  const handleOpenEdit = (task: ScheduledTask) => {
    setEditingTask(task);
    setFormData({
      name: task.name,
      cron: task.cron,
      collection: task.collection,
      operation: task.operation,
      payload: task.payload,
    });
    setCreateOpen(true);
  };

  const handleSave = () => {
    if (editingTask) {
      setTasks(prev => prev.map(t => 
        t.id === editingTask.id ? { ...t, ...formData } : t
      ));
      addNotification({ title: 'Task Updated', message: `${formData.name} has been updated.` });
    } else {
      const newTask: ScheduledTask = {
        id: Date.now().toString(),
        ...formData,
        status: 'active',
        runCount: 0,
        errorCount: 0,
      };
      setTasks(prev => [...prev, newTask]);
      addNotification({ title: 'Task Created', message: `${formData.name} has been created.` });
    }
    setCreateOpen(false);
    setEditingTask(null);
    setFormData({ name: '', cron: '', collection: '', operation: '', payload: '{}' });
  };

  const handleDelete = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    addNotification({ title: 'Task Deleted', message: 'Scheduled task has been deleted.' });
  };

  const handleToggle = (taskId: string) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: t.status === 'active' ? 'paused' : 'active' } : t
    ));
    addNotification({ title: 'Task Updated', message: 'Task status has been updated.' });
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCronDescription = (cron: string) => {
    const preset = PRESET_CRONS.find(p => p.value === cron);
    if (preset) return preset.label;
    
    const parts = cron.split(' ');
    if (parts[0] === '0' && parts[1] === '*') return 'Every hour';
    if (parts[0] === '0' && parts[1] === '0') return 'Daily at midnight';
    return cron;
  };

  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 4 }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                bgcolor: alpha('#8B5CF6', 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Clock size={24} color='#8B5CF6' />
            </Box>
            <Box>
              <Typography variant='h5' fontWeight={700}>
                Scheduled Tasks
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Automate recurring tasks with CRON expressions
              </Typography>
            </Box>
          </Box>
          <Button variant='contained' startIcon={<Plus size={18} />} onClick={() => {
            setEditingTask(null);
            setFormData({ name: '', cron: '', collection: '', operation: '', payload: '{}' });
            setCreateOpen(true);
          }}>
            Create Task
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Task</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Schedule</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Collection</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Last Run</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Next Run</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Runs / Errors</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align='right'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.map(task => (
                <TableRow key={task.id} hover sx={{ opacity: task.status === 'active' ? 1 : 0.6 }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Zap size={16} color='#8B5CF6' />
                      <Typography variant='body2' fontWeight={600}>{task.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getCronDescription(task.cron)}
                      size='small'
                      variant='outlined'
                      sx={{ fontFamily: 'monospace', fontSize: 11 }}
                    />
                    <Typography variant='caption' color='text.secondary' display='block'>
                      {task.cron}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={task.collection} size='small' variant='outlined' />
                  </TableCell>
                  <TableCell>{formatDate(task.lastRun)}</TableCell>
                  <TableCell>
                    {task.nextRun ? (
                      <Typography variant='body2' color='success.main'>
                        {formatDate(task.nextRun)}
                      </Typography>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2'>
                      <CheckCircle size={14} color='#22C55E' style={{ marginRight: 4, verticalAlign: 'middle' }} />
                      {task.runCount}
                      {task.errorCount > 0 && (
                        <span style={{ color: '#EF4444', marginLeft: 8 }}>
                          / {task.errorCount}
                        </span>
                      )}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={task.status}
                      size='small'
                      color={task.status === 'active' ? 'success' : task.status === 'error' ? 'error' : 'default'}
                    />
                  </TableCell>
                  <TableCell align='right'>
                    <IconButton size='small' onClick={() => handleToggle(task.id)}>
                      {task.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                    </IconButton>
                    <IconButton size='small' onClick={() => handleOpenEdit(task)}>
                      <Edit2 size={16} />
                    </IconButton>
                    <IconButton size='small' color='error' onClick={() => handleDelete(task.id)}>
                      <Trash2 size={16} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant='subtitle2' fontWeight={700} gutterBottom>
            CRON Format Reference
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            CRON expressions have 5 fields: minute, hour, day of month, month, day of week
          </Typography>
          <Paper variant='outlined' sx={{ p: 2, bgcolor: 'grey.50', fontFamily: 'monospace', fontSize: 13 }}>
            <pre style={{ margin: 0 }}>{`* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-6, Sunday = 0)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)`}</pre>
          </Paper>
        </Paper>
      </Box>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>{editingTask ? 'Edit Task' : 'Create Scheduled Task'}</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            label='Task Name'
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 3, mt: 1 }}
          />
          <TextField
            fullWidth
            select
            label='Schedule Preset'
            value={PRESET_CRONS.find(p => p.value === formData.cron) ? formData.cron : 'custom'}
            onChange={(e) => setFormData({ ...formData, cron: e.target.value })}
            sx={{ mb: 2 }}
          >
            {PRESET_CRONS.map(preset => (
              <MenuItem key={preset.value} value={preset.value}>{preset.label}</MenuItem>
            ))}
            <MenuItem value='custom'>Custom...</MenuItem>
          </TextField>
          <TextField
            fullWidth
            label='CRON Expression'
            value={formData.cron}
            onChange={(e) => setFormData({ ...formData, cron: e.target.value })}
            placeholder='* * * * *'
            sx={{ mb: 3 }}
          />
          <TextField
            fullWidth
            select
            label='Collection'
            value={formData.collection}
            onChange={(e) => setFormData({ ...formData, collection: e.target.value })}
            sx={{ mb: 3 }}
          >
            <MenuItem value='logs'>Logs</MenuItem>
            <MenuItem value='cache'>Cache</MenuItem>
            <MenuItem value='reports'>Reports</MenuItem>
            <MenuItem value='notifications'>Notifications</MenuItem>
          </TextField>
          <TextField
            fullWidth
            label='Operation'
            value={formData.operation}
            onChange={(e) => setFormData({ ...formData, operation: e.target.value })}
            placeholder='e.g., cleanup, refresh, generate'
            sx={{ mb: 3 }}
          />
          <TextField
            fullWidth
            label='Payload (JSON)'
            value={formData.payload}
            onChange={(e) => setFormData({ ...formData, payload: e.target.value })}
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant='contained' onClick={handleSave} disabled={!formData.name || !formData.cron}>
            {editingTask ? 'Save Changes' : 'Create Task'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
