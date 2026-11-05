"use client";

import React, { useId } from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

export default function Sparkline({ data, color = '#60A5FA', className = 'h-10 w-24' }: { data: number[]; color?: string; className?: string }) {
    const id = useId().replace(/:/g, '');
    if (data.length < 2) return null;
    const points = data.map((v, i) => ({ i, v }));
    return (
        <div className={className}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={points} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
                    <defs>
                        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.45} />
                            <stop offset="100%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#spark-${id})`} isAnimationActive={false} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
