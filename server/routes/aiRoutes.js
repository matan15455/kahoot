import express from "express";
import { GoogleGenAI, Type } from "@google/genai";

const router = express.Router();

const ai = new GoogleGenAI({
  apiKey: "AIzaSyDIsrZJyoRXD_q4HXpx_n9ofLX9bRXqyFo"
});

router.post("/generate-quiz", async (req, res) => {

  try {

    const { topic, difficulty, numQuestions } = req.body;

    const config = {
      thinkingConfig: {
        thinkingBudget: 0
      },

      responseMimeType: "application/json",

      responseSchema: {
        type: Type.OBJECT,
        required: ["questions"],
        properties: {

          title: {
            type: Type.STRING
          },

          description: {
            type: Type.STRING
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
- Difficulty must match the requested level (easy, medium, hard).
- The language must match the topic language.
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
Difficulty: ${difficulty}
`
          }
        ]
      }
    ];

    const stream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      config,
      contents
    });

    let fullText = "";

    for await (const chunk of stream) {
      if (chunk.text) {
        fullText += chunk.text;
      }
    }

    const data = JSON.parse(fullText);

    res.json(data);

  } catch (err) {

    console.error("AI ERROR:", err);

    res.status(500).json({
      error: "AI generation failed"
    });

  }

});

export default router;