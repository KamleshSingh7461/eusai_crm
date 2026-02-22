import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const canAccessTeam = token?.role === "DIRECTOR" || token?.role === "MANAGER" || token?.role === "TEAM_LEADER";
        const path = req.nextUrl.pathname;

        // Protect Team Management Route
        if (path.startsWith("/team") && !canAccessTeam) {
            return NextResponse.redirect(new URL("/", req.url));
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token
        },
        pages: {
            signIn: '/login',
        }
    }
)

// Protect all routes except login, ALL api routes, and public assets
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - /login (login page)
         * - /api/* (ALL API routes)
         * - /_next (Next.js internals)
         * - /favicon.ico, /robots.txt, etc. (public files)
         * - Public images (png, jpg, svg)
         */
        '/((?!login|api|_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:png|jpg|jpeg|gif|svg|webp)$).*)',
    ],
}
