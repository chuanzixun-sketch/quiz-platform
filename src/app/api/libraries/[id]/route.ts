import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth-server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await query(
    'SELECT * FROM libraries WHERE id = $1 AND (owner_id = $2 OR visibility IN ($3, $4))',
    [params.id, userId, 'public', 'shared']
  );
  if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(result.rows[0]);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, description, visibility } = await request.json();
  const result = await query(
    `UPDATE libraries SET name = COALESCE($1, name), description = COALESCE($2, description), visibility = COALESCE($3, visibility) WHERE id = $4 AND owner_id = $5 RETURNING *`,
    [name, description, visibility, params.id, userId]
  );
  if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(result.rows[0]);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await query('DELETE FROM libraries WHERE id = $1 AND owner_id = $2 RETURNING id', [params.id, userId]);
  if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ message: 'Deleted' });
}
