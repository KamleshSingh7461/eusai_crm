import prisma from './prisma';

export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

/**
 * Creates a notification for a specific user.
 */
export async function createNotification({
    userId,
    title,
    message,
    type = 'INFO',
    link
}: {
    userId: string;
    title: string;
    message: string;
    type?: NotificationType;
    link?: string;
}) {
    try {
        return await prisma.notification.create({
            data: {
                userId,
                title,
                message,
                type,
                link
            }
        });
    } catch (error) {
        console.error('Failed to create notification:', error);
        return null;
    }
}

/**
 * Notifies all users with "Upper Management" roles (DIRECTOR, MANAGER).
 * Optionally include TEAM_LEADER.
 */
export async function notifyUpperManagement({
    title,
    message,
    type = 'INFO',
    link,
    includeTeamLeaders = false
}: {
    title: string;
    message: string;
    type?: NotificationType;
    link?: string;
    includeTeamLeaders?: boolean;
}) {
    try {
        const roles = ['DIRECTOR', 'MANAGER'];
        if (includeTeamLeaders) roles.push('TEAM_LEADER');

        const managementUsers = await prisma.user.findMany({
            where: {
                role: { in: roles }
            },
            select: { id: true }
        });

        const notifications = managementUsers.map(user => ({
            userId: user.id,
            title,
            message,
            type,
            link
        }));

        return await prisma.notification.createMany({
            data: notifications
        });
    } catch (error) {
        console.error('Failed to notify upper management:', error);
        return null;
    }
}

/**
 * Notifies the manager of a specific user.
 */
export async function notifyUserManager({
    userId,
    title,
    message,
    type = 'INFO',
    link
}: {
    userId: string;
    title: string;
    message: string;
    type?: NotificationType;
    link?: string;
}) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { reportingManagers: { select: { id: true } } }
        });

        if (user?.reportingManagers && user.reportingManagers.length > 0) {
            const notifications = user.reportingManagers.map(mgr =>
                createNotification({
                    userId: mgr.id,
                    title,
                    message,
                    type,
                    link
                })
            );
            return await Promise.all(notifications);
        }
    } catch (error) {
        console.error('Failed to notify manager:', error);
    }
    return null;
}

/**
 * Sends hierarchy-based email alerts.
 * 
 * Logic:
 * - EMPLOYEE acts -> Notify TL, Manager, Director
 * - TL acts -> Notify Manager, Director
 * - MANAGER acts -> Notify Director
 * - DIRECTOR acts -> (Usually downstream, but if upward needed, notify no one above)
 * 
 * Also always notifies the "Assignee" if they are not the actor.
 */
import { sendEmail } from './email';

export async function notifyHierarchy({
    actorId,
    targetId, // Can be Task ID, Milestone ID, or specific User ID (assignee)
    action,
    title,
    details,
    link
}: {
    actorId: string;
    targetId?: string; // The assignee or relevant user
    action: string;
    title: string;
    details: string;
    link: string;
}) {
    try {
        // 1. Fetch Actor and their hierarchy
        const actor = await prisma.user.findUnique({
            where: { id: actorId },
            include: { reportingManagers: true }
        });

        if (!actor) return;

        const role = actor.role;
        const recipients = new Set<string>();

        // 2. Determine Upstream Recipients
        if (role === 'EMPLOYEE' || role === 'INTERN') {
            // Find all direct managers (TLs)
            actor.reportingManagers?.forEach(m => recipients.add(m.id));

            // Find Manager (Manager of TL)??
            // Simplified: Fetch all Directors and Managers and TLs associated?
            // The prompt says: "employee/Intern(director,Manager his/her, Team Leader of his/her)"

            // Just broaden the net: Notify ALL Directors + The direct Manager chain
            const directors = await prisma.user.findMany({ where: { role: 'DIRECTOR' }, select: { id: true, email: true } });
            directors.forEach(d => recipients.add(d.id));

            // Traverse up usually hard without recursive query, but let's try to get the Manager's Manager if possible or just rely on global "Manager" role?
            // Let's stick to: Direct Manager + All Directors. 
            // Also if Manager references a specific project manager... 

            // For now: Direct Manager AND All Directors is a safe bet for "Management"
        } else if (role === 'TEAM_LEADER') {
            // "director and manager of his/her"
            actor.reportingManagers?.forEach(m => recipients.add(m.id));
            const directors = await prisma.user.findMany({ where: { role: 'DIRECTOR' }, select: { id: true, email: true } });
            directors.forEach(d => recipients.add(d.id));
        } else if (role === 'MANAGER') {
            // "director"
            const directors = await prisma.user.findMany({ where: { role: 'DIRECTOR' }, select: { id: true, email: true } });
            directors.forEach(d => recipients.add(d.id));
        }

        // 3. Downstream / Target Recipient
        if (targetId && targetId !== actorId) {
            recipients.add(targetId);
        }

        // Remove actor from recipients just in case
        recipients.delete(actorId);

        // 4. Fetch Emails of Recipients
        const usersToNotify = await prisma.user.findMany({
            where: { id: { in: Array.from(recipients) } },
            select: { id: true, email: true, name: true }
        });

        // 5. Send Emails
        for (const user of usersToNotify) {
            if (!user.email) continue;

            const emailHtml = `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                    <h2 style="color: #0052CC;">${title}</h2>
                    <p><strong>Action by:</strong> ${actor.name} (${actor.role})</p>
                    <p><strong>Event:</strong> ${action}</p>
                    <p><strong>Details:</strong> ${details}</p>
                    <br/>
                    <a href="${process.env.NEXTAUTH_URL}${link}" style="background-color: #0052CC; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View in Dashboard</a>
                    <br/><br/>
                    <small style="color: #888;">This is an automated alert from EuSai CRM.</small>
                </div>
            `;

            await sendEmail({
                to: user.email,
                subject: `[Alert] ${title}`,
                html: emailHtml
            });

            // Also create in-app notification
            await createNotification({
                userId: user.id,
                title: title,
                message: `${action}: ${details}`,
                type: 'INFO',
                link
            });
        }

    } catch (e) {
        console.error("Failed to process hierarchy alerts:", e);
    }
}
