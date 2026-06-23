import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ user: null });
  }
  const payload = verifyToken(auth.slice(7));
  if (!payload) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({ user: { id: payload.userId, email: payload.email } });
}
