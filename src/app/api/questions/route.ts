import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const libraryId = searchParams.get('libraryId');
  const ids = searchParams.get('ids');

  if (libraryId) {
    const result = await query('SELECT COUNT(*) as count FROM questions WHERE library_id = $1 AND is_active = true', [libraryId]);
    return NextResponse.json({ count: parseInt(result.rows[0].count) });
  }

  if (ids) {
    const idArr = ids.split(',');
    const placeholders = idArr.map((_, i) => `$${i + 1}`).join(',');
    const result = await query(`SELECT * FROM questions WHERE id IN (${placeholders})`, idArr);
    return NextResponse.json(result.rows);
  }

  return NextResponse.json({ error: 'Provide libraryId or ids parameter' }, { status: 400 });
}
