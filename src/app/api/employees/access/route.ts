import { NextResponse } from 'next/server';
import { currentUser, staffAccess } from '@/lib/companies';

/** GET /api/employees/access : whether the signed-in person manages any company's employee records (for the menu). */
export async function GET() {
    const user = await currentUser();
    if (!user) return NextResponse.json({ canManage: false, allCompanies: false });
    const access = await staffAccess(user);
    return NextResponse.json({ canManage: access.canManageAny, allCompanies: access.allCompanies });
}
