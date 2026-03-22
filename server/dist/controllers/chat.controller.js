"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRooms = getRooms;
exports.createRoom = createRoom;
exports.getMessages = getMessages;
exports.sendMessage = sendMessage;
const database_1 = require("../config/database");
const uuid_1 = require("uuid");
// GET /api/chat/rooms
async function getRooms(req, res) {
    try {
        const rooms = await (0, database_1.db)('neurofy_chat_rooms').orderBy('updated_at', 'desc');
        const data = rooms
            .map((r) => ({
            ...r,
            members: JSON.parse(r.members_json || '[]'),
        }))
            .filter((r) => r.type === 'group' || r.members.includes(req.auth.userId));
        res.json({ data });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
// POST /api/chat/rooms
async function createRoom(req, res) {
    try {
        const body = req.body;
        const id = `room_${(0, uuid_1.v4)().replace(/-/g, '').slice(0, 12)}`;
        const members = body.members || [req.auth.userId];
        if (!members.includes(req.auth.userId))
            members.push(req.auth.userId);
        const row = {
            id,
            name: body.name || (body.type === 'direct' ? 'Direct Message' : 'Group Chat'),
            type: body.type || 'group',
            members_json: JSON.stringify(members),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        await (0, database_1.db)('neurofy_chat_rooms').insert(row);
        await (0, database_1.db)('neurofy_chat_messages').insert({
            room_id: id,
            user_id: 'system',
            user_email: null,
            message: `Room created by ${req.auth.email}`,
            type: 'system',
            created_at: new Date().toISOString(),
        });
        res.status(201).json({ data: { ...row, members } });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
// GET /api/chat/messages
async function getMessages(req, res) {
    try {
        const roomId = req.query.room_id;
        const limit = parseInt(req.query.limit || '50');
        const before = req.query.before;
        if (!roomId)
            return res.status(400).json({ error: 'room_id is required' });
        let query = (0, database_1.db)('neurofy_chat_messages')
            .where({ room_id: roomId })
            .orderBy('created_at', 'desc')
            .limit(limit);
        if (before)
            query = query.where('created_at', '<', before);
        const messages = await query;
        await (0, database_1.db)('neurofy_chat_rooms')
            .where({ id: roomId })
            .update({ updated_at: new Date().toISOString() });
        res.json({ data: messages.reverse() });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
// POST /api/chat/messages
async function sendMessage(req, res) {
    try {
        const body = req.body;
        if (!body.room_id || !body.message) {
            return res.status(400).json({ error: 'room_id and message are required' });
        }
        const [id] = await (0, database_1.db)('neurofy_chat_messages').insert({
            room_id: body.room_id,
            user_id: req.auth.userId,
            user_email: req.auth.email,
            message: body.message,
            type: body.type || 'text',
            created_at: new Date().toISOString(),
        });
        await (0, database_1.db)('neurofy_chat_rooms')
            .where({ id: body.room_id })
            .update({ updated_at: new Date().toISOString() });
        res.status(201).json({
            data: {
                id,
                room_id: body.room_id,
                user_id: req.auth.userId,
                user_email: req.auth.email,
                message: body.message,
                type: body.type || 'text',
                created_at: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
//# sourceMappingURL=chat.controller.js.map