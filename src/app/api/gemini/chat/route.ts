import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { message, history } = await req.json();
        const user = session.user as any;
        const userId = user.id;
        const userRole = (user.role || 'EMPLOYEE').toUpperCase();
        const userName = user.name?.split(' ')[0] || user.name;

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ reply: "⚠️ AI not configured — GEMINI_API_KEY missing." }, { status: 500 });
        }

        // Fetch real CRM data for context
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        let crmContext = "";

        // DIRECTOR/ADMIN/MANAGEMENT logic
        if (['DIRECTOR', 'ADMIN', 'MANAGEMENT'].includes(userRole)) {
            const [allUsers, tasks, todayReports, projects, spaces, milestones, weeklyReports] = await Promise.all([
                prisma.user.findMany({
                    where: { role: { notIn: ['DIRECTOR', 'ADMIN', 'MANAGEMENT'] } },
                    select: { id: true, name: true, role: true, email: true }
                }),
                (prisma as any).task.findMany({
                    select: { id: true, title: true, status: true, priority: true, deadline: true, userId: true },
                    orderBy: { deadline: 'asc' },
                    take: 100
                }),
                (prisma as any).dailyReport.findMany({
                    where: { date: { gte: today, lt: tomorrow } },
                    include: { user: { select: { id: true, name: true, role: true } } }
                }),
                (prisma as any).project.findMany({
                    select: { id: true, name: true, status: true },
                    take: 30
                }),
                (prisma as any).space.findMany({
                    select: { id: true, name: true }
                }),
                (prisma as any).milestone.findMany({
                    where: { status: { not: 'COMPLETED' } },
                    select: { title: true, status: true, targetDate: true },
                    take: 20
                }),
                (prisma as any).weeklyReport.findMany({
                    where: { weekStartDate: { gte: new Date(new Date().setDate(new Date().getDate() - 30)) } },
                    include: { user: { select: { name: true } } },
                    orderBy: { performanceScore: 'desc' },
                    take: 20
                })
            ]);

            const weeklyStats = (weeklyReports as any[]).map(r => `${r.user.name}: ${r.performanceScore}/100`).join(' | ');
            const submittedUserIds = new Set(todayReports.map((r: any) => r.userId));
            const staffMembers = allUsers.filter((u: any) => ['EMPLOYEE', 'INTERN', 'TEAM_LEADER', 'MANAGER'].includes(u.role));
            const missingReports = staffMembers.filter((u: any) => !submittedUserIds.has(u.id));
            const overdueTasks = tasks.filter((t: any) => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'DONE');
            const activeProjects = projects.filter((p: any) => p.status !== 'CLOSED');

            crmContext = `
=== ORGANISATION OVERVIEW (${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}) ===

TEAM:
- Total staff: ${allUsers.length} members
- Breakdown: ${['MANAGER','TEAM_LEADER','EMPLOYEE','INTERN'].map(role => {
    const count = allUsers.filter((u: any) => u.role === role).length;
    return count > 0 ? `${role}: ${count}` : null;
  }).filter(Boolean).join(', ')}

DAILY REPORTS TODAY:
- Submitted: ${todayReports.length}/${staffMembers.length}
- Submitted by: ${todayReports.map((r: any) => r.user.name).join(', ') || 'Nobody yet'}
- MISSING: ${missingReports.map((u: any) => `${u.name} (${u.role})`).join(', ') || 'None — all submitted! ✅'}

TASKS:
- Total: ${tasks.length} | Done: ${tasks.filter((t: any) => t.status === 'DONE').length}
- OVERDUE: ${overdueTasks.length} tasks

PROJECTS:
- Active: ${activeProjects.length} | Names: ${activeProjects.map((p: any) => p.name).join(', ')}

SPACES/DEPARTMENTS:
- ${spaces.map((s: any) => s.name).join(', ')}

MILESTONES (open):
- ${milestones.length} pending milestones
`;
        } else if (userRole === 'MANAGER' || userRole === 'TEAM_LEADER') {
            const [myTeam, myTasks, todayReports, myProjects] = await Promise.all([
                prisma.user.findMany({
                    where: { reportingManagers: { some: { id: userId } } },
                    select: { id: true, name: true, role: true }
                }),
                (prisma as any).task.findMany({
                    where: { userId: userId },
                    select: { title: true, status: true, priority: true, deadline: true },
                    take: 30
                }),
                (prisma as any).dailyReport.findMany({
                    where: { date: { gte: today, lt: tomorrow } },
                    include: { user: { select: { id: true, name: true } } }
                }),
                (prisma as any).project.findMany({
                    where: { managers: { some: { id: userId } } },
                    select: { name: true, status: true },
                    take: 10
                })
            ]);

            const submittedIds = new Set(todayReports.map((r: any) => r.userId));
            const missingTeam = myTeam.filter((m: any) => !submittedIds.has(m.id));
            const overdue = myTasks.filter((t: any) => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'DONE');

            crmContext = `
=== ${userRole} DASHBOARD for ${userName} ===
MY TEAM: ${myTeam.length} members
REPORTS: ${todayReports.length} submitted today. Missing: ${missingTeam.length}
TASKS: ${myTasks.length} total. Overdue: ${overdue.length}
`;
        } else {
            const [myTasks, myReports] = await Promise.all([
                (prisma as any).task.findMany({
                    where: { userId: userId },
                    select: { title: true, status: true, priority: true, deadline: true },
                    take: 30
                }),
                (prisma as any).dailyReport.findMany({
                    where: { userId: userId },
                    orderBy: { date: 'desc' },
                    take: 7
                })
            ]);

            crmContext = `
=== PERSONAL DASHBOARD for ${userName} ===
MY TASKS: ${myTasks.length} total.
LAST 7 REPORTS: ${myReports.length} submitted.
`;
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const fullSystemPrompt = `You are EUSAI AI, an intelligent assistant built into the EUSAI CRM platform.
You are speaking with ${userName} (${userRole}).

LIVE CRM DATA:
${crmContext}

RESPONSE STYLE:
- Use Markdown: **bold** for names, \`code\` for metrics.
- Be brief (max 3 sentences).
- Use bullet points.

User message: ${message}`;

        const chatHistory = (history || []).slice(-8).map((msg: any) => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        const chat = model.startChat({ history: chatHistory });
        const result = await chat.sendMessage(fullSystemPrompt);
        const text = result.response.text();

        return NextResponse.json({ reply: text });

    } catch (error: any) {
        console.error("EUSAI AI Error:", error);
        return NextResponse.json({
            reply: "I encountered an error fetching your CRM data. Please try again."
        }, { status: 500 });
    }
}
