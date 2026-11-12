import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEmail } from '@/lib/email';

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (!['DIRECTOR', 'MANAGER'].includes(userRole)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const resolvedParams = await context.params;
        const id = resolvedParams.id;

        const targetUser = await prisma.user.findUnique({
            where: { id }
        });

        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Send the actual invite email
        const loginUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login`;
        const emailHtml = `
            <div style="font-family: monospace; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ccc;">
                <h2 style="color: #0052CC; border-bottom: 2px solid #0052CC; padding-bottom: 10px;">CLASSIFIED - INTERNAL USE ONLY</h2>
                <p>Hi ${targetUser.name || 'there'},</p>
                <p>Your EUSAI workspace invitation has been sent.</p>
                <p>Your role: <strong style="color: #36B37E;">[${targetUser.role}]</strong>.</p>
                
                <div style="background-color: #f4f5f7; border: 1px solid #dfe1e6; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <p style="font-size: 12px; color: #5e6c84; font-weight: bold; margin-top: 0;">GETTING STARTED</p>
                    <ol style="font-size: 14px; margin-bottom: 0; padding-left: 20px;">
                        <li>Sign in using the link below.</li>
                        <li>Use your registered Google Workspace account.</li>
                        <li>Open tasks and milestones that need attention.</li>
                        <li>Daily reports are accepted between 5:00 PM and 11:59 PM IST.</li>
                    </ol>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${loginUrl}" style="background-color: #0052CC; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-family: sans-serif; font-weight: bold; display: inline-block;">Sign in</a>
                </div>
                
                <div style="font-size: 11px; color: #7a869a; border-top: 1px solid #dfe1e6; padding-top: 15px;">
                    <p style="margin: 0;">Sent by EUSAI</p>
                </div>
            </div>
        `;

        await sendEmail({
            to: targetUser.email,
            subject: 'Your EUSAI workspace access is ready',
            html: emailHtml
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to resend invitation:', error);
        return NextResponse.json({ error: 'Failed to resend invitation' }, { status: 500 });
    }
}
