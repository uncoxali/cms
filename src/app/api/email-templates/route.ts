import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

const db = getDb();

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const templates = await db('email_templates').select('*').orderBy('date_created', 'desc');
    
    return NextResponse.json({
      data: templates.map(t => ({
        id: t.id,
        name: t.name,
        subject: t.subject,
        body: t.body,
        type: t.type,
        to: t.to_field,
        from: t.from_field,
        cc: t.cc,
        bcc: t.bcc,
        active: !!t.active,
        lastSent: t.last_sent,
        sentCount: t.sent_count || 0,
        dateCreated: t.date_created,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching email templates:', error);
    
    // Return empty if table doesn't exist yet
    if (error.message?.includes('no such table')) {
      return NextResponse.json({ data: [] });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, subject, body: emailBody, type, to, from, cc, bcc, active } = body;

    if (!name || !subject) {
      return NextResponse.json({ error: 'Name and subject are required' }, { status: 400 });
    }

    const id = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await db('email_templates').insert({
      id,
      name,
      subject,
      body: emailBody || '',
      type: type || 'custom',
      to_field: to || '',
      from_field: from || '',
      cc: cc || '',
      bcc: bcc || '',
      active: active !== false ? 1 : 0,
      sent_count: 0,
      date_created: new Date().toISOString(),
    });

    return NextResponse.json({
      data: {
        id,
        name,
        subject,
        body: emailBody,
        type: type || 'custom',
        to,
        from,
        active: active !== false,
        sentCount: 0,
        dateCreated: new Date().toISOString(),
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating email template:', error);
    
    // Create table if doesn't exist
    if (error.message?.includes('no such table')) {
      try {
        await db.schema.createTable('email_templates', (table) => {
          table.string('id').primary();
          table.string('name').notNullable();
          table.string('subject').notNullable();
          table.text('body');
          table.string('type').defaultTo('custom');
          table.string('to_field');
          table.string('from_field');
          table.string('cc');
          table.string('bcc');
          table.integer('active').defaultTo(1);
          table.integer('sent_count').defaultTo(0);
          table.string('last_sent');
          table.string('date_created');
          table.string('date_updated');
        });
        
        // Retry insert
        const body = await req.json();
        const id = `email_${Date.now()}`;
        await db('email_templates').insert({
          id,
          ...body,
          active: body.active !== false ? 1 : 0,
          sent_count: 0,
          date_created: new Date().toISOString(),
        });
        
        return NextResponse.json({ data: { id, ...body } }, { status: 201 });
      } catch (createError) {
        return NextResponse.json({ error: String(createError) }, { status: 500 });
      }
    }
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
