import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getMobileSession } from "@/lib/auth-mobile";
import prisma from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";

// POST: Send overdue reminder via Email, Web Push, and In-App notification
export async function POST(request: Request) {
    try {
        let session = await getServerSession(authOptions);
        if (!session?.user) {
            session = await getMobileSession() as any;
        }

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userRole = (session.user as any).role;
        const senderName = (session.user as any).name || 'Senior Manager';
        const senderRole = userRole || 'SUPERVISOR';

        // Role check: Only senior roles can send overdue reminders
        const isSenior = ['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(userRole);
        if (!isSenior) {
            return NextResponse.json({ error: "Only senior roles (Director, Manager, Team Leader) can dispatch overdue reminders." }, { status: 403 });
        }

        const body = await request.json();
        const { entityType, entityId } = body;

        if (!entityType || !entityId) {
            return NextResponse.json({ error: "Missing entityType or entityId parameters" }, { status: 400 });
        }

        let title = '';
        let deadline: Date | null = null;
        let isDone = false;
        let assigneeId = '';
        let assigneeEmail = '';
        let assigneeName = '';
        let projectName = '';
        let itemLink = '';

        if (entityType === 'TASK') {
            const task = await prisma.task.findUnique({
                where: { id: entityId },
                include: {
                    assignedTo: { select: { id: true, name: true, email: true } },
                    project: { select: { name: true } }
                }
            });

            if (!task) {
                return NextResponse.json({ error: "Task not found" }, { status: 404 });
            }

            title = task.title;
            deadline = task.deadline;
            isDone = task.status === 'DONE';
            assigneeId = task.assignedTo?.id || '';
            assigneeEmail = task.assignedTo?.email || '';
            assigneeName = task.assignedTo?.name || 'Assignee';
            projectName = task.project?.name || 'General Operations';
            itemLink = '/tasks';
        } else if (entityType === 'MILESTONE') {
            const milestone = await prisma.milestone.findUnique({
                where: { id: entityId },
                include: {
                    ownerUser: { select: { id: true, name: true, email: true } },
                    project: { select: { name: true } },
                    university: { select: { name: true } }
                }
            });

            if (!milestone) {
                return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
            }

            title = milestone.title;
            deadline = milestone.targetDate;
            isDone = milestone.status === 'COMPLETED';
            assigneeId = milestone.ownerUser?.id || '';
            assigneeEmail = milestone.ownerUser?.email || '';
            assigneeName = milestone.ownerUser?.name || 'Assignee';
            projectName = milestone.project?.name || milestone.university?.name || 'Strategic Objective';
            itemLink = '/milestones';
        } else {
            return NextResponse.json({ error: "Invalid entityType. Must be TASK or MILESTONE" }, { status: 400 });
        }

        if (isDone) {
            return NextResponse.json({ error: "This item is already completed." }, { status: 400 });
        }

        const now = new Date();
        if (!deadline || deadline >= now) {
            return NextResponse.json({ error: "This item is not yet overdue." }, { status: 400 });
        }

        // Calculate days overdue
        const diffTime = Math.abs(now.getTime() - deadline.getTime());
        const daysOverdue = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

        const alertTitle = `Overdue Reminder: ${title}`;
        const alertMessage = `Your ${entityType.toLowerCase()} "${title}" (${projectName}) is overdue by ${daysOverdue} day${daysOverdue > 1 ? 's' : ''}. Please update the status or request an extension.`;

        // 1. Create In-App Notification & trigger Web Push
        if (assigneeId) {
            await createNotification({
                userId: assigneeId,
                title: alertTitle,
                message: alertMessage,
                type: 'WARNING',
                link: itemLink
            });
        }

        // 2. Send Direct Email Reminder
        let emailSent = false;
        if (assigneeEmail) {
            const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
            const emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #DFE1E6; border-radius: 8px; background-color: #ffffff;">
                    <div style="background-color: #FF5630; padding: 12px 16px; border-radius: 6px; color: #ffffff; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px;">
                        ⚠️ Action Required: Overdue ${entityType}
                    </div>
                    
                    <h2 style="color: #172B4D; margin-top: 0;">Hi ${assigneeName},</h2>
                    <p style="color: #42526E; font-size: 15px; line-height: 1.5;">
                        This is an official overdue reminder regarding your assigned ${entityType.toLowerCase()}:
                    </p>

                    <div style="background-color: #FAFBFC; border: 1px solid #DFE1E6; border-left: 4px solid #FF5630; padding: 16px; border-radius: 4px; margin: 20px 0;">
                        <h3 style="margin: 0 0 8px 0; color: #0052CC; font-size: 16px;">${title}</h3>
                        <p style="margin: 4px 0; color: #5E6C84; font-size: 13px;"><strong>Project/Scope:</strong> ${projectName}</p>
                        <p style="margin: 4px 0; color: #5E6C84; font-size: 13px;"><strong>Due Date:</strong> ${deadline.toLocaleDateString()}</p>
                        <p style="margin: 4px 0; color: #DE350B; font-size: 14px; font-weight: bold;">
                            🚨 Status: Overdue by ${daysOverdue} day${daysOverdue > 1 ? 's' : ''}
                        </p>
                    </div>

                    <p style="color: #42526E; font-size: 14px; line-height: 1.5;">
                        Prompt update requested by: <strong>${senderName} (${senderRole})</strong>
                    </p>

                    <div style="margin: 28px 0 16px 0; text-align: center;">
                        <a href="${baseUrl}${itemLink}" style="background-color: #0052CC; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px; display: inline-block;">
                            View & Update Item in CRM
                        </a>
                    </div>

                    <hr style="border: none; border-top: 1px solid #EBECF0; margin: 24px 0;" />
                    <p style="color: #97A0AF; font-size: 11px; text-align: center; margin: 0;">
                        EuSai CRM Operational Alert System • Automated Notification
                    </p>
                </div>
            `;

            emailSent = await sendEmail({
                to: assigneeEmail,
                subject: `[Overdue Reminder] ${title} is ${daysOverdue} day(s) overdue`,
                html: emailHtml
            });
        }

        return NextResponse.json({
            success: true,
            daysOverdue,
            assigneeName,
            emailSent,
            message: `Overdue reminder sent to ${assigneeName} via Email and Notification (${daysOverdue} days overdue).`
        });

    } catch (error) {
        console.error("Error sending overdue notification:", error);
        return NextResponse.json({ error: "Failed to send overdue notification" }, { status: 500 });
    }
}
