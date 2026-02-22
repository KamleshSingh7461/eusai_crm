import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = params.id;
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
                    where: { status: { not: 'DONE' } },
                    include: {
                        project: {
                            select: { id: true, name: true }
                        }
                    }
                },
                milestones: {
                    where: { status: { not: 'COMPLETED' } },
                    include: {
                        project: {
                            select: { id: true, name: true }
                        }
                    }
                },
                managedProjects: {
                    select: {
                        id: true,
                        name: true,
                        status: true
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

        return NextResponse.json(user);
    } catch (error) {
        console.error('Failed to fetch user:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user' },
            { status: 500 }
        );
    }
}
