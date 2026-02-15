"use client";

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Mail, Lock, Chrome, Github, LogIn } from 'lucide-react';

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

        // For demo purposes - in production, implement proper email/password auth
        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError('Invalid credentials');
            } else {
                router.push('/');
            }
        } catch (err) {
            setError('Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOAuthLogin = async (provider: 'google' | 'github') => {
        setIsLoading(true);
        await signIn(provider, { callbackUrl: '/' });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0052CC] to-[#0747A6] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center mx-auto mb-4 shadow-xl">
                        <span className="text-3xl font-bold text-[#0052CC]">EU</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">EUSAI TEAM</h1>
                    <p className="text-[#DEEBFF] text-sm">Enterprise Resource Management · Sign in to continue</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-lg shadow-2xl p-8">
                    {/* OAuth Buttons */}
                    <div className="space-y-3 mb-6">
                        <Button
                            variant="secondary"
                            className="w-full justify-center"
                            size="lg"
                            leftIcon={<Chrome className="w-5 h-5" />}
                            onClick={() => handleOAuthLogin('google')}
                            isLoading={isLoading}
                        >
                            Continue with Google
                        </Button>
                        <Button
                            variant="secondary"
                            className="w-full justify-center"
                            size="lg"
                            leftIcon={<Github className="w-5 h-5" />}
                            onClick={() => handleOAuthLogin('github')}
                            isLoading={isLoading}
                        >
                            Continue with GitHub
                        </Button>
                    </div>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[#DFE1E6]"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-[#6B778C] font-medium">Or sign in with email</span>
                        </div>
                    </div>

                    {/* Email/Password Form */}
                    <form onSubmit={handleEmailLogin} className="space-y-4">
                        <Input
                            type="email"
                            label="Email Address"
                            placeholder="your.email@eusai.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            leftIcon={<Mail className="w-4 h-4" />}
                            required
                        />

                        <Input
                            type="password"
                            label="Password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            leftIcon={<Lock className="w-4 h-4" />}
                            required
                        />

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full justify-center"
                            size="lg"
                            leftIcon={<LogIn className="w-5 h-5" />}
                            isLoading={isLoading}
                        >
                            Sign In
                        </Button>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 text-center text-sm text-[#6B778C]">
                        <p>Don't have an account? Contact your administrator</p>
                    </div>
                </div>

                {/* Bottom text */}
                <p className="text-center text-[#DEEBFF] text-xs mt-6">
                    © 2026 EUSAI TEAM. Secure authentication powered by NextAuth.
                </p>
            </div>
        </div>
    );
}
