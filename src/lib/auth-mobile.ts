import { headers } from 'next/headers';
import { DEV_MOBILE_TOKEN, devShortcutsAllowed, verifyMobileToken } from '@/lib/mobileToken';
import prisma from '@/lib/prisma';

export async function getMobileSession() {
    const headerList = await headers();
    const authHeader = headerList.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.split(' ')[1];
    
    // Mobile dev login: local only, and resolves to the real local admin user.
    if (token === DEV_MOBILE_TOKEN) {
        if (!devShortcutsAllowed()) return null;
        const admin = await prisma.user.findUnique({ where: { email: 'admin@eusaiteam.com' }, select: { id: true, email: true, role: true } });
        return admin ? { user: admin } : null;
    }

    try {
        const decoded = verifyMobileToken(token);
        
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
