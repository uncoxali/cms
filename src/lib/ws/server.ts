import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

interface WsMessage {
  event: string;
  data: any;
  room?: string;
}

class WsManager {
  private wss: WebSocketServer | null = null;
  private clients: Map<WebSocket, { rooms: Set<string>; userId?: string }> = new Map();

  init(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws, req) => {
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const token = url.searchParams.get('token');

      // In a real app, verify token here
      this.clients.set(ws, { rooms: new Set() });

      ws.on('message', (data) => {
        try {
          const message: WsMessage = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (e) {
          console.error('WS Message Error:', e);
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
      });
    });

    console.log('🔌 WebSocket Server initialized on /ws');
  }

  private handleMessage(ws: WebSocket, msg: WsMessage) {
    const client = this.clients.get(ws);
    if (!client) return;

    switch (msg.event) {
      case 'join_room':
        if (msg.room) client.rooms.add(msg.room);
        break;
      case 'leave_room':
        if (msg.room) client.rooms.delete(msg.room);
        break;
      default:
        // Broadcast to others or handle custom events
        break;
    }
  }

  broadcast(event: string, data: any, room?: string) {
    if (!this.wss) return;

    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        const clientData = this.clients.get(client as WebSocket);
        if (!room || clientData?.rooms.has(room)) {
          client.send(JSON.stringify({ event, data }));
        }
      }
    });
  }
}

export const wsManager = new WsManager();
