import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { resumeText, jobDescription, targetRole, review } = await req.json();

        if (!resumeText || !targetRole) {
            return NextResponse.json(
                { error: "Resume text and target role are required." },
                { status: 400 }
            );
        }

        const prompt = `
You are an expert technical interviewer.

Generate a mock interview for this candidate.

Target role:
${targetRole}

Job description:
${jobDescription || "No job description provided."}

Resume:
${resumeText}

Resume review feedback:
${JSON.stringify(review)}

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "id": 1,
      "type": "behavioral",
      "question": "..."
    }
  ]
}

Rules:
- Generate exactly 8 questions.
- 3 behavioral questions.
- 3 technical questions.
- 2 project deep-dive questions.
- Questions should be specific to the candidate's resume.
- Questions should match the target role.
- No markdown.
`;

        const completion = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.5,
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0]?.message?.content;

        if (!content) {
            return NextResponse.json(
                { error: "No AI response received." },
                { status: 500 }
            );
        }

        return NextResponse.json(JSON.parse(content));
    } catch (error) {
        console.error("Interview generation error:", error);

        return NextResponse.json(
            { error: "Failed to generate interview questions." },
            { status: 500 }
        );
    }
}