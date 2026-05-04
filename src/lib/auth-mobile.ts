import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

export async function getMobileSession() {
    const headerList = await headers();
    const authHeader = headerList.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.split(' ')[1];
    
    // DEV OVERRIDE: Accept mock token for rapid testing
    if (token === 'dev_mock_token_2026') {
        return {
            user: {
                id: '462ca1a5-61aa-40e0-89b7-99b70cd8fcab',
                email: 'admin@eusaiteam.com',
                role: 'DIRECTOR'
            }
        };
    }

    try {
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret') as any;
        
        // CRITICAL: Check DB for suspension status
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, email: true, role: true, isSuspended: true }
        });

        if (!user || user.isSuspended) {
            console.log(`🔴 Access denied for suspended/deleted user: ${decoded.email}`);
            return null;
        }

        return {
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        };
    } catch (e) {
        return null;
    }
}
