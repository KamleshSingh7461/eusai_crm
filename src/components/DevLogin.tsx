"use client";

import React, { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';

interface DevUser {
    email: string;
    name: string | null;
    role: string;
}

// Local-only "sign in as" list. The API returns 404 outside local, so this renders nothing there.
export default function DevLogin() {
    const [users, setUsers] = useState<DevUser[]>([]);
    const [pending, setPending] = useState<string | null>(null);
    const [problem, setProblem] = useState<string | null>(null);

    const load = () => {
        if (process.env.NEXT_PUBLIC_APP_ENV !== 'local') return;
        setProblem(null);
        fetch('/api/dev/users')
            .then(async res => {
                if (res.status === 404) return setUsers([]); // dev login disabled (non-local database)
                if (!res.ok) throw new Error();
                const list: DevUser[] = await res.json();
                setUsers(list);
                if (list.length === 0) setProblem('The local database has no users yet. Run: npm run db:seed');
            })
            .catch(() => setProblem("Can't reach the local database. Start Docker Desktop, then run: npm run services:up"));
    };

    useEffect(load, []);

    if (problem) {
        return (
            <div className="mt-6 rounded-xl border border-dashed border-amber-400/40 bg-amber-500/10 p-3 text-center text-xs text-amber-200">
                <p className="font-semibold">Local dev login unavailable</p>
                <p className="mt-1 text-amber-200/80">{problem}</p>
                <button onClick={load} className="mt-2 rounded-lg bg-white/10 px-3 py-1 font-medium text-white hover:bg-white/15">Try again</button>
            </div>
        );
    }

    if (users.length === 0) return null;

    const handleSignIn = async (email: string) => {
        setPending(email);
        await signIn('dev-login', { email, callbackUrl: '/' });
    };

    return (
        <div className="mt-6 pt-6 border-t border-dashed border-[#34D399]/40">
            <p className="text-xs font-semibold text-[#34D399] mb-3 text-center">
                Local dev login · sign in as
            </p>
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                {users.map(user => (
                    <button
                        key={user.email}
                        onClick={() => handleSignIn(user.email)}
                        disabled={pending !== null}
                        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] transition-all text-left disabled:opacity-50"
                    >
                        <span className="min-w-0">
                            <span className="block text-sm font-semibold text-white truncate">{user.name || user.email}</span>
                            <span className="block text-[11px] text-white/40 truncate">{user.email}</span>
                        </span>
                        <span className="shrink-0 text-[11px] font-semibold text-[#34D399]">
                            {pending === user.email ? '...' : user.role}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
