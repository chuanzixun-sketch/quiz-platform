import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get libraries count
  const libsResult = await query('SELECT COUNT(*) as count FROM libraries WHERE owner_id = $1', [userId]);
  const totalLibraries = parseInt(libsResult.rows[0].count);

  // Get today's attempts
  const today = new Date().toISOString().split('T')[0];
  const attemptsResult = await query(
    `SELECT COUNT(*) as total, SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct FROM attempts WHERE user_id = $1 AND created_at::date = $2`,
    [userId, today]
  );
  const todayAttempts = parseInt(attemptsResult.rows[0].total);
  const todayCorrect = parseInt(attemptsResult.rows[0].correct) || 0;
  const accuracy = todayAttempts > 0 ? Math.round((todayCorrect / todayAttempts) * 100) : 0;

  // Get user stats
  const statsResult = await query('SELECT * FROM user_stats WHERE user_id = $1', [userId]);

  return NextResponse.json({
    totalLibraries,
    todayAttempts,
    accuracy,
    stats: statsResult.rows[0] || null,
  });
}
