import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: userId } = await params;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                reportingManagers: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    }
                },
                reportingSubordinates: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        department: true,
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
        const enhancedUser = {
            ...user,
            rank: rank > 0 ? rank : null,
            // Only include non-done items in the list to match frontend "Active missions" filter but keep counts accurate
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
