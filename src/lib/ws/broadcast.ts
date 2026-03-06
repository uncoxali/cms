import type { WsMessage, WsEventType } from './events';

let broadcastFn: ((msg: WsMessage) => void) | null = null;

export function setBroadcastFunction(fn: (msg: WsMessage) => void) {
  broadcastFn = fn;
}

export function broadcastEvent(
  event: WsEventType | string,
  data: Record<string, unknown>,
  userId?: string
) {
  if (!broadcastFn) return;
  broadcastFn({
    event,
    data,
    timestamp: new Date().toISOString(),
    userId,
  });
}
