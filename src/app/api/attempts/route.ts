import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { attempts } = body;

  if (!Array.isArray(attempts) || attempts.length === 0) {
    return NextResponse.json({ error: 'No attempts provided' }, { status: 400 });
  }

  const results = [];
  for (const a of attempts) {
    const result = await query(
      `INSERT INTO attempts (user_id, question_id, library_id, user_answer, is_correct, time_spent) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [userId, a.question_id, a.library_id, JSON.stringify(a.user_answer), a.is_correct, a.time_spent || 0]
    );
    results.push(result.rows[0]);

    // Update wrong questions
    if (!a.is_correct) {
      await query(
        `INSERT INTO wrong_questions (user_id, question_id, library_id) VALUES ($1, $2, $3) ON CONFLICT (user_id, question_id) DO UPDATE SET wrong_count = wrong_questions.wrong_count + 1, last_wrong_at = NOW()`,
        [userId, a.question_id, a.library_id]
      );
    }
  }

  return NextResponse.json({ count: results.length });
}
