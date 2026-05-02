import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (!user || !user.password) {
            // Check for hardcoded admin fallback
            if (email === "admin@eusaiteam.com" && password === "admin123") {
                const adminUser = await prisma.user.upsert({
                    where: { email },
                    update: {},
                    create: {
                        email,
                        name: "Project Director",
                        role: "DIRECTOR",
                    }
                });
                
                const token = jwt.sign(
                    { id: adminUser.id, email: adminUser.email, role: adminUser.role },
                    process.env.NEXTAUTH_SECRET || 'fallback-secret',
                    { expiresIn: '30d' }
                );

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
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.NEXTAUTH_SECRET || 'fallback-secret',
            { expiresIn: '30d' }
        );

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
