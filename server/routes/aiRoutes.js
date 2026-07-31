import express from "express";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY
});

router.post("/generate-quiz", async (req, res) => {

  try {

    const { topic, instructions, numQuestions } = req.body;

    const config = {
      thinkingConfig: {
        thinkingBudget: 0
      },

      responseMimeType: "application/json",

      responseSchema: {
        type: Type.OBJECT,
        required: ["title", "description", "questions"],
        properties: {

          title: {
            type: Type.STRING,
            description: "שם קצר לחידון, מקסימום 5 מילים"
          },

          description: {
            type: Type.STRING,
            description: "תיאור קצר של החידון בעברית, 1-2 משפטים"
          },

          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,

              required: ["text","options","correctIndex"],

              properties: {

                text: {
                  type: Type.STRING
                },

                options: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.STRING
                  }
                },

                correctIndex: {
                  type: Type.INTEGER
                }

              }
            }
          }

        }
      },

      systemInstruction: [
        {
          text: `
You are an expert quiz generator.

Generate high-quality multiple-choice quiz questions.

Rules:
- Each question must have exactly 4 answer options.
- Only one option is correct.
- Questions must match the requested topic.
- If the user provides "Additional instructions", prioritize them to determine difficulty, tone, or style.
- If no specific instructions are provided, maintain a balanced, educational tone suitable for general knowledge.
- The language must match the topic language.
- Always provide a short description (1-2 sentences) summarizing the quiz topic in the same language as the topic.
- The quiz title must be short and concise - maximum 5 words.
`
        }
      ]
    };

    const contents = [
      {
        role: "user",
        parts: [
          {
            text: `
Generate ${numQuestions} quiz questions.

Topic: ${topic}
${instructions ? `Additional instructions: ${instructions}` : ""}
`
          }
        ]
      }
    ];

    let stream;
    try {
      stream = await ai.models.generateContentStream({
        model: "gemini-3.5-flash",
        config,
        contents
      });
    } catch (googleErr) {
      console.error("🔴 GOOGLE API ERROR", googleErr.message);
      return res.status(502).json({
        error: "שגיאה בשירות ה-AI של Google (Gemini) - הבעיה אינה באתר",
        source: "google-api",
        details: googleErr.message
      });
    }

    let fullText = "";

    try {
      for await (const chunk of stream) {
        if (chunk.text) {
          fullText += chunk.text;
        }
      }
    } catch (googleStreamErr) {
      console.error("🔴 GOOGLE API STREAM ERROR", googleStreamErr);
      return res.status(502).json({
        error: "שגיאה בשירות ה-AI של Google (Gemini) - הבעיה אינה באתר",
        source: "google-api",
        details: googleStreamErr.message
      });
    }

    let data;
    try {
      data = JSON.parse(fullText);
    } catch (parseErr) {
      console.error("🔴 GOOGLE RETURNED INVALID JSON", fullText);
      return res.status(502).json({
        error: "שירות ה-AI של Google החזיר תשובה לא תקינה - הבעיה אינה באתר",
        source: "google-api"
      });
    }

    res.json(data);

  } catch (err) {

    console.error("AI ERROR (internal):", err);

    res.status(500).json({
      error: "AI generation failed"
    });

  }

});

export default router;