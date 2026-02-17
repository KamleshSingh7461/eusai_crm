import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import StatusBadge, { StatusType } from './StatusBadge';

export interface TableColumn {
    id: string;
    header: string;
    width?: string;
    type?: 'text' | 'status' | 'date' | 'number';
}

export interface TableRow {
    id: string;
    [key: string]: any;
}

interface DatabaseTableProps {
    columns: TableColumn[];
    data: TableRow[];
    onRowClick?: (row: TableRow) => void;
    sortable?: boolean;
    emptyMessage?: string;
}

export default function DatabaseTable({
    columns,
    data,
    onRowClick,
    sortable = true,
    emptyMessage = 'No items to display'
}: DatabaseTableProps) {
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const handleSort = (columnId: string) => {
        if (!sortable) return;

        if (sortColumn === columnId) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(columnId);
            setSortDirection('asc');
        }
    };

    const sortedData = React.useMemo(() => {
        if (!sortColumn) return data;

        return [...data].sort((a, b) => {
            const aVal = a[sortColumn];
            const bVal = b[sortColumn];

            if (aVal === bVal) return 0;
            const comparison = aVal > bVal ? 1 : -1;
            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [data, sortColumn, sortDirection]);

    const renderCell = (column: TableColumn, row: TableRow) => {
        const value = row[column.id];

        switch (column.type) {
            case 'status':
                return <StatusBadge status={value as StatusType} size="sm" />;
            case 'date':
                return (
                    <span className="text-sm" style={{ color: 'var(--notion-text-secondary)' }}>
                        {value ? new Date(value).toLocaleDateString() : '—'}
                    </span>
                );
            case 'number':
                return (
                    <span className="text-sm font-mono" style={{ color: 'var(--notion-text-primary)' }}>
                        {value ?? '—'}
                    </span>
                );
            default:
                return (
                    <span className="text-sm" style={{ color: 'var(--notion-text-primary)' }}>
                        {value ?? '—'}
                    </span>
                );
        }
    };

    if (!data || data.length === 0) {
        return (
            <div
                className="rounded-md border p-12 text-center"
                style={{
                    backgroundColor: 'var(--notion-bg-secondary)',
                    borderColor: 'var(--notion-border-default)'
                }}
            >
                <p className="text-sm" style={{ color: 'var(--notion-text-tertiary)' }}>
                    {emptyMessage}
                </p>
            </div>
        );
    }

    return (
        <div
            className="rounded-md border overflow-hidden"
            style={{
                backgroundColor: 'var(--notion-bg-secondary)',
                borderColor: 'var(--notion-border-default)'
            }}
        >
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr
                            className="border-b"
                            style={{
                                backgroundColor: 'var(--notion-bg-primary)',
                                borderColor: 'var(--notion-border-default)'
                            }}
                        >
                            {columns.map((column) => (
                                <th
                                    key={column.id}
                                    onClick={() => handleSort(column.id)}
                                    className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${sortable ? 'cursor-pointer hover:bg-[var(--notion-bg-hover)]' : ''
                                        }`}
                                    style={{
                                        color: 'var(--notion-text-tertiary)',
                                        width: column.width
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        {column.header}
                                        {sortable && sortColumn === column.id && (
                                            sortDirection === 'asc' ?
                                                <ChevronUp className="w-3.5 h-3.5" /> :
                                                <ChevronDown className="w-3.5 h-3.5" />
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.map((row, rowIndex) => (
                            <tr
                                key={row.id}
                                onClick={() => onRowClick?.(row)}
                                className={`border-b last:border-b-0 transition-colors ${onRowClick ? 'cursor-pointer hover:bg-[var(--notion-bg-hover)]' : ''
                                    }`}
                                style={{ borderColor: 'var(--notion-border-default)' }}
                            >
                                {columns.map((column) => (
                                    <td key={column.id} className="px-4 py-3">
                                        {renderCell(column, row)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
