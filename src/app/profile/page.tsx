"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { User, Mail, Shield, LogOut, Save } from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function ProfilePage() {
    const { data: session } = useSession();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('');
    const [isSaving, setIsSaving] = useState(false);

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

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'ADMIN': return 'bg-[#FF5630] text-white';
            case 'PM': return 'bg-[#0052CC] text-white';
            default: return 'bg-[#36B37E] text-white';
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#172B4D] mb-2">Profile Settings</h1>
                    <p className="text-[#6B778C]">Manage your account information and preferences</p>
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
            <div className="bg-white border border-[#DFE1E6] rounded-lg p-8 space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-[#DEEBFF] flex items-center justify-center text-[#0052CC] text-3xl font-bold">
                        {name?.charAt(0) || session?.user?.email?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[#172B4D] mb-1">{name || 'User'}</h2>
                        <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRoleBadgeColor(role)}`}>
                                {role}
                            </span>
                            <span className="text-sm text-[#6B778C]">· Member since {new Date().getFullYear()}</span>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-[#DFE1E6]" />

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
                <div className="flex justify-end pt-4">
                    <Button
                        variant="primary"
                        leftIcon={<Save className="w-4 h-4" />}
                        onClick={handleSave}
                        isLoading={isSaving}
                    >
                        Save Changes
                    </Button>
                </div>
            </div>

            {/* Role Information */}
            <div className="bg-[#DEEBFF] border border-[#0052CC]/20 rounded-lg p-6">
                <h3 className="font-bold text-[#172B4D] mb-3 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#0052CC]" />
                    Role Permissions
                </h3>
                <div className="space-y-2 text-sm text-[#172B4D]">
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
