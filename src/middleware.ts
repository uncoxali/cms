import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-super-secret-key-change-this'
);

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Paths that don't require authentication
    if (
        pathname === '/admin/login' ||
        pathname.startsWith('/api/auth/login') ||
        pathname.startsWith('/_next') ||
        pathname === '/favicon.ico'
    ) {
        return NextResponse.next();
    }

    const token = request.cookies.get('session')?.value;

    if (!token) {
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    try {
        await jose.jwtVerify(token, JWT_SECRET);
        return NextResponse.next();
    } catch (error) {
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.redirect(new URL('/admin/login', request.url));
    }
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/api/:path*',
        '/dashboard/:path*',
    ],
};
