import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth-server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get('active') !== 'false';
  const activeFilter = activeOnly ? 'AND q.is_active = true' : '';

  const result = await query(
    `SELECT q.* FROM questions q JOIN libraries l ON q.library_id = l.id WHERE q.library_id = $1 AND (l.owner_id = $2 OR l.visibility IN ($3, $4)) ${activeFilter} ORDER BY q.created_at DESC`,
    [params.id, userId, 'public', 'shared']
  );
  return NextResponse.json(result.rows);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify ownership
  const lib = await query('SELECT owner_id FROM libraries WHERE id = $1', [params.id]);
  if (lib.rows.length === 0 || lib.rows[0].owner_id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { question_content, answer, analysis, difficulty, tags, category } = await request.json();
  if (!question_content) return NextResponse.json({ error: 'question_content is required' }, { status: 400 });

  const result = await query(
    `INSERT INTO questions (library_id, question_content, answer, analysis, difficulty, tags, category) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [params.id, JSON.stringify(question_content), answer ? JSON.stringify(answer) : null, analysis || '', difficulty || 3, tags || [], category || '']
  );
  return NextResponse.json(result.rows[0], { status: 201 });
}
