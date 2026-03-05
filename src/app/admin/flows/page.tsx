"use client";

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
import Switch from '@mui/material/Switch';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import { useFlowsStore } from '@/store/flows';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Settings, Trash2, Activity } from 'lucide-react';

export default function FlowsListPage() {
  const router = useRouter();
  const flows = useFlowsStore(state => state.flows);
  const deleteFlow = useFlowsStore(state => state.deleteFlow);
  const updateFlow = useFlowsStore(state => state.updateFlow);

  const toggleActive = (id: string) => {
    const flow = flows.find(f => f.id === id);
    if (flow) updateFlow(id, { status: flow.status === 'active' ? 'inactive' : 'active' });
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight={600}>Automations</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Link href="/admin/flows/logs" passHref style={{ textDecoration: 'none' }}>
            <Button variant="outlined" startIcon={<Activity size={18} />} color="inherit">Logs</Button>
          </Link>
          <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => router.push('/admin/settings/flows')}>
            Manage Flows
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ flexGrow: 1 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Active</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Trigger</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Operations</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {flows.length === 0 ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>No Automations configured yet.</TableCell></TableRow>
            ) : (
              flows.map((flow) => (
                <TableRow key={flow.id} hover>
                  <TableCell>
                    <Switch checked={flow.status === 'active'} onChange={() => toggleActive(flow.id)} color="primary" />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: flow.color }} />
                      <Typography fontWeight={500}>{flow.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={flow.triggerType} size="small" variant="outlined" sx={{ textTransform: 'capitalize' }} />
                  </TableCell>
                  <TableCell>{(flow.operations || []).length} operation(s)</TableCell>
                  <TableCell align="right">
                    <IconButton color="inherit" size="small" onClick={() => router.push(`/admin/settings/flows/${flow.id}`)}>
                      <Settings size={18} />
                    </IconButton>
                    <IconButton color="error" size="small" onClick={() => deleteFlow(flow.id)} sx={{ ml: 1 }}>
                      <Trash2 size={18} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
