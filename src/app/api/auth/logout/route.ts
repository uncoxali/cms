import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    const response = NextResponse.json({ success: true });

    response.cookies.set('session', '', {
        httpOnly: true,
        expires: new Date(0),
        path: '/'
    });

    return response;
}
