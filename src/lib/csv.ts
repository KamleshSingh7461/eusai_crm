/** Download rows as a CSV file in the browser. Values are quoted and escaped. */
export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const escape = (value: unknown) => {
        const text = value === null || value === undefined ? '' : value instanceof Date ? value.toISOString() : String(value);
        return `"${text.replace(/"/g, '""')}"`;
    };
    const csv = [headers.map(escape).join(','), ...rows.map(row => headers.map(h => escape(row[h])).join(','))].join('\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}

export const todayStamp = () => new Date().toISOString().slice(0, 10);
