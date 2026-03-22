"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatCompletion = chatCompletion;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODELS = [
    'google/gemma-3n-e4b-it',
    'google/gemma-3n-e2b-it',
    'meta-llama/llama-3.1-8b-instruct',
];
function buildMessages(body) {
    const chatMessages = [
        {
            role: 'system',
            content: 'You are a helpful AI assistant for a CMS called Neurofy CMS. Help users with content management, data modeling, webhooks, file management, and general CMS questions. Be concise and use Markdown formatting when helpful.',
        },
        ...body.messages.map((m) => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content,
        })),
    ];
    if (body.file) {
        const lastMsg = chatMessages[chatMessages.length - 1];
        if (body.file.mimeType.startsWith('image/')) {
            lastMsg.content = [
                { type: 'text', text: lastMsg.content },
                { type: 'image_url', image_url: { url: `data:${body.file.mimeType};base64,${body.file.data}` } },
            ];
        }
        else {
            lastMsg.content = `${lastMsg.content}\n\n[Attached file: ${body.file.mimeType}]`;
        }
    }
    return chatMessages;
}
async function tryModel(model, messages, apiKey) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
        const res = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://neurofy-cms.local',
                'X-Title': 'Neurofy CMS',
            },
            body: JSON.stringify({ model, messages, stream: true, temperature: 0.7, max_tokens: 4096 }),
            signal: controller.signal,
        });
        clearTimeout(timeout);
        return res;
    }
    catch (err) {
        clearTimeout(timeout);
        throw err;
    }
}
// POST /api/ai/chat
async function chatCompletion(req, res) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey === 'YOUR_OPENROUTER_API_KEY_HERE') {
        return res.status(500).json({ error: 'OPENROUTER_API_KEY not configured' });
    }
    try {
        const body = req.body;
        const { messages } = body;
        if (!messages || messages.length === 0) {
            return res.status(400).json({ error: 'Messages are required' });
        }
        const chatMessages = buildMessages(body);
        // Race all models simultaneously
        const results = await Promise.allSettled(MODELS.map(async (model) => {
            const result = await tryModel(model, chatMessages, apiKey);
            if (!result.ok) {
                const err = await result.json().catch(() => ({}));
                throw new Error(err?.error?.message || `Model ${model} failed (${result.status})`);
            }
            return result;
        }));
        // Find first successful response — stream SSE
        for (const result of results) {
            if (result.status === 'fulfilled') {
                res.writeHead(200, {
                    'Content-Type': 'text/event-stream; charset=utf-8',
                    'Cache-Control': 'no-cache, no-transform',
                    'Connection': 'keep-alive',
                    'X-Accel-Buffering': 'no',
                });
                const reader = result.value.body?.getReader();
                if (!reader) {
                    res.write(`data: ${JSON.stringify({ error: 'No response stream' })}\n\n`);
                    res.end();
                    return;
                }
                const decoder = new TextDecoder();
                let buffer = '';
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done)
                            break;
                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || '';
                        for (const line of lines) {
                            const trimmed = line.trim();
                            if (!trimmed || !trimmed.startsWith('data: '))
                                continue;
                            const dataStr = trimmed.slice(6);
                            if (dataStr === '[DONE]') {
                                res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
                                res.end();
                                return;
                            }
                            try {
                                const parsed = JSON.parse(dataStr);
                                const text = parsed.choices?.[0]?.delta?.content;
                                if (text) {
                                    res.write(`data: ${JSON.stringify({ text })}\n\n`);
                                }
                            }
                            catch { }
                        }
                    }
                }
                catch (streamErr) {
                    const errMsg = streamErr instanceof Error ? streamErr.message : 'Stream interrupted';
                    try {
                        res.write(`data: ${JSON.stringify({ error: errMsg })}\n\n`);
                    }
                    catch { }
                }
                res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
                res.end();
                return;
            }
        }
        // All failed
        const errors = results
            .filter((r) => r.status === 'rejected')
            .map((r) => r.reason?.message || 'Unknown error');
        console.error('[All models failed]', errors);
        res.status(503).json({ error: 'All models are busy. Please try again in a moment.' });
    }
    catch (error) {
        console.error('[API Error]', error);
        const message = error instanceof Error ? error.message : 'Failed to generate response';
        res.status(500).json({ error: message });
    }
}
//# sourceMappingURL=ai.controller.js.map