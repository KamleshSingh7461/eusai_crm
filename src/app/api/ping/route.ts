import { NextResponse } from 'next/server';
import { APP_ENV } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json({
        message: 'pong',
        timestamp: new Date().toISOString(),
        env: APP_ENV
    });
}
