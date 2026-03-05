"use client";

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import Switch from '@mui/material/Switch';
import { useBookmarksStore } from '@/store/bookmarks';
import { useSchemaStore } from '@/store/schema';
import { Settings, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function BookmarksSettingsPage() {
  const { bookmarks, deleteBookmark, updateBookmark } = useBookmarksStore();
  const { collections } = useSchemaStore();

  const handleScopeToggle = (id: string, currentScope: string) => {
    updateBookmark(id, { scope: currentScope === 'global' ? 'personal' : 'global' });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
        <Link href="/admin/settings" style={{ color: 'inherit' }}>
          <IconButton edge="start" color="inherit">
            <Settings size={20} />
          </IconButton>
        </Link>
        <Typography variant="h4" fontWeight={600}>
          Global Bookmarks
        </Typography>
      </Box>

      <TableContainer component={Paper} sx={{ backgroundColor: 'background.paper' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Collection</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Global Scope</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Author</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bookmarks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No bookmarks created yet.
                </TableCell>
              </TableRow>
            ) : (
              bookmarks.map((bm) => (
                <TableRow key={bm.id} hover>
                  <TableCell>{bm.name}</TableCell>
                  <TableCell>{collections[bm.collection]?.label || bm.collection}</TableCell>
                  <TableCell>
                    <Switch 
                      checked={bm.scope === 'global'}
                      onChange={() => handleScopeToggle(bm.id, bm.scope)}
                      color="primary"
                    />
                  </TableCell>
                  <TableCell>{bm.createdBy}</TableCell>
                  <TableCell>{new Date(bm.dateCreated).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    <IconButton color="error" onClick={() => deleteBookmark(bm.id)}>
                      <Trash2 size={18} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
