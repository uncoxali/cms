"use client";

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Link from 'next/link';
import { useSchemaStore } from '@/store/schema';
import { Database } from 'lucide-react';

export default function ContentRootPage() {
  const { collections } = useSchemaStore();
  const allCollections = Object.entries(collections).map(([key, val]) => ({ ...val, id: key }));

  return (
    <Box>
      <Typography variant="h4" fontWeight={600} mb={1}>
        Content
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={4}>
        Select a collection to manage its content.
      </Typography>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
        {allCollections.map((col) => (
          <Link href={`/admin/content/${col.id}`} key={col.id} style={{ textDecoration: 'none' }}>
            <Paper 
              sx={{ 
                p: 3, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: 'action.hover',
                  transform: 'translateY(-2px)',
                  boxShadow: 3,
                }
              }}
            >
              <Box sx={{ p: 1.5, bgcolor: 'primary.main', borderRadius: 2, display: 'flex' }}>
                <Database size={24} color="white" />
              </Box>
              <Box>
                <Typography variant="h6" color="text.primary">{col.label}</Typography>
                <Typography variant="body2" color="text.secondary">{col.fields.length} Fields</Typography>
              </Box>
            </Paper>
          </Link>
        ))}
        {allCollections.length === 0 && (
          <Typography color="text.secondary">No collections defined. Create one in Settings → Data Model.</Typography>
        )}
      </Box>
    </Box>
  );
}
