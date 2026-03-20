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
    const revisions = await db('item_revisions').select('*').orderBy('date_created', 'desc').limit(100);
    
    return NextResponse.json({
      data: revisions.map(r => ({
        id: r.id,
        collection: r.collection,
        itemId: r.item_id,
        itemName: r.item_name,
        version: r.version,
        changes: r.changes ? JSON.parse(r.changes) : [],
        user: {
          id: r.user_id,
          name: r.user_name,
        },
        status: r.status || 'published',
        dateCreated: r.date_created,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching revisions:', error);
    
    if (error.message?.includes('no such table')) {
      return NextResponse.json({ data: [] });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { collection, itemId, itemName, changes, status } = body;

    if (!collection || !itemId) {
      return NextResponse.json({ error: 'Collection and itemId are required' }, { status: 400 });
    }

    // Get the next version number for this item
    const existingRevisions = await db('item_revisions')
      .where({ collection, item_id: itemId })
      .orderBy('version', 'desc')
      .limit(1);
    
    const nextVersion = existingRevisions.length > 0 
      ? (existingRevisions[0].version || 0) + 1 
      : 1;

    const id = `rev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await db('item_revisions').insert({
      id,
      collection,
      item_id: itemId,
      item_name: itemName || '',
      version: nextVersion,
      changes: JSON.stringify(changes || []),
      user_id: (session as any).userId || (session as any).sub,
      user_name: (session as any).email || 'Unknown',
      status: status || 'draft',
      date_created: new Date().toISOString(),
    });

    return NextResponse.json({
      data: {
        id,
        collection,
        itemId,
        itemName,
        version: nextVersion,
        changes,
        user: {
          id: (session as any).userId || (session as any).sub,
          name: (session as any).email || 'Unknown',
        },
        status: status || 'draft',
        dateCreated: new Date().toISOString(),
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating revision:', error);
    
    if (error.message?.includes('no such table')) {
      try {
        await db.schema.createTable('item_revisions', (table) => {
          table.string('id').primary();
          table.string('collection').notNullable();
          table.string('item_id').notNullable();
          table.string('item_name');
          table.integer('version').defaultTo(1);
          table.text('changes');
          table.string('user_id');
          table.string('user_name');
          table.string('status').defaultTo('published');
          table.string('date_created');
          table.string('date_updated');
        });
        
        const body = await req.json();
        const id = `rev_${Date.now()}`;
        await db('item_revisions').insert({
          id,
          collection: body.collection,
          item_id: body.itemId,
          item_name: body.itemName || '',
          version: 1,
          changes: JSON.stringify(body.changes || []),
          user_id: (session as any)?.userId || (session as any)?.sub,
          user_name: (session as any)?.email || 'Unknown',
          status: body.status || 'draft',
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
