import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEmail } from '@/lib/email';

// GET /api/team - Fetch all users with hierarchy info
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const startRole = (session.user as any).role;

    if (!['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(startRole)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        let whereClause: any = {};

        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { department: true }
        });

        if (startRole === 'TEAM_LEADER') {
            // For TLs, only show their direct reports
            whereClause = { reportingManagers: { some: { id: userId } } };
        } else if (startRole === 'MANAGER') {
            // For Managers, show their subordinates OR people in the same department
            whereClause = {
                OR: [
                    { reportingManagers: { some: { id: userId } } },
                    { department: currentUser?.department }
                ]
            };
        }
        // DIRECTOR: See all (empty whereClause)

        const users = await prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                department: true,
                image: true,
                reportingManagers: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                reportingSubordinates: {
                    select: {
                        id: true,
                        name: true,
                        role: true
                    }
                },
                weeklyReports: {
                    select: {
                        performanceScore: true,
                        createdAt: true
                    },
                    orderBy: {
                        weekStartDate: 'desc'
                    },
                    take: 4
                },
                _count: {
                    select: {
                        tasks: true,
                        milestones: true,
                    }
                }
            },
            orderBy: {
                role: 'asc'
            }
        });

        // Calculate rankings and scores
        const usersWithPerformance = users.map((user: any) => {
            const reports = user.weeklyReports || [];
            const scores = reports
                .filter((r: any) => r.performanceScore !== null)
                .map((r: any) => r.performanceScore);

            const avgScore = scores.length > 0
                ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
                : 0;

            // Trend calculation (last vs previous)
            let trend: 'UP' | 'DOWN' | 'NEUTRAL' = 'NEUTRAL';
            if (scores.length >= 2) {
                if (scores[0] > scores[1]) trend = 'UP';
                else if (scores[0] < scores[1]) trend = 'DOWN';
            }

            return {
                ...user,
                performanceScore: avgScore,
                performanceTrend: trend,
                activeTasks: user._count.tasks, // Simplified for now
                weeklyReports: undefined // Don't return the raw reports
            };
        });

        // Sort by score to determine rank
        const sortedUsers = [...usersWithPerformance].sort((a: any, b: any) => b.performanceScore - a.performanceScore);

        const finalUsers = usersWithPerformance.map((user: any) => {
            const rank = sortedUsers.findIndex((u: any) => u.id === user.id) + 1;
            return {
                ...user,
                rank: user.performanceScore > 0 ? rank : null
            };
        });

        // Department Breakdown for Managers
        let departments: any = {};
        if (['DIRECTOR', 'MANAGER'].includes(startRole)) {
            finalUsers.forEach((u: any) => {
                const dept = u.department || 'Unassigned';
                departments[dept] = (departments[dept] || 0) + 1;
            });
        }

        return NextResponse.json({
            users: finalUsers,
            meta: {
                departments,
                totalTasks: finalUsers.reduce((acc: number, u: any) => acc + u.activeTasks, 0),
                avgEfficiency: Math.round(finalUsers.reduce((acc: number, u: any) => acc + u.performanceScore, 0) / (finalUsers.length || 1))
            }
        });
    } catch (error) {
        console.error('Failed to fetch team:', error);
        return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 });
    }
}

// POST /api/team - Invite/Create User
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (!['DIRECTOR', 'MANAGER'].includes(userRole)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { email, name, role, managerId, department } = body;

        // Check if user exists
        const existingUser = await (prisma as any).user.findUnique({
            where: { email }
        });

        if (existingUser) {
            // Check if role is being changed
            const isRoleChanging = role && role !== existingUser.role;

            if (isRoleChanging && userRole !== 'DIRECTOR') {
                return NextResponse.json({
                    error: 'Forbidden',
                    message: 'Only Directors can modify user roles.'
                }, { status: 403 });
            }

            // Update existing user's role/manager
            const updatedUser = await (prisma as any).user.update({
                where: { email },
                data: {
                    role: isRoleChanging ? role : existingUser.role,
                    reportingManagers: managerId ? {
                        set: [{ id: managerId }]
                    } : body.managerIds ? {
                        set: body.managerIds.map((id: string) => ({ id }))
                    } : undefined,
                    department,
                    name: name || existingUser.name
                }
            });
            return NextResponse.json(updatedUser);
        }

        // Create new user (Invite)
        if (role && role !== 'EMPLOYEE' && userRole !== 'DIRECTOR') {
            return NextResponse.json({
                error: 'Forbidden',
                message: 'Only Directors can assign elevated roles during invitation.'
            }, { status: 403 });
        }

        const newUser = await (prisma as any).user.create({
            data: {
                email,
                name,
                role: role || 'EMPLOYEE',
                reportingManagers: managerId ? {
                    connect: { id: managerId }
                } : body.managerIds ? {
                    connect: body.managerIds.map((id: string) => ({ id }))
                } : undefined,
                department,
            }
        });

        // Send the actual invite email
        const loginUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login`;
        const emailHtml = `
            <div style="font-family: monospace; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ccc;">
                <h2 style="color: #0052CC; border-bottom: 2px solid #0052CC; padding-bottom: 10px;">CLASSIFIED - INTERNAL USE ONLY</h2>
                <p>Attention ${name || 'Operative'},</p>
                <p>You have been provisioned access to the EUSAI Tactical Core.</p>
                <p>Your designated role parameter is: <strong style="color: #36B37E;">[${role || 'EMPLOYEE'}]</strong>.</p>
                
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
            to: email,
            cc: body.ccEmails || [],
            subject: 'Secure Access Provisioned: EUSAI Tactical Core',
            html: emailHtml
        });

        return NextResponse.json(newUser);
    } catch (error) {
        console.error('Failed to invite user:', error);
        return NextResponse.json({ error: 'Failed to invite user' }, { status: 500 });
    }
}

// PUT /api/team - Update User Hierarchy/Role
export async function PUT(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (!['DIRECTOR', 'MANAGER'].includes(userRole)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { id, role, managerId, department } = body;

        // Security check: Only Directors can change roles
        const targetUser = await (prisma as any).user.findUnique({
            where: { id },
            select: { role: true }
        });

        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const isRoleChanging = role && role !== targetUser.role;
        if (isRoleChanging && userRole !== 'DIRECTOR') {
            return NextResponse.json({
                error: 'Forbidden',
                message: 'Only Directors can modify user roles.'
            }, { status: 403 });
        }

        const updatedUser = await (prisma as any).user.update({
            where: { id },
            data: {
                role: isRoleChanging ? role : targetUser.role,
                reportingManagers: managerId ? {
                    set: [{ id: managerId }]
                } : body.managerIds ? {
                    set: body.managerIds.map((id: string) => ({ id }))
                } : undefined,
                department
            }
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Failed to update user:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}
