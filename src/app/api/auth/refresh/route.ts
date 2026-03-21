import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function POST(request: NextRequest) {
    try {
        const token =
            request.headers.get('Authorization')?.replace('Bearer ', '') ||
            request.cookies.get('session')?.value;

        if (!token) {
            return NextResponse.json({ error: 'No token provided' }, { status: 401 });
        }

        const backendRes = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await backendRes.json();

        if (!backendRes.ok) {
            return NextResponse.json({ error: data.error || 'Refresh failed' }, { status: backendRes.status });
        }

        const response = NextResponse.json(data);
        const expirationDays = data.token_expiration_days || 7;

        response.cookies.set('session', data.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * expirationDays,
            path: '/'
        });

        return response;
    } catch (error: any) {
        console.error('Token Refresh Proxy Error:', error);
        return NextResponse.json({ error: 'Internal server error while connecting to backend' }, { status: 500 });
    }
}
