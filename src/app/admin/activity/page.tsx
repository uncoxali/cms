"use client";

import { useState, useMemo, useEffect } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import { useActivityStore, ActivityLog } from '@/store/activity';
import { useSchemaStore } from '@/store/schema';
import {
  Search, User, Database, Play, PenTool, Trash2, LogIn,
  Plus, Activity, Filter, RefreshCw, Clock, Zap, FileText,
  Settings, ChevronRight, Globe, Key, Bell, Layers
} from 'lucide-react';

const ACTION_CONFIG: Record<string, { 
  label: string; 
  color: string; 
  bgColor: string;
  icon: any;
  description: string;
}> = {
  create: { label: 'Created', color: '#10B981', bgColor: alpha('#10B981', 0.1), icon: Plus, description: 'Created new item' },
  update: { label: 'Updated', color: '#3B82F6', bgColor: alpha('#3B82F6', 0.1), icon: PenTool, description: 'Modified item' },
  delete: { label: 'Deleted', color: '#EF4444', bgColor: alpha('#EF4444', 0.1), icon: Trash2, description: 'Removed item' },
  login: { label: 'Login', color: '#8B5CF6', bgColor: alpha('#8B5CF6', 0.1), icon: LogIn, description: 'Signed in' },
  logout: { label: 'Logout', color: '#6B7280', bgColor: alpha('#6B7280', 0.1), icon: LogIn, description: 'Signed out' },
  'flow.run': { label: 'Flow', color: '#F59E0B', bgColor: alpha('#F59E0B', 0.1), icon: Play, description: 'Triggered flow' },
  export: { label: 'Export', color: '#14B8A6', bgColor: alpha('#14B8A6', 0.1), icon: FileText, description: 'Exported data' },
  import: { label: 'Import', color: '#EC4899', bgColor: alpha('#EC4899', 0.1), icon: Layers, description: 'Imported data' },
  settings: { label: 'Settings', color: '#64748B', bgColor: alpha('#64748B', 0.1), icon: Settings, description: 'Changed settings' },
};

const QUICK_FILTERS = [
  { value: 'all', label: 'All', icon: Activity },
  { value: 'create', label: 'Creates', icon: Plus },
  { value: 'update', label: 'Updates', icon: PenTool },
  { value: 'delete', label: 'Deletes', icon: Trash2 },
  { value: 'login', label: 'Auth', icon: Key },
];

function formatDateGroup(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  if (date.getTime() > today.getTime() - 7 * 24 * 60 * 60 * 1000) return 'This Week';
  if (date.getTime() > today.getTime() - 30 * 24 * 60 * 60 * 1000) return 'This Month';
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function timeAgoShort(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function ActivityPage() {
  const { logs, fetchLogs, loading } = useActivityStore();
  const { collections } = useSchemaStore();
  const theme = useTheme();

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'compact'>('timeline');
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const q = search.toLowerCase();
      const matchSearch = !q || 
        log.user.toLowerCase().includes(q) || 
        (log.collection || '').toLowerCase().includes(q) ||
        (log.meta && JSON.stringify(log.meta).toLowerCase().includes(q));
      const matchAction = actionFilter === 'all' || log.action === actionFilter;
      return matchSearch && matchAction;
    });
  }, [logs, search, actionFilter]);

  const groupedLogs = useMemo(() => {
    const groups: Record<string, ActivityLog[]> = {};
    filteredLogs.forEach(log => {
      const group = formatDateGroup(log.timestamp);
      if (!groups[group]) groups[group] = [];
      groups[group].push(log);
    });
    return groups;
  }, [filteredLogs]);

  const stats = useMemo(() => ({
    total: logs.length,
    today: logs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length,
    creates: logs.filter(l => l.action === 'create').length,
    updates: logs.filter(l => l.action === 'update').length,
    deletes: logs.filter(l => l.action === 'delete').length,
  }), [logs]);

  const handleRefresh = () => {
    fetchLogs();
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', animation: 'fadeIn 300ms ease-out' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ 
              width: 52, height: 52, borderRadius: '16px', 
              background: `linear-gradient(135deg, ${alpha('#F59E0B', 0.2)}, ${alpha('#F59E0B', 0.05)})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid ${alpha('#F59E0B', 0.2)}`
            }}>
              <Zap size={24} color="#F59E0B" />
            </Box>
            <Box>
              <Typography variant="h3" fontWeight={700}>Activity Feed</Typography>
              <Typography color="text.secondary" variant="body2">
                Real-time system events and user actions
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh">
              <IconButton onClick={handleRefresh} sx={{ 
                border: 1, borderColor: 'divider', borderRadius: '10px',
                '&:hover': { bgcolor: alpha('#8B5CF6', 0.05) }
              }}>
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </IconButton>
            </Tooltip>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, v) => v && setViewMode(v)}
              size="small"
              sx={{ border: 1, borderColor: 'divider', borderRadius: '10px' }}
            >
              <ToggleButton value="timeline" sx={{ px: 2, py: 0.75 }}>Timeline</ToggleButton>
              <ToggleButton value="compact" sx={{ px: 2, py: 0.75 }}>Compact</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 2, mb: 3 }}>
        {[
          { label: 'Total Events', value: stats.total, gradient: `linear-gradient(135deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.7)})`, icon: Activity },
          { label: 'Today', value: stats.today, gradient: `linear-gradient(135deg, #3B82F6, ${alpha('#3B82F6', 0.7)})`, icon: Clock },
          { label: 'Creates', value: stats.creates, gradient: `linear-gradient(135deg, #10B981, ${alpha('#10B981', 0.7)})`, icon: Plus },
          { label: 'Updates', value: stats.updates, gradient: `linear-gradient(135deg, #F59E0B, ${alpha('#F59E0B', 0.7)})`, icon: PenTool },
          { label: 'Deletes', value: stats.deletes, gradient: `linear-gradient(135deg, #EF4444, ${alpha('#EF4444', 0.7)})`, icon: Trash2 },
        ].map(stat => (
          <Paper
            key={stat.label}
            sx={{
              p: 2, position: 'relative', overflow: 'hidden',
              background: stat.gradient,
              color: 'white',
              transition: 'all 200ms ease',
              cursor: 'pointer',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 },
              '&::before': {
                content: '""', position: 'absolute', top: 0, right: 0,
                width: 80, height: 80, borderRadius: '0 0 0 100%',
                bgcolor: alpha('#fff', 0.1),
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
              <Box>
                <Typography variant="h4" fontWeight={800} lineHeight={1.2}>{stat.value}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: 500 }}>{stat.label}</Typography>
              </Box>
              <Box sx={{
                width: 36, height: 36, borderRadius: '10px',
                bgcolor: alpha('#fff', 0.2),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <stat.icon size={18} />
              </Box>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', gap: 1, bgcolor: alpha('#8B5CF6', 0.05), p: 0.5, borderRadius: '12px', border: 1, borderColor: 'divider' }}>
          {QUICK_FILTERS.map(filter => (
            <Chip
              key={filter.value}
              label={filter.label}
              icon={<filter.icon size={14} />}
              onClick={() => setActionFilter(filter.value)}
              sx={{
                fontWeight: actionFilter === filter.value ? 700 : 500,
                bgcolor: actionFilter === filter.value ? alpha('#8B5CF6', 0.15) : 'transparent',
                color: actionFilter === filter.value ? '#8B5CF6' : 'text.secondary',
                border: 'none',
                '& .MuiChip-icon': { color: 'inherit' },
              }}
            />
          ))}
        </Box>
        <TextField
          size="small"
          placeholder="Search activities..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ width: 280 }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment> } }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
          {filteredLogs.length} event{filteredLogs.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {/* Activity Content */}
      <Box sx={{ flexGrow: 1, display: 'flex', gap: 3, overflow: 'hidden' }}>
        {/* Main Timeline */}
        <Box sx={{ flex: 1, overflow: 'auto', pr: 1 }}>
          {loading && logs.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : filteredLogs.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Box sx={{
                width: 80, height: 80, borderRadius: '50%', bgcolor: alpha('#8B5CF6', 0.1),
                mx: 'auto', mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Activity size={36} style={{ opacity: 0.4 }} />
              </Box>
              <Typography variant="h6" fontWeight={600} mb={1}>No activity found</Typography>
              <Typography variant="body2" color="text.secondary">
                {search || actionFilter !== 'all' 
                  ? 'Try adjusting your filters'
                  : 'Start creating content to see activity here'}
              </Typography>
            </Box>
          ) : viewMode === 'timeline' ? (
            <Box>
              {Object.entries(groupedLogs).map(([group, groupLogs]) => (
                <Box key={group} mb={3}>
                  <Typography variant="subtitle2" fontWeight={700} color="text.secondary" mb={2} sx={{ 
                    display: 'flex', alignItems: 'center', gap: 1,
                    '&::after': { content: '""', flex: 1, height: 1, bgcolor: 'divider', ml: 2 }
                  }}>
                    {group}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {groupLogs.map((log, index) => {
                      const config = ACTION_CONFIG[log.action] || ACTION_CONFIG.update;
                      const isSelected = selectedLog?.id === log.id;
                      return (
                        <Paper
                          key={log.id}
                          onClick={() => setSelectedLog(isSelected ? null : log)}
                          sx={{
                            p: 2, cursor: 'pointer', position: 'relative',
                            border: isSelected ? 2 : 1,
                            borderColor: isSelected ? config.color : 'divider',
                            transition: 'all 150ms ease',
                            '&:hover': { 
                              borderColor: config.color,
                              boxShadow: `0 4px 20px ${alpha(config.color, 0.15)}`,
                            },
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              left: -10, top: '50%',
                              width: 8, height: 8, borderRadius: '50%',
                              bgcolor: config.color,
                              transform: 'translateY(-50%)',
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                            <Avatar sx={{ 
                              width: 40, height: 40, fontSize: 14, fontWeight: 700,
                              bgcolor: alpha(config.color, 0.15),
                              color: config.color,
                              border: `2px solid ${alpha(config.color, 0.3)}`,
                            }}>
                              {log.user.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                                <Typography variant="body2" fontWeight={600}>
                                  {log.user}
                                </Typography>
                                <Chip
                                  label={config.label}
                                  size="small"
                                  icon={<config.icon size={10} />}
                                  sx={{
                                    height: 20, fontSize: 10, fontWeight: 700,
                                    bgcolor: config.bgColor, color: config.color,
                                    '& .MuiChip-icon': { color: 'inherit' },
                                  }}
                                />
                                {log.collection && (
                                  <>
                                    <Typography variant="body2" color="text.secondary">
                                      on
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <Database size={12} style={{ opacity: 0.5 }} />
                                      <Typography variant="body2" fontWeight={500}>
                                        {collections[log.collection]?.label || log.collection}
                                      </Typography>
                                    </Box>
                                  </>
                                )}
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                {config.description}
                                {log.item && ` #${log.item}`}
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                              <Typography variant="caption" fontWeight={500} color="text.secondary">
                                {formatTime(log.timestamp)}
                              </Typography>
                              <Typography variant="caption" display="block" color="text.disabled">
                                {timeAgoShort(log.timestamp)} ago
                              </Typography>
                            </Box>
                          </Box>

                          {isSelected && log.meta && (
                            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                              <Typography variant="caption" fontWeight={600} color="text.secondary" mb={1} display="block">
                                Details
                              </Typography>
                              <Paper variant="outlined" sx={{ p: 1.5, bgcolor: alpha('#000', 0.02) }}>
                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                                  <Box>
                                    <Typography variant="caption" color="text.secondary">Event ID</Typography>
                                    <Typography variant="body2" fontFamily="monospace" fontSize={11}>
                                      {log.id.substring(0, 8)}...
                                    </Typography>
                                  </Box>
                                  <Box>
                                    <Typography variant="caption" color="text.secondary">Timestamp</Typography>
                                    <Typography variant="body2" fontSize={11}>
                                      {new Date(log.timestamp).toLocaleString()}
                                    </Typography>
                                  </Box>
                                </Box>
                                {Object.keys(log.meta).length > 0 && (
                                  <Box mt={1}>
                                    <Typography variant="caption" color="text.secondary">Changes</Typography>
                                    <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                      {Object.entries(log.meta).slice(0, 5).map(([key, value]) => (
                                        <Chip
                                          key={key}
                                          label={`${key}: ${JSON.stringify(value).substring(0, 20)}`}
                                          size="small"
                                          sx={{ fontSize: 10, height: 20 }}
                                        />
                                      ))}
                                      {Object.keys(log.meta).length > 5 && (
                                        <Chip
                                          label={`+${Object.keys(log.meta).length - 5} more`}
                                          size="small"
                                          sx={{ fontSize: 10, height: 20 }}
                                        />
                                      )}
                                    </Box>
                                  </Box>
                                )}
                              </Paper>
                            </Box>
                          )}
                        </Paper>
                      );
                    })}
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {filteredLogs.map(log => {
                const config = ACTION_CONFIG[log.action] || ACTION_CONFIG.update;
                return (
                  <Box
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1.5,
                      borderRadius: '10px', cursor: 'pointer',
                      bgcolor: selectedLog?.id === log.id ? alpha(config.color, 0.08) : 'transparent',
                      '&:hover': { bgcolor: alpha(config.color, 0.04) },
                    }}
                  >
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: config.color, flexShrink: 0 }} />
                    <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: alpha(config.color, 0.15), color: config.color }}>
                      {log.user.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" fontWeight={500} sx={{ flex: 1 }} noWrap>
                      {log.user}
                    </Typography>
                    <Chip
                      label={config.label}
                      size="small"
                      sx={{
                        fontSize: 10, height: 20, fontWeight: 600,
                        bgcolor: config.bgColor, color: config.color,
                      }}
                    />
                    {log.collection && (
                      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }} noWrap>
                        {collections[log.collection]?.label || log.collection}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 50, textAlign: 'right' }}>
                      {timeAgoShort(log.timestamp)}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>

        {/* Side Panel - Selected Activity Details */}
        {selectedLog && (
          <Paper sx={{ width: 320, flexShrink: 0, p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1" fontWeight={700}>Details</Typography>
              <IconButton size="small" onClick={() => setSelectedLog(null)}>
                <ChevronRight size={16} />
              </IconButton>
            </Box>
            <Box sx={{ p: 2, overflow: 'auto', flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ 
                  width: 48, height: 48, fontSize: 18, fontWeight: 700,
                  bgcolor: alpha(ACTION_CONFIG[selectedLog.action]?.color || '#8B5CF6', 0.15),
                  color: ACTION_CONFIG[selectedLog.action]?.color || '#8B5CF6',
                }}>
                  {selectedLog.user.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>{selectedLog.user}</Typography>
                  <Chip
                    label={ACTION_CONFIG[selectedLog.action]?.label || selectedLog.action}
                    size="small"
                    sx={{
                      mt: 0.5, fontWeight: 700,
                      bgcolor: alpha(ACTION_CONFIG[selectedLog.action]?.color || '#8B5CF6', 0.1),
                      color: ACTION_CONFIG[selectedLog.action]?.color || '#8B5CF6',
                    }}
                  />
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[
                  { label: 'Timestamp', value: new Date(selectedLog.timestamp).toLocaleString(), icon: Clock },
                  { label: 'Collection', value: selectedLog.collection ? (collections[selectedLog.collection]?.label || selectedLog.collection) : 'System', icon: Database },
                  { label: 'Item', value: selectedLog.item ? `#${selectedLog.item}` : '—', icon: FileText },
                  { label: 'Event ID', value: selectedLog.id, icon: Activity, mono: true },
                ].map(item => (
                  <Box key={item.label}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <item.icon size={12} style={{ opacity: 0.4 }} />
                      <Typography variant="caption" color="text.secondary" fontWeight={500}>
                        {item.label}
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={500} fontFamily={item.mono ? 'monospace' : undefined} sx={{ wordBreak: 'break-all' }}>
                      {item.value}
                    </Typography>
                  </Box>
                ))}

                {selectedLog.meta && Object.keys(selectedLog.meta).length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={500} mb={1} display="block">
                      Metadata
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 1.5, bgcolor: alpha('#000', 0.02) }}>
                      <pre style={{ margin: 0, fontSize: 11, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                        {JSON.stringify(selectedLog.meta, null, 2)}
                      </pre>
                    </Paper>
                  </Box>
                )}
              </Box>
            </Box>
          </Paper>
        )}
      </Box>
    </Box>
  );
}
