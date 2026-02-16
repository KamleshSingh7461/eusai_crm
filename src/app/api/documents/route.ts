import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');

        if (!projectId) {
            return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
        }

        const documents = await (prisma as any).document.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(documents);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { projectId, name, type, size, url, uploadedBy } = await request.json();

        if (!projectId || !name || !url) {
            return NextResponse.json({ error: 'Missing required document fields' }, { status: 400 });
        }

        const document = await (prisma as any).document.create({
            data: {
                projectId,
                name,
                type,
                size,
                url,
                uploadedBy
            }
        });

        // Log activity in Relational DB (PostgreSQL)
        await prisma.activity.create({
            data: {
                projectId,
                userId: uploadedBy,
                action: 'DOCUMENT_UPLOADED',
                metadata: {
                    fileName: name,
                    fileType: type
                }
            }
        });

        return NextResponse.json(document, { status: 201 });
    } catch (error: any) {
        console.error('Document API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();
        await (prisma as any).document.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
