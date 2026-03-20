import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

const db = getDb();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const template = await db('email_templates').where({ id }).first();
    
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        id: template.id,
        name: template.name,
        subject: template.subject,
        body: template.body,
        type: template.type,
        to: template.to_field,
        from: template.from_field,
        cc: template.cc,
        bcc: template.bcc,
        active: !!template.active,
        lastSent: template.last_sent,
        sentCount: template.sent_count || 0,
        dateCreated: template.date_created,
      },
    });
  } catch (error: any) {
    console.error('Error fetching email template:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { name, subject, body: emailBody, type, to, from, cc, bcc, active } = body;

    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (subject !== undefined) updateData.subject = subject;
    if (emailBody !== undefined) updateData.body = emailBody;
    if (type !== undefined) updateData.type = type;
    if (to !== undefined) updateData.to_field = to;
    if (from !== undefined) updateData.from_field = from;
    if (cc !== undefined) updateData.cc = cc;
    if (bcc !== undefined) updateData.bcc = bcc;
    if (active !== undefined) updateData.active = active ? 1 : 0;
    updateData.date_updated = new Date().toISOString();

    await db('email_templates').where({ id }).update(updateData);

    const updated = await db('email_templates').where({ id }).first();

    return NextResponse.json({
      data: {
        id: updated.id,
        name: updated.name,
        subject: updated.subject,
        body: updated.body,
        type: updated.type,
        to: updated.to_field,
        from: updated.from_field,
        active: !!updated.active,
        dateCreated: updated.date_created,
      },
    });
  } catch (error: any) {
    console.error('Error updating email template:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    await db('email_templates').where({ id }).delete();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting email template:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
