"use client";

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { alpha } from '@mui/material/styles';
import ReactECharts from 'echarts-for-react';
import {
  X, Plus, Trash2, BarChart3, LineChart as LineChartIcon,
  PieChart as PieChartIcon, AreaChart, ScatterChart,
  BarChart2, RotateCcw, Settings2
} from 'lucide-react';

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'area' | 'scatter' | 'radar';
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  colorScheme?: 'default' | 'pastel' | 'vibrant' | 'monochrome';
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      color?: string;
    }[];
  };
}

interface ChartBuilderProps {
  value: ChartConfig | null;
  onChange: (config: ChartConfig | null) => void;
  disabled?: boolean;
}

const CHART_TYPES = [
  { value: 'bar', label: 'Bar', icon: BarChart3 },
  { value: 'line', label: 'Line', icon: LineChartIcon },
  { value: 'area', label: 'Area', icon: AreaChart },
  { value: 'pie', label: 'Pie', icon: PieChartIcon },
  { value: 'doughnut', label: 'Doughnut', icon: PieChartIcon },
  { value: 'scatter', label: 'Scatter', icon: ScatterChart },
] as const;

const COLOR_SCHEMES = {
  default: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'],
  pastel: ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#14B8A6', '#F97316', '#6366F1'],
  vibrant: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0'],
  monochrome: ['#1a1a2e', '#16213e', '#0f3460', '#e94560', '#533483', '#2c3e50', '#34495e', '#7f8c8d', '#95a5a6'],
};

const DEFAULT_DATA: ChartConfig['data'] = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    { label: 'Sales', data: [65, 59, 80, 81, 56, 55] },
    { label: 'Revenue', data: [28, 48, 40, 19, 86, 27] },
  ],
};

export function ChartBuilder({ value, onChange, disabled = false }: ChartBuilderProps) {
  const [activeTab, setActiveTab] = useState<'data' | 'style'>('data');
  
  const config = value || {
    type: 'bar' as const,
    title: '',
    showLegend: true,
    showGrid: true,
    showTooltip: true,
    colorScheme: 'pastel' as const,
    data: DEFAULT_DATA,
  };

  const colors = COLOR_SCHEMES[config.colorScheme || 'pastel'];

  const handleTypeChange = (type: ChartConfig['type']) => {
    onChange({ ...config, type });
  };

  const handleTitleChange = (title: string) => {
    onChange({ ...config, title });
  };

  const handleColorSchemeChange = (colorScheme: ChartConfig['colorScheme']) => {
    onChange({ ...config, colorScheme });
  };

  const handleToggle = (key: keyof ChartConfig) => {
    onChange({ ...config, [key]: !config[key] });
  };

  const handleLabelChange = (index: number, value: string) => {
    const labels = [...config.data.labels];
    labels[index] = value;
    onChange({ ...config, data: { ...config.data, labels } });
  };

  const handleDatasetLabelChange = (dsIndex: number, value: string) => {
    const datasets = [...config.data.datasets];
    datasets[dsIndex] = { ...datasets[dsIndex], label: value };
    onChange({ ...config, data: { ...config.data, datasets } });
  };

  const handleDatasetDataChange = (dsIndex: number, index: number, value: string) => {
    const datasets = [...config.data.datasets];
    const newData = [...datasets[dsIndex].data];
    newData[index] = parseFloat(value) || 0;
    datasets[dsIndex] = { ...datasets[dsIndex], data: newData };
    onChange({ ...config, data: { ...config.data, datasets } });
  };

  const handleAddDataset = () => {
    onChange({
      ...config,
      data: {
        ...config.data,
        datasets: [
          ...config.data.datasets,
          { label: `Dataset ${config.data.datasets.length + 1}`, data: config.data.labels.map(() => 0) },
        ],
      },
    });
  };

  const handleRemoveDataset = (index: number) => {
    const datasets = config.data.datasets.filter((_, i) => i !== index);
    onChange({ ...config, data: { ...config.data, datasets } });
  };

  const getChartOption = () => {
    const isPie = config.type === 'pie' || config.type === 'doughnut';
    const isScatter = config.type === 'scatter';

    if (isPie) {
      return {
        title: config.title ? { text: config.title, left: 'center', top: 10, textStyle: { fontSize: 14, fontWeight: 600 } } : undefined,
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: config.showLegend ? { bottom: 10, left: 'center' } : undefined,
        series: [{
          type: config.type,
          radius: config.type === 'doughnut' ? ['40%', '70%'] : '70%',
          center: ['50%', '50%'],
          data: config.data.labels.map((label, i) => ({
            name: label,
            value: config.data.datasets[0].data[i] || 0,
          })),
          itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
          label: { show: config.showLegend !== true, formatter: '{b}: {d}%' },
        }],
        color: colors,
      };
    }

    if (isScatter) {
      return {
        title: config.title ? { text: config.title, left: 'center', top: 10, textStyle: { fontSize: 14, fontWeight: 600 } } : undefined,
        tooltip: { trigger: 'item' },
        grid: config.showGrid ? { left: '10%', right: '10%', bottom: '15%', top: config.title ? '80px' : '15%' } : { left: '10%', right: '10%', bottom: '15%', containLabel: true },
        xAxis: { type: 'value', name: config.xAxisLabel },
        yAxis: { type: 'value', name: config.yAxisLabel },
        series: config.data.datasets.map((ds, i) => ({
          type: 'scatter',
          symbolSize: 15,
          data: ds.data.map((v, j) => [j * 10, v]),
          name: ds.label,
        })),
        legend: config.showLegend ? { bottom: 10 } : undefined,
        color: colors,
      };
    }

    const isArea = config.type === 'area';
    const isLine = config.type === 'line';

    return {
      title: config.title ? { text: config.title, left: 'center', top: 10, textStyle: { fontSize: 14, fontWeight: 600 } } : undefined,
      tooltip: config.showTooltip ? { trigger: 'axis' } : undefined,
      legend: config.showLegend ? { bottom: 10 } : undefined,
      grid: config.showGrid ? { left: '10%', right: '10%', bottom: '15%', top: config.title ? '80px' : '10%' } : { left: '10%', right: '10%', bottom: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: config.data.labels,
        name: config.xAxisLabel,
        boundaryGap: config.type === 'bar',
      },
      yAxis: { type: 'value', name: config.yAxisLabel },
      series: config.data.datasets.map((ds, i) => ({
        type: isLine || isArea ? 'line' : 'bar',
        name: ds.label,
        data: ds.data,
        smooth: isLine || isArea,
        areaStyle: isArea ? { opacity: 0.3 } : undefined,
        itemStyle: { borderRadius: config.type === 'bar' ? [4, 4, 0, 0] : undefined },
        color: colors[i % colors.length],
      })),
      color: colors,
    };
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        {CHART_TYPES.map(({ value: type, label, icon: Icon }) => (
          <ToggleButton
            key={type}
            value={type}
            selected={config.type === type}
            onChange={() => handleTypeChange(type)}
            disabled={disabled}
            sx={{
              px: 2, py: 1, borderRadius: '8px !important',
              '&.Mui-selected': {
                bgcolor: alpha('#8B5CF6', 0.1),
                color: '#8B5CF6',
                borderColor: '#8B5CF6',
              },
            }}
          >
            <Icon size={16} style={{ marginRight: 4 }} />
            {label}
          </ToggleButton>
        ))}
      </Box>

      <Paper variant="outlined" sx={{ p: 0, overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
          {['data', 'style'].map(tab => (
            <Button
              key={tab}
              size="small"
              onClick={() => setActiveTab(tab as 'data' | 'style')}
              sx={{
                px: 3, py: 1.5, borderRadius: 0,
                textTransform: 'capitalize',
                borderBottom: activeTab === tab ? '2px solid #8B5CF6' : '2px solid transparent',
                color: activeTab === tab ? '#8B5CF6' : 'text.secondary',
              }}
            >
              {tab === 'data' ? 'Data' : 'Style'}
            </Button>
          ))}
        </Box>

        <Box sx={{ p: 2 }}>
          {activeTab === 'data' ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="Chart Title"
                size="small"
                value={config.title || ''}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Enter chart title..."
                disabled={disabled}
              />

              <Box>
                <Typography variant="body2" fontWeight={600} mb={1}>Labels (X-Axis)</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {config.data.labels.map((label, i) => (
                    <TextField
                      key={i}
                      size="small"
                      value={label}
                      onChange={(e) => handleLabelChange(i, e.target.value)}
                      sx={{ width: 80 }}
                      disabled={disabled}
                    />
                  ))}
                </Box>
              </Box>

              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" fontWeight={600}>Datasets</Typography>
                  {!disabled && (
                    <Button size="small" startIcon={<Plus size={14} />} onClick={handleAddDataset}>
                      Add Dataset
                    </Button>
                  )}
                </Box>
                {config.data.datasets.map((ds, dsIndex) => (
                  <Paper key={dsIndex} variant="outlined" sx={{ p: 2, mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <Box sx={{
                        width: 12, height: 12, borderRadius: '50%',
                        bgcolor: colors[dsIndex % colors.length]
                      }} />
                      <TextField
                        size="small"
                        label="Dataset Name"
                        value={ds.label}
                        onChange={(e) => handleDatasetLabelChange(dsIndex, e.target.value)}
                        sx={{ flex: 1 }}
                        disabled={disabled}
                      />
                      {!disabled && config.data.datasets.length > 1 && (
                        <IconButton size="small" color="error" onClick={() => handleRemoveDataset(dsIndex)}>
                          <Trash2 size={14} />
                        </IconButton>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {ds.data.map((val, i) => (
                        <TextField
                          key={i}
                          size="small"
                          type="number"
                          value={val}
                          onChange={(e) => handleDatasetDataChange(dsIndex, i, e.target.value)}
                          sx={{ width: 70 }}
                          disabled={disabled}
                          label={config.data.labels[i]}
                        />
                      ))}
                    </Box>
                  </Paper>
                ))}
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Color Scheme</InputLabel>
                <Select
                  value={config.colorScheme || 'pastel'}
                  label="Color Scheme"
                  onChange={(e) => handleColorSchemeChange(e.target.value as ChartConfig['colorScheme'])}
                  disabled={disabled}
                >
                  <MenuItem value="default">Default</MenuItem>
                  <MenuItem value="pastel">Pastel</MenuItem>
                  <MenuItem value="vibrant">Vibrant</MenuItem>
                  <MenuItem value="monochrome">Monochrome</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>X-Axis Label</InputLabel>
                <TextField
                  size="small"
                  value={config.xAxisLabel || ''}
                  onChange={(e) => onChange({ ...config, xAxisLabel: e.target.value })}
                  label="X-Axis Label"
                  disabled={disabled}
                />
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Y-Axis Label</InputLabel>
                <TextField
                  size="small"
                  value={config.yAxisLabel || ''}
                  onChange={(e) => onChange({ ...config, yAxisLabel: e.target.value })}
                  label="Y-Axis Label"
                  disabled={disabled}
                />
              </FormControl>

              <Box>
                <Typography variant="body2" fontWeight={600} mb={1}>Display Options</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {[
                    { key: 'showLegend', label: 'Show Legend' },
                    { key: 'showGrid', label: 'Show Grid' },
                    { key: 'showTooltip', label: 'Show Tooltip' },
                  ].map(opt => (
                    <Box
                      key={opt.key}
                      onClick={() => !disabled && handleToggle(opt.key as keyof ChartConfig)}
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 1,
                        borderRadius: '8px', cursor: disabled ? 'not-allowed' : 'pointer',
                        bgcolor: config[opt.key as keyof ChartConfig] ? alpha('#8B5CF6', 0.08) : 'transparent',
                        '&:hover': !disabled ? { bgcolor: alpha('#8B5CF6', 0.04) } : {},
                      }}
                    >
                      <Box sx={{
                        width: 18, height: 18, borderRadius: '4px', border: 1,
                        borderColor: config[opt.key as keyof ChartConfig] ? '#8B5CF6' : 'divider',
                        bgcolor: config[opt.key as keyof ChartConfig] ? '#8B5CF6' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 150ms ease',
                      }}>
                        {config[opt.key as keyof ChartConfig] && (
                          <Typography sx={{ color: 'white', fontSize: 12 }}>✓</Typography>
                        )}
                      </Box>
                      <Typography variant="body2">{opt.label}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          )}
        </Box>

        <Divider />

        <Box sx={{ p: 2, bgcolor: alpha('#8B5CF6', 0.02) }}>
          <Typography variant="caption" color="text.secondary" mb={1} display="block">
            Preview
          </Typography>
          <ReactECharts
            option={getChartOption()}
            style={{ height: 250 }}
            opts={{ renderer: 'svg' }}
          />
        </Box>
      </Paper>

      {!value && (
        <Typography variant="caption" color="text.secondary" mt={1} display="block" textAlign="center">
          Configure your chart above, or paste JSON configuration
        </Typography>
      )}
    </Box>
  );
}
