import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, token, newPassword } = body;

        if (!email || !token || !newPassword || newPassword.length < 6) {
            return NextResponse.json({ error: "Invalid parameters. Protocol violation." }, { status: 400 });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // 1. Double check the OTP token exists and isn't expired
        // This prevents someone from bypassing the /verify endpoint
        const otpRecord = await prisma.oTPToken.findFirst({
            where: {
                email: normalizedEmail,
                token: token,
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (!otpRecord || new Date() > otpRecord.expiresAt) {
            return NextResponse.json({ error: "Integrity sequence invalid or expired." }, { status: 400 });
        }

        // 2. Hash the new password securely
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // 3. Update the user record
        await prisma.user.update({
            where: { email: normalizedEmail },
            data: { password: hashedPassword }
        });

        // 4. Burn the used OTP and any other stray OTPs for this user
        await prisma.oTPToken.deleteMany({
            where: { email: normalizedEmail }
        });

        return NextResponse.json({ message: "Credentials formally synchronized." }, { status: 200 });

    } catch (error: any) {
        console.error("Password Restructure Error:", error);
        return NextResponse.json({ error: "Core sync failure." }, { status: 500 });
    }
}
