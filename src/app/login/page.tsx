"use client";

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import Image from 'next/image';
import { Chrome, Shield, Activity } from 'lucide-react';

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        await signIn('google', { callbackUrl: '/' });
    };

    return (
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Dynamic Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#0052CC]/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#0747A6]/10 rounded-full blur-[120px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-[#0052CC]/5 rounded-full blur-[150px]" />

            <div className="w-full max-w-[400px] relative z-10">
                {/* Header Section */}
                <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(255,255,255,0.1)] border border-white/20 hover:scale-105 transition-transform overflow-hidden p-2">
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

                {/* Login Card */}
                <div className="bg-[#191919]/60 backdrop-blur-3xl rounded-[32px] border border-white/10 p-10 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000">

                    <div className="mb-6 text-center">
                        <p className="text-white/50 text-sm font-medium">Sign in with your company Google account</p>
                        <p className="text-white/25 text-xs mt-1">Authorized domains only • Invite required</p>
                    </div>

                    {/* Google Sign In Button */}
                    <button
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="w-full bg-white hover:bg-white/90 h-14 rounded-2xl flex items-center justify-center gap-4 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
                    >
                        {isLoading ? (
                            <>
                                <Activity className="w-5 h-5 text-[#0052CC] animate-spin" />
                                <span className="text-sm font-bold text-gray-700">Connecting...</span>
                            </>
                        ) : (
                            <>
                                {/* Google G logo SVG */}
                                <svg width="20" height="20" viewBox="0 0 48 48">
                                    <path fill="#4285F4" d="M47.532 24.5528C47.532 22.9214 47.3997 21.2811 47.1175 19.6761H24.48V28.9181H37.4434C36.9055 31.8988 35.177 34.5356 32.6461 36.2111V42.2078H40.3801C44.9217 38.0278 47.532 31.8547 47.532 24.5528Z"/>
                                    <path fill="#34A853" d="M24.48 48.0016C30.9529 48.0016 36.4116 45.8764 40.3888 42.2078L32.6549 36.2111C30.5031 37.675 27.7252 38.5039 24.4888 38.5039C18.2275 38.5039 12.9187 34.2798 11.0139 28.6006H3.03296V34.7825C7.10718 42.8868 15.4056 48.0016 24.48 48.0016Z"/>
                                    <path fill="#FBBC04" d="M11.0051 28.6006C9.99973 25.6199 9.99973 22.3922 11.0051 19.4115V13.2296H3.03298C-0.371021 20.0112 -0.371021 28.0009 3.03298 34.7825L11.0051 28.6006Z"/>
                                    <path fill="#EA4335" d="M24.48 9.49932C27.9016 9.44641 31.2086 10.7339 33.6866 13.0973L40.5387 6.24523C36.2 2.17101 30.4414 -0.068932 24.48 0.00161733C15.4055 0.00161733 7.10718 5.11644 3.03296 13.2296L11.005 19.4115C12.901 13.7235 18.2187 9.49932 24.48 9.49932Z"/>
                                </svg>
                                <span className="text-sm font-bold text-gray-700">Continue with Google</span>
                            </>
                        )}
                    </button>

                    {/* Footer note */}
                    <div className="mt-8 text-center">
                        <div className="flex items-center justify-center gap-2 text-white/20">
                            <Shield className="w-3 h-3" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Access Restricted to Invited Members</span>
                        </div>
                    </div>
                </div>

                {/* Branding Footer */}
                <div className="mt-8 flex flex-col items-center gap-4 animate-in fade-in duration-1000 delay-500">
                    <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em]">Powered by EUSAI Tactical Framework v4.2</p>
                </div>
            </div>
        </div>
    );
}
