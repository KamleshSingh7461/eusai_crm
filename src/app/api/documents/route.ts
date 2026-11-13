import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ALL_COMPANY_ROLES, currentUser } from '@/lib/companies';

// Project documents shown in the Library. Signed-in people only; the uploader is always the signed-in
// person (never taken from the request), and only the uploader or a Director can delete a document.

const SAFE_URL = /^(https?:\/\/|\/uploads\/)/i;

export async function GET(request: Request) {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    try {
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');
        const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50') || 50, 1), 200);

        const documents = await prisma.document.findMany({
            where: projectId ? { projectId } : {},
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
        return NextResponse.json(documents);
    } catch (error) {
        console.error('Document list failed', error);
        return NextResponse.json({ error: "Couldn't load documents" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    try {
        const { projectId, name, type, size, url } = await request.json();
        if (!projectId || !name || !url) {
            return NextResponse.json({ error: 'Missing required document fields' }, { status: 400 });
        }
        // links only to web addresses or our own uploads: no javascript: or data: links in the Library
        if (typeof url !== 'string' || !SAFE_URL.test(url)) {
            return NextResponse.json({ error: 'The document link must be a web address.' }, { status: 400 });
        }
        const project = await prisma.project.findUnique({ where: { id: String(projectId) }, select: { id: true } });
        if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

        const document = await prisma.document.create({
            data: {
                projectId: project.id,
                name: String(name).slice(0, 200),
                type: String(type || 'FILE').slice(0, 40),
                size: String(size || '').slice(0, 40),
                url: url.slice(0, 2000),
                uploadedBy: user.id,
            },
        });

        await prisma.activity.create({
            data: {
                projectId: project.id,
                userId: user.id,
                action: 'DOCUMENT_UPLOADED',
                metadata: JSON.stringify({ fileName: document.name, fileType: document.type }),
            },
        });

        return NextResponse.json(document, { status: 201 });
    } catch (error) {
        console.error('Document API error:', error);
        return NextResponse.json({ error: "Couldn't save the document" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    try {
        const { id } = await request.json();
        const doc = await prisma.document.findUnique({ where: { id: String(id || '') }, select: { id: true, uploadedBy: true } });
        if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        if (doc.uploadedBy !== user.id && !ALL_COMPANY_ROLES.includes(user.role)) {
            return NextResponse.json({ error: 'Only the person who added this document or a Director can delete it.' }, { status: 403 });
        }
        await prisma.document.delete({ where: { id: doc.id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Document delete failed', error);
        return NextResponse.json({ error: "Couldn't delete the document" }, { status: 500 });
    }
}
