import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/mongodb';
import { Activity } from '@/models/MongoModels';

export async function POST(request: Request) {
    try {
        const { projectId, query } = await request.json();
        const apiKey = process.env.GEMINI_API_KEY;

        console.log(`[AI Insights] Request for Project: ${projectId}, Query: ${query}`);

        if (!apiKey || apiKey === "") {
            console.log("[AI Insights] No API Key found, using Simulation Mode");
            return NextResponse.json({
                insight: "AI Analysis is currently in 'Simulation Mode'.\n\n**Assessment:** Project shows stable velocity. No immediate action required.",
                isMock: true
            });
        }

        // Initialize with verified model handle
        const genAI = new GoogleGenerativeAI(apiKey);
        const modelName = "gemini-flash-latest"; // Verified via diagnostic script for this environment

        // Specifying v1 API to avoid v1beta 404 issues
        const model = genAI.getGenerativeModel({ model: modelName });

        // 1. Fetch data for analysis
        if (projectId === 'GLOBAL' || !projectId) {
            console.log("[AI Insights] GLOBAL context detected");
            const prompt = query
                ? `Analyze the following query for all projects: "${query}". Provide a concise professional response.`
                : "Provide a global project health assessment for the entire platform (max 3 bullets).";

            console.log(`[AI Insights] Generating content for GLOBAL prompt using ${modelName} (v1)...`);
            const result = await model.generateContent(prompt);
            const responseText = result.response.text();
            console.log("[AI Insights] Global response generated successfully");
            return NextResponse.json({ insight: responseText, isMock: false });
        }

        console.log(`[AI Insights] Searching for project with ID: ${projectId}`);
        const project = await (prisma as any).project.findUnique({
            where: { id: projectId },
            include: { tasks: true, resources: true }
        });

        if (!project) {
            console.log(`[AI Insights] Project ${projectId} not found in database`);
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        console.log("[AI Insights] Connecting to MongoDB for activity stream...");
        await dbConnect();
        const activities = await Activity.find({ projectId }).sort({ timestamp: -1 }).limit(20);
        console.log(`[AI Insights] Found ${activities.length} activity records`);

        const dataContext = `
            Project: ${project.name}
            Status: ${project.status}
            Tasks: ${project.tasks.length} total, ${project.tasks.filter((t: any) => t.status === 'DONE').length} completed.
            Resources: ${project.resources.length} allocated.
            Activities: ${activities.map((a: any) => `- ${a.action}`).join(', ')}
        `;

        const prompt = query
            ? `Based on this project data: ${dataContext}\n\nAnswer the user query concisely: "${query}"`
            : `Analyze this project data and provide a concise assessment (max 3 bullets):\n${dataContext}`;

        console.log(`[AI Insights] Generating content for PROJECT prompt using ${modelName} (v1)...`);
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        console.log("[AI Insights] Project response generated successfully");
        return NextResponse.json({ insight: responseText, isMock: false });

    } catch (error: any) {
        console.error('Gemini API Error details:', {
            message: error.message,
            stack: error.stack
        });

        // User-friendly error message
        const userMsg = error.message.includes('404')
            ? "The Gemini model 'gemini-1.5-flash' could not be reached. Please verify your API key access levels."
            : `AI Analysis failed: ${error.message}`;

        return NextResponse.json({ error: userMsg }, { status: 500 });
    }
}
