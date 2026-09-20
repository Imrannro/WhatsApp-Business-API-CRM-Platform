import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cookieToken = req.cookies.get('token')?.value;

  const user = await authenticateRequest(authHeader, cookieToken);
  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Valid token required' },
      { status: 401 }
    );
  }

  return NextResponse.json({ success: true, data: { user } });
}

export async function POST(_req: NextRequest) {
  // Logout
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.delete('token');
  return response;
}
