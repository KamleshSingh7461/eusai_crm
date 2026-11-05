import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Knowledge pages belong to a project or a department (space).
// Everyone signed in can read; the author or a leader can edit/delete; MANAGEMENT is read-only.
const LEADERS = ['DIRECTOR', 'MANAGER', 'TEAM_LEADER'];

async function requireUser() {
    const session = await getServerSession(authOptions);
    return session?.user ? (session.user as any) : null;
}

const pageInclude = {
    project: { select: { id: true, name: true } },
    space: { select: { id: true, name: true, color: true } },
};

export async function GET(request: Request) {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (id) {
            const page = await prisma.wikiPage.findUnique({ where: { id }, include: pageInclude });
            if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 });
            const author = await prisma.user.findUnique({ where: { id: page.authorId }, select: { id: true, name: true, image: true } });
            return NextResponse.json({ ...page, author });
        }

        const projectId = searchParams.get('projectId');
        const spaceId = searchParams.get('spaceId');
        const limit = Math.min(parseInt(searchParams.get('limit') || '50') || 50, 200);

        const pages = await prisma.wikiPage.findMany({
            where: { ...(projectId ? { projectId } : {}), ...(spaceId ? { spaceId } : {}) },
            orderBy: { updatedAt: 'desc' },
            include: pageInclude,
            take: limit,
        });

        return NextResponse.json(pages);
    } catch (error) {
        console.error('Wiki GET error:', error);
        return NextResponse.json({ error: 'Failed to load pages' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role === 'MANAGEMENT') return NextResponse.json({ error: 'Read-only role' }, { status: 403 });

    try {
        const { projectId, spaceId, title, content } = await request.json();
        if (!title || (!projectId && !spaceId)) {
            return NextResponse.json({ error: 'A title and a project or department are required' }, { status: 400 });
        }

        const page = await prisma.wikiPage.create({
            data: {
                projectId: projectId || null,
                spaceId: spaceId || null,
                title,
                content: content || '',
                authorId: user.id,
            }
        });

        if (projectId) {
            await prisma.activity.create({
                data: { projectId, userId: user.id, action: 'WIKI_PAGE_CREATED', metadata: JSON.stringify({ title }) }
            });
        }

        return NextResponse.json(page, { status: 201 });
    } catch (error) {
        console.error('Wiki POST error:', error);
        return NextResponse.json({ error: 'Failed to create page' }, { status: 500 });
    }
}

async function loadEditable(id: string, user: any) {
    const page = await prisma.wikiPage.findUnique({ where: { id } });
    if (!page) return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) };
    if (page.authorId !== user.id && !LEADERS.includes(user.role)) {
        return { error: NextResponse.json({ error: 'Only the author or a leader can change this page' }, { status: 403 }) };
    }
    return { page };
}

export async function PUT(request: Request) {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id, title, content } = await request.json();
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        const { error } = await loadEditable(id, user);
        if (error) return error;

        const page = await prisma.wikiPage.update({
            where: { id },
            data: { ...(title !== undefined ? { title } : {}), ...(content !== undefined ? { content } : {}) }
        });
        return NextResponse.json(page);
    } catch (error) {
        console.error('Wiki PUT error:', error);
        return NextResponse.json({ error: 'Failed to save page' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = await request.json();
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        const { error } = await loadEditable(id, user);
        if (error) return error;

        await prisma.wikiPage.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Wiki DELETE error:', error);
        return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 });
    }
}
