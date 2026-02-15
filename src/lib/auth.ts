import { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GithubProvider({
            clientId: process.env.GITHUB_ID || "MOCK_GITHUB_ID",
            clientSecret: process.env.GITHUB_SECRET || "MOCK_GITHUB_SECRET",
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "MOCK_GOOGLE_ID",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "MOCK_GOOGLE_SECRET",
            authorization: {
                params: {
                    scope: "openid profile email",
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
    debug: process.env.NODE_ENV === 'development',
};
