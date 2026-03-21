import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Forward login request to Express backend
        const backendRes = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await backendRes.json();

        if (!backendRes.ok) {
            return NextResponse.json({ error: data.error || 'Login failed' }, { status: backendRes.status });
        }

        // Set the session cookie for Next.js middleware
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
        console.error('Login Proxy Error:', error);
        return NextResponse.json({ error: 'Internal server error while connecting to backend' }, { status: 500 });
    }
}
