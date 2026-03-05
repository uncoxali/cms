"use client";

import { createTheme, ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ReactNode, useMemo } from 'react';

export default function ThemeContext({
  children,
}: {
  children: ReactNode;
}) {
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: 'dark',
          primary: {
            main: '#6644ff',
            light: '#8B6FFF',
            dark: '#4422CC',
          },
          secondary: {
            main: '#1abc9c',
          },
          background: {
            default: '#0f1114',
            paper: '#171921',
          },
          divider: 'rgba(255, 255, 255, 0.06)',
          text: {
            primary: '#E4E6EB',
            secondary: '#8B8FA3',
          },
          action: {
            hover: 'rgba(255, 255, 255, 0.04)',
            selected: 'rgba(102, 68, 255, 0.08)',
          },
          success: { main: '#22C55E' },
          error: { main: '#EF4444' },
          warning: { main: '#F59E0B' },
          info: { main: '#3B82F6' },
        },
        typography: {
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          h4: {
            fontWeight: 700,
            letterSpacing: '-0.02em',
            fontSize: '1.75rem',
          },
          h5: {
            fontWeight: 700,
            letterSpacing: '-0.01em',
          },
          h6: {
            fontWeight: 600,
            letterSpacing: '-0.01em',
          },
          subtitle1: {
            fontWeight: 600,
          },
          body2: {
            fontSize: '0.8125rem',
            lineHeight: 1.6,
          },
          button: {
            textTransform: 'none',
            fontWeight: 600,
          },
        },
        shape: {
          borderRadius: 12,
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: '10px',
                padding: '8px 18px',
                fontWeight: 600,
                boxShadow: 'none',
                transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  boxShadow: 'none',
                },
              },
              contained: {
                background: 'linear-gradient(135deg, #6644ff 0%, #5533dd 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #7755ff 0%, #6644ff 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 16px rgba(102, 68, 255, 0.3)',
                },
              },
              outlined: {
                borderColor: 'rgba(255,255,255,0.1)',
                '&:hover': {
                  borderColor: 'rgba(255,255,255,0.2)',
                  backgroundColor: 'rgba(255,255,255,0.04)',
                },
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
                backgroundColor: '#171921',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '14px',
              },
            },
          },
          MuiTableCell: {
            styleOverrides: {
              root: {
                borderColor: 'rgba(255, 255, 255, 0.04)',
                padding: '14px 16px',
              },
              head: {
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                fontWeight: 700,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#8B8FA3',
              },
            },
          },
          MuiTableRow: {
            styleOverrides: {
              root: {
                transition: 'background-color 150ms ease',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.02) !important',
                },
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.75rem',
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                    transition: 'border-color 200ms ease',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.15)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#6644ff',
                    boxShadow: '0 0 0 3px rgba(102, 68, 255, 0.1)',
                  },
                },
              },
            },
          },
          MuiDialog: {
            styleOverrides: {
              paper: {
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 24px 80px rgba(0, 0, 0, 0.5)',
                backgroundImage: 'none',
              },
            },
          },
          MuiDrawer: {
            styleOverrides: {
              paper: {
                borderRadius: '0',
                border: 'none',
                borderLeft: '1px solid rgba(255, 255, 255, 0.06)',
              },
            },
          },
          MuiTab: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                minHeight: 44,
              },
            },
          },
          MuiTabs: {
            styleOverrides: {
              indicator: {
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
            },
          },
          MuiSwitch: {
            styleOverrides: {
              root: {
                width: 44,
                height: 24,
                padding: 0,
              },
              switchBase: {
                padding: 2,
                '&.Mui-checked': {
                  transform: 'translateX(20px)',
                  '& + .MuiSwitch-track': {
                    backgroundColor: '#6644ff',
                    opacity: 1,
                  },
                },
              },
              thumb: {
                width: 20,
                height: 20,
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              },
              track: {
                borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.1)',
                opacity: 1,
              },
            },
          },
          MuiTooltip: {
            styleOverrides: {
              tooltip: {
                backgroundColor: '#252830',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                fontWeight: 500,
                padding: '6px 12px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              },
            },
          },
          MuiPopover: {
            styleOverrides: {
              paper: {
                borderRadius: '14px',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
              },
            },
          },
        },
      }),
    []
  );

  return (
    <MUIThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MUIThemeProvider>
  );
}
