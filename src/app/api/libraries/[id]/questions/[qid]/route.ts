import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth-server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; qid: string } }
) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { question_content, answer, analysis, difficulty, tags, is_active } = await request.json();
  const result = await query(
    `UPDATE questions SET question_content = COALESCE($1, question_content), answer = COALESCE($2, answer), analysis = COALESCE($3, analysis), difficulty = COALESCE($4, difficulty), tags = COALESCE($5, tags) WHERE id = $6 AND library_id = $7 RETURNING *`,
    [question_content ? JSON.stringify(question_content) : null, answer ? JSON.stringify(answer) : null, analysis, difficulty, tags, params.qid, params.id]
  );
  if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(result.rows[0]);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; qid: string } }
) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await query('DELETE FROM questions WHERE id = $1 AND library_id = $2 RETURNING id', [params.qid, params.id]);
  if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ message: 'Deleted' });
}
