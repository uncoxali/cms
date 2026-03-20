"use client";

import { useAuthStore } from '@/store/auth';
import { useSchemaStore } from '@/store/schema';
import { useActivityStore } from '@/store/activity';
import { ExtensionRegistry } from '@/lib/meta/registry';
import { api } from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import ThemeProvider from '@/components/admin/ThemeProvider';
import Sidebar from '@/components/admin/Sidebar';
import Header from '@/components/admin/Header';
import { ConfirmDialogProvider } from '@/components/admin/ConfirmDialog';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { ShieldOff } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import RealtimeProvider from '@/components/admin/RealtimeProvider';
import ChatWidget from '@/components/admin/ChatWidget';
import CommandPalette from '@/components/admin/CommandPalette';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = useAuthStore((state) => state.role);
  const token = useAuthStore((state) => state.token);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const fetchSchema = useSchemaStore((state) => state.fetchSchema);
  const fetchLogs = useActivityStore((state) => state.fetchLogs);
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const restoringRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !hasHydrated) return;

    if (pathname === '/admin/login') {
      setReady(true);
      return;
    }

    if (role && token) {
      api.setToken(token);
      setReady(true);
      return;
    }

    if (token && !role && !restoringRef.current) {
      restoringRef.current = true;
      restoreSession().then((ok) => {
        restoringRef.current = false;
        if (!ok) {
          router.push('/admin/login');
        } else {
          setReady(true);
        }
      });
      return;
    }

    if (!token) {
      router.push('/admin/login');
    }
  }, [mounted, hasHydrated, role, token, pathname, router, restoreSession]);

  useEffect(() => {
    if (role && token) {
      api.setToken(token);
      fetchSchema();
      fetchLogs();
    }
  }, [role, token, fetchSchema, fetchLogs]);

  const hasAccess = (() => {
    if (!role) return false;
    if (pathname === '/admin/login') return true;
    if (pathname === '/admin/dashboard') return true;

    const matchingModule = ExtensionRegistry.modules.find(m =>
      pathname.startsWith(m.path) && m.path !== '/admin/dashboard'
    );

    if (!matchingModule) return true;

    return matchingModule.permissionsRequired.includes(role);
  })();

  if (!mounted) return null;

  if (!ready && pathname !== '/admin/login') {
    return (
      <ThemeProvider>
        <Box sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100vh', bgcolor: 'background.default',
        }}>
          <CircularProgress size={36} sx={{ color: '#6644ff' }} />
        </Box>
      </ThemeProvider>
    );
  }

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
      <RealtimeProvider>
      <ConfirmDialogProvider>
      <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: 'background.default' }}>
        <Sidebar />
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
          <Header />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              overflow: 'auto',
              p: 4,
              backgroundColor: 'background.default',
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
                  {t('auth.accessDenied')}
                </Typography>
                <Typography variant="body2" color="text.secondary" maxWidth={400}>
                  {t('auth.noPermission')}
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => router.push('/admin/dashboard')}
                  sx={{ borderColor: 'divider', color: 'text.secondary', borderRadius: '12px' }}
                >
                  {t('auth.backToDashboard')}
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
      <ChatWidget />
      <CommandPalette />
      </ConfirmDialogProvider>
      </RealtimeProvider>
    </ThemeProvider>
  );
}
