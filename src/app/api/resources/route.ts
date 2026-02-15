import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role: userRole } = (session.user as any);

    try {
        const resources = await (prisma as any).resource.findMany({
            include: {
                projects: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        // Calculate metadata for Managers/Directors
        const isExecutive = ['DIRECTOR', 'MANAGER'].includes(userRole);
        let meta = null;

        if (isExecutive) {
            const totalAllocated = resources.filter((r: any) => r.status === 'ALLOCATED').length;
            const totalAvailable = resources.filter((r: any) => r.status === 'AVAILABLE').length;

            // Type distribution
            const typeCounts = resources.reduce((acc: any, r: any) => {
                acc[r.type] = (acc[r.type] || 0) + 1;
                return acc;
            }, {});

            // Utilization
            const avgUtilization = resources.length > 0
                ? Math.round(resources.reduce((acc: any, r: any) => acc + (r.utilization || 0), 0) / resources.length)
                : 0;

            // Daily Burn (assuming 8h day)
            const totalDailyBurn = resources.reduce((acc: any, r: any) => {
                if (r.status === 'ALLOCATED') {
                    return acc + (Number(r.hourlyRate) * 8);
                }
                return acc;
            }, 0);

            meta = {
                totalResources: resources.length,
                totalAllocated,
                totalAvailable,
                typeCounts,
                avgUtilization,
                totalDailyBurn,
                highUtilizationCount: resources.filter((r: any) => r.utilization > 80).length
            };
        }

        return NextResponse.json({ resources, meta });
    } catch (error) {
        console.error('Failed to fetch resources:', error);
        return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { name, type, role, hourlyRate, projectIds } = body;

        const resource = await (prisma as any).resource.create({
            data: {
                name,
                type,
                role,
                hourlyRate: parseFloat(hourlyRate),
                status: 'AVAILABLE',
                utilization: 0,
                projects: projectIds && projectIds.length > 0 ? {
                    connect: projectIds.map((id: string) => ({ id }))
                } : undefined
            }
        });

        return NextResponse.json(resource);
    } catch (error) {
        console.error('Failed to create resource:', error);
        return NextResponse.json({ error: 'Failed to create resource' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { id, status, utilization, projectIds, role, hourlyRate } = body;

        const updateData: any = {};
        if (status) updateData.status = status;
        if (utilization !== undefined) updateData.utilization = parseInt(utilization);
        if (role) updateData.role = role;
        if (hourlyRate) updateData.hourlyRate = parseFloat(hourlyRate);

        if (projectIds) {
            updateData.projects = {
                set: projectIds.map((id: string) => ({ id }))
            };
        }

        const resource = await (prisma as any).resource.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(resource);
    } catch (error) {
        console.error('Failed to update resource:', error);
        return NextResponse.json({ error: 'Failed to update resource' }, { status: 500 });
    }
}
