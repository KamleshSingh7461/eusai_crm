import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, type = "RESET" } = body;

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // 1. Verify user exists in the database
        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail }
        });

        if (!user) {
            // We return 200 even if the user isn't found to prevent email enumeration attacks
            return NextResponse.json({ message: "If the email exists, an OTP has been sent." }, { status: 200 });
        }

        // 2. Generate a 6-digit cryptographic-like OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // 3. Set Expiration (15 minutes)
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);

        // 4. Invalidate any existing requested OTPs for this user
        await prisma.oTPToken.deleteMany({
            where: { email: normalizedEmail }
        });

        // 5. Save the new OTP securely in the Database
        await prisma.oTPToken.create({
            data: {
                email: normalizedEmail,
                token: otp,
                type: type,
                expiresAt: expiresAt
            }
        });

        // 6. Dispatch the Email via NodeMailer
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const subject = type === "SETUP" ? "Set Up Your EUSAI Account Password" : "Reset Your EUSAI Password";
        const emailHeader = type === "SETUP" ? "EUSAI Terminal Setup" : "Security Credential Reset";

        const mailOptions = {
            from: `"EUSAI Command Center" <${process.env.SMTP_USER}>`,
            to: normalizedEmail,
            subject: subject,
            html: `
                <div style="font-family: 'Courier New', Courier, monospace; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0A0A0A; border: 1px solid #333; color: #E5E5E5; border-radius: 8px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #fff; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #333; padding-bottom: 10px;">${emailHeader}</h1>
                    </div>
                    
                    <p>Operator ${user.name || user.email},</p>
                    
                    <p>A request was issued to ${type === "SETUP" ? "establish" : "reset"} the secure credentials for your command center profile.</p>

                    <div style="background-color: #1A1A1A; border: 1px solid #36B37E; padding: 20px; text-align: center; margin: 30px 0; border-radius: 4px;">
                        <p style="margin: 0; color: #888; font-size: 12px; text-transform: uppercase; tracking: 2px;">Your One-Time Authentication Code</p>
                        <h2 style="font-size: 32px; letter-spacing: 8px; color: #36B37E; margin: 10px 0 0 0;">${otp}</h2>
                    </div>

                    <p style="color: #FF5630; font-size: 14px;"><strong>CRITICAL:</strong> This structural sequence will self-destruct in 15 minutes.</p>
                    
                    <p style="color: #888; font-size: 12px; margin-top: 40px; border-top: 1px solid #333; padding-top: 20px;">
                        If this operation was not initiated by you, ignore this transmission. Your current clearance remains secure.<br><br>
                        <em>Transmission origin: EUSAI Auth Server</em>
                    </p>
                </div>
            `,
        };

        // If SMTP isn't fully configured locally, log it instead of crashing
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.log(`[MOCK EMAIL SENT] To: ${normalizedEmail} | Subject: ${subject} | OTP: ${otp}`);
        } else {
            await transporter.sendMail(mailOptions);
            console.log(`[EMAIL SENT] Secure OTP dispatched to ${normalizedEmail}`);
        }

        return NextResponse.json({ message: "If the email exists, an OTP has been sent." }, { status: 200 });

    } catch (error: any) {
        console.error("OTP Dispatch Error:", error);
        return NextResponse.json({ error: "Failed to dispatch integrity check" }, { status: 500 });
    }
}
