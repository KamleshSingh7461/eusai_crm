import jwt from 'jsonwebtoken';
import { isDevLoginEnabled } from '@/lib/env';

// Bearer tokens for the Flutter apps. Signed with NEXTAUTH_SECRET only: there is no fallback
// secret, because a known fallback would let anyone mint a Director token.
const secret = () => {
    const value = process.env.NEXTAUTH_SECRET;
    if (!value) throw new Error('NEXTAUTH_SECRET is not set');
    return value;
};

export const signMobileToken = (payload: { id: string; email: string; role: string }) =>
    jwt.sign(payload, secret(), { expiresIn: '30d' });

export const verifyMobileToken = (token: string) => jwt.verify(token, secret()) as { id: string; email: string; role: string };

/**
 * Test shortcuts used by the mobile app's dev login. Accepted only when the server runs locally
 * against a local database (same rule as the web dev login), never on staging or production.
 */
export const DEV_MOBILE_TOKEN = 'dev_mock_token_2026';
export const devShortcutsAllowed = () => isDevLoginEnabled;
