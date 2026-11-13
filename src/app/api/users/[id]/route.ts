import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canManageCompany, canViewPerson, currentUser, staffAccess } from '@/lib/companies';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Signed-in people only, and only those allowed to see this person (same rule as the profile panel).
        const viewer = await currentUser();
        if (!viewer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const { id: userId } = await params;
        const target = await prisma.user.findUnique({ where: { id: userId }, select: { companyId: true } });
        if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });
        const canManage = canManageCompany(await staffAccess(viewer), target.companyId);
        if (!(await canViewPerson(viewer, userId, canManage))) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                company: { select: { code: true, legalName: true, brandColor: true } },
                reportingManagers: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        company: { select: { code: true, legalName: true, brandColor: true } },
                    }
                },
                reportingSubordinates: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        department: true,
                        company: { select: { code: true, legalName: true, brandColor: true } },
                    }
                },
                dailyReports: {
                    orderBy: { date: 'desc' },
                    take: 50,
                    include: {
                        project: {
                            select: { id: true, name: true }
                        }
                    }
                },
                weeklyReports: {
                    orderBy: { weekStartDate: 'desc' },
                    take: 12
                },
                tasks: {
                    select: { id: true, title: true, status: true, deadline: true, updatedAt: true, project: { select: { name: true } } }
                },
                milestones: {
                    select: { id: true, title: true, status: true, targetDate: true, updatedAt: true, project: { select: { name: true } } }
                },
                managedProjects: {
                    select: {
                        id: true,
                        name: true,
                        status: true
                    }
                },
                _count: {
                    select: {
                        tasks: true,
                        milestones: true
                    }
                }
            }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Calculate Ranking (Provisional Logic)
        const allUsers = await prisma.user.findMany({
            where: {
                role: {
                    notIn: ['DIRECTOR', 'MANAGER', 'TEAM_LEADER']
                }
            },
            include: {
                _count: {
                    select: {
                        tasks: { where: { status: 'DONE' } },
                        milestones: { where: { status: 'COMPLETED' } }
                    }
                }
            }
        });

        const userScores = allUsers.map(u => ({
            id: u.id,
            totalDone: u._count.tasks + u._count.milestones
        })).sort((a, b) => b.totalDone - a.totalDone);

        const rank = userScores.findIndex(s => s.id === userId) + 1;

        // Add calculated fields to response
        // never send sign-in secrets or internal fields to the browser
        const { password: _password, emailVerified: _emailVerified, ...safeUser } = user;
        const enhancedUser = {
            ...safeUser,
            rank: rank > 0 ? rank : null,
            // Only include non-done items in the list to match frontend "Active tasks" filter but keep counts accurate
            activeTasks: user.tasks.filter(t => t.status !== 'DONE'),
            activeMilestones: user.milestones.filter(m => m.status !== 'COMPLETED'),
        };

        return NextResponse.json(enhancedUser);
    } catch (error) {
        console.error('Failed to fetch user:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = (session.user as any).id;
    const userRole = (session.user as any).role;

    if (userRole !== 'DIRECTOR') {
        return NextResponse.json({ error: 'Forbidden', message: 'Only Directors can delete users.' }, { status: 403 });
    }

    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        if (id === currentUserId) {
            return NextResponse.json({ error: 'Bad Request', message: 'You cannot delete your own account.' }, { status: 400 });
        }

        const targetUser = await prisma.user.findUnique({ where: { id } });
        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        await prisma.$transaction(async (tx) => {
            // Nullify references in Task, Issue, Space
            await tx.task.updateMany({ where: { userId: id }, data: { userId: null } });
            await tx.issue.updateMany({ where: { reporterId: id }, data: { reporterId: null } });
            await tx.issue.updateMany({ where: { assignedToId: id }, data: { assignedToId: null } });
            await tx.issue.updateMany({ where: { resolvedById: id }, data: { resolvedById: null } });
            await tx.space.updateMany({ where: { managerId: id }, data: { managerId: null } });
            
            // Delete user meetings
            await tx.meeting.deleteMany({ where: { organizerId: id } });
            
            // Reassign milestones owned by user to the Director
            await tx.milestone.updateMany({ where: { owner: id }, data: { owner: currentUserId } });

            // Delete direct user records
            await tx.dailyReport.deleteMany({ where: { userId: id } });
            await tx.weeklyReport.deleteMany({ where: { userId: id } });
            await tx.expense.deleteMany({ where: { userId: id } });
            await tx.comment.deleteMany({ where: { userId: id } });
            await tx.activity.deleteMany({ where: { userId: id } });
            await tx.chatMessage.deleteMany({ where: { senderId: id } });
            await tx.notification.deleteMany({ where: { userId: id } });
            await tx.pushSubscription.deleteMany({ where: { userId: id } });
            await tx.fcmToken.deleteMany({ where: { userId: id } });
            await tx.session.deleteMany({ where: { userId: id } });
            await tx.account.deleteMany({ where: { userId: id } });

            // Disconnect many-to-many relations
            await tx.user.update({
                where: { id },
                data: {
                    reportingManagers: { set: [] },
                    reportingSubordinates: { set: [] },
                    managedProjects: { set: [] },
                    managedSpaces: { set: [] },
                    memberSpaces: { set: [] },
                    chatChannels: { set: [] },
                    meetingAttendance: { set: [] }
                }
            });

            // Delete user
            await tx.user.delete({ where: { id } });
        });

        return NextResponse.json({ success: true, message: 'User permanently deleted' });
    } catch (error: any) {
        console.error('Failed to delete user:', error);
        return NextResponse.json({ error: error.message || 'Failed to delete user' }, { status: 500 });
    }
}
