import crypto from 'crypto';
import { getDb } from '@/lib/db';

export interface WebhookPayload {
  [key: string]: any;
}

export interface SendWebhookResult {
  ok: boolean;
  status: number;
  responseBody: string;
}

export async function sendWebhook(
  webhookId: string,
  payload: WebhookPayload,
): Promise<SendWebhookResult> {
  const db = getDb();

  const webhook = await db('neurofy_webhooks').where({ id: webhookId }).first();
  if (!webhook) {
    throw new Error(`Webhook ${webhookId} not found`);
  }

  const jsonBody = JSON.stringify(payload);

  const hmac = crypto.createHmac('sha256', webhook.secret);
  hmac.update(jsonBody, 'utf8');
  const signature = hmac.digest('hex');

  let status = 0;
  let responseText = '';

  try {
    const res = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-signature': signature,
      },
      body: jsonBody,
    });

    status = res.status;
    responseText = await res.text();
  } catch (err: any) {
    status = 0;
    responseText = `Network error: ${err?.message || String(err)}`;
  }

  const ok = status >= 200 && status < 300;

  await db('neurofy_webhook_logs').insert({
    webhook_id: webhook.id,
    status,
    request_body: jsonBody,
    response_body: responseText,
  });

  if (ok) {
    await db('neurofy_webhooks')
      .where({ id: webhook.id })
      .update({ last_triggered_at: new Date().toISOString() });
  }

  return { ok, status, responseBody: responseText };
}

export async function testWebhook(webhookId: string) {
  const payload: WebhookPayload = {
    event: 'webhook.test',
    timestamp: new Date().toISOString(),
    data: { hello: 'world' },
  };
  return sendWebhook(webhookId, payload);
}

