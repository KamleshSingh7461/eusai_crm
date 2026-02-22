import { NextAuthOptions } from "next-auth";
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

            if (account && account.provider === 'google') {
                try {
                    // Force update the account tokens in the database
                    await prisma.account.upsert({
                        where: {
                            provider_providerAccountId: {
                                provider: account.provider,
                                providerAccountId: account.providerAccountId
                            }
                        },
                        update: {
                            access_token: account.access_token,
                            refresh_token: account.refresh_token,
                            expires_at: account.expires_at,
                            token_type: account.token_type,
                            scope: account.scope,
                            id_token: account.id_token,
                            session_state: account.session_state
                        },
                        create: {
                            userId: user.id,
                            type: account.type,
                            provider: account.provider,
                            providerAccountId: account.providerAccountId,
                            access_token: account.access_token,
                            refresh_token: account.refresh_token,
                            expires_at: account.expires_at,
                            token_type: account.token_type,
                            scope: account.scope,
                            id_token: account.id_token,
                            session_state: account.session_state
                        }
                    });
                    console.log("✅ Google tokens updated in DB for user:", user.email);
                } catch (error) {
                    console.error("🔴 Failed to save Google tokens:", error);
                }
            }
            return true;
        },
        async jwt({ token, user, account, profile }: any) {
            if (account) {
                token.accessToken = account.access_token;
                token.refreshToken = account.refresh_token;
            }
            if (profile?.picture) {
                token.picture = profile.picture;
            }
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.managerIds = user.reportingManagers?.map((m: any) => m.id) || [];
                if (!token.picture && user.image) {
                    token.picture = user.image;
                }
            }
            return token;
        },
        async session({ session, token }: any) {
            if (session.user && token.id) {
                (session.user as any).id = token.id;
                (session as any).accessToken = token.accessToken;
                if (token.picture) {
                    session.user.image = token.picture;
                }

                try {
                    const user = await prisma.user.findUnique({
                        where: { id: token.id },
                        select: {
                            role: true,
                            reportingManagers: { select: { id: true } },
                            image: true
                        }
                    });
                    (session.user as any).role = user?.role || "EMPLOYEE";
                    (session.user as any).managerIds = user?.reportingManagers?.map(m => m.id) || [];
                    // If no token picture (e.g. credentials login), fallback to DB image
                    if (!session.user.image && user?.image) {
                        session.user.image = user.image;
                    }
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
