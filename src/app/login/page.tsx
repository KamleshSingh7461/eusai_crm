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

    // Forgot Password State
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotStep, setForgotStep] = useState<'email' | 'otp' | 'password'>('email');
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotToken, setForgotToken] = useState('');
    const [forgotNewPass, setForgotNewPass] = useState('');
    const [isForgotLoading, setIsForgotLoading] = useState(false);
    const [forgotError, setForgotError] = useState('');
    const [forgotMsg, setForgotMsg] = useState('');

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

    const handleSendOTP = async () => {
        if (!forgotEmail) {
            setForgotError("Email address required.");
            return;
        }
        setIsForgotLoading(true);
        setForgotError('');
        setForgotMsg('');
        try {
            const res = await fetch('/api/auth/otp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail, type: 'RESET' })
            });
            const data = await res.json();
            if (res.ok) {
                setForgotMsg(data.message);
                setTimeout(() => {
                    setForgotStep('otp');
                    setForgotMsg('');
                }, 1500);
            } else {
                setForgotError(data.error);
            }
        } catch (err) {
            setForgotError("Transmission failed.");
        } finally {
            setIsForgotLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (forgotToken.length < 6) {
            setForgotError("Invalid sequence length.");
            return;
        }
        setIsForgotLoading(true);
        setForgotError('');
        setForgotMsg('');
        try {
            const res = await fetch('/api/auth/otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail, token: forgotToken })
            });
            const data = await res.json();
            if (res.ok) {
                setForgotMsg(data.message);
                setTimeout(() => {
                    setForgotStep('password');
                    setForgotMsg('');
                }, 1500);
            } else {
                setForgotError(data.error);
            }
        } catch (err) {
            setForgotError("Verification failed.");
        } finally {
            setIsForgotLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (forgotNewPass.length < 6) {
            setForgotError("Security key must be at least 6 characters.");
            return;
        }
        setIsForgotLoading(true);
        setForgotError('');
        setForgotMsg('');
        try {
            const res = await fetch('/api/auth/password/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail, token: forgotToken, newPassword: forgotNewPass })
            });
            const data = await res.json();
            if (res.ok) {
                setForgotMsg(data.message);
                setTimeout(() => {
                    setShowForgotModal(false);
                    setForgotStep('email');
                    setForgotEmail('');
                    setForgotToken('');
                    setForgotNewPass('');
                    setForgotMsg('');
                }, 2000);
            } else {
                setForgotError(data.error);
            }
        } catch (err) {
            setForgotError("Synchronization failed.");
        } finally {
            setIsForgotLoading(false);
        }
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

                        <div className="flex items-center justify-between mb-2 mt-4">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Security Key (Password)</label>
                            <button
                                type="button"
                                onClick={() => setShowForgotModal(true)}
                                className="text-[10px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-widest transition-colors focus:outline-none"
                            >
                                Forgot Password?
                            </button>
                        </div>
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

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-400 font-bold flex items-center gap-3 animate-in fade-in zoom-in-95 mt-6">
                                <Activity className="w-4 h-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-14 mt-6 bg-[#0052CC] hover:bg-[#0747A6] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(0,82,204,0.3)] hover:shadow-[0_0_30px_rgba(0,82,204,0.5)] transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
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

                {/* --- Forgot Password Modal --- */}
                {showForgotModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="w-full max-w-[400px] bg-[#111] border border-white/10 p-8 rounded-3xl shadow-2xl relative animate-in zoom-in-95 duration-300">

                            <button onClick={() => { setShowForgotModal(false); setForgotStep('email'); setForgotEmail(''); setForgotToken(''); setForgotNewPass(''); setForgotError(''); setForgotMsg(''); }} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors">
                                <div className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10">✕</div>
                            </button>

                            <h2 className="text-xl font-black text-white tracking-widest uppercase mb-6 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-[#0052CC]" /> Credential Recovery
                            </h2>

                            {forgotError && (
                                <div className="p-3 mb-6 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-bold flex items-center gap-2">
                                    <Activity className="w-4 h-4 shrink-0" /> {forgotError}
                                </div>
                            )}
                            {forgotMsg && (
                                <div className="p-3 mb-6 bg-green-500/10 border border-green-500/20 rounded-xl text-xs text-green-400 font-bold flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> {forgotMsg}
                                </div>
                            )}

                            {/* Step 1: Request OTP */}
                            {forgotStep === 'email' && (
                                <div className="space-y-4">
                                    <p className="text-xs text-white/60 font-medium">Enter your tactical email address. If verified, an encrypted OTP sequence will be dispatched.</p>
                                    <input
                                        type="email"
                                        placeholder="operator@eusai.com"
                                        value={forgotEmail}
                                        onChange={(e) => setForgotEmail(e.target.value)}
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all font-mono"
                                        required
                                    />
                                    <Button onClick={handleSendOTP} disabled={isForgotLoading} className="w-full mt-2 h-12 rounded-xl text-xs tracking-widest">
                                        {isForgotLoading ? 'TRANSMITTING...' : 'DISPATCH OTP'}
                                    </Button>
                                </div>
                            )}

                            {/* Step 2: Verify OTP */}
                            {forgotStep === 'otp' && (
                                <div className="space-y-4">
                                    <p className="text-xs text-white/60 font-medium">An authentication sequence has been securely directed to <span className="text-blue-400 font-mono">{forgotEmail}</span>.</p>
                                    <input
                                        type="text"
                                        placeholder="0 0 0 • 0 0 0"
                                        value={forgotToken}
                                        onChange={(e) => setForgotToken(e.target.value)}
                                        className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-4 text-center text-xl tracking-[0.5em] text-green-400 placeholder:text-white/20 focus:outline-none focus:border-green-500/50 focus:bg-white/10 transition-all font-mono font-black"
                                        required
                                        maxLength={6}
                                    />
                                    <Button onClick={handleVerifyOTP} disabled={isForgotLoading} className="w-full mt-2 h-12 rounded-xl text-xs tracking-widest bg-white/10 hover:bg-white/20 text-white">
                                        {isForgotLoading ? 'VERIFYING...' : 'VERIFY SEQUENCE'}
                                    </Button>
                                </div>
                            )}

                            {/* Step 3: New Password */}
                            {forgotStep === 'password' && (
                                <div className="space-y-4">
                                    <p className="text-xs text-green-400 font-medium mb-4">Integrity Verified. Formulate new credentials.</p>
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-1">New Security Key</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={forgotNewPass}
                                        onChange={(e) => setForgotNewPass(e.target.value)}
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all font-mono"
                                        required
                                        minLength={6}
                                    />
                                    <Button onClick={handleResetPassword} disabled={isForgotLoading} className="w-full mt-4 h-12 rounded-xl text-xs tracking-widest">
                                        {isForgotLoading ? 'SYNCHRONIZING...' : 'LOCK NEW CREDENTIALS'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

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
