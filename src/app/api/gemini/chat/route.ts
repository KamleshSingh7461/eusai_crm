import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function POST(req: NextRequest) {
    try {
        const { message, context } = await req.json();

        if (!process.env.GOOGLE_API_KEY) {
            return NextResponse.json({ reply: "I'm not configured properly (Missing API Key)." }, { status: 500 });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const systemPrompt = `You are a helpful AI assistant for the EUSAI CRM platform. 
        Your goal is to help users navigate and use the platform effectively.
        The platform includes features for Project Management, Team Management, Reports, and Analytics.
        Users have roles: Director, Manager, Team Leader, Employee.
        
        Current Context: ${context || "General Query"}
        User Message: ${message}
        
        Keep your answer concise, professional, and helpful.`;

        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ reply: text });

    } catch (error) {
        console.error("Gemini Chat Error:", error);
        return NextResponse.json({ reply: "I encountered an error processing your request." }, { status: 500 });
    }
}
