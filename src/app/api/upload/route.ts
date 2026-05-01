import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const filename = `${uuidv4()}-${file.name.replace(/\s+/g, '_')}`;
        const uploadDir = join(process.cwd(), 'public', 'uploads');
        
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) {}

        const path = join(uploadDir, filename);
        await writeFile(path, buffer);

        const url = `/uploads/${filename}`;

        return NextResponse.json({ 
            url,
            name: file.name,
            size: file.size,
            type: file.type
        });

    } catch (error) {
        console.error('UPLOAD_POST', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
