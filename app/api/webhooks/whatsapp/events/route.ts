import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';

export async function GET() {
  const events = await dbStore.getAllWebhookEvents(50);
  return NextResponse.json({ success: true, count: events.length, data: events });
}
