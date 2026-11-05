"use client";

import React, { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, BarChart3, CheckCircle2, Loader2, ShieldCheck, Target, Users } from 'lucide-react';
import DevLogin from '@/components/DevLogin';

const ERRORS: Record<string, string> = {
    UnauthorizedDomain: 'That account isn’t on an approved company domain. Sign in with your work Google account.',
    NotInvited: 'Your account hasn’t been invited yet. Ask your manager or a director to add you.',
    AccessDenied: 'Access was denied. Ask your administrator to check your invitation.',
    OAuthCallback: 'Google sign-in was interrupted. Try again.',
    Default: 'Sign-in didn’t complete. Try again.',
};

const FEATURES = [
    { icon: Target, title: 'Milestones and MOUs', text: 'Track every agreement from prospect to signature.' },
    { icon: BarChart3, title: 'Live performance', text: 'Daily reports, streaks and team rankings in one view.' },
    { icon: Users, title: 'Built for your hierarchy', text: 'Directors, managers, leads and staff each see what matters.' },
];

function GoogleIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#4285F4" d="M47.532 24.5528C47.532 22.9214 47.3997 21.2811 47.1175 19.6761H24.48V28.9181H37.4434C36.9055 31.8988 35.177 34.5356 32.6461 36.2111V42.2078H40.3801C44.9217 38.0278 47.532 31.8547 47.532 24.5528Z" />
            <path fill="#34A853" d="M24.48 48.0016C30.9529 48.0016 36.4116 45.8764 40.3888 42.2078L32.6549 36.2111C30.5031 37.675 27.7252 38.5039 24.4888 38.5039C18.2275 38.5039 12.9187 34.2798 11.0139 28.6006H3.03296V34.7825C7.10718 42.8868 15.4056 48.0016 24.48 48.0016Z" />
            <path fill="#FBBC04" d="M11.0051 28.6006C9.99973 25.6199 9.99973 22.3922 11.0051 19.4115V13.2296H3.03298C-0.371021 20.0112 -0.371021 28.0009 3.03298 34.7825L11.0051 28.6006Z" />
            <path fill="#EA4335" d="M24.48 9.49932C27.9016 9.44641 31.2086 10.7339 33.6866 13.0973L40.5387 6.24523C36.2 2.17101 30.4414 -0.068932 24.48 0.00161733C15.4055 0.00161733 7.10718 5.11644 3.03296 13.2296L11.005 19.4115C12.901 13.7235 18.2187 9.49932 24.48 9.49932Z" />
        </svg>
    );
}

function LoginCard() {
    const params = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const errorKey = params.get('error');
    const error = errorKey ? ERRORS[errorKey] || ERRORS.Default : null;

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        await signIn('google', { callbackUrl: params.get('callbackUrl') || '/' });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="glass w-full max-w-[440px] rounded-3xl p-8 sm:p-10"
        >
            <div className="flex items-center gap-3 lg:hidden">
                <span className="h-11 w-11 rounded-xl bg-white p-1 shadow-[0_0_24px_rgba(59,130,246,0.35)]"><img src="/EUSAI-LOGO.png" alt="" className="h-full w-full object-contain" /></span>
                <span className="font-display text-xl font-bold text-white">EUSAI Team</span>
            </div>

            <h1 className="mt-8 font-display text-3xl font-extrabold tracking-tight text-white lg:mt-0">Welcome back</h1>
            <p className="mt-2 text-sm text-slate-400">Sign in with your company Google account to continue.</p>

            {error && (
                <div role="alert" className="mt-6 flex gap-3 rounded-2xl border border-rose-400/25 bg-rose-500/10 p-4 text-sm text-rose-100">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
                    <p>{error}</p>
                </div>
            )}

            <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="mt-8 flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-white text-sm font-semibold text-slate-800 shadow-[0_10px_30px_-10px_rgba(255,255,255,0.4)] transition hover:bg-slate-100 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
            >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-blue-600" /> : <GoogleIcon />}
                {isLoading ? 'Connecting to Google…' : 'Continue with Google'}
            </button>

            <ul className="mt-6 space-y-2 text-xs text-slate-500">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />Approved company domains only</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />Access by invitation from your organization</li>
            </ul>

            <DevLogin />

            <div className="mt-8 flex items-center gap-2 border-t border-white/[0.06] pt-6 text-xs text-slate-500">
                <ShieldCheck className="h-4 w-4 text-slate-400" />
                Secured with Google sign-in. Your password is never stored here.
            </div>
        </motion.div>
    );
}

export default function LoginPage() {
    return (
        <div className="relative min-h-screen overflow-hidden bg-[#07090D]">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-blue-600/20 blur-[140px]" />
                <div className="absolute -bottom-40 right-0 h-[520px] w-[520px] rounded-full bg-violet-600/15 blur-[140px]" />
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            </div>

            <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-6 py-12 lg:grid-cols-2 lg:px-12">
                <motion.section
                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}
                    className="hidden lg:block"
                >
                    <div className="flex items-center gap-3">
                        <span className="h-12 w-12 rounded-2xl bg-white p-1.5 shadow-[0_0_32px_rgba(59,130,246,0.45)]"><img src="/EUSAI-LOGO.png" alt="EUSAI" className="h-full w-full object-contain" /></span>
                        <div>
                            <p className="font-display text-xl font-bold text-white">EUSAI Team</p>
                            <p className="text-sm text-slate-500">Enterprise workspace</p>
                        </div>
                    </div>
                    <h2 className="mt-12 max-w-lg font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-white">
                        Run every partnership <span className="text-gradient-brand">in one place.</span>
                    </h2>
                    <p className="mt-5 max-w-md text-lg text-slate-400">Projects, milestones, daily reports and your whole team, in one workspace.</p>
                    <ul className="mt-10 max-w-md space-y-4">
                        {FEATURES.map((f, i) => (
                            <motion.li key={f.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}
                                className="glass flex items-start gap-4 p-4">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/25 to-blue-500/5 text-blue-300 ring-1 ring-inset ring-blue-400/25"><f.icon className="h-5 w-5" /></span>
                                <div>
                                    <p className="font-semibold text-white">{f.title}</p>
                                    <p className="mt-0.5 text-sm text-slate-400">{f.text}</p>
                                </div>
                            </motion.li>
                        ))}
                    </ul>
                </motion.section>

                <div className="flex justify-center lg:justify-end">
                    <Suspense fallback={<div className="glass h-[520px] w-full max-w-[440px] rounded-3xl" />}>
                        <LoginCard />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
