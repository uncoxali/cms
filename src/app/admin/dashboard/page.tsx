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
import { useAuthStore } from '@/store/auth';
import { useSchemaStore } from '@/store/schema';
import { api } from '@/lib/api';
import {
  Database, Users, FileText, Zap, TrendingUp,
  Activity, Clock, Plus, Upload, UserPlus, ArrowUpRight,
  Server, Wifi, HardDrive, CheckCircle2
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
  meta?: any;
}

const STAT_CARDS = [
  { id: 'items', label: 'Total Items', icon: Database, color: '#3B82F6', gradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' },
  { id: 'users', label: 'Active Users', icon: Users, color: '#22C55E', gradient: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)' },
  { id: 'activity', label: 'Events Today', icon: Activity, color: '#F59E0B', gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' },
  { id: 'flows', label: 'Active Flows', icon: Zap, color: '#8B5CF6', gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' },
];

const ACTION_COLOR: Record<string, string> = {
  create: '#22C55E', update: '#3B82F6', delete: '#EF4444',
  login: '#8B5CF6', logout: '#6B7280', 'flow.run': '#F59E0B',
};

export default function DashboardPage() {
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
      .catch(err => {
        console.error('Dashboard fetch error:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const allCollections = Object.entries(collections);
  const roleLabel = role === 'admin' ? 'Administrator' : role === 'editor' ? 'Editor' : 'Viewer';

  const isAdmin = role === 'admin';
  const isEditor = role === 'editor';
  const isViewer = role === 'viewer';

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
    if (isEditor) {
      // Editor: hide total users
      return card.id !== 'users';
    }
    // Viewer: only content & activity
    return card.id === 'items' || card.id === 'activity';
  });

  const quickActions = [
    { id: 'createItem', label: 'Create Item', icon: Plus, href: '/admin/content', color: '#3B82F6', roles: ['admin', 'editor'] },
    { id: 'uploadFile', label: 'Upload File', icon: Upload, href: '/admin/files', color: '#22C55E', roles: ['admin', 'editor'] },
    { id: 'inviteUser', label: 'Invite User', icon: UserPlus, href: '/admin/users', color: '#8B5CF6', roles: ['admin'] },
    { id: 'viewFlows', label: 'View Flows', icon: Zap, href: '/admin/settings/flows', color: '#F59E0B', roles: ['admin', 'editor'] },
  ].filter(action => (action.roles as (Role | null)[]).includes(role as any));

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em" mb={0.5}>
          Welcome back, {user?.name || 'User'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Logged in as <strong>{roleLabel}</strong> — here&apos;s what&apos;s happening with your project today.
        </Typography>
        {!isAdmin && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Your dashboard is tailored to your permissions. Some admin-only metrics and actions are hidden.
          </Typography>
        )}
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {visibleStatCards.map(card => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={card.id}>
            <Paper sx={{
              p: 3,
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 250ms ease',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 8px 30px ${card.color}15` },
            }}>
              <Box sx={{
                position: 'absolute', top: -20, right: -20,
                width: 80, height: 80, borderRadius: '50%',
                background: card.gradient, opacity: 0.08,
              }} />
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{
                    width: 40, height: 40, borderRadius: '10px',
                    background: card.gradient,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 4px 12px ${card.color}30`,
                  }}>
                    <card.icon size={20} color="white" />
                  </Box>
                  <TrendingUp size={16} style={{ color: '#22C55E', opacity: 0.7 }} />
                </Box>
                {loading ? (
                  <Skeleton variant="text" width={80} height={48} />
                ) : (
                  <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em">
                    {getStatValue(card.id)}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary" fontSize={13}>
                  {card.label}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5}>
        {/* Recent Activity Timeline */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Activity size={18} style={{ opacity: 0.6 }} />
                <Typography variant="subtitle1" fontWeight={700}>Recent Activity</Typography>
                {stats && (
                  <Chip label={`${stats.totalActivity} total`} size="small" variant="outlined" sx={{ fontSize: 11, height: 22 }} />
                )}
              </Box>
              <Link href="/admin/activity" style={{ textDecoration: 'none' }}>
                <Button size="small" endIcon={<ArrowUpRight size={14} />} sx={{ fontSize: 12 }}>View All</Button>
              </Link>
            </Box>
            {loading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} variant="rectangular" height={40} sx={{ borderRadius: 1 }} />
                ))}
              </Box>
            ) : recentActivity.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Clock size={32} style={{ opacity: 0.2, marginBottom: 8 }} />
                <Typography color="text.secondary">No activity recorded yet.</Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {recentActivity.slice(0, 8).map((log, idx) => (
                  <Box key={log.id} sx={{
                    display: 'flex', gap: 2, py: 1.5,
                    borderBottom: idx < Math.min(recentActivity.length, 8) - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                  }}>
                    <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Box sx={{
                        width: 8, height: 8, borderRadius: '50%',
                        bgcolor: ACTION_COLOR[log.action] || '#6B7280',
                        mt: 0.75, flexShrink: 0,
                        boxShadow: `0 0 8px ${ACTION_COLOR[log.action] || '#6B7280'}50`,
                      }} />
                      {idx < Math.min(recentActivity.length, 8) - 1 && (
                        <Box sx={{ width: 1, flexGrow: 1, bgcolor: 'rgba(255,255,255,0.04)', mt: 0.5 }} />
                      )}
                    </Box>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography component="div" variant="body2" fontWeight={600} fontSize={13}>
                          {log.user}
                          <Typography component="span" color="text.secondary" fontSize={13} fontWeight={400}> {log.action} </Typography>
                          {log.collection && (
                            <Chip label={log.collection} size="small" variant="outlined" sx={{ ml: 0.5, height: 20, fontSize: 11 }} />
                          )}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontSize={11} flexShrink={0} ml={1}>
                          {timeAgo(log.timestamp)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Right Column */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Content Overview */}
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                <Database size={18} style={{ opacity: 0.6 }} />
                <Typography variant="subtitle1" fontWeight={700}>Collections</Typography>
              </Box>
              {allCollections.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No collections defined.</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {allCollections.map(([key, col]) => {
                    const collStat = stats?.collections.find(c => c.name === key);
                    return (
                      <Link key={key} href={`/admin/content/${key}`} style={{ textDecoration: 'none' }}>
                        <Box sx={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          py: 1, px: 1.5, borderRadius: '8px',
                          transition: 'all 150ms ease',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#6644ff' }} />
                            <Typography variant="body2" fontWeight={500} color="text.primary">{col.label}</Typography>
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

            {/* Quick Actions */}
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                <Zap size={18} style={{ opacity: 0.6 }} />
                <Typography variant="subtitle1" fontWeight={700}>Quick Actions</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {quickActions.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    You have view-only access. Ask an administrator if you need more permissions.
                  </Typography>
                )}
                {quickActions.map(action => (
                  <Link key={action.label} href={action.href} style={{ textDecoration: 'none' }}>
                    <Box sx={{
                      display: 'flex', alignItems: 'center', gap: 1.5,
                      py: 1.25, px: 1.5, borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.04)',
                      transition: 'all 200ms ease',
                      cursor: 'pointer',
                      '&:hover': {
                        borderColor: `${action.color}30`,
                        bgcolor: `${action.color}06`,
                        transform: 'translateX(4px)',
                      },
                    }}>
                      <Box sx={{
                        width: 32, height: 32, borderRadius: '8px',
                        bgcolor: `${action.color}15`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <action.icon size={16} color={action.color} />
                      </Box>
                      <Typography variant="body2" fontWeight={500} color="text.primary">{action.label}</Typography>
                      <ArrowUpRight size={14} style={{ marginLeft: 'auto', opacity: 0.3 }} />
                    </Box>
                  </Link>
                ))}
              </Box>
            </Paper>

            {/* System Health */}
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                <Server size={18} style={{ opacity: 0.6 }} />
                <Typography variant="subtitle1" fontWeight={700}>System Health</Typography>
                <Chip label="All Systems Operational" size="small" color="success" sx={{ ml: 'auto', fontSize: 11, height: 22 }} />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[
                  { label: 'API Response', value: 'Healthy', icon: Wifi },
                  { label: 'Database', value: 'Connected (SQLite)', icon: Server },
                  {
                    label: 'Storage',
                    value: stats ? formatSize(stats.filesSize) : '—',
                    icon: HardDrive,
                    progress: stats ? Math.min((stats.filesSize / 10737418240) * 100, 100) : 0,
                  },
                  { label: 'Files', value: stats ? `${stats.filesCount} files` : '—', icon: FileText },
                ].map(item => (
                  <Box key={item.label}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 'progress' in item && item.progress ? 0.5 : 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <item.icon size={14} style={{ opacity: 0.5 }} />
                        <Typography variant="body2" color="text.secondary" fontSize={13}>{item.label}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Typography variant="body2" fontWeight={600} fontSize={13}>{item.value}</Typography>
                        <CheckCircle2 size={14} color="#22C55E" />
                      </Box>
                    </Box>
                    {'progress' in item && item.progress !== undefined && item.progress > 0 && (
                      <LinearProgress
                        variant="determinate"
                        value={item.progress}
                        sx={{
                          height: 4, borderRadius: 2,
                          bgcolor: 'rgba(255,255,255,0.04)',
                          '& .MuiLinearProgress-bar': { borderRadius: 2, bgcolor: '#22C55E' },
                        }}
                      />
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
