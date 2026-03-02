import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Ensure user is actively logged in via OAuth or otherwise
        if (!session || !session.user || !session.user.email) {
            return NextResponse.json({ error: "Unauthorized. Active session required." }, { status: 403 });
        }

        const body = await req.json();
        const { newPassword } = body;

        if (!newPassword || newPassword.length < 6) {
            return NextResponse.json({ error: "Invalid password. Must be at least 6 characters." }, { status: 400 });
        }

        const normalizedEmail = session.user.email.toLowerCase().trim();

        // Check if user already has a password set (Prevent overwriting existing passwords via this method, optionally)
        const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail }
        });

        if (existingUser?.password) {
            return NextResponse.json({ error: "Credentials already established. Use the Reset flow to change them." }, { status: 400 });
        }

        // Hash the new credential key
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update user
        await prisma.user.update({
            where: { email: normalizedEmail },
            data: { password: hashedPassword }
        });

        return NextResponse.json({ message: "Tactical Credentials established successfully." });
    } catch (error: any) {
        console.error("Failed to setup credentials:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
