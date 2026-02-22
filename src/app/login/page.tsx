"use client";

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Mail, Lock, Chrome, LogIn, Shield, Activity, Fingerprint } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError('Authentication Failed: Invalid tactical credentials.');
            } else {
                router.push('/');
            }
        } catch (err) {
            setError('Operational Error: System authentication link failed.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOAuthLogin = async (provider: 'google') => {
        setIsLoading(true);
        await signIn(provider, { callbackUrl: '/' });
    };

    return (
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Dynamic Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#0052CC]/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#0747A6]/10 rounded-full blur-[120px]" />

            <div className="w-full max-w-[440px] relative z-10">
                {/* Header Section */}
                <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(255,255,255,0.1)] border border-white/20 group hover:scale-105 transition-transform overflow-hidden p-2">
                        <Image
                            src="/EUSAI-LOGO.png"
                            alt="EUSAI Logo"
                            width={80}
                            height={80}
                            style={{ objectFit: 'contain' }}
                        />
                    </div>
                    <h1 className="text-4xl font-black text-white mb-2 tracking-tighter">
                        EUSAI <span className="text-[#0052CC]">TEAM</span>
                    </h1>
                    <p className="text-white/40 text-xs font-black uppercase tracking-[0.3em]">Sector Intelligence Gateway</p>
                </div>

                {/* Glassmorphism Login Card */}
                <div className="bg-[#191919]/60 backdrop-blur-3xl rounded-[32px] border border-white/10 p-10 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    {/* Google OAuth - Primary Entry */}
                    <div className="mb-8">
                        <button
                            onClick={() => handleOAuthLogin('google')}
                            disabled={isLoading}
                            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 h-14 rounded-2xl flex items-center justify-center gap-4 transition-all group overflow-hidden relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                            <Chrome className="w-5 h-5 text-blue-400" />
                            <span className="text-sm font-bold text-white tracking-tight">Identity Verification via Google</span>
                        </button>
                    </div>

                    {/* Styled Divider */}
                    <div className="relative my-10">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/5"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                            <span className="px-4 bg-transparent text-white/20">Tactical Credentials</span>
                        </div>
                    </div>

                    {/* Credentials Form */}
                    <form onSubmit={handleEmailLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Access Token (Email)</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-blue-400 transition-colors" />
                                <input
                                    type="email"
                                    placeholder="operator@eusai.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.08] transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Security Key (Password)</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-blue-400 transition-colors" />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.08] transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-400 font-bold flex items-center gap-3 animate-in fade-in zoom-in-95">
                                <Activity className="w-4 h-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-14 bg-[#0052CC] hover:bg-[#0747A6] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(0,82,204,0.3)] hover:shadow-[0_0_30px_rgba(0,82,204,0.5)] transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <Activity className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Fingerprint className="w-5 h-5" />
                                    Initiate Uplink
                                </>
                            )}
                        </button>
                    </form>

                    {/* Support Link */}
                    <div className="mt-10 text-center">
                        <button className="text-[10px] font-black text-white/20 hover:text-white/40 uppercase tracking-widest transition-colors flex items-center justify-center gap-2 mx-auto">
                            <Shield className="w-3 h-3" /> System Access Restricted
                        </button>
                    </div>
                </div>

                {/* Branding Footer */}
                <div className="mt-10 flex flex-col items-center gap-4 animate-in fade-in duration-1000 delay-500">
                    <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em]">Powered by EUSAI Tactical Framework v4.2</p>
                    <div className="flex gap-6 opacity-20">
                        <div className="w-6 h-6 rounded bg-white/10" />
                        <div className="w-6 h-6 rounded bg-white/10" />
                        <div className="w-6 h-6 rounded bg-white/10" />
                    </div>
                </div>
            </div>
        </div>
    );
}
