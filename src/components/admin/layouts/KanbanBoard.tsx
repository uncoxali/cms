'use client';

import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { useTheme, alpha } from '@mui/material/styles';
import { Plus, MoreVertical, Pencil, Trash2, GripVertical, Check, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useConfirm } from '@/components/admin/ConfirmDialog';

interface KanbanColumn {
  id: string | number;
  label: string;
  color: string;
  items: any[];
}

interface KanbanBoardProps {
  collectionKey: string;
  statusField: string;
  statusOptions: { value: string | number; label: string; color: string }[];
  fields: any[];
  onItemUpdate: () => void;
}

const DEFAULT_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', 
  '#22C55E', '#14B8A6', '#06B6D4', '#3B82F6', '#6B7280'
];

export default function KanbanBoard({ 
  collectionKey, 
  statusField, 
  statusOptions, 
  fields,
  onItemUpdate 
}: KanbanBoardProps) {
  const theme = useTheme();
  const confirm = useConfirm();
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<{ item: any; sourceColumn: string } | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [editingCard, setEditingCard] = useState<{ item: any; columnId: string } | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement | null; item: any; columnId: string | number } | null>(null);
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [newColumnName, setNewColumnName] = useState('');
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newStatusName, setNewStatusName] = useState('');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: any[] }>(`/items/${String(collectionKey)}`, { limit: String(1000) });
      const items = res.data || [];
      
      const cols: KanbanColumn[] = statusOptions.map((opt, idx) => ({
        id: String(opt.value),
        label: opt.label,
        color: opt.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
        items: items.filter(item => String(item[statusField]) === String(opt.value)),
      }));

      const uncategorized = items.filter(item => !item[statusField]);
      if (uncategorized.length > 0) {
        cols.push({
          id: 'uncategorized',
          label: 'Uncategorized',
          color: '#6B7280',
          items: uncategorized,
        });
      }

      setColumns(cols);
    } catch (err) {
      console.error('Failed to fetch items:', err);
    } finally {
      setLoading(false);
    }
  }, [collectionKey, statusField, statusOptions]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleDragStart = (e: React.DragEvent, item: any, columnId: string | number) => {
    setDraggedItem({ item, sourceColumn: String(columnId) });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ item, sourceColumn: columnId }));
  };

  const handleDragOver = (e: React.DragEvent, columnId: string | number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(String(columnId));
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, targetColumnId: string | number) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    if (!draggedItem) return;
    
    try {
      await api.patch(`/items/${collectionKey}/${draggedItem.item.id}`, {
        [statusField]: targetColumnId === 'uncategorized' ? null : targetColumnId
      });
      await fetchItems();
      onItemUpdate();
    } catch (err) {
      console.error('Failed to update item:', err);
    }
    
    setDraggedItem(null);
  };

  const handleDeleteItem = async (item: any, columnId: string | number) => {
    setMenuAnchor(null);
    const ok = await confirm({
      title: 'Delete Item',
      message: 'Are you sure you want to delete this item?',
      confirmText: 'Delete',
      severity: 'error'
    });
    if (!ok) return;
    
    try {
      await api.del(`/items/${collectionKey}/${item.id}`);
      await fetchItems();
      onItemUpdate();
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const getFieldValue = (item: any, fieldName: string) => {
    const value = item[fieldName];
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value).slice(0, 100);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <Typography color="text.secondary">Loading board...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2, minHeight: 400 }}>
      {columns.map((column) => (
        <Box
          key={column.id}
          onDragOver={(e) => handleDragOver(e, column.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, column.id)}
          sx={{
            width: 300,
            minWidth: 300,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: alpha(theme.palette.background.default, 0.5),
            borderRadius: 3,
            border: `2px solid ${dragOverColumn === column.id ? theme.palette.primary.main : 'transparent'}`,
            transition: 'all 200ms ease',
          }}
        >
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: column.color,
                boxShadow: `0 0 8px ${column.color}50`,
              }}
            />
            <Typography variant="subtitle2" fontWeight={700} sx={{ flexGrow: 1 }}>
              {column.label}
            </Typography>
            <Chip 
              label={column.items.length} 
              size="small" 
              sx={{ height: 22, fontSize: 11, fontWeight: 700 }}
            />
            <IconButton 
              size="small" 
              onClick={() => setMenuAnchor({ el: null as any, item: null as any, columnId: column.id })}
            >
              <MoreVertical size={14} />
            </IconButton>
          </Box>

          <Box sx={{ flexGrow: 1, px: 1.5, pb: 1.5, display: 'flex', flexDirection: 'column', gap: 1, minHeight: 200 }}>
            {column.items.map((item) => (
              <Paper
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, item, column.id)}
                sx={{
                  p: 1.5,
                  cursor: 'grab',
                  transition: 'all 150ms ease',
                  '&:hover': {
                    boxShadow: 3,
                    transform: 'translateY(-2px)',
                  },
                  '&:active': {
                    cursor: 'grabbing',
                    opacity: 0.8,
                  },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="body2" fontWeight={600} sx={{ flexGrow: 1, lineHeight: 1.3 }}>
                    {item.title || item.name || `#${item.id}`}
                  </Typography>
                  <IconButton 
                    size="small" 
                    sx={{ ml: 0.5, opacity: 0.6 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuAnchor({ el: e.currentTarget, item, columnId: column.id });
                    }}
                  >
                    <MoreVertical size={12} />
                  </IconButton>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {fields.slice(0, 3).map((field) => {
                    if (field.name === statusField) return null;
                    const value = getFieldValue(item, field.name);
                    if (value === '—') return null;
                    return (
                      <Box key={field.name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                          {field.label}:
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: 11, fontWeight: 500 }}>
                          {value}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Paper>
            ))}

            {column.items.length === 0 && (
              <Box
                sx={{
                  py: 4,
                  textAlign: 'center',
                  border: `2px dashed ${theme.palette.divider}`,
                  borderRadius: 2,
                  opacity: 0.5,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Drop items here
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      ))}

      <Menu
        anchorEl={menuAnchor?.el}
        open={Boolean(menuAnchor?.el)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => {
          if (menuAnchor) {
            window.location.href = `/admin/content/${collectionKey}/${menuAnchor.item.id}`;
          }
        }}>
          <ListItemIcon><Pencil size={16} /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => menuAnchor && handleDeleteItem(menuAnchor.item, menuAnchor.columnId)} sx={{ color: 'error.main' }}>
          <ListItemIcon><Trash2 size={16} color={theme.palette.error.main} /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}
