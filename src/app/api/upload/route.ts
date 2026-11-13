import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMobileSession } from '@/lib/auth-mobile';

// Attachments (chat files, completion proof, documents). Files are saved under /public/uploads, which the
// site serves from its own address, so only document and image types are accepted: an uploaded .html or
// .svg could otherwise run script as the CRM for whoever opens it.

const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED: Record<string, string> = {
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp',
    pdf: 'application/pdf',
    doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain', csv: 'text/csv', zip: 'application/zip',
};

export async function POST(req: Request) {
    try {
        const session = (await getServerSession(authOptions)) || (await getMobileSession());
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file');
        if (!(file instanceof File) || file.size === 0) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }
        if (file.size > MAX_BYTES) {
            return NextResponse.json({ error: 'Files can be up to 20 MB.' }, { status: 400 });
        }

        const ext = (file.name.split('.').pop() || '').toLowerCase();
        if (!ALLOWED[ext]) {
            return NextResponse.json({ error: `This file type isn't allowed. Use ${Object.keys(ALLOWED).join(', ')}.` }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        // the stored name is generated here; only the checked extension comes from the upload
        const base = file.name.slice(0, -(ext.length + 1)).replace(/[^a-zA-Z0-9-]/g, '_').slice(0, 60) || 'file';
        const filename = `${randomUUID()}-${base}.${ext}`;
        const uploadDir = join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadDir, { recursive: true }).catch(() => {});
        await writeFile(join(uploadDir, filename), buffer);

        return NextResponse.json({
            url: `/uploads/${filename}`,
            name: file.name.slice(0, 200),
            size: file.size,
            type: ALLOWED[ext],
        });
    } catch (error) {
        console.error('UPLOAD_POST', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
