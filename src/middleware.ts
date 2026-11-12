import { withAuth, type NextRequestWithAuth } from "next-auth/middleware"
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server"

// Signed-in pages, plus the public ID card verification pages.
//
// Addresses starting with "verify." (verify.fgsnlive.com and so on) only ever serve verification:
//   /            → the card number lookup page
//   /v/<token>   → the page a card's QR code opens
// Everything else there, including every CRM page and API, is "not found".

const authMiddleware = withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const canAccessTeam = ['DIRECTOR', 'MANAGEMENT', 'MANAGER', 'TEAM_LEADER'].includes(token?.role as string);
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

// open without signing in on the CRM's own address
const PUBLIC = /^\/(login|privacy|terms|verify)(\/|$)|^\/(api|uploads)\//;
const STATIC_FILE = /\.(?:png|jpg|jpeg|gif|svg|webp|pdf|ico|txt|apk|exe|zip)$/i;

// tells the root layout to render the page bare (no CRM shell, no sign-in session)
const verifyRequest = (req: NextRequest) => {
    const h = new Headers(req.headers);
    h.set('x-verify-page', '1');
    return { request: { headers: h } };
};

const privateHeaders = (res: NextResponse) => {
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    res.headers.set('Referrer-Policy', 'no-referrer');
    res.headers.set('Cache-Control', 'no-store');
    return res;
};

export default function middleware(req: NextRequest, event: NextFetchEvent) {
    const host = (req.headers.get('host') || '').toLowerCase();
    const path = req.nextUrl.pathname;

    if (host.startsWith('verify.')) {
        if (path.startsWith('/_next/') || path === '/favicon.ico') return NextResponse.next();
        if (path.startsWith('/api/verify/')) return privateHeaders(NextResponse.next());
        const url = req.nextUrl.clone();
        if (path === '/' || path === '/verify') {
            url.pathname = '/verify';
            return privateHeaders(NextResponse.rewrite(url, verifyRequest(req)));
        }
        const m = /^\/v\/([A-Za-z0-9_-]{1,64})\/?$/.exec(path);
        if (m) {
            url.pathname = `/verify/${m[1]}`;
            return privateHeaders(NextResponse.rewrite(url, verifyRequest(req)));
        }
        return new NextResponse('Not found', { status: 404, headers: { 'X-Robots-Tag': 'noindex', 'Cache-Control': 'no-store' } });
    }

    if (path === '/verify' || path.startsWith('/verify/')) return privateHeaders(NextResponse.next(verifyRequest(req)));
    if (PUBLIC.test(path) || STATIC_FILE.test(path)) return NextResponse.next();
    return authMiddleware(req as NextRequestWithAuth, event);
}

export const config = {
    // everything except Next.js build files; public paths are let through above
    matcher: ['/((?!_next/static|_next/image).*)'],
}
