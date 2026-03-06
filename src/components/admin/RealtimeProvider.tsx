"use client";

import { createContext, useContext, ReactNode, useEffect, useCallback, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { useWebSocket } from '@/lib/ws/client';
import type { WsMessage } from '@/lib/ws/events';

interface RealtimeContextValue {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  send: (event: string, data: Record<string, unknown>, room?: string) => void;
  on: (event: string, handler: (msg: WsMessage) => void) => () => void;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
  onlineUsers: string[];
  realtimeNotifications: RealtimeNotification[];
  clearNotifications: () => void;
}

export interface RealtimeNotification {
  id: string;
  event: string;
  message: string;
  data: Record<string, unknown>;
  timestamp: string;
  read: boolean;
}

const RealtimeContext = createContext<RealtimeContextValue>({
  status: 'disconnected',
  send: () => {},
  on: () => () => {},
  joinRoom: () => {},
  leaveRoom: () => {},
  onlineUsers: [],
  realtimeNotifications: [],
  clearNotifications: () => {},
});

export function useRealtime() {
  return useContext(RealtimeContext);
}

function eventToMessage(msg: WsMessage): string {
  switch (msg.event) {
    case 'item:created':
      return `New item created in ${msg.data.collection || 'collection'}`;
    case 'item:updated':
      return `Item updated in ${msg.data.collection || 'collection'}`;
    case 'item:deleted':
      return `Item deleted from ${msg.data.collection || 'collection'}`;
    case 'file:uploaded':
      return `File uploaded: ${msg.data.filename || 'file'}`;
    case 'file:deleted':
      return `File deleted`;
    case 'user:online':
      return `User came online`;
    case 'user:offline':
      return `User went offline`;
    default:
      return msg.event;
  }
}

export default function RealtimeProvider({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const { status, send, on, joinRoom, leaveRoom } = useWebSocket(token);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [realtimeNotifications, setRealtimeNotifications] = useState<RealtimeNotification[]>([]);

  const handlePresence = useCallback((msg: WsMessage) => {
    const userId = msg.data.userId as string;
    if (msg.event === 'user:online') {
      setOnlineUsers((prev) => [...new Set([...prev, userId])]);
    } else if (msg.event === 'user:offline') {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    }
  }, []);

  const handleNotification = useCallback((msg: WsMessage) => {
    const skipEvents = ['connected', 'user:online', 'user:offline', 'chat:typing'];
    if (skipEvents.includes(msg.event)) return;

    setRealtimeNotifications((prev) => [
      {
        id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        event: msg.event,
        message: eventToMessage(msg),
        data: msg.data,
        timestamp: msg.timestamp,
        read: false,
      },
      ...prev.slice(0, 49),
    ]);
  }, []);

  useEffect(() => {
    const unsub1 = on('user:online', handlePresence);
    const unsub2 = on('user:offline', handlePresence);
    const unsub3 = on('*', handleNotification);
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [on, handlePresence, handleNotification]);

  const clearNotifications = useCallback(() => {
    setRealtimeNotifications([]);
  }, []);

  return (
    <RealtimeContext.Provider
      value={{
        status,
        send,
        on,
        joinRoom,
        leaveRoom,
        onlineUsers,
        realtimeNotifications,
        clearNotifications,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}
