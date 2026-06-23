import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await query(
    `SELECT * FROM study_sessions WHERE user_id = $1 ORDER BY date DESC LIMIT 100`,
    [userId]
  );
  return NextResponse.json(result.rows);
}

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { library_id, questions_answered, correct_count, duration_minutes } = await request.json();
  const result = await query(
    `INSERT INTO study_sessions (user_id, library_id, questions_answered, correct_count, duration_minutes) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, library_id || null, questions_answered || 0, correct_count || 0, duration_minutes || 0]
  );
  return NextResponse.json(result.rows[0], { status: 201 });
}
