import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, token } = body;

        if (!email || !token) {
            return NextResponse.json({ error: "Email and Token are required" }, { status: 400 });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // 1. Find the latest OTP for this exact email and token
        const otpRecord = await prisma.oTPToken.findFirst({
            where: {
                email: normalizedEmail,
                token: token,
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // 2. Validate token existence
        if (!otpRecord) {
            return NextResponse.json({ error: "Invalid integrity check sequence." }, { status: 400 });
        }

        // 3. Validate Expiration
        if (new Date() > otpRecord.expiresAt) {
            // Clean up expired token
            await prisma.oTPToken.delete({ where: { id: otpRecord.id } });
            return NextResponse.json({ error: "Sequence expired. Initiate a new uplink." }, { status: 400 });
        }

        // Return success, but DO NOT delete the token yet.
        // It will be deleted when the user actually sets the new password in the next immediate step.
        return NextResponse.json({ message: "Integrity verified. Proceed to credential generation.", type: otpRecord.type });

    } catch (error: any) {
        console.error("OTP Verification Error:", error);
        return NextResponse.json({ error: "Validation server error." }, { status: 500 });
    }
}
