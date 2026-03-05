"use client";

import { useAuthStore } from '@/store/auth';
import { useSchemaStore } from '@/store/schema';
import { useActivityStore } from '@/store/activity';
import { ExtensionRegistry } from '@/lib/meta/registry';
import { api } from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import ThemeProvider from '@/components/admin/ThemeProvider';
import Sidebar from '@/components/admin/Sidebar';
import Header from '@/components/admin/Header';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { ShieldOff } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = useAuthStore((state) => state.role);
  const token = useAuthStore((state) => state.token);
  const fetchSchema = useSchemaStore((state) => state.fetchSchema);
  const fetchLogs = useActivityStore((state) => state.fetchLogs);
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!role && pathname !== '/admin/login') {
      router.push('/admin/login');
    }
  }, [role, router, pathname]);

  // Auto-fetch data from API when authenticated
  useEffect(() => {
    if (role && token) {
      api.setToken(token);
      fetchSchema();
      fetchLogs();
    }
  }, [role, token, fetchSchema, fetchLogs]);

  // Check if user has permission for current page
  const hasAccess = (() => {
    if (!role) return false;
    if (pathname === '/admin/login') return true;
    if (pathname === '/admin/dashboard') return true;

    // Find matching module
    const matchingModule = ExtensionRegistry.modules.find(m =>
      pathname.startsWith(m.path) && m.path !== '/admin/dashboard'
    );

    // If no module found (e.g. sub-pages), allow access
    if (!matchingModule) return true;

    return matchingModule.permissionsRequired.includes(role);
  })();

  if (!mounted) return null;

  if (pathname === '/admin/login') {
    return (
      <ThemeProvider>
        {children}
      </ThemeProvider>
    );
  }

  if (!role) return null;

  return (
    <ThemeProvider>
      <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: '#0f1114' }}>
        <Sidebar />
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
          <Header />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              overflow: 'auto',
              p: 4,
              backgroundColor: '#0f1114',
            }}
          >
            {hasAccess ? children : (
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: 3,
                textAlign: 'center',
              }}>
                <Box sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255, 82, 82, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <ShieldOff size={36} color="#ff5252" />
                </Box>
                <Typography variant="h5" fontWeight={700} color="text.primary">
                  Access Denied
                </Typography>
                <Typography variant="body2" color="text.secondary" maxWidth={400}>
                  You don&apos;t have permission to access this page. Please contact your administrator to request access.
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => router.push('/admin/dashboard')}
                  sx={{ borderColor: 'rgba(255,255,255,0.15)', color: 'text.secondary', borderRadius: '12px' }}
                >
                  Back to Dashboard
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
