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
import Chip from '@mui/material/Chip';
import { useFlowsStore } from '@/store/flows';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function FlowLogsPage() {
  const { runLogs, flows } = useFlowsStore();

  const getFlowName = (flowId: string) => {
    return flows.find(f => f.id === flowId)?.name || flowId;
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
        <Link href="/admin/flows" passHref style={{ textDecoration: 'none' }}>
          <Button variant="outlined" startIcon={<ArrowLeft size={18} />} color="inherit" size="small">Back</Button>
        </Link>
        <Typography variant="h4" fontWeight={600}>Flow Execution Logs</Typography>
      </Box>

      <TableContainer component={Paper} sx={{ flexGrow: 1 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Flow</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Trigger</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Timestamp</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {runLogs.length === 0 ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>No logs available.</TableCell></TableRow>
            ) : (
              runLogs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell>
                    <Chip label={log.status} color={log.status === 'success' ? 'success' : 'error'} size="small" />
                  </TableCell>
                  <TableCell><Typography fontWeight={500}>{getFlowName(log.flowId)}</Typography></TableCell>
                  <TableCell><Chip label={log.triggerType} size="small" variant="outlined" /></TableCell>
                  <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{log.duration}ms</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
