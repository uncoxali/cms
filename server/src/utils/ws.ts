import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage, Server as HttpServer } from 'http';
import { decodeToken } from './auth';

export interface WsMessage {
    event: string;
    data: any;
    timestamp: string;
    userId?: string;
    room?: string;
}

export interface WsClient {
    ws: WebSocket;
    userId: string;
    email: string;
    roleId: string;
    rooms: Set<string>;
    isAlive: boolean;
}

class WsManager {
    private wss: WebSocketServer | null = null;
    private clients = new Map<string, WsClient>();
    private pingInterval: ReturnType<typeof setInterval> | null = null;

    init(server: HttpServer) {
        this.wss = new WebSocketServer({ server, path: '/ws' });

        this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
            const url = new URL(req.url || '/', `http://${req.headers.host}`);
            const token = url.searchParams.get('token');

            if (!token) {
                ws.close(4001, 'Token required');
                return;
            }

            const payload = decodeToken(token);
            if (!payload) {
                ws.close(4003, 'Invalid token');
                return;
            }

            const clientId = `${payload.userId}_${Date.now()}`;
            const client: WsClient = {
                ws,
                userId: payload.userId,
                email: payload.email,
                roleId: payload.roleId,
                rooms: new Set(['global']),
                isAlive: true,
            };

            this.clients.set(clientId, client);
            this.broadcastPresence(payload.userId, true);

            ws.on('message', (raw) => {
                try {
                    const msg = JSON.parse(raw.toString());
                    this.handleMessage(clientId, client, msg);
                } catch { /* ignore malformed messages */ }
            });

            ws.on('pong', () => { client.isAlive = true; });

            ws.on('close', () => {
                this.clients.delete(clientId);
                const stillOnline = [...this.clients.values()].some(c => c.userId === payload.userId);
                if (!stillOnline) this.broadcastPresence(payload.userId, false);
            });

            ws.send(JSON.stringify({
                event: 'connected',
                data: { clientId, userId: payload.userId },
                timestamp: new Date().toISOString(),
            }));
        });

        this.pingInterval = setInterval(() => {
            for (const [id, client] of this.clients) {
                if (!client.isAlive) {
                    client.ws.terminate();
                    this.clients.delete(id);
                    continue;
                }
                client.isAlive = false;
                client.ws.ping();
            }
        }, 30000);

        console.log('[WS] WebSocket server initialized on /ws');
    }

    private handleMessage(clientId: string, client: WsClient, msg: any) {
        switch (msg.event) {
            case 'join_room':
                if (msg.room) client.rooms.add(msg.room);
                break;
            case 'leave_room':
                if (msg.room) client.rooms.delete(msg.room);
                break;
            case 'chat:message':
                this.broadcastToRoom(msg.room || 'global', {
                    event: 'chat:message',
                    data: { message: msg.data?.message, userId: client.userId, email: client.email },
                    timestamp: new Date().toISOString(),
                    userId: client.userId,
                    room: msg.room || 'global',
                }, clientId);
                break;
        }
    }

    broadcast(message: WsMessage, excludeClientId?: string) {
        const payload = JSON.stringify(message);
        for (const [id, client] of this.clients) {
            if (id === excludeClientId) continue;
            if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(payload);
            }
        }
    }

    broadcastToRoom(room: string, message: WsMessage, excludeClientId?: string) {
        const payload = JSON.stringify(message);
        for (const [id, client] of this.clients) {
            if (id === excludeClientId) continue;
            if (client.rooms.has(room) && client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(payload);
            }
        }
    }

    sendToUser(userId: string, message: WsMessage) {
        const payload = JSON.stringify(message);
        for (const client of this.clients.values()) {
            if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(payload);
            }
        }
    }

    private broadcastPresence(userId: string, online: boolean) {
        this.broadcast({
            event: online ? 'user:online' : 'user:offline',
            data: { userId },
            timestamp: new Date().toISOString(),
        });
    }

    getOnlineUsers(): string[] {
        return [...new Set([...this.clients.values()].map(c => c.userId))];
    }

    getClientCount(): number {
        return this.clients.size;
    }

    shutdown() {
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.wss?.close();
    }
}

export const wsManager = new WsManager();
