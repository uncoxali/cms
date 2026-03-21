"use client";

import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { alpha, useTheme } from '@mui/material/styles';
import { useTrashStore, TrashedItem } from '@/store/trash';
import { useSchemaStore } from '@/store/schema';
import { useNotificationsStore } from '@/store/notifications';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  Database,
  Calendar,
  User,
} from 'lucide-react';

export default function TrashPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { items, loading, filter, setFilter, fetchTrash, restoreItem, permanentDelete, emptyTrash } = useTrashStore();
  const { collections } = useSchemaStore();
  const { addNotification } = useNotificationsStore();

  const [search, setSearch] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'restore' | 'delete' | 'empty'; item?: TrashedItem } | null>(null);

  useEffect(() => {
    fetchTrash();
  }, [fetchTrash]);

  const collectionOptions = useMemo(() => {
    const cols = [...new Set(items.map((i) => i.collection))];
    return cols.sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = search.toLowerCase();
      const matchSearch = !q || item.collection.toLowerCase().includes(q) || JSON.stringify(item.data).toLowerCase().includes(q);
      const matchFilter = filter === 'all' || item.collection === filter;
      return matchSearch && matchFilter;
    });
  }, [items, search, filter]);

  const handleRestore = async (item: TrashedItem) => {
    const success = await restoreItem(item.id);
    if (success) {
      addNotification({ title: 'Restored', message: `Item restored to ${item.collectionLabel}` });
    } else {
      addNotification({ title: 'Error', message: 'Failed to restore item' });
    }
    setConfirmOpen(false);
    setConfirmAction(null);
  };

  const handlePermanentDelete = async (item: TrashedItem) => {
    const success = await permanentDelete(item.id);
    if (success) {
      addNotification({ title: 'Deleted', message: 'Item permanently deleted' });
    } else {
      addNotification({ title: 'Error', message: 'Failed to delete item' });
    }
    setConfirmOpen(false);
    setConfirmAction(null);
  };

  const handleEmptyTrash = async () => {
    const success = await emptyTrash();
    if (success) {
      addNotification({ title: 'Trash Emptied', message: 'All items permanently deleted' });
    } else {
      addNotification({ title: 'Error', message: 'Failed to empty trash' });
    }
    setConfirmOpen(false);
    setConfirmAction(null);
  };

  const openConfirm = (type: 'restore' | 'delete' | 'empty', item?: TrashedItem) => {
    setConfirmAction({ type, item });
    setConfirmOpen(true);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) return `${days}d remaining`;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return `${hours}h remaining`;
  };

  const getCollectionColor = (collection: string) => {
    const colors = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#EF4444'];
    return colors[collection.length % colors.length];
  };

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
                background: `linear-gradient(135deg, #EF4444, #DC2626)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Trash2 size={24} color="#fff" />
            </Box>
            <Box>
              <Typography variant="h3" fontWeight={700}>Trash</Typography>
              <Typography variant="body1" color="text.secondary">
                {items.length} item{items.length !== 1 ? 's' : ''} in trash
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshCw size={16} />}
            onClick={fetchTrash}
            sx={{ borderRadius: '10px' }}
          >
            Refresh
          </Button>
          {items.length > 0 && (
            <Button
              variant="contained"
              color="error"
              size="small"
              startIcon={<Trash2 size={16} />}
              onClick={() => openConfirm('empty')}
              sx={{ borderRadius: '10px' }}
            >
              Empty Trash
            </Button>
          )}
        </Box>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 280 }}
          slotProps={{
            input: {
              startAdornment: <Search size={16} style={{ marginRight: 8, opacity: 0.5 }} />,
            },
          }}
        />
        <TextField
          size="small"
          select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          sx={{ width: 180 }}
          slotProps={{
            input: {
              startAdornment: <Filter size={16} style={{ marginRight: 8, opacity: 0.5 }} />,
            },
          }}
        >
          <MenuItem value="all">All Collections</MenuItem>
          {collectionOptions.map((col) => (
            <MenuItem key={col} value={col}>
              {collections[col]?.label || col}
            </MenuItem>
          ))}
        </TextField>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
          {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filteredItems.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center', borderRadius: '20px' }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: alpha('#EF4444', 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}
          >
            <Trash2 size={36} style={{ opacity: 0.4 }} />
          </Box>
          <Typography variant="h6" fontWeight={700} mb={1}>Trash is empty</Typography>
          <Typography variant="body2" color="text.secondary">
            {search || filter !== 'all' ? 'No items match your filters' : 'Deleted items will appear here'}
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredItems.map((item) => {
            const color = getCollectionColor(item.collection);
            const title = item.data.title || item.data.name || item.data.label || `#${item.id.substring(0, 8)}`;
            return (
              <Paper
                key={item.id}
                sx={{
                  p: 2.5,
                  borderRadius: '16px',
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 200ms',
                  '&:hover': {
                    borderColor: alpha('#EF4444', 0.3),
                    boxShadow: `0 4px 20px ${alpha('#EF4444', 0.1)}`,
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '12px',
                      bgcolor: alpha(color, 0.1),
                      color: color,
                    }}
                  >
                    <Database size={20} />
                  </Avatar>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" fontWeight={700} noWrap>
                      {title}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
                      <Chip
                        label={item.collectionLabel}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: 11,
                          bgcolor: alpha(color, 0.1),
                          color: color,
                          fontWeight: 600,
                        }}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <User size={12} style={{ opacity: 0.4 }} />
                        <Typography variant="caption" color="text.secondary">
                          {item.deletedBy}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Calendar size={12} style={{ opacity: 0.4 }} />
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(item.deletedAt)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {item.expiresAt && (
                    <Chip
                      label={getTimeRemaining(item.expiresAt)}
                      size="small"
                      icon={<AlertTriangle size={12} />}
                      sx={{
                        height: 22,
                        fontSize: 11,
                        bgcolor: alpha('#F59E0B', 0.1),
                        color: '#F59E0B',
                        '& .MuiChip-icon': { color: 'inherit' },
                      }}
                    />
                  )}

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Restore">
                      <IconButton
                        size="small"
                        onClick={() => openConfirm('restore', item)}
                        sx={{
                          borderRadius: '10px',
                          bgcolor: alpha('#10B981', 0.1),
                          color: '#10B981',
                          '&:hover': { bgcolor: alpha('#10B981', 0.2) },
                        }}
                      >
                        <RotateCcw size={18} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Permanently">
                      <IconButton
                        size="small"
                        onClick={() => openConfirm('delete', item)}
                        sx={{
                          borderRadius: '10px',
                          bgcolor: alpha('#EF4444', 0.1),
                          color: '#EF4444',
                          '&:hover': { bgcolor: alpha('#EF4444', 0.2) },
                        }}
                      >
                        <Trash2 size={18} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}

      {/* Confirm Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>
          {confirmAction?.type === 'restore' && 'Restore Item'}
          {confirmAction?.type === 'delete' && 'Delete Permanently'}
          {confirmAction?.type === 'empty' && 'Empty Trash'}
        </DialogTitle>
        <DialogContent>
          {confirmAction?.type === 'restore' && (
            <Typography>Are you sure you want to restore this item to {confirmAction.item?.collectionLabel}?</Typography>
          )}
          {confirmAction?.type === 'delete' && (
            <Typography>This action cannot be undone. Are you sure you want to permanently delete this item?</Typography>
          )}
          {confirmAction?.type === 'empty' && (
            <Typography>This will permanently delete all {items.length} items in trash. This action cannot be undone.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color={confirmAction?.type === 'restore' ? 'success' : 'error'}
            onClick={() => {
              if (confirmAction?.type === 'restore' && confirmAction.item) handleRestore(confirmAction.item);
              else if (confirmAction?.type === 'delete' && confirmAction.item) handlePermanentDelete(confirmAction.item);
              else if (confirmAction?.type === 'empty') handleEmptyTrash();
            }}
          >
            {confirmAction?.type === 'restore' ? 'Restore' : confirmAction?.type === 'delete' ? 'Delete Forever' : 'Empty All'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
