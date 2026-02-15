'use client';

import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    Legend
} from 'recharts';
import { DollarSign, TrendingDown, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const BUDGET_DATA = [
    { name: 'Infrastructure', budget: 500000, actual: 480000 },
    { name: 'Personnel', budget: 800000, actual: 850000 },
    { name: 'Software', budget: 150000, actual: 120000 },
    { name: 'Operations', budget: 100000, actual: 110000 },
];

const BudgetVarianceChart = () => {
    const totalBudget = BUDGET_DATA.reduce((acc, curr) => acc + curr.budget, 0);
    const totalActual = BUDGET_DATA.reduce((acc, curr) => acc + curr.actual, 0);
    const variance = ((totalActual - totalBudget) / totalBudget) * 100;

    return (
        <div className="card-eusai flex flex-col h-full bg-white">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-[#36B37E]" />
                        Budget Variance Analysis
                    </h3>
                    <p className="text-[10px] text-[#6B778C] font-bold uppercase tracking-widest mt-1">Financial Intelligence</p>
                </div>
                <div className="text-right">
                    <p className={cn(
                        "text-lg font-bold",
                        variance > 0 ? "text-[#FF5630]" : "text-[#36B37E]"
                    )}>
                        {variance > 0 ? '+' : ''}{variance.toFixed(1)}%
                    </p>
                    <p className="text-[9px] text-[#6B778C] uppercase font-bold tracking-widest">Baseline Variance</p>
                </div>
            </div>

            <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={BUDGET_DATA} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#EBECF0" vertical={false} />
                        <XAxis dataKey="name" stroke="#6B778C" fontSize={10} axisLine={false} tickLine={false} />
                        <YAxis stroke="#6B778C" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #DFE1E6', borderRadius: '3px', boxShadow: '0 4px 8px rgba(9, 30, 66, 0.25)' }}
                            labelStyle={{ color: '#172B4D', fontWeight: 'bold', fontSize: '12px' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', color: '#6B778C', textTransform: 'uppercase' }} />
                        <Bar dataKey="budget" fill="#172B4D" radius={[2, 2, 0, 0]} name="Allocated" barSize={32} />
                        <Bar dataKey="actual" radius={[2, 2, 0, 0]} name="Actual" barSize={32}>
                            {BUDGET_DATA.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.actual > entry.budget ? '#FF5630' : '#36B37E'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-6 p-3 bg-[#F4F5F7] rounded-sm border border-[#DFE1E6] flex items-start gap-3">
                <div className={cn(
                    "p-1.5 rounded text-white mt-0.5",
                    variance > 0 ? "bg-[#FF5630]" : "bg-[#36B37E]"
                )}>
                    <Info className="w-3.5 h-3.5" />
                </div>
                <div>
                    <h4 className="text-[11px] font-bold text-[#172B4D] uppercase tracking-wider">Financial Insight</h4>
                    <p className="text-xs text-[#42526E] mt-1 leading-snug">
                        {variance > 0
                            ? 'Personnel costs are currently exceeding projection. System recommends audit of resource allocation.'
                            : 'Operations are within target parameters. Efficiency is at 104% of baseline.'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BudgetVarianceChart;
