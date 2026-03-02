import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Ensure only Directors can set passwords for others
        if (!session || !session.user || (session.user as any).role !== "DIRECTOR") {
            return NextResponse.json({ error: "Unauthorized. Only Directors can set core credentials." }, { status: 403 });
        }

        const body = await request.json();
        const { userId, rawPassword } = body;

        if (!userId || !rawPassword || rawPassword.length < 6) {
            return NextResponse.json({ error: "Invalid input. Password must be at least 6 characters." }, { status: 400 });
        }

        // Hash the new credential key
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(rawPassword, salt);

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });

        return NextResponse.json({ message: `Credentials established successfully for ${updatedUser.name || updatedUser.email}` });
    } catch (error: any) {
        console.error("Failed to set credentials:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
