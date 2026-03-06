import { create } from 'zustand';

export interface WebhookLogItem {
  id: number;
  webhook_id: string;
  status: number;
  request_body: string;
  response_body: string;
  timestamp: string;
}

interface WebhookLogsState {
  logs: WebhookLogItem[];
  loading: boolean;
  error: string | null;
  fetchLogs: (webhookId: string) => Promise<void>;
}

export const useWebhookLogsStore = create<WebhookLogsState>()((set) => ({
  logs: [],
  loading: false,
  error: null,

  fetchLogs: async (webhookId: string) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/webhooks/${webhookId}/logs`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || res.statusText);
      }
      const data = await res.json();
      set({ logs: data.logs || [], loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load webhook logs', loading: false });
    }
  },
}));

