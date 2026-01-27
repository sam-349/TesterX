const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function run() {
    const modelsToTry = ["gemini-flash-latest", "gemini-pro-latest", "gemini-1.5-flash", "gemini-1.0-pro"];

    for (const modelName of modelsToTry) {
        try {
            console.log(`\nTesting model: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hi");
            const text = (await result.response).text();
            console.log(`✅ Success with ${modelName}:`, text);
            return; // Stop if any works
        } catch (err) {
            console.log(`❌ Failed ${modelName}: ${err.status} - ${err.message}`);
        }
    }
}

run();
