import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const mastered = searchParams.get('mastered');

  let sql = `SELECT wq.* FROM wrong_questions wq WHERE wq.user_id = $1`;
  const params: any[] = [userId];

  if (mastered === 'true') {
    sql += ` AND wq.mastered = true`;
  } else if (mastered === 'false') {
    sql += ` AND wq.mastered = false`;
  }
  sql += ` ORDER BY wq.last_wrong_at DESC`;

  const result = await query(sql, params);
  return NextResponse.json(result.rows);
}

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { question_id, library_id } = await request.json();
  const result = await query(
    `INSERT INTO wrong_questions (user_id, question_id, library_id) VALUES ($1, $2, $3) ON CONFLICT (user_id, question_id) DO UPDATE SET wrong_count = wrong_questions.wrong_count + 1, last_wrong_at = NOW() RETURNING *`,
    [userId, question_id, library_id]
  );
  return NextResponse.json(result.rows[0], { status: 201 });
}

export async function PUT(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, mastered } = await request.json();
  const result = await query(
    `UPDATE wrong_questions SET mastered = $1 WHERE id = $2 AND user_id = $3 RETURNING *`,
    [mastered, id, userId]
  );
  if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(result.rows[0]);
}
