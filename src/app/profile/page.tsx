"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { User, Mail, Shield, LogOut, Save, Lock } from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function ProfilePage() {
    const { data: session } = useSession();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Security Credentials State
    const [newPassword, setNewPassword] = useState('');
    const [isSettingPassword, setIsSettingPassword] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        if (session?.user) {
            setEmail(session.user.email || '');
            setName(session.user.name || '');
            setRole((session.user as any).role || 'MEMBER');
        }
    }, [session]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSetupPassword = async () => {
        if (newPassword.length < 6) {
            setPasswordMessage({ text: 'Security Key must be at least 6 characters long.', type: 'error' });
            return;
        }

        setIsSettingPassword(true);
        setPasswordMessage({ text: '', type: '' });

        try {
            const res = await fetch('/api/auth/password/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword }),
            });
            const data = await res.json();

            if (res.ok) {
                setPasswordMessage({ text: 'Password set.', type: 'success' });
                setNewPassword(''); // Clear the field
            } else {
                setPasswordMessage({ text: data.error || 'Failed to setup credentials.', type: 'error' });
            }
        } catch (error) {
            setPasswordMessage({ text: 'A network error occurred.', type: 'error' });
        } finally {
            setIsSettingPassword(false);
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'ADMIN': return 'bg-[#FB7185] text-white';
            case 'PM': return 'bg-[#3B82F6] text-white';
            default: return 'bg-[#34D399] text-white';
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Profile and settings</h1>
                    <p className="mt-2 max-w-2xl text-base text-slate-400">Manage your account information and preferences</p>
                </div>
                <Button
                    variant="ghost"
                    leftIcon={<LogOut className="w-4 h-4" />}
                    onClick={() => signOut({ callbackUrl: '/login' })}
                >
                    Sign Out
                </Button>
            </div>

            {/* Profile Card */}
            <div className="bg-white/[0.03] border border-[#FFFFFF14] rounded-lg p-5 sm:p-8 space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-[#3B82F61F] flex items-center justify-center text-[#3B82F6] text-3xl font-bold">
                        {name?.charAt(0) || session?.user?.email?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[#E6EAF0] mb-1">{name || 'User'}</h2>
                        <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRoleBadgeColor(role)}`}>
                                {role}
                            </span>
                            <span className="text-sm text-[#8B94A5]">· Member since {new Date().getFullYear()}</span>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-[#FFFFFF14]" />

                {/* Form Section */}
                <div className="space-y-4">
                    <Input
                        label="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        leftIcon={<User className="w-4 h-4" />}
                        placeholder="Enter your full name"
                    />

                    <Input
                        label="Email Address"
                        value={email}
                        disabled
                        leftIcon={<Mail className="w-4 h-4" />}
                        helperText="Email cannot be changed"
                    />

                    <Input
                        label="Role"
                        value={role}
                        disabled
                        leftIcon={<Shield className="w-4 h-4" />}
                        helperText="Contact administrator to change your role"
                    />
                </div>

                {/* Actions */}
                <div className="flex justify-end pt-4 pb-6 border-b border-[#FFFFFF14]">
                    <Button
                        variant="primary"
                        leftIcon={<Save className="w-4 h-4" />}
                        onClick={handleSave}
                        isLoading={isSaving}
                    >
                        Save Changes
                    </Button>
                </div>

                {/* Security Credentials Section */}
                <div className="pt-4 space-y-4">
                    <h3 className="font-bold text-[#E6EAF0] mb-1 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-[#3B82F6]" />
                        Credentials Configuration
                    </h3>
                    <p className="text-sm text-[#8B94A5] mb-4">Set a password so this person can also sign in with email instead of Google.</p>

                    <div className="flex items-end gap-4 max-w-md">
                        <div className="flex-1">
                            <Input
                                label="New Security Key"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                leftIcon={<Lock className="w-4 h-4" />}
                                placeholder="••••••••"
                            />
                        </div>
                        <Button
                            variant="secondary"
                            onClick={handleSetupPassword}
                            isLoading={isSettingPassword}
                        >
                            Establish Key
                        </Button>
                    </div>

                    {passwordMessage.text && (
                        <div className={`p-3 rounded-lg text-sm border flex items-center gap-2 ${passwordMessage.type === 'success' ? 'bg-[#34D3991F] border-[#34D399]/20 text-[#059669]' : 'bg-[#FB71851F] border-[#FB7185]/20 text-[#E11D48]'}`}>
                            <Shield className="w-4 h-4 shrink-0" /> {passwordMessage.text}
                        </div>
                    )}
                </div>
            </div>

            {/* Role Information */}
            <div className="bg-[#3B82F61F] border border-[#3B82F6]/20 rounded-lg p-6">
                <h3 className="font-bold text-[#E6EAF0] mb-3 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#3B82F6]" />
                    Role Permissions
                </h3>
                <div className="space-y-2 text-sm text-[#E6EAF0]">
                    {role === 'ADMIN' && (
                        <>
                            <p>✓ Full platform access</p>
                            <p>✓ User management</p>
                            <p>✓ System configuration</p>
                            <p>✓ All reports and analytics</p>
                        </>
                    )}
                    {role === 'PM' && (
                        <>
                            <p>✓ Project management</p>
                            <p>✓ Resource allocation</p>
                            <p>✓ Team reports</p>
                            <p>✗ System administration</p>
                        </>
                    )}
                    {role === 'MEMBER' && (
                        <>
                            <p>✓ View assigned projects</p>
                            <p>✓ Update task status</p>
                            <p>✓ Submit reports</p>
                            <p>✗ Manage resources</p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
