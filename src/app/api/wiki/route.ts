import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');

        if (!projectId) {
            return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
        }

        const pages = await (prisma as any).wikiPage.findMany({
            where: { projectId },
            orderBy: { updatedAt: 'desc' }
        });

        return NextResponse.json(pages);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { projectId, title, content, authorId } = await request.json();

        if (!projectId || !title) {
            return NextResponse.json({ error: 'Missing title or project ID' }, { status: 400 });
        }

        const page = await (prisma as any).wikiPage.create({
            data: {
                projectId,
                title,
                content: content || 'Start typing your wiki content here...',
                authorId: authorId || 'SYSTEM_ADMIN'
            }
        });

        // Log activity in Relational DB (PostgreSQL)
        await prisma.activity.create({
            data: {
                projectId,
                userId: authorId || 'SYSTEM_ADMIN',
                action: 'WIKI_PAGE_CREATED',
                metadata: JSON.stringify({
                    title
                })
            }
        });

        return NextResponse.json(page, { status: 201 });
    } catch (error: any) {
        console.error('Wiki API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const { id, title, content } = await request.json();

        const page = await (prisma as any).wikiPage.update({
            where: { id },
            data: { title, content, updatedAt: new Date() }
        });

        return NextResponse.json(page);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();
        await (prisma as any).wikiPage.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
