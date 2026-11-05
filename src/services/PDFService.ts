import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const BRAND: [number, number, number] = [37, 99, 235];
const INK: [number, number, number] = [15, 23, 42];
const MUTED: [number, number, number] = [100, 116, 139];

const fmtDate = (d?: string | Date | null) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-');
const humanize = (v?: string | null) => (v ? v.replace(/_/g, ' ').toLowerCase().replace(/^./, c => c.toUpperCase()) : '-');
// The default PDF font has no rupee glyph, so amounts are written as "INR".
const inr = (n: unknown) => `INR ${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;
const PRIORITY: Record<number, string> = { 3: 'High', 2: 'Medium', 1: 'Low' };

export class PDFService {
    /** Project summary built only from the project's real data (tasks, milestones, expenses, managers). */
    static generateProjectExecutiveSummary(project: any) {
        const doc = new jsPDF();
        const tasks: any[] = project.tasks || [];
        const milestones: any[] = project.milestones || [];
        const expenses: any[] = project.expenses || [];
        const now = new Date();

        const done = tasks.filter(t => t.status === 'DONE').length;
        const overdue = tasks.filter(t => t.status !== 'DONE' && t.deadline && new Date(t.deadline) < now).length;
        const msDone = milestones.filter(m => m.status === 'COMPLETED').length;
        const approvedSpend = expenses.filter(e => e.status === 'APPROVED').reduce((s, e) => s + Number(e.amount || 0), 0);
        const pendingSpend = expenses.filter(e => e.status === 'PENDING').reduce((s, e) => s + Number(e.amount || 0), 0);
        const budget = Number(project.budget) || 0;

        doc.setFillColor(...BRAND);
        doc.rect(0, 0, 210, 6, 'F');
        doc.setFontSize(20);
        doc.setTextColor(...INK);
        doc.text(project.name || 'Project summary', 14, 22);
        doc.setFontSize(10);
        doc.setTextColor(...MUTED);
        doc.text(`Project summary · generated ${now.toLocaleString('en-IN')}`, 14, 29);

        const section = (title: string, y: number) => {
            doc.setFontSize(13);
            doc.setTextColor(...INK);
            doc.text(title, 14, y);
            return y + 4;
        };
        const nextY = () => (doc as any).lastAutoTable.finalY + 12;

        autoTable(doc, {
            startY: section('Overview', 42),
            body: [
                ['Status', humanize(project.status)],
                ['Department', project.space?.name || 'Unassigned'],
                ['Managers', (project.managers || []).map((m: any) => m.name).join(', ') || 'Unassigned'],
                ['Timeline', `${fmtDate(project.startDate)} to ${fmtDate(project.endDate)}`],
                ['Budget', budget ? inr(budget) : 'Not set'],
            ],
            theme: 'plain',
            styles: { fontSize: 10, cellPadding: 2 },
            columnStyles: { 0: { textColor: MUTED, cellWidth: 40 } },
        });

        autoTable(doc, {
            startY: section('Delivery', nextY()),
            head: [['Measure', 'Value']],
            body: [
                ['Tasks completed', `${done} of ${tasks.length}${tasks.length ? ` (${Math.round((done / tasks.length) * 100)}%)` : ''}`],
                ['Overdue tasks', String(overdue)],
                ['Milestones completed', `${msDone} of ${milestones.length}`],
                ['Approved spend', `${inr(approvedSpend)}${budget ? ` (${Math.round((approvedSpend / budget) * 100)}% of budget)` : ''}`],
                ['Spend awaiting approval', inr(pendingSpend)],
            ],
            theme: 'grid',
            headStyles: { fillColor: BRAND },
            styles: { fontSize: 10 },
        });

        if (milestones.length) {
            autoTable(doc, {
                startY: section('Milestones', nextY()),
                head: [['Milestone', 'Status', 'Progress', 'Target']],
                body: milestones.map(m => [m.title, humanize(m.status), `${m.progress ?? 0}%`, fmtDate(m.targetDate)]),
                theme: 'striped',
                headStyles: { fillColor: INK },
                styles: { fontSize: 9 },
            });
        }

        if (tasks.length) {
            autoTable(doc, {
                startY: section('Tasks', nextY()),
                head: [['Task', 'Status', 'Priority', 'Assignee', 'Deadline']],
                body: tasks.map(t => [
                    t.title, humanize(t.status), PRIORITY[t.priority] || '-', t.assignedTo?.name || 'Unassigned',
                    `${fmtDate(t.deadline)}${t.status !== 'DONE' && t.deadline && new Date(t.deadline) < now ? ' (overdue)' : ''}`,
                ]),
                theme: 'striped',
                headStyles: { fillColor: INK },
                styles: { fontSize: 9 },
            });
        }

        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(...MUTED);
            doc.text(`EUSAI · ${project.name} · page ${i} of ${pageCount}`, 14, 290);
        }

        doc.save(`${(project.name || 'project').replace(/[^\w-]+/g, '_')}_summary.pdf`);
    }
}
