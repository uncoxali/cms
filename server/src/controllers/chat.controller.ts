import { Response } from 'express';
import { db } from '../config/database';
import { AuthenticatedRequest } from '../utils/auth';
import { v4 as uuid } from 'uuid';

// GET /api/chat/rooms
export async function getRooms(req: AuthenticatedRequest, res: Response) {
    try {
        const rooms = await db('neurofy_chat_rooms').orderBy('updated_at', 'desc');

        const data = rooms
            .map((r: any) => ({
                ...r,
                members: JSON.parse(r.members_json || '[]'),
            }))
            .filter((r: any) => r.type === 'group' || r.members.includes(req.auth!.userId));

        res.json({ data });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

// POST /api/chat/rooms
export async function createRoom(req: AuthenticatedRequest, res: Response) {
    try {
        const body = req.body;
        const id = `room_${uuid().replace(/-/g, '').slice(0, 12)}`;

        const members = body.members || [req.auth!.userId];
        if (!members.includes(req.auth!.userId)) members.push(req.auth!.userId);

        const row = {
            id,
            name: body.name || (body.type === 'direct' ? 'Direct Message' : 'Group Chat'),
            type: body.type || 'group',
            members_json: JSON.stringify(members),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        await db('neurofy_chat_rooms').insert(row);

        await db('neurofy_chat_messages').insert({
            room_id: id,
            user_id: 'system',
            user_email: null,
            message: `Room created by ${req.auth!.email}`,
            type: 'system',
            created_at: new Date().toISOString(),
        });

        res.status(201).json({ data: { ...row, members } });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

// GET /api/chat/messages
export async function getMessages(req: AuthenticatedRequest, res: Response) {
    try {
        const roomId = req.query.room_id as string;
        const limit = parseInt(req.query.limit as string || '50');
        const before = req.query.before as string;

        if (!roomId) return res.status(400).json({ error: 'room_id is required' });

        let query = db('neurofy_chat_messages')
            .where({ room_id: roomId })
            .orderBy('created_at', 'desc')
            .limit(limit);

        if (before) query = query.where('created_at', '<', before);

        const messages = await query;

        await db('neurofy_chat_rooms')
            .where({ id: roomId })
            .update({ updated_at: new Date().toISOString() });

        res.json({ data: messages.reverse() });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

// POST /api/chat/messages
export async function sendMessage(req: AuthenticatedRequest, res: Response) {
    try {
        const body = req.body;

        if (!body.room_id || !body.message) {
            return res.status(400).json({ error: 'room_id and message are required' });
        }

        const [id] = await db('neurofy_chat_messages').insert({
            room_id: body.room_id,
            user_id: req.auth!.userId,
            user_email: req.auth!.email,
            message: body.message,
            type: body.type || 'text',
            created_at: new Date().toISOString(),
        });

        await db('neurofy_chat_rooms')
            .where({ id: body.room_id })
            .update({ updated_at: new Date().toISOString() });

        res.status(201).json({
            data: {
                id,
                room_id: body.room_id,
                user_id: req.auth!.userId,
                user_email: req.auth!.email,
                message: body.message,
                type: body.type || 'text',
                created_at: new Date().toISOString(),
            },
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}
