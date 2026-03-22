"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wsManager = void 0;
const ws_1 = require("ws");
const auth_1 = require("./auth");
class WsManager {
    wss = null;
    clients = new Map();
    pingInterval = null;
    init(server) {
        this.wss = new ws_1.WebSocketServer({ server, path: '/ws' });
        this.wss.on('connection', (ws, req) => {
            const url = new URL(req.url || '/', `http://${req.headers.host}`);
            const token = url.searchParams.get('token');
            if (!token) {
                ws.close(4001, 'Token required');
                return;
            }
            const payload = (0, auth_1.decodeToken)(token);
            if (!payload) {
                ws.close(4003, 'Invalid token');
                return;
            }
            const clientId = `${payload.userId}_${Date.now()}`;
            const client = {
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
                }
                catch { /* ignore malformed messages */ }
            });
            ws.on('pong', () => { client.isAlive = true; });
            ws.on('close', () => {
                this.clients.delete(clientId);
                const stillOnline = [...this.clients.values()].some(c => c.userId === payload.userId);
                if (!stillOnline)
                    this.broadcastPresence(payload.userId, false);
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
    handleMessage(clientId, client, msg) {
        switch (msg.event) {
            case 'join_room':
                if (msg.room)
                    client.rooms.add(msg.room);
                break;
            case 'leave_room':
                if (msg.room)
                    client.rooms.delete(msg.room);
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
    broadcast(message, excludeClientId) {
        const payload = JSON.stringify(message);
        for (const [id, client] of this.clients) {
            if (id === excludeClientId)
                continue;
            if (client.ws.readyState === ws_1.WebSocket.OPEN) {
                client.ws.send(payload);
            }
        }
    }
    broadcastToRoom(room, message, excludeClientId) {
        const payload = JSON.stringify(message);
        for (const [id, client] of this.clients) {
            if (id === excludeClientId)
                continue;
            if (client.rooms.has(room) && client.ws.readyState === ws_1.WebSocket.OPEN) {
                client.ws.send(payload);
            }
        }
    }
    sendToUser(userId, message) {
        const payload = JSON.stringify(message);
        for (const client of this.clients.values()) {
            if (client.userId === userId && client.ws.readyState === ws_1.WebSocket.OPEN) {
                client.ws.send(payload);
            }
        }
    }
    broadcastPresence(userId, online) {
        this.broadcast({
            event: online ? 'user:online' : 'user:offline',
            data: { userId },
            timestamp: new Date().toISOString(),
        });
    }
    getOnlineUsers() {
        return [...new Set([...this.clients.values()].map(c => c.userId))];
    }
    getClientCount() {
        return this.clients.size;
    }
    shutdown() {
        if (this.pingInterval)
            clearInterval(this.pingInterval);
        this.wss?.close();
    }
}
exports.wsManager = new WsManager();
//# sourceMappingURL=ws.js.map