const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "YOUR_API_KEY_HERE");

const generateQuiz = async (text, config) => {
  // Using gemini-1.5-flash for stability and cost-efficiency
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_ONLY_HIGH",
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_ONLY_HIGH",
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_ONLY_HIGH",
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_ONLY_HIGH",
      },
    ]
  });

  const prompt = `
    Create a quiz based on the following text/topic: "${text}".
    
    Configuration:
    - Difficulty: ${config.difficulty}
    - Number of Questions: ${config.questionCount}
    - Mode: ${config.mode} (If 'flash', questions must be SHORT. If 'general', standard length.)
    
    Output strictly in JSON format as an array of objects:
    [
      {
        "question": "Question text here",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "Correct Option Text"
      }
    ]
    IMPORTANT: Provide ONLY the raw JSON array. Do not include markdown code blocks, explanations, or any other text.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text();

    // Robust JSON Extraction: Find the first '[' and last ']'
    const start = responseText.indexOf('[');
    const end = responseText.lastIndexOf(']');

    if (start === -1 || end === -1) {
      console.error("Raw AI Response:", responseText);
      throw new Error("No JSON array found in AI response");
    }

    const jsonStr = responseText.substring(start, end + 1);
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini AI Error:", error);
    throw new Error("Failed to generate quiz content. " + (error.message || ""));
  }
};

module.exports = { generateQuiz };
