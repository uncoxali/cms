"use client";

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { alpha } from '@mui/material/styles';
import ReactECharts from 'echarts-for-react';
import { ChartBuilder, ChartConfig } from './ChartBuilder';
import {
  Plus, BarChart3, Edit2, Trash2, RotateCcw, BarChart2,
  LineChart as LineChartIcon, PieChart as PieChartIcon
} from 'lucide-react';

interface ChartFieldProps {
  value: ChartConfig | null;
  onChange: (value: ChartConfig | null) => void;
  label: string;
  disabled?: boolean;
  description?: string;
}

const CHART_ICONS: Record<string, any> = {
  bar: BarChart3,
  line: LineChartIcon,
  pie: PieChartIcon,
  doughnut: PieChartIcon,
  area: BarChart2,
  scatter: BarChart3,
  radar: BarChart3,
};

export function ChartField({
  value,
  onChange,
  label,
  disabled = false,
  description,
}: ChartFieldProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleSave = (config: ChartConfig | null) => {
    onChange(config);
    setEditDialogOpen(false);
  };

  const renderChartPreview = () => {
    if (!value) return null;

    const getOption = () => {
      const colors = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444'];
      const isPie = value.type === 'pie' || value.type === 'doughnut';

      if (isPie) {
        return {
          title: value.title ? { text: value.title, left: 'center', top: 5, textStyle: { fontSize: 12, fontWeight: 600 } } : undefined,
          tooltip: { trigger: 'item' },
          legend: value.showLegend ? { bottom: 5, left: 'center' } : undefined,
          series: [{
            type: value.type,
            radius: value.type === 'doughnut' ? ['45%', '75%'] : '70%',
            center: ['50%', value.title ? '50%' : '50%'],
            data: value.data.labels.map((label, i) => ({
              name: label,
              value: value.data.datasets[0].data[i] || 0,
            })),
            itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
          }],
          color: colors,
        };
      }

      const isArea = value.type === 'area';

      return {
        title: value.title ? { text: value.title, left: 'center', top: 5, textStyle: { fontSize: 12, fontWeight: 600 } } : undefined,
        tooltip: value.showTooltip !== false ? { trigger: 'axis' } : undefined,
        legend: value.showLegend ? { bottom: 5 } : undefined,
        grid: { left: '10%', right: '10%', bottom: value.showLegend ? '25%' : '15%', top: value.title ? '60px' : '10%', containLabel: true },
        xAxis: {
          type: 'category',
          data: value.data.labels,
          name: value.xAxisLabel,
          boundaryGap: value.type === 'bar',
          axisLabel: { fontSize: 10 },
        },
        yAxis: { type: 'value', name: value.yAxisLabel, axisLabel: { fontSize: 10 } },
        series: value.data.datasets.map((ds, i) => ({
          type: value.type === 'line' || isArea ? 'line' : 'bar',
          name: ds.label,
          data: ds.data,
          smooth: value.type === 'line' || isArea,
          areaStyle: isArea ? { opacity: 0.3 } : undefined,
          itemStyle: { borderRadius: value.type === 'bar' ? [3, 3, 0, 0] : undefined },
          color: colors[i % colors.length],
        })),
        color: colors,
      };
    };

    return (
      <ReactECharts
        option={getOption()}
        style={{ height: value.title ? 220 : 200 }}
        opts={{ renderer: 'svg' }}
      />
    );
  };

  if (!value) {
    return (
      <Box>
        <Typography variant="body2" fontWeight={600} mb={0.5}>{label}</Typography>
        {description && (
          <Typography variant="caption" color="text.secondary" mb={1} display="block">{description}</Typography>
        )}
        <Paper
          onClick={() => !disabled && setEditDialogOpen(true)}
          sx={{
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: '12px',
            p: 4,
            textAlign: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            transition: 'all 150ms ease',
            '&:hover': !disabled ? {
              borderColor: '#8B5CF6',
              bgcolor: alpha('#8B5CF6', 0.02),
            } : {},
          }}
        >
          <Box sx={{
            width: 56, height: 56, borderRadius: '16px',
            bgcolor: alpha('#8B5CF6', 0.1), mx: 'auto', mb: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Plus size={24} color="#8B5CF6" />
          </Box>
          <Typography variant="body1" fontWeight={600} mb={0.5}>
            Add Chart
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Create a new chart or graph
          </Typography>
          <Button
            size="small"
            variant="contained"
            startIcon={<Plus size={14} />}
            onClick={(e) => { e.stopPropagation(); setEditDialogOpen(true); }}
            disabled={disabled}
          >
            Create Chart
          </Button>
        </Paper>

        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{ sx: { maxHeight: '90vh' } }}
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: alpha('#8B5CF6', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart3 size={18} color="#8B5CF6" />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700}>Create Chart</Typography>
                <Typography variant="caption" color="text.secondary">Configure your chart data and styling</Typography>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <ChartBuilder value={null} onChange={handleSave} disabled={disabled} />
          </DialogContent>
        </Dialog>
      </Box>
    );
  }

  const ChartIcon = CHART_ICONS[value.type] || BarChart3;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box>
          <Typography variant="body2" fontWeight={600}>{label}</Typography>
          {description && (
            <Typography variant="caption" color="text.secondary">{description}</Typography>
          )}
        </Box>
        {!disabled && (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton size="small" onClick={() => setEditDialogOpen(true)} sx={{ color: 'primary.main' }}>
              <Edit2 size={14} />
            </IconButton>
            <IconButton size="small" onClick={() => onChange(null)} sx={{ color: 'error.main' }}>
              <Trash2 size={14} />
            </IconButton>
          </Box>
        )}
      </Box>

      <Paper
        variant="outlined"
        sx={{
          borderRadius: '12px', overflow: 'hidden',
          border: '1px solid', borderColor: 'divider',
          '&:hover': !disabled ? {
            borderColor: alpha('#8B5CF6', 0.5),
          } : {},
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1, borderBottom: 1, borderColor: 'divider', bgcolor: alpha('#8B5CF6', 0.02) }}>
          <ChartIcon size={14} color="#8B5CF6" />
          <Typography variant="caption" fontWeight={600} color="text.secondary" textTransform="uppercase">
            {value.type} Chart
          </Typography>
          {value.data.datasets.map((ds, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'][i] }} />
              <Typography variant="caption" color="text.secondary">{ds.label}</Typography>
            </Box>
          ))}
        </Box>
        {renderChartPreview()}
      </Paper>

      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { maxHeight: '90vh' } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: alpha('#8B5CF6', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart3 size={18} color="#8B5CF6" />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>Edit Chart</Typography>
              <Typography variant="caption" color="text.secondary">Update chart data and styling</Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <ChartBuilder value={value} onChange={handleSave} disabled={disabled} />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
