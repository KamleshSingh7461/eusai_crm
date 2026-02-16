import { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    secret: process.env.NEXTAUTH_SECRET,
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (credentials?.email === "admin@eusaiteam.com" && credentials?.password === "admin123") {
                    const email = credentials.email;
                    // find or create the user in the database
                    // @ts-ignore
                    const user = await prisma.user.upsert({
                        where: { email },
                        update: {},
                        create: {
                            email,
                            name: "Project Director",
                            role: "DIRECTOR",
                        }
                    });
                    return user as any;
                }
                return null;
            }
        }),
        GithubProvider({
            clientId: process.env.GITHUB_ID || "MOCK_GITHUB_ID",
            clientSecret: process.env.GITHUB_SECRET || "MOCK_GITHUB_SECRET",
            allowDangerousEmailAccountLinking: true,
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "MOCK_GOOGLE_ID",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "MOCK_GOOGLE_SECRET",
            allowDangerousEmailAccountLinking: true,
            authorization: {
                params: {
                    scope: "openid profile email https://www.googleapis.com/auth/calendar.readonly",
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code"
                }
            }
        }),
    ],
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async signIn({ user, account, profile }: any) {
            console.log("🔵 SignIn Callback:", { user, account, profile });
            return true;
        },
        async jwt({ token, user, account, trigger, session }: any) {
            if (account) {
                token.accessToken = account.access_token;
                token.refreshToken = account.refresh_token;
            }
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.managerId = user.managerId;
            }
            return token;
        },
        async session({ session, token }: any) {
            if (session.user && token.id) {
                (session.user as any).id = token.id;
                (session as any).accessToken = token.accessToken;

                try {
                    const user = await prisma.user.findUnique({
                        where: { id: token.id },
                        select: { role: true, managerId: true }
                    });
                    (session.user as any).role = user?.role || "EMPLOYEE";
                    (session.user as any).managerId = user?.managerId || null;
                } catch (error) {
                    console.error("🔴 Error fetching user role:", error);
                    (session.user as any).role = "EMPLOYEE";
                }
            }
            return session;
        },
    },
    debug: true,
};
