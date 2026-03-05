"use client";

import { useState, useMemo, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import { useActivityStore, ActivityAction } from '@/store/activity';
import { useSchemaStore } from '@/store/schema';
import {
  Search, User, Database, Play, PenTool, Trash2, LogIn,
  TrendingUp, Plus, ChevronDown, ChevronRight, Activity, Filter
} from 'lucide-react';

const ACTION_CONFIG: Record<string, { label: string; color: string; chipColor: 'success' | 'info' | 'error' | 'primary' | 'warning' | 'secondary' | 'default'; icon: any }> = {
  create: { label: 'CREATE', color: '#22C55E', chipColor: 'success', icon: Plus },
  update: { label: 'UPDATE', color: '#3B82F6', chipColor: 'info', icon: PenTool },
  delete: { label: 'DELETE', color: '#EF4444', chipColor: 'error', icon: Trash2 },
  login: { label: 'LOGIN', color: '#8B5CF6', chipColor: 'primary', icon: LogIn },
  logout: { label: 'LOGOUT', color: '#6B7280', chipColor: 'default', icon: LogIn },
  'flow.run': { label: 'FLOW RUN', color: '#F59E0B', chipColor: 'warning', icon: Play },
};

export default function ActivityPage() {
  const { logs, fetchLogs } = useActivityStore();
  const { collections } = useSchemaStore();
  const theme = useTheme();

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Fetch logs from API on mount
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Stats
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayLogs = logs.filter(l => new Date(l.timestamp).toDateString() === today);
    return {
      total: logs.length,
      today: todayLogs.length,
      creates: todayLogs.filter(l => l.action === 'create').length,
      updates: todayLogs.filter(l => l.action === 'update').length,
      deletes: todayLogs.filter(l => l.action === 'delete').length,
    };
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const q = search.toLowerCase();
      const matchSearch = !q || log.user.toLowerCase().includes(q) || (log.collection || '').toLowerCase().includes(q);
      const matchAction = actionFilter === 'all' || log.action === actionFilter;
      return matchSearch && matchAction;
    });
  }, [logs, search, actionFilter]);

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <Activity size={24} style={{ opacity: 0.6 }} />
          <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em">Activity Log</Typography>
        </Box>
        <Typography color="text.secondary" variant="body2">
          Track all system events, content changes, and automations.
        </Typography>
      </Box>

      {/* Stats Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Events', value: stats.total, color: theme.palette.primary.main, icon: TrendingUp },
          { label: 'Today', value: stats.today, color: theme.palette.info.main, icon: Activity },
          { label: 'Creates', value: stats.creates, color: theme.palette.success.main, icon: Plus },
          { label: 'Updates', value: stats.updates, color: theme.palette.warning.main, icon: PenTool },
          { label: 'Deletes', value: stats.deletes, color: theme.palette.error.main, icon: Trash2 },
        ].map(stat => (
          <Grid size={{ xs: 6, sm: 2.4 }} key={stat.label}>
            <Paper sx={{
              p: 2, display: 'flex', alignItems: 'center', gap: 1.5,
              transition: 'all 200ms ease',
              '&:hover': { transform: 'translateY(-2px)' },
            }}>
              <Box sx={{
                width: 36, height: 36, borderRadius: '8px',
                bgcolor: `${stat.color}12`, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <stat.icon size={16} color={stat.color} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={800} lineHeight={1.2}>{stat.value}</Typography>
                <Typography variant="caption" color="text.secondary" fontSize={11}>{stat.label}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search by user or collection..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ width: 300 }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment> } }}
        />
        <TextField
          select size="small" label="Action" value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="all">All Actions</MenuItem>
          <MenuItem value="create">Create</MenuItem>
          <MenuItem value="update">Update</MenuItem>
          <MenuItem value="delete">Delete</MenuItem>
          <MenuItem value="login">Login</MenuItem>
          <MenuItem value="flow.run">Flow Run</MenuItem>
        </TextField>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
          Showing {filteredLogs.length} of {logs.length} events
        </Typography>
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{ flexGrow: 1 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 40 }}></TableCell>
              <TableCell>Action</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Context</TableCell>
              <TableCell>Time</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <Activity size={32} style={{ opacity: 0.15, marginBottom: 8 }} />
                  <Typography color="text.secondary">No activity recorded yet.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((log) => {
                const config = ACTION_CONFIG[log.action] || ACTION_CONFIG.create;
                const isExpanded = expandedId === log.id;
                return (
                  <Box component="tbody" key={log.id}>
                    <TableRow
                      hover
                      onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      sx={{ cursor: 'pointer', '& td': { borderBottom: isExpanded ? 'none' : undefined } }}
                    >
                      <TableCell sx={{ width: 40, pr: 0 }}>
                        <IconButton size="small" sx={{ p: 0.25 }}>
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={<config.icon size={12} />}
                          label={config.label}
                          color={config.chipColor}
                          size="small"
                          sx={{ fontWeight: 700, fontSize: 11 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: 11, bgcolor: `${config.color}30`, color: config.color }}>
                            {log.user.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography variant="body2" fontWeight={500}>{log.user}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {log.collection ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Database size={14} style={{ opacity: 0.4 }} />
                            <Typography variant="body2">
                              {collections[log.collection]?.label || log.collection}
                              {log.item ? <Typography component="span" color="text.secondary"> #{log.item}</Typography> : ''}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">System</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" fontSize={13}>
                          {timeAgo(log.timestamp)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={5} sx={{ p: 0, border: 'none' }}>
                        <Collapse in={isExpanded} unmountOnExit>
                          <Box sx={{
                            px: 4, py: 2, mb: 1,
                            bgcolor: 'action.hover',
                            borderBottom: 1, borderColor: 'divider',
                          }}>
                            <Typography variant="subtitle2" fontWeight={700} mb={1} fontSize={12} color="text.secondary">
                              Event Details
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid size={{ xs: 6 }}>
                                <Typography variant="caption" color="text.secondary">Event ID</Typography>
                                <Typography variant="body2" fontFamily="monospace" fontSize={12}>{log.id}</Typography>
                              </Grid>
                              <Grid size={{ xs: 6 }}>
                                <Typography variant="caption" color="text.secondary">Timestamp</Typography>
                                <Typography variant="body2" fontSize={12}>
                                  {new Date(log.timestamp).toLocaleString([], { dateStyle: 'full', timeStyle: 'medium' })}
                                </Typography>
                              </Grid>
                              {log.meta && (
                                <Grid size={{ xs: 12 }}>
                                  <Typography variant="caption" color="text.secondary">Metadata</Typography>
                                  <Paper variant="outlined" sx={{ p: 1.5, mt: 0.5, bgcolor: 'rgba(0,0,0,0.2)' }}>
                                    <Typography variant="body2" fontFamily="monospace" fontSize={12} sx={{ whiteSpace: 'pre-wrap' }}>
                                      {JSON.stringify(log.meta, null, 2)}
                                    </Typography>
                                  </Paper>
                                </Grid>
                              )}
                            </Grid>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </Box>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={filteredLogs.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        rowsPerPageOptions={[10, 25, 50, 100]}
        sx={{ borderTop: 1, borderColor: 'divider' }}
      />
    </Box>
  );
}
