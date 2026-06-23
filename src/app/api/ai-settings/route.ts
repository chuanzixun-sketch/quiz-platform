import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await query('SELECT * FROM ai_settings WHERE user_id = $1', [userId]);
  return NextResponse.json(result.rows[0] || null);
}

export async function PUT(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { provider, api_key, api_endpoint, model, auto_grade, auto_explain, temperature, max_tokens } = await request.json();

  const result = await query(
    `INSERT INTO ai_settings (user_id, provider, api_key, api_endpoint, model, auto_grade, auto_explain, temperature, max_tokens)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (user_id) DO UPDATE SET
       provider = COALESCE($2, ai_settings.provider),
       api_key = COALESCE($3, ai_settings.api_key),
       api_endpoint = COALESCE($4, ai_settings.api_endpoint),
       model = COALESCE($5, ai_settings.model),
       auto_grade = COALESCE($6, ai_settings.auto_grade),
       auto_explain = COALESCE($7, ai_settings.auto_explain),
       temperature = COALESCE($8, ai_settings.temperature),
       max_tokens = COALESCE($9, ai_settings.max_tokens)
     RETURNING *`,
    [userId, provider || 'deepseek', api_key || '', api_endpoint || '', model || 'deepseek-chat',
     auto_grade, auto_explain, temperature, max_tokens]
  );
  return NextResponse.json(result.rows[0]);
}
