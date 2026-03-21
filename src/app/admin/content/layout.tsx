"use client";

import Box from '@mui/material/Box';
import ContentSidebar from '@/components/admin/ContentSidebar';

export default function ContentLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: 'flex',
        width: 'calc(100% + 64px)',
        height: 'calc(100% + 64px)',
        overflow: 'hidden',
        m: -4,
      }}
    >
      <ContentSidebar />
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 4 }}>
        {children}
      </Box>
    </Box>
  );
}
