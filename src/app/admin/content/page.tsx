"use client";

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Link from 'next/link';
import { useSchemaStore } from '@/store/schema';
import { alpha, useTheme } from '@mui/material/styles';
import { Database, Layers, ArrowRight, Plus } from 'lucide-react';

export default function ContentRootPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { collections } = useSchemaStore();
  const allCollections = Object.entries(collections).map(([key, val]) => ({ ...val, id: key }));

  const getCollectionColor = (collectionName: string) => {
    const colors = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#EF4444'];
    const index = collectionName.length % colors.length;
    return colors[index];
  };

  return (
    <Box sx={{ animation: 'fadeIn 300ms ease-out' }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h3" fontWeight={700} mb={0.5}>
            Content
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your collections and their content
          </Typography>
        </Box>
        <Box sx={{ px: 2, py: 1, borderRadius: '10px', bgcolor: alpha('#8B5CF6', 0.1), display: 'flex', alignItems: 'center', gap: 1 }}>
          <Layers size={16} color="#8B5CF6" />
          <Typography variant="body2" fontWeight={600} color="#8B5CF6">{allCollections.length} Collections</Typography>
        </Box>
      </Box>

      {/* Collections Grid */}
      {allCollections.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '20px' }}>
          <Box sx={{ width: 72, height: 72, borderRadius: '20px', bgcolor: alpha('#8B5CF6', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
            <Database size={32} color="#8B5CF6" style={{ opacity: 0.6 }} />
          </Box>
          <Typography variant="h6" fontWeight={700} mb={1}>No collections yet</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Create your first collection in Settings → Data Model.
          </Typography>
          <Link href="/admin/settings/data-model" style={{ textDecoration: 'none' }}>
            <Box component="button" sx={{
              display: 'inline-flex', alignItems: 'center', gap: 1, px: 2.5, py: 1.25,
              borderRadius: '10px', backgroundColor: '#8B5CF6', color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer',
              '&:hover': { backgroundColor: '#7C3AED' },
            }}>
              <Plus size={18} /> Create Collection
            </Box>
          </Link>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {allCollections.map((col, index) => {
            const color = getCollectionColor(col.id);
            return (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={col.id}>
                <Link href={`/admin/content/${col.id}`} style={{ textDecoration: 'none' }}>
                  <Paper
                    sx={{
                      p: 0,
                      overflow: 'hidden',
                      borderRadius: '16px',
                      transition: 'all 200ms ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 8px 30px ${alpha(color, 0.15)}`,
                        borderColor: alpha(color, 0.3),
                      },
                    }}
                  >
                    {/* Top accent bar */}
                    <Box sx={{ height: 4, bgcolor: color }} />

                    <Box sx={{ p: 2.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Box sx={{
                          width: 48, height: 48, borderRadius: '14px',
                          bgcolor: alpha(color, 0.1),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Database size={24} color={color} />
                        </Box>

                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight={700} mb={0.5}>
                            {col.label}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {col.fields.length} fields • CRUD enabled
                          </Typography>
                        </Box>

                        <Box sx={{
                          width: 32, height: 32, borderRadius: '10px',
                          bgcolor: alpha(color, 0.08),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <ArrowRight size={16} color={color} />
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                        <Box sx={{ px: 1.5, py: 0.5, borderRadius: '8px', bgcolor: alpha(color, 0.08) }}>
                          <Typography variant="caption" fontWeight={600} sx={{ color, fontSize: 11 }}>
                            {col.fields.length} Fields
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Paper>
                </Link>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}
