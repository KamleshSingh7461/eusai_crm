import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signMobileToken, devShortcutsAllowed } from '@/lib/mobileToken';
import { allowAuthAttempt, ipOf } from '@/lib/rateLimit';

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
        }
        // password guessing: 10 tries per address and 30 per connection every 15 minutes
        if (!allowAuthAttempt('login', String(email), ipOf(req.headers), 10, 30)) {
            return NextResponse.json({ error: 'Too many sign-in attempts. Wait 15 minutes and try again.' }, { status: 429 });
        }

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (!user || !user.password) {
            // Check for hardcoded admin fallback
            // Test shortcut for the mobile dev build: local servers only.
            if (devShortcutsAllowed() && email === "admin@eusaiteam.com" && password === "admin123") {
                const adminUser = await prisma.user.upsert({
                    where: { email },
                    update: {},
                    create: {
                        email,
                        name: "Project Director",
                        role: "DIRECTOR",
                    }
                });
                
                const token = signMobileToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role });

                return NextResponse.json({
                    token,
                    user: {
                        id: adminUser.id,
                        email: adminUser.email,
                        name: adminUser.name,
                        role: adminUser.role,
                        image: adminUser.image
                    }
                });
            }
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Generate a standalone JWT for mobile
        // suspended or exited people can't sign in (same rule as the web)
        if (user.isSuspended) {
            return NextResponse.json({ error: 'Your account has been suspended. Contact your administrator.' }, { status: 403 });
        }

        const token = signMobileToken({ id: user.id, email: user.email, role: user.role });

        return NextResponse.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                image: user.image
            }
        });

    } catch (error) {
        console.error('MOBILE_LOGIN_ERROR', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
