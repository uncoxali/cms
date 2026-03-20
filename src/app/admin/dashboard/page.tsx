"use client";

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Skeleton from '@mui/material/Skeleton';
import Link from 'next/link';
import { useAuthStore, type Role } from '@/store/auth';
import { useSchemaStore } from '@/store/schema';
import { api } from '@/lib/api';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Database, Users, FileText, Zap, TrendingUp,
  Activity, Clock, Plus, Upload, UserPlus, ArrowUpRight,
  Server, HardDrive, CheckCircle2, Sparkles
} from 'lucide-react';

interface DashboardStats {
  totalItems: number;
  activeUsers: number;
  totalUsers: number;
  todayEvents: number;
  totalActivity: number;
  activeFlows: number;
  filesCount: number;
  filesSize: number;
  collections: { name: string; count: number }[];
}

interface ActivityItem {
  id: number;
  action: string;
  user: string;
  collection?: string;
  item?: string;
  timestamp: string;
}

const STAT_CARDS = [
  { id: 'items', label: 'Total Items', icon: Database, color: '#8B5CF6' },
  { id: 'users', label: 'Active Users', icon: Users, color: '#10B981' },
  { id: 'activity', label: 'Events Today', icon: Activity, color: '#F59E0B' },
  { id: 'flows', label: 'Active Flows', icon: Zap, color: '#EC4899' },
];

const ACTION_COLORS: Record<string, string> = {
  create: '#10B981',
  update: '#8B5CF6',
  delete: '#EF4444',
  login: '#EC4899',
  logout: '#6B7280',
};

export default function DashboardPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);
  const { collections } = useSchemaStore();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ stats: DashboardStats; recentActivity: ActivityItem[] }>('/dashboard')
      .then(res => {
        setStats(res.stats);
        setRecentActivity(res.recentActivity || []);
      })
      .catch(err => console.error('Dashboard fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  const allCollections = Object.entries(collections);
  const roleLabel = role === 'admin' ? 'Administrator' : role === 'editor' ? 'Editor' : 'Viewer';
  const isAdmin = role === 'admin';
  const isEditor = role === 'editor';

  const getStatValue = (id: string) => {
    if (!stats) return '—';
    switch (id) {
      case 'items': return String(stats.totalItems);
      case 'users': return String(stats.activeUsers);
      case 'activity': return String(stats.todayEvents);
      case 'flows': return String(stats.activeFlows);
      default: return '0';
    }
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
    return `${(bytes / 1073741824).toFixed(2)} GB`;
  };

  const visibleStatCards = STAT_CARDS.filter(card => {
    if (isAdmin) return true;
    if (isEditor) return card.id !== 'users';
    return card.id === 'items' || card.id === 'activity';
  });

  const quickActions = [
    { id: 'createItem', label: 'Create Item', icon: Plus, href: '/admin/content', color: '#8B5CF6', roles: ['admin', 'editor'] },
    { id: 'uploadFile', label: 'Upload File', icon: Upload, href: '/admin/files', color: '#10B981', roles: ['admin', 'editor'] },
    { id: 'inviteUser', label: 'Invite User', icon: UserPlus, href: '/admin/users', color: '#EC4899', roles: ['admin'] },
    { id: 'viewFlows', label: 'View Flows', icon: Zap, href: '/admin/settings/flows', color: '#F59E0B', roles: ['admin', 'editor'] },
  ].filter(action => (action.roles as (Role | null)[]).includes(role as any));

  return (
    <Box sx={{ animation: 'fadeIn 300ms ease-out' }}>
      {/* Welcome */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
          <Typography variant="h3" fontWeight={700}>
            Welcome back, {user?.name || 'User'}
          </Typography>
          <Chip
            icon={<Sparkles size={14} />}
            label={roleLabel}
            size="small"
            sx={{ bgcolor: alpha('#8B5CF6', 0.1), color: '#8B5CF6', fontWeight: 600 }}
          />
        </Box>
        <Typography variant="body1" color="text.secondary">
          Here&apos;s what&apos;s happening with your project today.
        </Typography>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {visibleStatCards.map((card, index) => (
          <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={card.id}>
            <Paper sx={{ p: 2.5, borderRadius: '16px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{
                  width: 44, height: 44, borderRadius: '12px',
                  bgcolor: alpha(card.color, 0.1),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <card.icon size={22} color={card.color} />
                </Box>
                <TrendingUp size={16} color="#10B981" />
              </Box>
              {loading ? (
                <Skeleton variant="text" width={60} height={40} />
              ) : (
                <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
                  {getStatValue(card.id)}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                {card.label}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5}>
        {/* Recent Activity */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper sx={{ borderRadius: '16px', overflow: 'hidden' }}>
            <Box sx={{ p: 2.5, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.palette.divider}` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: alpha('#8B5CF6', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={18} color="#8B5CF6" />
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>Recent Activity</Typography>
                  {stats && <Typography variant="caption" color="text.secondary">{stats.totalActivity} total events</Typography>}
                </Box>
              </Box>
              <Link href="/admin/activity" style={{ textDecoration: 'none' }}>
                <Button size="small" endIcon={<ArrowUpRight size={14} />} sx={{ fontSize: 12 }}>View All</Button>
              </Link>
            </Box>

            {loading ? (
              <Box sx={{ p: 2 }}><Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} /></Box>
            ) : recentActivity.length === 0 ? (
              <Box sx={{ py: 5, textAlign: 'center' }}>
                <Clock size={32} style={{ opacity: 0.2, marginBottom: 8 }} />
                <Typography color="text.secondary" fontWeight={500}>No activity yet</Typography>
              </Box>
            ) : (
              <Box sx={{ p: 1.5 }}>
                {recentActivity.slice(0, 5).map((log) => (
                  <Box key={log.id} sx={{ display: 'flex', gap: 1.5, p: 1.5, borderRadius: '10px', '&:hover': { bgcolor: alpha(theme.palette.text.primary, isDark ? 0.04 : 0.02) } }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: ACTION_COLORS[log.action] || '#6B7280', mt: 0.75, flexShrink: 0 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                        <Typography variant="body2" fontWeight={600} fontSize={13}>{log.user}</Typography>
                        <Typography component="span" color="text.secondary" fontSize={12}>{log.action}</Typography>
                        {log.collection && <Chip label={log.collection} size="small" sx={{ height: 18, fontSize: 10, bgcolor: alpha('#8B5CF6', 0.1), color: '#8B5CF6' }} />}
                      </Box>
                    </Box>
                    <Box component="span" sx={{ flexShrink: 0 }}>
                      <Typography variant="caption" color="text.secondary" fontSize={11}>{timeAgo(log.timestamp)}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Collections */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper sx={{ borderRadius: '16px', overflow: 'hidden' }}>
            <Box sx={{ p: 2.5, pb: 2, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: alpha('#3B82F6', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Database size={18} color="#3B82F6" />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>Collections</Typography>
                <Typography variant="caption" color="text.secondary">{allCollections.length} total</Typography>
              </Box>
            </Box>

            {allCollections.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">No collections defined.</Typography>
              </Box>
            ) : (
              <Box sx={{ p: 1.5 }}>
                {allCollections.slice(0, 6).map(([key, col]) => {
                  const collStat = stats?.collections.find(c => c.name === key);
                  return (
                    <Link key={key} href={`/admin/content/${key}`} style={{ textDecoration: 'none' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, borderRadius: '10px', '&:hover': { bgcolor: alpha('#8B5CF6', 0.04) } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#8B5CF6' }} />
                          <Typography variant="body2" fontWeight={600}>{col.label}</Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {collStat ? `${collStat.count} items` : `${col.fields.length} fields`}
                        </Typography>
                      </Box>
                    </Link>
                  );
                })}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Quick Actions + System */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Quick Actions */}
            <Paper sx={{ borderRadius: '16px', p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: alpha('#EC4899', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={18} color="#EC4899" />
                </Box>
                <Typography variant="subtitle1" fontWeight={700}>Quick Actions</Typography>
              </Box>

              {quickActions.length === 0 ? (
                <Typography variant="body2" color="text.secondary" fontSize={13}>
                  View-only access. Contact an administrator.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {quickActions.map(action => (
                    <Link key={action.id} href={action.href} style={{ textDecoration: 'none' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: '12px', border: `1px solid ${theme.palette.divider}`, transition: 'all 150ms ease', '&:hover': { borderColor: alpha(action.color, 0.4), bgcolor: alpha(action.color, 0.04) } }}>
                        <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: alpha(action.color, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <action.icon size={18} color={action.color} />
                        </Box>
                        <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>{action.label}</Typography>
                        <ArrowUpRight size={14} style={{ opacity: 0.4 }} />
                      </Box>
                    </Link>
                  ))}
                </Box>
              )}
            </Paper>

            {/* System Health */}
            <Paper sx={{ borderRadius: '16px', p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: alpha('#10B981', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Server size={18} color="#10B981" />
                </Box>
                <Typography variant="subtitle1" fontWeight={700}>System Health</Typography>
                <Chip label="All OK" size="small" sx={{ ml: 'auto', bgcolor: alpha('#10B981', 0.1), color: '#10B981', fontWeight: 600, fontSize: 11 }} />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[
                  { label: 'Database', value: 'Connected', color: '#10B981' },
                  { label: 'Storage', value: stats ? formatSize(stats.filesSize) : '—', color: '#F59E0B', progress: stats ? Math.min((stats.filesSize / 10737418240) * 100, 100) : 0 },
                  { label: 'Files', value: stats ? `${stats.filesCount}` : '—', color: '#8B5CF6' },
                ].map(item => (
                  <Box key={item.label}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 'progress' in item && item.progress !== undefined ? 1 : 0 }}>
                      <Typography variant="body2" color="text.secondary" fontSize={13}>{item.label}</Typography>
                      <Typography variant="body2" fontWeight={700} fontSize={13} color={item.color}>{item.value}</Typography>
                    </Box>
                    {'progress' in item && item.progress !== undefined && item.progress > 0 && (
                      <LinearProgress variant="determinate" value={item.progress} sx={{ '& .MuiLinearProgress-bar': { bgcolor: item.color } }} />
                    )}
                  </Box>
                ))}
              </Box>
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
