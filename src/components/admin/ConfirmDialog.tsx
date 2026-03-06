"use client";

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { AlertTriangle } from 'lucide-react';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  severity?: 'error' | 'warning' | 'info';
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

const SEVERITY_CONFIG = {
  error: { color: '#EF4444', bgTint: 'rgba(239,68,68,0.08)' },
  warning: { color: '#F59E0B', bgTint: 'rgba(245,158,11,0.08)' },
  info: { color: '#3B82F6', bgTint: 'rgba(59,130,246,0.08)' },
};

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    title: 'Confirm',
    message: '',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    severity: 'error',
  });

  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm: ConfirmFn = useCallback((opts) => {
    setOptions({
      title: opts.title ?? 'Confirm Action',
      message: opts.message,
      confirmText: opts.confirmText ?? 'Delete',
      cancelText: opts.cancelText ?? 'Cancel',
      severity: opts.severity ?? 'error',
    });
    setOpen(true);

    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleClose = (result: boolean) => {
    setOpen(false);
    resolveRef.current?.(result);
    resolveRef.current = null;
  };

  const sev = SEVERITY_CONFIG[options.severity || 'error'];

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        open={open}
        onClose={() => handleClose(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            overflow: 'hidden',
          },
        }}
      >
        <Box sx={{ bgcolor: sev.bgTint, px: 3, pt: 3, pb: 2, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box sx={{
            width: 40, height: 40, borderRadius: '12px',
            bgcolor: `${sev.color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <AlertTriangle size={20} color={sev.color} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              {options.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5} lineHeight={1.6}>
              {options.message}
            </Typography>
          </Box>
        </Box>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            onClick={() => handleClose(false)}
            color="inherit"
            variant="outlined"
            sx={{ borderColor: 'divider', fontWeight: 600 }}
          >
            {options.cancelText}
          </Button>
          <Button
            onClick={() => handleClose(true)}
            variant="contained"
            color={options.severity === 'error' ? 'error' : options.severity === 'warning' ? 'warning' : 'primary'}
            sx={{ fontWeight: 600 }}
            autoFocus
          >
            {options.confirmText}
          </Button>
        </DialogActions>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const fn = useContext(ConfirmContext);
  if (!fn) throw new Error('useConfirm must be used within ConfirmDialogProvider');
  return fn;
}
