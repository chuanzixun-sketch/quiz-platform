import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const limit = parseInt(searchParams.get('limit') || '50');

  if (id) {
    const result = await query('SELECT * FROM libraries WHERE id = $1 AND (owner_id = $2 OR visibility IN ($3, $4))', [id, userId, 'public', 'shared']);
    if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(result.rows[0]);
  }

  const result = await query('SELECT * FROM libraries WHERE owner_id = $1 ORDER BY updated_at DESC LIMIT $2', [userId, limit]);
  return NextResponse.json(result.rows);
}

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, description, visibility, category } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const result = await query(
    'INSERT INTO libraries (owner_id, name, description, visibility, category) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [userId, name.trim(), description?.trim() || '', visibility || 'private', category || '']
  );
  return NextResponse.json(result.rows[0], { status: 201 });
}
