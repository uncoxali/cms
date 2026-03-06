export const WS_EVENTS = {
  ITEM_CREATED: 'item:created',
  ITEM_UPDATED: 'item:updated',
  ITEM_DELETED: 'item:deleted',
  FILE_UPLOADED: 'file:uploaded',
  FILE_DELETED: 'file:deleted',
  PAGE_CREATED: 'page:created',
  PAGE_UPDATED: 'page:updated',
  PAGE_DELETED: 'page:deleted',
  USER_JOINED: 'user:joined',
  USER_LEFT: 'user:left',
  CHAT_MESSAGE: 'chat:message',
  CHAT_TYPING: 'chat:typing',
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  NOTIFICATION: 'notification',
} as const;

export type WsEventType = (typeof WS_EVENTS)[keyof typeof WS_EVENTS];

export interface WsMessage {
  event: WsEventType | string;
  data: Record<string, unknown>;
  timestamp: string;
  userId?: string;
  room?: string;
}
