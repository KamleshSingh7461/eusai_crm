
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
    const genAI = new GoogleGenerativeAI("AIzaSyDp0cf1M6n8JmLyjWq69-DyOTZz2jZfbhw");
    try {
        const result = await genAI.getGenerativeModel({ model: "gemini-flash-latest" }).generateContent("test");
        console.log("Gemini-Flash-Latest Works!");
    } catch (e) {
        console.log("Gemini-Flash-Latest Fails:", e.message);
    }

    try {
        const result = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }).generateContent("test");
        console.log("Gemini-1.5-Flash Works!");
    } catch (e) {
        console.log("Gemini-1.5-Flash Fails:", e.message);
    }
}

listModels();
