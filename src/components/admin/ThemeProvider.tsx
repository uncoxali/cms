"use client";

import { createTheme, ThemeProvider as MUIThemeProvider, alpha, Shadows } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import useMediaQuery from '@mui/material/useMediaQuery';
import { ReactNode, useEffect, useMemo } from 'react';
import { useProjectStore } from '@/store/project';
import { isRtlLocale } from '@/lib/i18n';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import rtlPlugin from 'stylis-plugin-rtl';
import { prefixer } from 'stylis';
import { THEME_PRESETS, ThemePreset } from '@/lib/themes';

const GOOGLE_FONT_FAMILIES = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Nunito',
  'Fira Sans', 'Vazirmatn', 'Yekan Bakh', 'Montserrat', 'Raleway',
  'Source Sans 3', 'Ubuntu', 'Noto Sans', 'Noto Sans Arabic',
];

function getGoogleFontUrl(family: string): string | null {
  if (family === 'system-ui' || family === 'monospace') return null;
  if (!GOOGLE_FONT_FAMILIES.includes(family)) return null;
  const encoded = family.replace(/ /g, '+');
  return `https://fonts.googleapis.com/css2?family=${encoded}:wght@300;400;500;600;700;800&display=swap`;
}

function buildFontStack(family: string): string {
  if (family === 'monospace') return "'Fira Code', 'JetBrains Mono', monospace";
  if (family === 'system-ui') return "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  return `'${family}', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
}

const ltrCache = createCache({ key: 'mui-ltr' });
const rtlCache = createCache({ key: 'mui-rtl', stylisPlugins: [prefixer, rtlPlugin] });

export const PASTEL_COLORS = {
  pink: { light: '#FDF2F8', main: '#F9A8D4', dark: '#F472B6' },
  purple: { light: '#F5F3FF', main: '#C4B5FD', dark: '#A78BFA' },
  blue: { light: '#EFF6FF', main: '#93C5FD', dark: '#60A5FA' },
  green: { light: '#ECFDF5', main: '#86EFAC', dark: '#4ADE80' },
  yellow: { light: '#FEFCE8', main: '#FDE047', dark: '#FACC15' },
  orange: { light: '#FFF7ED', main: '#FDBA74', dark: '#FB923C' },
  red: { light: '#FEF2F2', main: '#FCA5A5', dark: '#F87171' },
  gray: { light: '#F9FAFB', main: '#E5E7EB', dark: '#9CA3AF' },
};

export default function ThemeContext({ children }: { children: ReactNode }) {
  const themeMode = useProjectStore((s) => s.settings.theme);
  const themePresetId = useProjectStore((s) => s.settings.themePreset);
  const fontFamily = useProjectStore((s) => s.settings.fontFamily);
  const locale = useProjectStore((s) => s.settings.defaultLanguage);
  const customThemes = useProjectStore((s) => s.settings.customThemes);
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)', { noSsr: true });

  const resolvedMode = themeMode === 'system' ? (prefersDark ? 'dark' : 'light') : themeMode;
  const isDark = resolvedMode === 'dark';
  const isRtl = isRtlLocale(locale);

  const allPresets = { ...THEME_PRESETS };
  (customThemes || []).forEach(t => { allPresets[t.id] = t; });
  const activePreset: ThemePreset = allPresets[themePresetId] || THEME_PRESETS.midnight;
  const presetColors = activePreset.colors;

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
    document.documentElement.setAttribute('data-theme', themePresetId);
  }, [isRtl, isDark, themePresetId]);

  const baseTheme = useMemo(() => {
    const fontStack = buildFontStack(fontFamily);

    return createTheme({
      direction: isRtl ? 'rtl' : 'ltr',
      palette: {
        mode: isDark ? 'dark' : 'light',
      },
      typography: {
        fontFamily: fontStack,
        h1: { fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.2 },
        h2: { fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.3 },
        h3: { fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.3 },
        h4: { fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.4 },
        h5: { fontWeight: 600, letterSpacing: '-0.01em' },
        h6: { fontWeight: 600, letterSpacing: '-0.01em' },
        subtitle1: { fontWeight: 600, letterSpacing: '-0.01em' },
        subtitle2: { fontWeight: 600 },
        body1: { lineHeight: 1.7 },
        body2: { fontSize: '0.875rem', lineHeight: 1.6 },
        button: { textTransform: 'none', fontWeight: 600, letterSpacing: '-0.01em' },
        caption: { fontWeight: 500 },
      },
      shape: { borderRadius: 12 },
      shadows: [
        'none',
        isDark ? '0 1px 2px rgba(0,0,0,0.4)' : '0 1px 3px rgba(0,0,0,0.04)',
        isDark ? '0 2px 4px rgba(0,0,0,0.4)' : '0 2px 6px rgba(0,0,0,0.04)',
        isDark ? '0 4px 8px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.06)',
        isDark ? '0 6px 12px rgba(0,0,0,0.45)' : '0 6px 16px rgba(0,0,0,0.08)',
        isDark ? '0 8px 16px rgba(0,0,0,0.45)' : '0 8px 24px rgba(0,0,0,0.1)',
        isDark ? '0 12px 24px rgba(0,0,0,0.5)' : '0 12px 32px rgba(0,0,0,0.1)',
        isDark ? '0 16px 32px rgba(0,0,0,0.5)' : '0 16px 40px rgba(0,0,0,0.1)',
        isDark ? '0 20px 40px rgba(0,0,0,0.55)' : '0 20px 48px rgba(0,0,0,0.12)',
        isDark ? '0 24px 48px rgba(0,0,0,0.55)' : '0 24px 56px rgba(0,0,0,0.12)',
        isDark ? '0 28px 56px rgba(0,0,0,0.6)' : '0 28px 64px rgba(0,0,0,0.14)',
        isDark ? '0 32px 64px rgba(0,0,0,0.6)' : '0 32px 72px rgba(0,0,0,0.14)',
        isDark ? '0 36px 72px rgba(0,0,0,0.65)' : '0 36px 80px rgba(0,0,0,0.16)',
        isDark ? '0 40px 80px rgba(0,0,0,0.65)' : '0 40px 88px rgba(0,0,0,0.16)',
        isDark ? '0 44px 88px rgba(0,0,0,0.7)' : '0 44px 96px rgba(0,0,0,0.18)',
        isDark ? '0 48px 96px rgba(0,0,0,0.7)' : '0 48px 104px rgba(0,0,0,0.18)',
        isDark ? '0 52px 104px rgba(0,0,0,0.75)' : '0 52px 112px rgba(0,0,0,0.2)',
        isDark ? '0 56px 112px rgba(0,0,0,0.75)' : '0 56px 120px rgba(0,0,0,0.2)',
        isDark ? '0 60px 120px rgba(0,0,0,0.8)' : '0 60px 128px rgba(0,0,0,0.22)',
        isDark ? '0 64px 128px rgba(0,0,0,0.8)' : '0 64px 136px rgba(0,0,0,0.22)',
        isDark ? '0 68px 136px rgba(0,0,0,0.85)' : '0 68px 144px rgba(0,0,0,0.24)',
        isDark ? '0 72px 144px rgba(0,0,0,0.85)' : '0 72px 152px rgba(0,0,0,0.24)',
        isDark ? '0 76px 152px rgba(0,0,0,0.9)' : '0 76px 160px rgba(0,0,0,0.26)',
        isDark ? '0 80px 160px rgba(0,0,0,0.9)' : '0 80px 168px rgba(0,0,0,0.26)',
        isDark ? '0 84px 168px rgba(0,0,0,0.95)' : '0 84px 176px rgba(0,0,0,0.28)',
      ] as unknown as Shadows,
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            '@keyframes fadeIn': {
              from: { opacity: 0 },
              to: { opacity: 1 },
            },
            '@keyframes slideUp': {
              from: { opacity: 0, transform: 'translateY(8px)' },
              to: { opacity: 1, transform: 'translateY(0)' },
            },
            '*': {
              scrollBehavior: 'smooth',
            },
            '::selection': {
              backgroundColor: alpha('#8B5CF6', isDark ? 0.3 : 0.2),
              color: isDark ? '#fff' : '#18181B',
            },
            '::-webkit-scrollbar': {
              width: '6px',
              height: '6px',
            },
            '::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '::-webkit-scrollbar-thumb': {
              background: alpha(isDark ? '#fff' : '#000', 0.12),
              borderRadius: '6px',
              '&:hover': {
                background: alpha(isDark ? '#fff' : '#000', 0.2),
              },
            },
          },
        },
        MuiButton: {
          defaultProps: { disableElevation: true },
          styleOverrides: {
            root: {
              borderRadius: '10px',
              padding: '10px 20px',
              fontWeight: 600,
              transition: 'all 150ms ease',
            },
            sizeLarge: {
              padding: '12px 28px',
              fontSize: '0.9375rem',
            },
            sizeSmall: {
              padding: '6px 14px',
              fontSize: '0.8125rem',
            },
            contained: {
              backgroundColor: '#8B5CF6',
              color: '#fff',
              '&:hover': {
                backgroundColor: '#7C3AED',
              },
            },
            containedSecondary: {
              backgroundColor: '#EC4899',
              color: '#fff',
              '&:hover': {
                backgroundColor: '#DB2777',
              },
            },
            outlined: ({ theme: t }) => ({
              borderColor: t.palette.divider,
              '&:hover': {
                borderColor: t.palette.primary.main,
                backgroundColor: alpha(t.palette.primary.main, 0.04),
              },
            }),
            text: ({ theme: t }) => ({
              '&:hover': {
                backgroundColor: alpha(t.palette.primary.main, 0.04),
              },
            }),
          },
        },
        MuiPaper: {
          defaultProps: { elevation: 0 },
          styleOverrides: {
            root: ({ theme: t }) => ({
              backgroundImage: 'none',
              backgroundColor: t.palette.background.paper,
              border: `1px solid ${t.palette.divider}`,
              borderRadius: '16px',
            }),
          },
        },
        MuiCard: {
          defaultProps: { elevation: 0 },
          styleOverrides: {
            root: ({ theme: t }) => ({
              backgroundColor: t.palette.background.paper,
              border: `1px solid ${t.palette.divider}`,
              borderRadius: '16px',
            }),
          },
        },
        MuiTableCell: {
          styleOverrides: {
            root: ({ theme: t }) => ({
              borderColor: t.palette.divider,
              padding: '16px 20px',
            }),
            head: ({ theme: t }) => ({
              backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
              fontWeight: 600,
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
            root: {
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.75rem',
            },
            filled: ({ theme: t }) => ({
              backgroundColor: alpha(t.palette.primary.main, 0.1),
              color: t.palette.primary.main,
            }),
          },
        },
        MuiTextField: {
          defaultProps: { variant: 'outlined', size: 'small' },
          styleOverrides: {
            root: ({ theme: t }) => ({
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                '& fieldset': {
                  borderColor: t.palette.divider,
                },
                '&:hover fieldset': {
                  borderColor: alpha(t.palette.text.secondary, 0.5),
                },
                '&.Mui-focused fieldset': {
                  borderColor: t.palette.primary.main,
                  borderWidth: '2px',
                },
              },
            }),
          },
        },
        MuiOutlinedInput: {
          styleOverrides: {
            root: ({ theme: t }) => ({
              borderRadius: '10px',
            }),
            input: {
              padding: '12px 16px',
            },
          },
        },
        MuiDialog: {
          styleOverrides: {
            paper: ({ theme: t }) => ({
              borderRadius: '20px',
              border: `1px solid ${t.palette.divider}`,
              boxShadow: isDark
                ? '0 24px 80px rgba(0, 0, 0, 0.5)'
                : '0 24px 80px rgba(0, 0, 0, 0.1)',
              backgroundImage: 'none',
            }),
          },
        },
        MuiTab: {
          styleOverrides: {
            root: {
              textTransform: 'none' as const,
              fontWeight: 600,
              fontSize: '0.875rem',
              minHeight: 48,
            },
          },
        },
        MuiTabs: {
          styleOverrides: {
            indicator: {
              height: 3,
              borderRadius: '3px 3px 0 0',
              backgroundColor: '#8B5CF6',
            },
          },
        },
        MuiSwitch: {
          styleOverrides: {
            root: { width: 48, height: 28, padding: 0 },
            switchBase: {
              padding: 3,
              '&.Mui-checked': {
                transform: 'translateX(20px)',
                '& + .MuiSwitch-track': {
                  backgroundColor: '#8B5CF6',
                  opacity: 1,
                },
              },
            },
            thumb: {
              width: 22,
              height: 22,
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              backgroundColor: '#fff',
            },
            track: ({ theme: t }) => ({
              borderRadius: 14,
              backgroundColor: t.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
              opacity: 1,
            }),
          },
        },
        MuiTooltip: {
          styleOverrides: {
            tooltip: ({ theme: t }) => ({
              backgroundColor: isDark ? 'rgba(26, 26, 26, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(8px)',
              border: `1px solid ${t.palette.divider}`,
              borderRadius: '8px',
              fontSize: '0.8125rem',
              fontWeight: 500,
              padding: '8px 14px',
              boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.1)',
              color: t.palette.text.primary,
            }),
          },
        },
        MuiPopover: {
          styleOverrides: {
            paper: ({ theme: t }) => ({
              borderRadius: '16px',
              border: `1px solid ${t.palette.divider}`,
              boxShadow: isDark
                ? '0 20px 60px rgba(0,0,0,0.5)'
                : '0 20px 60px rgba(0,0,0,0.12)',
            }),
          },
        },
        MuiMenu: {
          styleOverrides: {
            paper: ({ theme: t }) => ({
              borderRadius: '12px',
              border: `1px solid ${t.palette.divider}`,
              boxShadow: isDark
                ? '0 16px 48px rgba(0,0,0,0.5)'
                : '0 16px 48px rgba(0,0,0,0.1)',
              padding: '6px',
            }),
          },
        },
        MuiMenuItem: {
          styleOverrides: {
            root: ({ theme: t }) => ({
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '2px',
              '&:last-child': { marginBottom: 0 },
              '&:hover': {
                backgroundColor: alpha(t.palette.primary.main, 0.06),
              },
              '&.Mui-selected': {
                backgroundColor: alpha(t.palette.primary.main, 0.1),
                '&:hover': {
                  backgroundColor: alpha(t.palette.primary.main, 0.14),
                },
              },
            }),
          },
        },
        MuiAvatar: {
          styleOverrides: {
            root: {
              fontWeight: 600,
            },
          },
        },
        MuiLinearProgress: {
          styleOverrides: {
            root: {
              borderRadius: 6,
              height: 6,
              backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
            },
            bar: {
              borderRadius: 6,
              backgroundColor: '#8B5CF6',
            },
          },
        },
        MuiSkeleton: {
          styleOverrides: {
            root: {
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
            },
          },
        },
        MuiListItemButton: {
          styleOverrides: {
            root: ({ theme: t }) => ({
              borderRadius: '10px',
              '&:hover': {
                backgroundColor: alpha(t.palette.primary.main, 0.04),
              },
              '&.Mui-selected': {
                backgroundColor: alpha(t.palette.primary.main, 0.08),
                '&:hover': {
                  backgroundColor: alpha(t.palette.primary.main, 0.12),
                },
              },
            }),
          },
        },
        MuiAlert: {
          styleOverrides: {
            root: ({ theme: t }) => ({
              borderRadius: '12px',
              border: `1px solid ${t.palette.divider}`,
            }),
          },
        },
      },
    });
  }, [isDark, fontFamily, isRtl]);

  const palette = useMemo(() => {
    return isDark
      ? {
          mode: 'dark' as const,
          primary: {
            main: presetColors.primary,
            light: alpha(presetColors.primary, 0.7).toString(),
            dark: alpha(presetColors.primary, 0.9).toString(),
            contrastText: '#FFFFFF',
          },
          secondary: {
            main: presetColors.secondary,
            light: alpha(presetColors.secondary, 0.7).toString(),
            dark: alpha(presetColors.secondary, 0.9).toString(),
            contrastText: '#FFFFFF',
          },
          background: {
            default: presetColors.background.default,
            paper: presetColors.background.paper,
          },
          divider: presetColors.divider,
          text: { primary: presetColors.text.primary, secondary: presetColors.text.secondary },
          action: {
            hover: alpha(presetColors.primary, 0.04),
            selected: alpha(presetColors.primary, 0.08),
            focus: alpha(presetColors.primary, 0.08),
          },
          success: { main: presetColors.success, light: alpha(presetColors.success, 0.7).toString(), dark: alpha(presetColors.success, 0.9).toString() },
          error: { main: presetColors.error, light: alpha(presetColors.error, 0.7).toString(), dark: alpha(presetColors.error, 0.9).toString() },
          warning: { main: presetColors.warning, light: alpha(presetColors.warning, 0.7).toString(), dark: alpha(presetColors.warning, 0.9).toString() },
          info: { main: presetColors.info, light: alpha(presetColors.info, 0.7).toString(), dark: alpha(presetColors.info, 0.9).toString() },
        }
      : {
          mode: 'light' as const,
          primary: {
            main: presetColors.primary,
            light: alpha(presetColors.primary, 0.7).toString(),
            dark: alpha(presetColors.primary, 0.9).toString(),
            contrastText: '#FFFFFF',
          },
          secondary: {
            main: presetColors.secondary,
            light: alpha(presetColors.secondary, 0.7).toString(),
            dark: alpha(presetColors.secondary, 0.9).toString(),
            contrastText: '#FFFFFF',
          },
          background: {
            default: presetColors.background.default,
            paper: presetColors.background.paper,
          },
          divider: presetColors.divider,
          text: { primary: presetColors.text.primary, secondary: presetColors.text.secondary },
          action: {
            hover: alpha(presetColors.primary, 0.02),
            selected: alpha(presetColors.primary, 0.06),
            focus: alpha(presetColors.primary, 0.06),
          },
          success: { main: presetColors.success, light: alpha(presetColors.success, 0.7).toString(), dark: alpha(presetColors.success, 0.9).toString() },
          error: { main: presetColors.error, light: alpha(presetColors.error, 0.7).toString(), dark: alpha(presetColors.error, 0.9).toString() },
          warning: { main: presetColors.warning, light: alpha(presetColors.warning, 0.7).toString(), dark: alpha(presetColors.warning, 0.9).toString() },
          info: { main: presetColors.info, light: alpha(presetColors.info, 0.7).toString(), dark: alpha(presetColors.info, 0.9).toString() },
        };
  }, [isDark, themePresetId, customThemes]);

  const theme = useMemo(() => createTheme(baseTheme, { palette }), [baseTheme, palette]);

  return (
    <CacheProvider value={isRtl ? rtlCache : ltrCache}>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </CacheProvider>
  );
}
