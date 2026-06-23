import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await query(
    `SELECT f.* FROM favorites f WHERE f.user_id = $1 ORDER BY f.created_at DESC`,
    [userId]
  );
  return NextResponse.json(result.rows);
}

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { question_id, library_id } = await request.json();
  const result = await query(
    `INSERT INTO favorites (user_id, question_id, library_id) VALUES ($1, $2, $3) ON CONFLICT (user_id, question_id) DO NOTHING RETURNING *`,
    [userId, question_id, library_id]
  );
  if (result.rows.length === 0) return NextResponse.json({ error: 'Already exists' }, { status: 409 });
  return NextResponse.json(result.rows[0], { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await query('DELETE FROM favorites WHERE id = $1 AND user_id = $2', [id, userId]);
  return NextResponse.json({ message: 'Deleted' });
}
