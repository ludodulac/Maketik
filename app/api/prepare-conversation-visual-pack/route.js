import { NextResponse } from 'next/server';
import { buildConversationVisualPack } from '../../../lib/conversation-visual-pack.mjs';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const body = await request.json();
    const pack = buildConversationVisualPack(body || {});
    return NextResponse.json({ pack, preparedAt: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = error?.message || 'CONVERSATION_VISUAL_PACK_FAILED';
    const status = code.endsWith('_REQUIRED') ? 409 : 500;
    return NextResponse.json({ error: code }, { status });
  }
}
