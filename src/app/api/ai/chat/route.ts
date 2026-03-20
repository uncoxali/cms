import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const MODELS = [
    'google/gemma-3n-e4b-it',
    'google/gemma-3n-e2b-it',
    'meta-llama/llama-3.1-8b-instruct',
];

function buildMessages(body: { messages: { role: 'user' | 'model'; content: string }[]; file?: { mimeType: string; data: string } }) {
    const chatMessages: { role: string; content: string | unknown[] }[] = [
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
                { type: 'text', text: lastMsg.content as string },
                { type: 'image_url', image_url: { url: `data:${body.file.mimeType};base64,${body.file.data}` } },
            ];
        } else {
            lastMsg.content = `${lastMsg.content}\n\n[Attached file: ${body.file.mimeType}]`;
        }
    }

    return chatMessages;
}

async function tryModel(model: string, messages: unknown[], apiKey: string): Promise<Response> {
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
    } catch (err) {
        clearTimeout(timeout);
        throw err;
    }
}

function createStreamFromResponse(response: Response) {
    const encoder = new TextEncoder();
    const reader = response.body?.getReader();

    return new ReadableStream({
        async start(controller) {
            if (!reader) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'No response stream' })}\n\n`));
                controller.close();
                return;
            }

            const decoder = new TextDecoder();
            let buffer = '';

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed || !trimmed.startsWith('data: ')) continue;

                        const dataStr = trimmed.slice(6);
                        if (dataStr === '[DONE]') {
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
                            controller.close();
                            return;
                        }

                        try {
                            const parsed = JSON.parse(dataStr);
                            const text = parsed.choices?.[0]?.delta?.content;
                            if (text) {
                                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                            }
                        } catch { /* skip */ }
                    }
                }

                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
                controller.close();
            } catch (streamErr: unknown) {
                const errMsg = streamErr instanceof Error ? streamErr.message : 'Stream interrupted';
                try {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errMsg })}\n\n`));
                } catch { /* closed */ }
                controller.close();
            }
        },
    });
}

export async function POST(request: NextRequest) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey === 'YOUR_OPENROUTER_API_KEY_HERE') {
        return NextResponse.json({ error: 'OPENROUTER_API_KEY not configured' }, { status: 500 });
    }

    try {
        const body = await request.json();
        const { messages } = body as {
            messages: { role: 'user' | 'model'; content: string }[];
            file?: { mimeType: string; data: string };
        };

        if (!messages || messages.length === 0) {
            return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
        }

        const chatMessages = buildMessages(body);

        // Race all models simultaneously
        const results = await Promise.allSettled(
            MODELS.map(async (model) => {
                const res = await tryModel(model, chatMessages, apiKey);
                if (!res.ok) {
                    const err = await res.json().catch(() => ({})) as any;
                    throw new Error(err?.error?.message || `Model ${model} failed (${res.status})`);
                }
                return res;
            })
        );

        // Find first successful response
        for (const result of results) {
            if (result.status === 'fulfilled') {
                const stream = createStreamFromResponse(result.value);
                return new Response(stream, {
                    headers: {
                        'Content-Type': 'text/event-stream; charset=utf-8',
                        'Cache-Control': 'no-cache, no-transform',
                        'Connection': 'keep-alive',
                        'X-Accel-Buffering': 'no',
                    },
                });
            }
        }

        // All failed
        const errors = results
            .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
            .map((r) => r.reason?.message || 'Unknown error');

        console.error('[All models failed]', errors);
        return NextResponse.json(
            { error: 'All models are busy. Please try again in a moment.' },
            { status: 503 }
        );
    } catch (error: unknown) {
        console.error('[API Error]', error);
        const message = error instanceof Error ? error.message : 'Failed to generate response';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
