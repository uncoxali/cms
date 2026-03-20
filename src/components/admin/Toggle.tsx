'use client';

import { Box, Typography, useTheme, SxProps, Theme } from '@mui/material';
import { useState, useEffect, useCallback } from 'react';
import { alpha } from '@mui/material/styles';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'success' | 'warning' | 'error';
  sx?: SxProps<Theme>;
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'medium',
  color = 'primary',
  sx,
}: ToggleProps) {
  const theme = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = useCallback(() => {
    if (!disabled) {
      onChange(!checked);
    }
  }, [checked, disabled, onChange]);

  const getColor = () => {
    switch (color) {
      case 'success':
        return '#22C55E';
      case 'warning':
        return '#F59E0B';
      case 'error':
        return '#EF4444';
      default:
        return theme.palette.primary.main;
    }
  };

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { track: { width: 36, height: 20 }, thumb: { size: 16, offset: 2 } };
      case 'large':
        return { track: { width: 56, height: 30 }, thumb: { size: 26, offset: 2 } };
      default:
        return { track: { width: 48, height: 26 }, thumb: { size: 22, offset: 2 } };
    }
  };

  const sizeConfig = getSizeConfig();
  const activeColor = getColor();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'opacity 200ms',
        ...sx,
      }}
      onClick={handleClick}
    >
      {/* Toggle Track */}
      <Box
        sx={{
          position: 'relative',
          width: sizeConfig.track.width,
          height: sizeConfig.track.height,
          borderRadius: '999px',
          bgcolor: mounted && checked
            ? alpha(activeColor, 0.2)
            : theme.palette.mode === 'dark'
              ? 'rgba(255,255,255,0.1)'
              : 'rgba(0,0,0,0.15)',
          border: `2px solid ${mounted && checked ? activeColor : 'transparent'}`,
          transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          '&:hover': !disabled ? {
            bgcolor: mounted && checked
              ? alpha(activeColor, 0.25)
              : theme.palette.mode === 'dark'
                ? 'rgba(255,255,255,0.15)'
                : 'rgba(0,0,0,0.2)',
          } : {},
          '&:active': !disabled ? {
            transform: 'scale(0.98)',
          } : {},
        }}
      >
        {/* Background Animation */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: mounted && checked ? activeColor : 'transparent',
            transition: 'background-color 250ms',
          }}
        />

        {/* Thumb */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            transform: `translateY(-50%) translateX(${mounted && checked
              ? sizeConfig.track.width - sizeConfig.thumb.size - sizeConfig.thumb.offset * 2
              : sizeConfig.thumb.offset
            }px)`,
            width: sizeConfig.thumb.size,
            height: sizeConfig.thumb.size,
            borderRadius: '50%',
            bgcolor: mounted && checked ? '#fff' : theme.palette.mode === 'dark' ? '#fff' : '#666',
            boxShadow: mounted && checked
              ? `0 2px 8px ${alpha(activeColor, 0.5)}, 0 0 0 2px ${alpha(activeColor, 0.2)}`
              : '0 2px 4px rgba(0,0,0,0.2)',
            transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Icon inside thumb */}
          {mounted && checked && (
            <Box
              component="svg"
              viewBox="0 0 24 24"
              sx={{
                width: size === 'small' ? 8 : size === 'large' ? 14 : 10,
                height: size === 'small' ? 8 : size === 'large' ? 14 : 10,
                fill: activeColor,
              }}
            >
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </Box>
          )}
        </Box>
      </Box>

      {/* Label */}
      {(label || description) && (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {label && (
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{
                color: theme.palette.text.primary,
                userSelect: 'none',
              }}
            >
              {label}
            </Typography>
          )}
          {description && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ userSelect: 'none' }}
            >
              {description}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}

interface StatusToggleProps {
  active: boolean;
  onToggle: (active: boolean) => void;
  labels?: { active: string; inactive: string };
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  sx?: SxProps<Theme>;
}

export function StatusToggle({
  active,
  onToggle,
  labels = { active: 'Active', inactive: 'Inactive' },
  disabled = false,
  size = 'medium',
  sx,
}: StatusToggleProps) {
  const theme = useTheme();

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { height: 28, fontSize: 11, px: 1.5 };
      case 'large':
        return { height: 40, fontSize: 14, px: 2.5 };
      default:
        return { height: 34, fontSize: 12, px: 2 };
    }
  };

  const sizeConfig = getSizeConfig();

  return (
    <Box
      sx={{
        display: 'inline-flex',
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        borderRadius: '999px',
        p: 0.5,
        gap: 0.5,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...sx,
      }}
    >
      <Box
        onClick={() => !disabled && onToggle(true)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          height: sizeConfig.height,
          px: sizeConfig.px,
          borderRadius: '999px',
          bgcolor: active ? '#22C55E' : 'transparent',
          color: active ? '#fff' : theme.palette.text.secondary,
          fontWeight: 600,
          fontSize: sizeConfig.fontSize,
          transition: 'all 200ms',
          userSelect: 'none',
          '&:hover': !disabled && !active ? {
            bgcolor: alpha('#22C55E', 0.1),
            color: '#22C55E',
          } : {},
        }}
      >
        {active && (
          <Box
            component="svg"
            viewBox="0 0 24 24"
            sx={{ width: 12, height: 12, fill: 'currentColor' }}
          >
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
          </Box>
        )}
        {labels.active}
      </Box>
      <Box
        onClick={() => !disabled && onToggle(false)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          height: sizeConfig.height,
          px: sizeConfig.px,
          borderRadius: '999px',
          bgcolor: !active ? alpha(theme.palette.text.secondary, 0.15) : 'transparent',
          color: !active ? theme.palette.text.primary : theme.palette.text.secondary,
          fontWeight: 600,
          fontSize: sizeConfig.fontSize,
          transition: 'all 200ms',
          userSelect: 'none',
          '&:hover': !disabled && active ? {
            bgcolor: alpha(theme.palette.text.secondary, 0.1),
          } : {},
        }}
      >
        {labels.inactive}
      </Box>
    </Box>
  );
}

interface EnableDisableToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  sx?: SxProps<Theme>;
}

export function EnableDisableToggle({
  enabled,
  onChange,
  disabled = false,
  size = 'medium',
  sx,
}: EnableDisableToggleProps) {
  const theme = useTheme();

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { height: 28, fontSize: 11, px: 1.5 };
      case 'large':
        return { height: 40, fontSize: 14, px: 2.5 };
      default:
        return { height: 34, fontSize: 12, px: 2 };
    }
  };

  const sizeConfig = getSizeConfig();

  return (
    <Box
      sx={{
        display: 'inline-flex',
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        borderRadius: '999px',
        p: 0.5,
        gap: 0.5,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...sx,
      }}
    >
      <Box
        onClick={() => !disabled && onChange(true)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          height: sizeConfig.height,
          px: sizeConfig.px,
          borderRadius: '999px',
          bgcolor: enabled ? '#22C55E' : 'transparent',
          color: enabled ? '#fff' : theme.palette.text.secondary,
          fontWeight: 600,
          fontSize: sizeConfig.fontSize,
          transition: 'all 200ms',
          userSelect: 'none',
          '&:hover': !disabled && !enabled ? {
            bgcolor: alpha('#22C55E', 0.1),
            color: '#22C55E',
          } : {},
        }}
      >
        <Box
          component="svg"
          viewBox="0 0 24 24"
          sx={{
            width: size === 'small' ? 10 : size === 'large' ? 16 : 12,
            height: size === 'small' ? 10 : size === 'large' ? 16 : 12,
            fill: 'currentColor',
          }}
        >
          <path d="M8 5v14l11-7z" />
        </Box>
        Enable
      </Box>
      <Box
        onClick={() => !disabled && onChange(false)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          height: sizeConfig.height,
          px: sizeConfig.px,
          borderRadius: '999px',
          bgcolor: !enabled ? alpha(theme.palette.text.secondary, 0.15) : 'transparent',
          color: !enabled ? theme.palette.text.primary : theme.palette.text.secondary,
          fontWeight: 600,
          fontSize: sizeConfig.fontSize,
          transition: 'all 200ms',
          userSelect: 'none',
          '&:hover': !disabled && enabled ? {
            bgcolor: alpha(theme.palette.text.secondary, 0.1),
          } : {},
        }}
      >
        <Box
          component="svg"
          viewBox="0 0 24 24"
          sx={{
            width: size === 'small' ? 10 : size === 'large' ? 16 : 12,
            height: size === 'small' ? 10 : size === 'large' ? 16 : 12,
            fill: 'currentColor',
          }}
        >
          <path d="M6 6h12v12H6z" />
        </Box>
        Disable
      </Box>
    </Box>
  );
}
