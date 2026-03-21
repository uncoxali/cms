"use client";

import { useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Avatar from '@mui/material/Avatar';
import { alpha, useTheme } from '@mui/material/styles';
import ReactECharts from 'echarts-for-react';
import { useAnalyticsStore } from '@/store/analytics';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Database,
  FileImage,
  Activity,
  Calendar,
  Download,
  RefreshCw,
} from 'lucide-react';

const METRIC_ICONS: Record<string, any> = {
  'Total Items': Database,
  'Total Users': Users,
  'Total Files': FileImage,
  "Today's Activity": Activity,
};

export default function AnalyticsPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { data, loading, error, dateRange, setDateRange, fetchAnalytics } = useAnalyticsStore();

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const overviewCards = useMemo(() => {
    if (!data) return [];
    return data.recentMetrics.map((metric) => ({
      ...metric,
      icon: METRIC_ICONS[metric.label] || BarChart3,
    }));
  }, [data]);

  const timelineChartOption = useMemo(() => {
    if (!data?.activityTimeline) return {};
    const dates = data.activityTimeline.map((d) => d.date);
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: isDark ? '#1e293b' : '#fff',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        textStyle: { color: isDark ? '#f1f5f9' : '#1e293b' },
      },
      legend: {
        data: ['Creates', 'Updates', 'Deletes', 'Logins'],
        textStyle: { color: isDark ? '#94a3b8' : '#64748b' },
        bottom: 0,
      },
      grid: { left: 50, right: 20, top: 20, bottom: 50 },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: isDark ? '#334155' : '#e2e8f0' } },
        axisLabel: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: isDark ? '#1e293b' : '#f1f5f9' } },
        axisLabel: { color: isDark ? '#94a3b8' : '#64748b' },
      },
      series: [
        { name: 'Creates', type: 'line', smooth: true, data: data.activityTimeline.map((d) => d.creates), itemStyle: { color: '#10B981' }, areaStyle: { color: alpha('#10B981', 0.1) } },
        { name: 'Updates', type: 'line', smooth: true, data: data.activityTimeline.map((d) => d.updates), itemStyle: { color: '#3B82F6' }, areaStyle: { color: alpha('#3B82F6', 0.1) } },
        { name: 'Deletes', type: 'line', smooth: true, data: data.activityTimeline.map((d) => d.deletes), itemStyle: { color: '#EF4444' }, areaStyle: { color: alpha('#EF4444', 0.1) } },
        { name: 'Logins', type: 'line', smooth: true, data: data.activityTimeline.map((d) => d.logins), itemStyle: { color: '#8B5CF6' }, areaStyle: { color: alpha('#8B5CF6', 0.1) } },
      ],
    };
  }, [data?.activityTimeline, isDark]);

  const collectionChartOption = useMemo(() => {
    if (!data?.contentByCollection) return {};
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: isDark ? '#1e293b' : '#fff',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        textStyle: { color: isDark ? '#f1f5f9' : '#1e293b' },
      },
      legend: {
        data: ['Total', 'Created', 'Updated'],
        textStyle: { color: isDark ? '#94a3b8' : '#64748b' },
        bottom: 0,
      },
      grid: { left: 100, right: 20, top: 20, bottom: 50 },
      xAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: isDark ? '#334155' : '#e2e8f0' } },
        splitLine: { lineStyle: { color: isDark ? '#1e293b' : '#f1f5f9' } },
        axisLabel: { color: isDark ? '#94a3b8' : '#64748b' },
      },
      yAxis: {
        type: 'category',
        data: data.contentByCollection.map((c) => c.label),
        axisLine: { lineStyle: { color: isDark ? '#334155' : '#e2e8f0' } },
        axisLabel: { color: isDark ? '#94a3b8' : '#64748b' },
      },
      series: [
        { name: 'Total', type: 'bar', data: data.contentByCollection.map((c) => c.count), itemStyle: { color: '#8B5CF6' } },
        { name: 'Created', type: 'bar', data: data.contentByCollection.map((c) => c.created), itemStyle: { color: '#10B981' } },
        { name: 'Updated', type: 'bar', data: data.contentByCollection.map((c) => c.updated), itemStyle: { color: '#3B82F6' } },
      ],
    };
  }, [data?.contentByCollection, isDark]);

  const rangeOptions = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: 'all', label: 'All Time' },
  ];

  return (
    <Box sx={{ p: 4, overflow: 'auto', animation: 'fadeIn 300ms ease-out' }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '14px',
                background: `linear-gradient(135deg, #8B5CF6, #6366F1)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BarChart3 size={24} color="#fff" />
            </Box>
            <Typography variant="h3" fontWeight={700}>
              Analytics
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            Insights and reports for your content
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Box sx={{ display: 'flex', bgcolor: alpha('#8B5CF6', 0.08), borderRadius: '12px', p: 0.5 }}>
            {rangeOptions.map((opt) => (
              <Button
                key={opt.value}
                size="small"
                onClick={() => setDateRange(opt.value as any)}
                sx={{
                  borderRadius: '10px',
                  fontSize: 12,
                  fontWeight: dateRange === opt.value ? 700 : 500,
                  color: dateRange === opt.value ? '#fff' : 'text.secondary',
                  bgcolor: dateRange === opt.value ? '#8B5CF6' : 'transparent',
                  px: 2,
                  minWidth: 'auto',
                  '&:hover': {
                    bgcolor: dateRange === opt.value ? '#7C3AED' : alpha('#8B5CF6', 0.1),
                  },
                }}
              >
                {opt.label}
              </Button>
            ))}
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshCw size={16} />}
            onClick={fetchAnalytics}
            sx={{ borderRadius: '10px' }}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Download size={16} />}
            sx={{ borderRadius: '10px' }}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={i}>
                <Paper sx={{ p: 2.5, borderRadius: '16px' }}>
                  <Skeleton variant="circular" width={44} height={44} />
                  <Skeleton variant="text" width={80} height={40} sx={{ mt: 2 }} />
                  <Skeleton variant="text" width={100} />
                </Paper>
              </Grid>
            ))
          : overviewCards.map((metric, idx) => {
              const colors = ['#8B5CF6', '#10B981', '#3B82F6', '#F59E0B'];
              const color = colors[idx % colors.length];
              const Icon = metric.icon;
              return (
                <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={metric.label}>
                  <Paper sx={{ p: 2.5, borderRadius: '16px', transition: 'all 200ms', '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 4px 20px ${alpha(color, 0.15)}` } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: alpha(color, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={22} color={color} />
                      </Box>
                      <Chip
                        size="small"
                        icon={metric.trend === 'up' ? <TrendingUp size={12} /> : metric.trend === 'down' ? <TrendingDown size={12} /> : <Minus size={12} />}
                        label={`${metric.change > 0 ? '+' : ''}${metric.change}%`}
                        sx={{
                          height: 22,
                          fontSize: 11,
                          fontWeight: 600,
                          bgcolor: metric.trend === 'up' ? alpha('#10B981', 0.1) : metric.trend === 'down' ? alpha('#EF4444', 0.1) : alpha('#6B7280', 0.1),
                          color: metric.trend === 'up' ? '#10B981' : metric.trend === 'down' ? '#EF4444' : '#6B7280',
                          '& .MuiChip-icon': { color: 'inherit' },
                        }}
                      />
                    </Box>
                    <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
                      {metric.value.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      {metric.label}
                    </Typography>
                  </Paper>
                </Grid>
              );
            })}
      </Grid>

      {/* Charts */}
      <Grid container spacing={2.5}>
        {/* Activity Timeline */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper sx={{ p: 3, borderRadius: '16px', height: 400 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: alpha('#8B5CF6', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={18} color="#8B5CF6" />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>Activity Timeline</Typography>
                <Typography variant="caption" color="text.secondary">User actions over time</Typography>
              </Box>
            </Box>
            {loading ? (
              <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} />
            ) : data?.activityTimeline?.length ? (
              <ReactECharts option={timelineChartOption} style={{ height: 280 }} />
            ) : (
              <Box sx={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">No activity data</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Content by Collection */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper sx={{ p: 3, borderRadius: '16px', height: 400 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: alpha('#3B82F6', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Database size={18} color="#3B82F6" />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>Content Overview</Typography>
                <Typography variant="caption" color="text.secondary">Items by collection</Typography>
              </Box>
            </Box>
            {loading ? (
              <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} />
            ) : data?.contentByCollection?.length ? (
              <ReactECharts option={collectionChartOption} style={{ height: 280 }} />
            ) : (
              <Box sx={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">No collections</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Top Users */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 3, borderRadius: '16px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: alpha('#10B981', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={18} color="#10B981" />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>Top Users</Typography>
                <Typography variant="caption" color="text.secondary">Most active users this period</Typography>
              </Box>
            </Box>
            {loading ? (
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
            ) : data?.topUsers?.length ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {data.topUsers.slice(0, 5).map((user, idx) => (
                  <Box
                    key={user.email}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 1.5,
                      borderRadius: '12px',
                      bgcolor: alpha('#8B5CF6', idx === 0 ? 0.08 : 0.02),
                      border: `1px solid ${alpha('#8B5CF6', idx === 0 ? 0.2 : 0.05)}`,
                    }}
                  >
                    <Avatar sx={{ width: 36, height: 36, bgcolor: alpha('#8B5CF6', 0.15), color: '#8B5CF6', fontSize: 14, fontWeight: 700 }}>
                      {user.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {user.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(user.lastActive).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Chip
                      label={`${user.actions} actions`}
                      size="small"
                      sx={{ height: 22, fontSize: 11, bgcolor: alpha('#10B981', 0.1), color: '#10B981', fontWeight: 600 }}
                    />
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Users size={32} style={{ opacity: 0.2, marginBottom: 8 }} />
                <Typography color="text.secondary" variant="body2">No user activity yet</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Quick Stats Table */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 3, borderRadius: '16px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: alpha('#F59E0B', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={18} color="#F59E0B" />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>Collection Stats</Typography>
                <Typography variant="caption" color="text.secondary">Content breakdown</Typography>
              </Box>
            </Box>
            {loading ? (
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
            ) : data?.contentByCollection?.length ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {data.contentByCollection.slice(0, 5).map((col, idx) => {
                  const colors = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6'];
                  const color = colors[idx % colors.length];
                  const maxCount = Math.max(...data.contentByCollection.map((c) => c.count), 1);
                  const percentage = Math.round((col.count / maxCount) * 100);
                  return (
                    <Box key={col.collection}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: color }} />
                          <Typography variant="body2" fontWeight={600}>{col.label}</Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                          {col.count} items
                        </Typography>
                      </Box>
                      <Box sx={{ height: 6, bgcolor: alpha(color, 0.1), borderRadius: '3px', overflow: 'hidden' }}>
                        <Box sx={{ height: '100%', width: `${percentage}%`, bgcolor: color, borderRadius: '3px', transition: 'width 500ms ease' }} />
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            ) : (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Database size={32} style={{ opacity: 0.2, marginBottom: 8 }} />
                <Typography color="text.secondary" variant="body2">No collections yet</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
