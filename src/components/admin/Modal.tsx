'use client';

import { ReactNode, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { alpha, useTheme, SxProps, Theme } from '@mui/material/styles';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  onSave?: () => void;
  saveText?: string;
  cancelText?: string;
  saving?: boolean;
  saveDisabled?: boolean;
  width?: 'sm' | 'md' | 'lg' | 'xl' | number;
  sidebar?: ReactNode;
  footer?: ReactNode;
  sx?: SxProps<Theme>;
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
  onSave,
  saveText = 'Save',
  cancelText = 'Cancel',
  saving = false,
  saveDisabled = false,
  width = 'md',
  sidebar,
  footer,
  sx,
}: ModalProps) {
  const theme = useTheme();

  const getWidth = () => {
    if (typeof width === 'number') return width;
    switch (width) {
      case 'sm': return 480;
      case 'lg': return 720;
      case 'xl': return 960;
      default: return 560;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: getWidth(),
          maxWidth: '100%',
          maxHeight: 'calc(100vh - 80px)',
          margin: 2,
          borderRadius: '12px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 40, 0.95)' : 'background.paper',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: `0 25px 50px -12px ${alpha('#000', 0.25)}`,
          ...sx,
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: alpha('#000', 0.5),
            backdropFilter: 'blur(4px)',
          },
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 3,
          py: 2.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          bgcolor: theme.palette.mode === 'dark' ? alpha('#fff', 0.02) : alpha('#000', 0.01),
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {icon && (
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme.palette.primary.main,
              }}
            >
              {icon}
            </Box>
          )}
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{
            color: theme.palette.text.secondary,
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
            },
          }}
        >
          <X size={18} />
        </IconButton>
      </Box>

      {/* Body */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <DialogContent
          sx={{
            flex: sidebar ? '1 1 60%' : 1,
            overflow: 'auto',
            p: 3,
            '&::-webkit-scrollbar': {
              width: 6,
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: alpha(theme.palette.text.primary, 0.15),
              borderRadius: 3,
            },
          }}
        >
          {children}
        </DialogContent>

        {/* Sidebar */}
        {sidebar && (
          <Box
            sx={{
              flex: '0 0 40%',
              borderLeft: `1px solid ${theme.palette.divider}`,
              p: 3,
              overflow: 'auto',
              bgcolor: theme.palette.mode === 'dark' ? alpha('#000', 0.2) : alpha('#000', 0.02),
            }}
          >
            {sidebar}
          </Box>
        )}
      </Box>

      {/* Footer */}
      {footer ? (
        <Box
          sx={{
            px: 3,
            py: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.mode === 'dark' ? alpha('#fff', 0.02) : alpha('#000', 0.01),
          }}
        >
          {footer}
        </Box>
      ) : (onSave || onClose) ? (
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.mode === 'dark' ? alpha('#fff', 0.02) : alpha('#000', 0.01),
            gap: 1,
          }}
        >
          <Button
            variant="text"
            onClick={onClose}
            disabled={saving}
            sx={{
              color: theme.palette.text.secondary,
              '&:hover': {
                bgcolor: alpha(theme.palette.text.primary, 0.05),
              },
            }}
          >
            {cancelText}
          </Button>
          {onSave && (
            <Button
              variant="contained"
              onClick={onSave}
              disabled={saving || saveDisabled}
              sx={{
                minWidth: 100,
                bgcolor: theme.palette.primary.main,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.85),
                },
                '&:disabled': {
                  bgcolor: alpha(theme.palette.primary.main, 0.3),
                },
              }}
            >
              {saving ? 'Saving...' : saveText}
            </Button>
          )}
        </DialogActions>
      ) : null}
    </Dialog>
  );
}

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  severity?: 'default' | 'danger';
  loading?: boolean;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  severity = 'default',
  loading = false,
}: ConfirmModalProps) {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: '12px',
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 40, 0.95)' : 'background.paper',
          backdropFilter: 'blur(20px)',
        },
      }}
    >
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </Box>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button
          variant="text"
          onClick={onClose}
          disabled={loading}
          sx={{ color: theme.palette.text.secondary }}
        >
          {cancelText}
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={loading}
          sx={{
            bgcolor: severity === 'danger' ? theme.palette.error.main : theme.palette.primary.main,
            '&:hover': {
              bgcolor: severity === 'danger'
                ? alpha(theme.palette.error.main, 0.85)
                : alpha(theme.palette.primary.main, 0.85),
            },
          }}
        >
          {loading ? 'Loading...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface FormSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  sx?: SxProps<Theme>;
}

export function FormSection({ title, description, children, sx }: FormSectionProps) {
  const theme = useTheme();

  return (
    <Box sx={{ mb: 3, ...sx }}>
      {(title || description) && (
        <Box sx={{ mb: 2 }}>
          {title && (
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
              {title}
            </Typography>
          )}
          {description && (
            <Typography variant="caption" color="text.secondary">
              {description}
            </Typography>
          )}
        </Box>
      )}
      {children}
    </Box>
  );
}

interface FormFieldProps {
  label: string;
  required?: boolean;
  description?: string;
  error?: string;
  children: ReactNode;
  sx?: SxProps<Theme>;
}

export function FormField({ label, required, description, error, children, sx }: FormFieldProps) {
  const theme = useTheme();

  return (
    <Box sx={{ mb: 2.5, ...sx }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
        <Typography variant="body2" fontWeight={600}>
          {label}
        </Typography>
        {required && (
          <Typography variant="caption" color="error" fontWeight={700}>
            *
          </Typography>
        )}
      </Box>
      {children}
      {description && !error && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          {description}
        </Typography>
      )}
      {error && (
        <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}

interface FormActionsProps {
  children: ReactNode;
}

export function FormActions({ children }: FormActionsProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 1,
        pt: 2,
        mt: 2,
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      {children}
    </Box>
  );
}
