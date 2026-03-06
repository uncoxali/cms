"use client";

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import { useTheme, alpha } from '@mui/material/styles';
import { useSchemaStore } from '@/store/schema';
import { useBookmarksStore } from '@/store/bookmarks';
import { useAuthStore, hasCollectionAccess } from '@/store/auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Database, Bookmark as BookmarkIcon, ChevronRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function ContentSidebar() {
  const pathname = usePathname();
  const { collections } = useSchemaStore();
  const user = useAuthStore((s) => s.user);
  const allCollections = Object.entries(collections)
    .map(([key, val]) => ({ ...val, id: key }))
    .filter(col => hasCollectionAccess(user, col.id, 'read'));
  const bookmarks = useBookmarksStore(state => state.bookmarks);
  const [openCollections, setOpenCollections] = useState<Record<string, boolean>>({});
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const toggleCollection = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenCollections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <Box sx={{
      width: 240,
      flexShrink: 0,
      height: '100%',
      bgcolor: isDark
        ? alpha(theme.palette.background.paper, 0.8)
        : theme.palette.background.paper,
      borderRight: `1px solid ${theme.palette.divider}`,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      backdropFilter: isDark ? 'blur(16px)' : 'none',
    }}>
      <Box sx={{
        p: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}>
        <Database size={16} style={{ opacity: 0.6 }} />
        <Typography variant="subtitle2" fontWeight={700} fontSize={12} letterSpacing="0.05em" textTransform="uppercase" color="text.secondary">
          Collections
        </Typography>
      </Box>
      <List sx={{ px: 1, pt: 1 }}>
        {allCollections.map(col => {
          const colBookmarks = bookmarks.filter(b => b.collection === col.id);
          const isOpen = openCollections[col.id];
          const isActive = pathname === `/admin/content/${col.id}`;

          return (
            <Box key={col.id}>
              <ListItemButton
                component={Link}
                href={`/admin/content/${col.id}`}
                sx={{
                  borderRadius: '10px',
                  mb: 0.5,
                  py: 0.75,
                  px: 1.25,
                  backgroundColor: isActive
                    ? alpha(theme.palette.primary.main, isDark ? 0.2 : 0.08)
                    : 'transparent',
                  color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
                  transition: 'all 200ms ease',
                  '&:hover': {
                    backgroundColor: isActive
                      ? alpha(theme.palette.primary.main, isDark ? 0.28 : 0.12)
                      : alpha(theme.palette.text.primary, isDark ? 0.06 : 0.04),
                    color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
                  <Database size={16} strokeWidth={isActive ? 2.5 : 1.5} />
                </ListItemIcon>
                <ListItemText
                  primary={col.label}
                  slotProps={{ primary: { fontSize: 13, fontWeight: isActive ? 600 : 400 } }}
                />
                {colBookmarks.length > 0 && (
                  <IconButton size="small" onClick={(e) => toggleCollection(col.id, e)} sx={{ p: 0.25, color: 'inherit' }}>
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </IconButton>
                )}
              </ListItemButton>

              <Collapse in={isOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding sx={{ pl: 3, pb: 0.5 }}>
                  {colBookmarks.map(bm => {
                    const bmUrl = `/admin/content/${col.id}?bookmark=${bm.id}`;
                    const isBmActive = pathname === `/admin/content/${col.id}` && typeof window !== 'undefined' && window.location.search.includes(`bookmark=${bm.id}`);
                    return (
                      <ListItemButton
                        key={bm.id}
                        component={Link}
                        href={bmUrl}
                        sx={{
                          borderRadius: '8px',
                          mb: 0.25,
                          py: 0.5,
                          backgroundColor: isBmActive
                            ? alpha(theme.palette.primary.main, isDark ? 0.18 : 0.08)
                            : 'transparent',
                          color: isBmActive ? theme.palette.primary.main : theme.palette.text.secondary,
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 24, color: 'inherit' }}>
                          <BookmarkIcon size={12} />
                        </ListItemIcon>
                        <ListItemText primary={bm.name} slotProps={{ primary: { fontSize: 12 } }} />
                      </ListItemButton>
                    );
                  })}
                </List>
              </Collapse>
            </Box>
          );
        })}
      </List>
    </Box>
  );
}
