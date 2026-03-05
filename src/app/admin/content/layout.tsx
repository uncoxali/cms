"use client";

import Box from '@mui/material/Box';
import ContentSidebar from '@/components/admin/ContentSidebar';

export default function ContentLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden', m: -4 }}>
      <ContentSidebar />
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 4, height: '100%' }}>
        {children}
      </Box>
    </Box>
  );
}
