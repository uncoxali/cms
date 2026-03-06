'use client';

import { useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import { alpha, useTheme } from '@mui/material/styles';
import { useWebhookLogsStore } from '@/store/webhookLogs';

interface WebhookLogsPanelProps {
  webhookId: string;
  webhookName: string;
}

async function callTestWebhook(webhookId: string) {
  await fetch(`/api/webhooks/${webhookId}/test`, { method: 'POST' });
}

export default function WebhookLogsPanel({ webhookId, webhookName }: WebhookLogsPanelProps) {
  const theme = useTheme();
  const { logs, loading, error, fetchLogs } = useWebhookLogsStore();

  useEffect(() => {
    if (webhookId) {
      fetchLogs(webhookId);
    }
  }, [webhookId, fetchLogs]);

  const last = logs[0];
  const lastOk = last && last.status >= 200 && last.status < 300;

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2.5,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: last
                ? lastOk
                  ? theme.palette.success.main
                  : theme.palette.error.main
                : alpha(theme.palette.text.disabled, 0.5),
              boxShadow: last
                ? `0 0 8px ${
                    lastOk
                      ? alpha(theme.palette.success.main, 0.6)
                      : alpha(theme.palette.error.main, 0.6)
                  }`
                : 'none',
            }}
          />
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>
              Webhook Logs
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {webhookName} · {logs.length} deliveries
            </Typography>
          </Box>
        </Box>

        <Button
          size="small"
          variant="outlined"
          onClick={async () => {
            await callTestWebhook(webhookId);
            await fetchLogs(webhookId);
          }}
        >
          Test Webhook
        </Button>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {loading && (
          <Box
            sx={{
              py: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <CircularProgress size={20} />
            <Typography variant="caption" color="text.secondary">
              Loading logs…
            </Typography>
          </Box>
        )}

        {!loading && error && (
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              mb: 2,
              borderColor: alpha(theme.palette.error.main, 0.4),
              bgcolor: alpha(theme.palette.error.main, 0.04),
            }}
          >
            <Typography variant="caption" color="error">
              {error}
            </Typography>
          </Paper>
        )}

        {!loading && !error && logs.length === 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ py: 3, textAlign: 'center' }}
          >
            No deliveries yet.
          </Typography>
        )}

        {logs.map((log) => (
          <Paper
            key={log.id}
            variant="outlined"
            sx={{
              mb: 1.5,
              p: 1.5,
              borderRadius: 1.5,
              borderColor: alpha(theme.palette.divider, 0.8),
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 0.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={log.status || 'ERR'}
                  size="small"
                  color={
                    log.status >= 200 && log.status < 300 ? 'success' : 'error'
                  }
                />
                <Typography
                  variant="caption"
                  sx={{ fontFamily: 'monospace', color: 'text.secondary' }}
                >
                  {new Date(log.timestamp).toLocaleString()}
                </Typography>
              </Box>
            </Box>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600, mb: 0.5, display: 'block' }}
            >
              Payload
            </Typography>
            <Box
              component="pre"
              sx={{
                maxHeight: 120,
                overflow: 'auto',
                bgcolor: alpha(theme.palette.background.default, 0.9),
                borderRadius: 1,
                p: 1,
                fontFamily: 'monospace',
                fontSize: 11,
                whiteSpace: 'pre-wrap',
              }}
            >
              {log.request_body}
            </Box>

            {log.response_body && (
              <>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600, mt: 1, mb: 0.5, display: 'block' }}
                >
                  Response
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    maxHeight: 80,
                    overflow: 'auto',
                    bgcolor: alpha(theme.palette.background.default, 0.9),
                    borderRadius: 1,
                    p: 1,
                    fontFamily: 'monospace',
                    fontSize: 11,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {log.response_body}
                </Box>
              </>
            )}
          </Paper>
        ))}
      </Box>
    </Box>
  );
}

