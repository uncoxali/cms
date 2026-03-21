"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import type { WsMessage } from './events';

type WsStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
type EventHandler = (msg: WsMessage) => void;

const MAX_RECONNECT_DELAY = 30000;
const INITIAL_RECONNECT_DELAY = 1000;

export function useWebSocket(token: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<WsStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<WsMessage | null>(null);
  const handlersRef = useRef<Map<string, Set<EventHandler>>>(new Map());
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!token || !mountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    // Backend runs on port 8055 by default in this project
    const wsUrl = `${protocol}://${window.location.hostname}:8055/ws?token=${token}`;

    setStatus('connecting');
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      setStatus('connected');
      reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      try {
        const msg: WsMessage = JSON.parse(event.data);
        setLastMessage(msg);
        const handlers = handlersRef.current.get(msg.event);
        if (handlers) {
          handlers.forEach((h) => h(msg));
        }
        const wildcardHandlers = handlersRef.current.get('*');
        if (wildcardHandlers) {
          wildcardHandlers.forEach((h) => h(msg));
        }
      } catch { /* ignore parse errors */ }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setStatus('disconnected');
      reconnectTimerRef.current = setTimeout(() => {
        reconnectDelayRef.current = Math.min(
          reconnectDelayRef.current * 2,
          MAX_RECONNECT_DELAY
        );
        connect();
      }, reconnectDelayRef.current);
    };

    ws.onerror = () => {
      if (!mountedRef.current) return;
      setStatus('error');
    };
  }, [token]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((event: string, data: Record<string, unknown>, room?: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event, data, room }));
    }
  }, []);

  const on = useCallback((event: string, handler: EventHandler) => {
    if (!handlersRef.current.has(event)) {
      handlersRef.current.set(event, new Set());
    }
    handlersRef.current.get(event)!.add(handler);
    return () => {
      handlersRef.current.get(event)?.delete(handler);
    };
  }, []);

  const joinRoom = useCallback((room: string) => {
    send('join_room', {}, room);
  }, [send]);

  const leaveRoom = useCallback((room: string) => {
    send('leave_room', {}, room);
  }, [send]);

  return { status, lastMessage, send, on, joinRoom, leaveRoom };
}
