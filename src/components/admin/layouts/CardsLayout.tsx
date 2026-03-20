'use client';

import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid';
import Pagination from '@mui/material/Pagination';
import { useTheme, alpha } from '@mui/material/styles';
import { Eye, Pencil, Trash2, MoreVertical, Image } from 'lucide-react';
import { api } from '@/lib/api';
import { useConfirm } from '@/components/admin/ConfirmDialog';

interface CardsLayoutProps {
  collectionKey: string;
  fields: any[];
  canEdit: boolean;
  canDelete: boolean;
  onItemUpdate: () => void;
}

export default function CardsLayout({ 
  collectionKey, 
  fields,
  canEdit,
  canDelete,
  onItemUpdate 
}: CardsLayoutProps) {
  const theme = useTheme();
  const confirm = useConfirm();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCard, setSelectedCard] = useState<any | null>(null);
  const rowsPerPage = 12;

  const titleField = fields.find(f => ['title', 'name', 'label'].includes(f.name)) || fields[0];
  const imageField = fields.find(f => f.type === 'file' || f.name.includes('image') || f.name.includes('avatar'));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: any[]; meta: { total: number } }>(`/items/${String(collectionKey)}`, {
        limit: String(rowsPerPage),
        page: String(page),
      });
      
      setData(res.data || []);
      const total = res.meta?.total || 0;
      setTotalPages(Math.ceil(total / rowsPerPage));
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, [collectionKey, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (item: any) => {
    const ok = await confirm({
      title: 'Delete Item',
      message: 'Are you sure you want to delete this item?',
      confirmText: 'Delete',
      severity: 'error'
    });
    if (!ok) return;

    try {
      await api.del(`/items/${collectionKey}/${item.id}`);
      fetchData();
      onItemUpdate();
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const getFieldValue = (item: any, field: any) => {
    const value = item[field.name];
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value).slice(0, 50);
  };

  const getDisplayValue = (item: any) => {
    if (titleField) return getFieldValue(item, titleField);
    return `#${item.id}`;
  };

  const getImageUrl = (item: any) => {
    if (!imageField) return null;
    const value = item[imageField.name];
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (value.url) return value.url;
    if (value.data?.url) return value.data.url;
    return null;
  };

  return (
    <Box>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <Typography color="text.secondary">Loading...</Typography>
        </Box>
      ) : data.length === 0 ? (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography color="text.secondary">No items found</Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={2}>
            {data.map((item) => {
              const imageUrl = getImageUrl(item);
              const displayValue = getDisplayValue(item);

              return (
                <Grid key={item.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                  <Paper
                    sx={{
                      overflow: 'hidden',
                      transition: 'all 200ms ease',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                      },
                    }}
                    onClick={() => setSelectedCard(item)}
                  >
                    {imageUrl && (
                      <Box
                        sx={{
                          height: 160,
                          backgroundImage: `url(${imageUrl})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                        }}
                      />
                    )}
                    {!imageUrl && (
                      <Box
                        sx={{
                          height: 120,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                        }}
                      >
                        <Image size={40} color={theme.palette.text.disabled} />
                      </Box>
                    )}

                    <Box sx={{ p: 2 }}>
                      <Typography 
                        variant="subtitle1" 
                        fontWeight={700} 
                        sx={{ 
                          mb: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {displayValue}
                      </Typography>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
                        {fields.slice(1, 4).map((field) => {
                          const value = getFieldValue(item, field);
                          if (value === '—' || field.name === imageField?.name) return null;
                          return (
                            <Box key={field.name} sx={{ display: 'flex', gap: 1 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60 }}>
                                {field.label}:
                              </Typography>
                              <Typography variant="caption" sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {value}
                              </Typography>
                            </Box>
                          );
                        })}
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/admin/content/${collectionKey}/${item.id}`;
                          }}
                        >
                          <Eye size={16} />
                        </IconButton>
                        {canEdit && (
                          <IconButton 
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `/admin/content/${collectionKey}/${item.id}`;
                            }}
                          >
                            <Pencil size={16} />
                          </IconButton>
                        )}
                        {canDelete && (
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item);
                            }}
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {selectedCard && (
        <Box
          onClick={() => setSelectedCard(null)}
          sx={{
            position: 'fixed',
            inset: 0,
            bgcolor: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Paper
            onClick={(e) => e.stopPropagation()}
            sx={{ maxWidth: 500, width: '100%', p: 3 }}
          >
            {imageField && (
              <Box
                sx={{
                  height: 200,
                  backgroundImage: `url(${getImageUrl(selectedCard)})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: 1,
                  mb: 2,
                }}
              />
            )}
            <Typography variant="h6" fontWeight={700} mb={2}>
              {getDisplayValue(selectedCard)}
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {fields.map((field) => {
                const value = getFieldValue(selectedCard, field);
                if (value === '—') return null;
                return (
                  <Box key={field.name} sx={{ display: 'flex', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                      {field.label}:
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {value}
                    </Typography>
                  </Box>
                );
              })}
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button 
                variant="contained" 
                onClick={() => {
                  window.location.href = `/admin/content/${collectionKey}/${selectedCard.id}`;
                }}
              >
                View Details
              </Button>
              <Button variant="outlined" onClick={() => setSelectedCard(null)}>
                Close
              </Button>
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
}
