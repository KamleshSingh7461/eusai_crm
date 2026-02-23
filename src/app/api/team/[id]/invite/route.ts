import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEmail } from '@/lib/email';

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> } | { params: { id: string } }
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
        const resolvedParams = await (context.params instanceof Promise ? context.params : Promise.resolve(context.params));
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
                <p>Attention ${targetUser.name || 'Operative'},</p>
                <p>Your access parameters to the EUSAI Tactical Core have been transmitted.</p>
                <p>Your designated role parameter is: <strong style="color: #36B37E;">[${targetUser.role}]</strong>.</p>
                
                <div style="background-color: #f4f5f7; border: 1px solid #dfe1e6; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <p style="font-size: 12px; color: #5e6c84; font-weight: bold; margin-top: 0;">INITIALIZATION DIRECTIVES:</p>
                    <ol style="font-size: 14px; margin-bottom: 0; padding-left: 20px;">
                        <li>Access the secure portal via the uplink below.</li>
                        <li>Authenticate using your registered Google Workspace credentials.</li>
                        <li>Review pending tactical objectives (Tasks & Milestones).</li>
                        <li>Acknowledge communication protocol (Daily Submission Window: 18:00 - 20:00).</li>
                    </ol>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${loginUrl}" style="background-color: #0052CC; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-family: sans-serif; font-weight: bold; display: inline-block;">Initiate Secure Uplink</a>
                </div>
                
                <div style="font-size: 11px; color: #7a869a; border-top: 1px solid #dfe1e6; padding-top: 15px;">
                    <p style="margin: 0 0 5px 0;">Auth Token: ${Math.random().toString(36).substring(2, 15).toUpperCase()}</p>
                    <p style="margin: 0;">Transmission Origin: EUSAI Command Center</p>
                </div>
            </div>
        `;

        await sendEmail({
            to: targetUser.email,
            subject: 'Secure Access Provisioned: EUSAI Tactical Core',
            html: emailHtml
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to resend invitation:', error);
        return NextResponse.json({ error: 'Failed to resend invitation' }, { status: 500 });
    }
}
