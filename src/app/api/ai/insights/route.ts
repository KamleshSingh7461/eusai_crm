import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { projectId, query } = await request.json();
        const apiKey = process.env.GEMINI_API_KEY;
        const encoder = new TextEncoder();

        console.log(`[AI Insights] Request for Project: ${projectId}, Query: ${query}`);

        // Streaming helper for Simulation Mode
        const streamSimulation = (text: string) => {
            const stream = new ReadableStream({
                async start(controller) {
                    const chunks = text.split(/(?=[,.\n])/); // Split by punctuation to simulate thinking
                    for (const chunk of chunks) {
                        controller.enqueue(encoder.encode(chunk));
                        await new Promise(resolve => setTimeout(resolve, 50)); // Artificial delay
                    }
                    controller.close();
                }
            });
            return new Response(stream, { headers: { 'Content-Type': 'text/plain' } });
        };

        if (!apiKey || apiKey === "") {
            console.warn("[AI Insights] No API Key found, using Simulation Mode");
            return streamSimulation("⚠️ **Service Note**: Real-time AI services are currently unavailable. \n\n**Simulation Mode Response:**\nBased on your query, here is a projected insight:\n\n*   Project velocity remains consistent.\n*   No critical blockers identified in the current sprint.\n*   Recommendation: Review pending tasks in the 'High Priority' queue.");
        }

        // Initialize with verified model handle
        const genAI = new GoogleGenerativeAI(apiKey);
        const modelName = "gemini-flash-latest"; // Verified via diagnostic script for this environment
        const model = genAI.getGenerativeModel({ model: modelName });

        let prompt = "";

        // 1. Fetch data for analysis
        if (projectId === 'GLOBAL' || !projectId) {
            console.log("[AI Insights] GLOBAL context detected");
            prompt = query
                ? `Analyze the following query for all projects: "${query}". Provide a concise professional response.`
                : "Provide a global project health assessment for the entire platform (max 3 bullets).";
        } else {
            console.log(`[AI Insights] Searching for project with ID: ${projectId}`);
            const project = await (prisma as any).project.findUnique({
                where: { id: projectId },
                include: { tasks: true, resources: true }
            });

            if (!project) {
                return new Response("Project not found", { status: 404 });
            }

            const activities = await (prisma as any).activity.findMany({
                where: { projectId },
                orderBy: { timestamp: 'desc' },
                take: 20
            });

            const dataContext = `
                Project: ${project.name}
                Status: ${project.status}
                Tasks: ${project.tasks.length} total, ${project.tasks.filter((t: any) => t.status === 'DONE').length} completed.
                Resources: ${project.resources.length} allocated.
                Activities: ${activities.map((a: any) => `- ${a.action}`).join(', ')}
            `;

            prompt = query
                ? `Based on this project data: ${dataContext}\n\nAnswer the user query concisely: "${query}"`
                : `Analyze this project data and provide a concise assessment (max 3 bullets):\n${dataContext}`;
        }

        // Create Streaming Response
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    const result = await model.generateContentStream(prompt);
                    for await (const chunk of result.stream) {
                        const chunkText = chunk.text();
                        controller.enqueue(encoder.encode(chunkText));
                    }
                    controller.close();
                } catch (error) {
                    controller.error(error);
                }
            }
        });

        return new Response(stream, { headers: { 'Content-Type': 'text/plain' } });

    } catch (error: any) {
        console.error('Gemini API Error details:', error);

        // Fallback to simulation on error
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                const msg = "⚠️ **Service Interruption**: Using cached simulation model.\n\nI couldn't reach the live AI service right now. Please try again later.";
                controller.enqueue(encoder.encode(msg));
                controller.close();
            }
        });
        return new Response(stream, { headers: { 'Content-Type': 'text/plain' } });
    }
}
