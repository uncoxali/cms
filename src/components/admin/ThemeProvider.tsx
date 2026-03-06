"use client";

import { createTheme, ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import useMediaQuery from '@mui/material/useMediaQuery';
import { ReactNode, useEffect, useMemo } from 'react';
import { useProjectStore } from '@/store/project';
import { isRtlLocale } from '@/lib/i18n';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import rtlPlugin from 'stylis-plugin-rtl';
import { prefixer } from 'stylis';

const GOOGLE_FONT_FAMILIES = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Nunito',
  'Fira Sans', 'Vazirmatn', 'Yekan Bakh', 'Montserrat', 'Raleway',
  'Source Sans 3', 'Ubuntu', 'Noto Sans', 'Noto Sans Arabic',
];

function getGoogleFontUrl(family: string): string | null {
  if (family === 'system-ui' || family === 'monospace') return null;
  if (!GOOGLE_FONT_FAMILIES.includes(family)) return null;
  const encoded = family.replace(/ /g, '+');
  return `https://fonts.googleapis.com/css2?family=${encoded}:wght@300;400;500;600;700&display=swap`;
}

function buildFontStack(family: string): string {
  if (family === 'monospace') return "'Fira Code', 'JetBrains Mono', monospace";
  if (family === 'system-ui') return "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  return `'${family}', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
}

const ltrCache = createCache({ key: 'mui-ltr' });
const rtlCache = createCache({ key: 'mui-rtl', stylisPlugins: [prefixer, rtlPlugin] });

export default function ThemeContext({ children }: { children: ReactNode }) {
  const themeMode = useProjectStore((s) => s.settings.theme);
  const fontFamily = useProjectStore((s) => s.settings.fontFamily);
  const locale = useProjectStore((s) => s.settings.defaultLanguage);
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)', { noSsr: true });

  const resolvedMode = themeMode === 'system' ? (prefersDark ? 'dark' : 'light') : themeMode;
  const isDark = resolvedMode === 'dark';
  const isRtl = isRtlLocale(locale);

  useEffect(() => {
    const url = getGoogleFontUrl(fontFamily);
    if (!url) return;
    const id = 'dynamic-google-font';
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (link) {
      if (link.href === url) return;
      link.href = url;
    } else {
      link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = url;
      document.head.appendChild(link);
    }
  }, [fontFamily]);

  useEffect(() => {
    document.body.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.classList.toggle('theme-dark', isDark);
    document.documentElement.classList.toggle('theme-light', !isDark);
  }, [isRtl, isDark]);

  const theme = useMemo(() => {
    const fontStack = buildFontStack(fontFamily);

    return createTheme({
      direction: isRtl ? 'rtl' : 'ltr',
      palette: isDark
        ? {
            mode: 'dark',
            primary: { main: '#6644ff', light: '#8B6FFF', dark: '#4422CC' },
            secondary: { main: '#1abc9c' },
            background: { default: '#0f1114', paper: '#171921' },
            divider: 'rgba(255, 255, 255, 0.06)',
            text: { primary: '#E4E6EB', secondary: '#8B8FA3' },
            action: { hover: 'rgba(255, 255, 255, 0.04)', selected: 'rgba(102, 68, 255, 0.08)' },
            success: { main: '#22C55E' },
            error: { main: '#EF4444' },
            warning: { main: '#F59E0B' },
            info: { main: '#3B82F6' },
          }
        : {
            mode: 'light',
            primary: { main: '#6644ff', light: '#8B6FFF', dark: '#4422CC' },
            secondary: { main: '#1abc9c' },
            background: { default: '#F4F6F8', paper: '#FFFFFF' },
            divider: 'rgba(0, 0, 0, 0.08)',
            text: { primary: '#1A1A2E', secondary: '#5A5A7A' },
            action: { hover: 'rgba(0, 0, 0, 0.04)', selected: 'rgba(102, 68, 255, 0.06)' },
            success: { main: '#16A34A' },
            error: { main: '#DC2626' },
            warning: { main: '#D97706' },
            info: { main: '#2563EB' },
          },
      typography: {
        fontFamily: fontStack,
        h4: { fontWeight: 700, letterSpacing: '-0.02em', fontSize: '1.75rem' },
        h5: { fontWeight: 700, letterSpacing: '-0.01em' },
        h6: { fontWeight: 600, letterSpacing: '-0.01em' },
        subtitle1: { fontWeight: 600 },
        body2: { fontSize: '0.8125rem', lineHeight: 1.6 },
        button: { textTransform: 'none', fontWeight: 600 },
      },
      shape: { borderRadius: 12 },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: '10px',
              padding: '8px 18px',
              fontWeight: 600,
              boxShadow: 'none',
              transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': { boxShadow: 'none' },
            },
            contained: {
              background: 'linear-gradient(135deg, #6644ff 0%, #5533dd 100%)',
              color: '#fff',
              '&:hover': {
                background: 'linear-gradient(135deg, #7755ff 0%, #6644ff 100%)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 16px rgba(102, 68, 255, 0.3)',
              },
            },
            outlined: ({ theme: t }) => ({
              borderColor: t.palette.divider,
              '&:hover': {
                borderColor: t.palette.text.secondary,
                backgroundColor: t.palette.action.hover,
              },
            }),
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: ({ theme: t }) => ({
              backgroundImage: 'none',
              backgroundColor: t.palette.background.paper,
              border: `1px solid ${t.palette.divider}`,
              borderRadius: '14px',
            }),
          },
        },
        MuiTableCell: {
          styleOverrides: {
            root: ({ theme: t }) => ({
              borderColor: t.palette.divider,
              padding: '14px 16px',
            }),
            head: ({ theme: t }) => ({
              backgroundColor: t.palette.action.hover,
              fontWeight: 700,
              fontSize: '0.75rem',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.05em',
              color: t.palette.text.secondary,
            }),
          },
        },
        MuiTableRow: {
          styleOverrides: {
            root: ({ theme: t }) => ({
              transition: 'background-color 150ms ease',
              '&:hover': {
                backgroundColor: `${t.palette.action.hover} !important`,
              },
            }),
          },
        },
        MuiChip: {
          styleOverrides: {
            root: { borderRadius: '8px', fontWeight: 600, fontSize: '0.75rem' },
          },
        },
        MuiTextField: {
          styleOverrides: {
            root: ({ theme: t }) => ({
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                '& fieldset': {
                  borderColor: t.palette.divider,
                  transition: 'border-color 200ms ease',
                },
                '&:hover fieldset': {
                  borderColor: t.palette.text.secondary,
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#6644ff',
                  boxShadow: '0 0 0 3px rgba(102, 68, 255, 0.1)',
                },
              },
            }),
          },
        },
        MuiDialog: {
          styleOverrides: {
            paper: ({ theme: t }) => ({
              borderRadius: '16px',
              border: `1px solid ${t.palette.divider}`,
              boxShadow: isDark ? '0 24px 80px rgba(0, 0, 0, 0.5)' : '0 24px 80px rgba(0, 0, 0, 0.15)',
              backgroundImage: 'none',
            }),
          },
        },
        MuiDrawer: {
          styleOverrides: {
            paper: ({ theme: t }) => ({
              borderRadius: '0',
              border: 'none',
              borderLeft: `1px solid ${t.palette.divider}`,
            }),
          },
        },
        MuiTab: {
          styleOverrides: {
            root: { textTransform: 'none', fontWeight: 600, fontSize: '0.875rem', minHeight: 44 },
          },
        },
        MuiTabs: {
          styleOverrides: {
            indicator: { height: 3, borderRadius: '3px 3px 0 0' },
          },
        },
        MuiSwitch: {
          styleOverrides: {
            root: { width: 44, height: 24, padding: 0 },
            switchBase: {
              padding: 2,
              '&.Mui-checked': {
                transform: 'translateX(20px)',
                '& + .MuiSwitch-track': { backgroundColor: '#6644ff', opacity: 1 },
              },
            },
            thumb: ({ theme: t }) => ({
              width: 20,
              height: 20,
              boxShadow: isDark ? '0 2px 4px rgba(0,0,0,0.2)' : '0 2px 4px rgba(0,0,0,0.1)',
              backgroundColor: t.palette.mode === 'dark' ? '#fff' : '#fff',
            }),
            track: ({ theme: t }) => ({
              borderRadius: 12,
              backgroundColor: t.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.15)',
              opacity: 1,
            }),
          },
        },
        MuiTooltip: {
          styleOverrides: {
            tooltip: ({ theme: t }) => ({
              backgroundColor: t.palette.mode === 'dark' ? '#252830' : '#333',
              border: `1px solid ${t.palette.divider}`,
              borderRadius: '8px',
              fontSize: '0.8125rem',
              fontWeight: 500,
              padding: '6px 12px',
              boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.3)' : '0 8px 24px rgba(0,0,0,0.1)',
            }),
          },
        },
        MuiPopover: {
          styleOverrides: {
            paper: ({ theme: t }) => ({
              borderRadius: '14px',
              border: `1px solid ${t.palette.divider}`,
              boxShadow: isDark ? '0 16px 48px rgba(0,0,0,0.4)' : '0 16px 48px rgba(0,0,0,0.12)',
            }),
          },
        },
      },
    });
  }, [isDark, fontFamily, isRtl]);

  return (
    <CacheProvider value={isRtl ? rtlCache : ltrCache}>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </CacheProvider>
  );
}
