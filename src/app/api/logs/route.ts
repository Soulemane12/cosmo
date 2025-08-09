import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const safe = {
      level: body?.level ?? 'error',
      type: body?.type ?? 'unknown',
      message: body?.message ?? '',
      stack: body?.stack ?? '',
      url: body?.url ?? '',
      userAgent: body?.userAgent ?? '',
      userId: body?.userId ?? null,
      extra: body?.extra ?? null,
      timestamp: body?.timestamp ?? new Date().toISOString(),
    };

    // Emit to server logs (visible on your hosting platform)
    const prefix = `[client-log] ${safe.level.toUpperCase()} ${safe.type}`;
    console.error(prefix, JSON.stringify(safe));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[client-log] FAILED_TO_PARSE', error);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}


