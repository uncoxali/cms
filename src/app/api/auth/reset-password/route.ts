import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

// POST /api/auth/reset-password — Admin resets a user's password
export async function POST(request: NextRequest) {
    try {
        const { email, newPassword, adminSecret } = await request.json();

        if (!email || !newPassword) {
            return NextResponse.json({ error: 'Email and new password are required' }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        }

        const db = getDb();

        const user = await db('neurofy_users').where('email', email).first();
        if (!user) {
            return NextResponse.json({ error: 'No account found with this email address' }, { status: 404 });
        }

        const hashedPassword = await hashPassword(newPassword);
        await db('neurofy_users').where('email', email).update({
            password_hash: hashedPassword,
        });

        await db('neurofy_activity').insert({
            action: 'update',
            user: email,
            user_id: user.id,
            collection: 'neurofy_users',
            item: user.id,
            meta_json: JSON.stringify({ action: 'password_reset' }),
        });

        return NextResponse.json({ success: true, message: 'Password has been reset successfully' });
    } catch (error: any) {
        console.error('Reset Password Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
