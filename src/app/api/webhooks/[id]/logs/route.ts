import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';

type RouteParams = { params: Promise<Record<string, string>> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const db = getDb();
  const logs = await db('neurofy_webhook_logs')
    .where({ webhook_id: id })
    .orderBy('timestamp', 'desc')
    .limit(100);

  return NextResponse.json({ logs });
}

