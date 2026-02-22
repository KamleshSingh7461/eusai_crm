import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from '@/lib/prisma';

// Helper to check if user is DIRECTOR
async function checkAdmin() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'DIRECTOR') {
        return false;
    }
    return true;
}

// GET /api/admin/users - List all users with full details
export async function GET() {
    if (!await checkAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const users = await prisma.user.findMany({
            include: {
                reportingManagers: {
                    select: { id: true, name: true, email: true }
                },
                reportingSubordinates: {
                    select: { id: true, name: true, email: true, role: true }
                },
                _count: {
                    select: {
                        managedProjects: true,
                        tasks: true,
                        dailyReports: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

// PUT /api/admin/users - Update user role or department
export async function PUT(req: NextRequest) {
    if (!await checkAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { userId, role, department } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                ...(role && { role }),
                ...(department !== undefined && { department })
            }
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}

// DELETE /api/admin/users - Permanently remove a user
export async function DELETE(req: NextRequest) {
    if (!await checkAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Prevent self-deletion
        const session = await getServerSession(authOptions);
        if (session?.user?.email === "admin@eusaiteam.com" && (session.user as any).id === userId) {
            return NextResponse.json({ error: 'Cannot delete the primary admin account' }, { status: 400 });
        }

        await prisma.user.delete({
            where: { id: userId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Deletion failed' }, { status: 500 });
    }
}
