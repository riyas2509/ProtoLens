import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function analyzeProduct(
  inputs: { type: string; data: string; mimeType: string }[],
  textDescription: string
): Promise<AnalysisResult> {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `You are ProtoLens, a brutally honest AI beta tester and product intelligence engine. 
Your purpose is to evaluate whether a product idea, app, website, or prototype actually makes sense and has market potential.

Analyze the provided inputs (images, videos, audio, or text) in 5 intelligence layers:
1. UNDERSTANDING LAYER: Infer product goal, target user, value prop, and expected flow.
2. BETA USER SIMULATION: Simulate using the product like a real user. Write in first-person (e.g., "I feel overwhelmed").
3. UX/UI CRITIQUE: Analyze hierarchy, CTA visibility, layout clarity, visual clutter, and accessibility.
4. MARKET VALIDATION: Analyze demand, originality, and competitive risk.
5. FEASIBILITY: Evaluate technical and business feasibility.

STRICT OUTPUT STRUCTURE:
Your response MUST be a JSON object matching this schema:
{
  "biggestFriction": "one brutally honest sentence",
  "understanding": "detailed markdown summary of what ProtoLens understood",
  "betaSimulation": "detailed first-person narrative of the simulated user experience",
  "criticalProblems": [
    { "priority": "High|Medium|Low", "problem": "...", "impact": "...", "fix": "..." }
  ],
  "marketValidation": "detailed markdown analysis of market and originality",
  "feasibilityAnalysis": "detailed markdown analysis of technical and business feasibility",
  "lessGenericAnalysis": "one insight that goes beyond common AI advice",
  "nextActions": ["Action 1", "Action 2", "Action 3"]
}

Be opinionated, deep, and focus on user psychology. Expose flaws. Do not be generic.`;

  const parts = inputs.map(input => ({
    inlineData: {
      data: input.data.split(',')[1] || input.data,
      mimeType: input.mimeType
    }
  }));

  if (textDescription) {
    parts.push({ text: `Additional User Description: ${textDescription}` } as any);
  }

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: parts as any }],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          biggestFriction: { type: Type.STRING },
          understanding: { type: Type.STRING },
          betaSimulation: { type: Type.STRING },
          criticalProblems: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                priority: { type: Type.STRING },
                problem: { type: Type.STRING },
                impact: { type: Type.STRING },
                fix: { type: Type.STRING }
              },
              required: ["priority", "problem", "impact", "fix"]
            }
          },
          marketValidation: { type: Type.STRING },
          feasibilityAnalysis: { type: Type.STRING },
          lessGenericAnalysis: { type: Type.STRING },
          nextActions: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: [
          "biggestFriction", 
          "understanding", 
          "betaSimulation", 
          "criticalProblems", 
          "marketValidation", 
          "feasibilityAnalysis", 
          "lessGenericAnalysis", 
          "nextActions"
        ]
      }
    }
  });

  if (!response.text) {
    throw new Error("No response from ProtoLens AI");
  }

  return JSON.parse(response.text.trim()) as AnalysisResult;
}
