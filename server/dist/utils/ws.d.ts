import { WebSocket } from 'ws';
import type { Server as HttpServer } from 'http';
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
declare class WsManager {
    private wss;
    private clients;
    private pingInterval;
    init(server: HttpServer): void;
    private handleMessage;
    broadcast(message: WsMessage, excludeClientId?: string): void;
    broadcastToRoom(room: string, message: WsMessage, excludeClientId?: string): void;
    sendToUser(userId: string, message: WsMessage): void;
    private broadcastPresence;
    getOnlineUsers(): string[];
    getClientCount(): number;
    shutdown(): void;
}
export declare const wsManager: WsManager;
export {};
