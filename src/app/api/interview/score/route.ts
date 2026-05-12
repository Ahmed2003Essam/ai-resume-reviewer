import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { question, answer, type, targetRole } = await req.json();

        const prompt = `
You are a strict professional interviewer evaluating a candidate's interview answer.

Target role:
${targetRole}

Question type:
${type}

Question:
${question}

Candidate answer:
${answer}

Evaluate the answer strictly.

Important grading rules:
- If the answer is extremely short, vague, incomplete, or only 1-3 words, the overall score must be between 0 and 2.
- If the answer does not directly answer the question, the overall score must be between 0 and 3.
- If the answer gives no specific example, no reasoning, no technical detail, and no measurable result, the score must be low.
- Do not give partial credit just because the answer contains a relevant keyword.
- For behavioral questions, expect STAR structure: Situation, Task, Action, Result.
- For technical questions, expect clear explanation, tools/technologies, reasoning, tradeoffs, and correctness.
- For project questions, expect project goal, implementation details, challenges, impact, and lessons learned.
- Be honest and critical, but constructive.

Return ONLY valid JSON:

{
  "score": 2,
  "communication": 2,
  "technicalDepth": 1,
  "clarity": 2,
  "completeness": 1,
  "relevance": 2,
  "specificity": 1,
  "feedback": "...",
  "improvedAnswer": "...",
  "strengths": ["...", "..."],
  "improvements": ["...", "..."],
  "redFlags": ["...", "..."],
  "missingElements": ["...", "..."]
}

Scoring scale:
0-2 = unacceptable or extremely incomplete
3-4 = weak answer with major missing pieces
5-6 = partially acceptable but vague or underdeveloped
7-8 = strong answer with clear structure and details
9-10 = excellent, specific, role-aligned, polished answer

Rules:
- Scores must be out of 10.
- Be strict.
- Penalize vague answers heavily.
- Mention exactly what is missing.
- improvedAnswer should be a strong professional answer the candidate could use.
- No markdown.
`;

        const completion = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.4,
        });

        const content = completion.choices[0]?.message?.content;

        if (!content) {
            return NextResponse.json(
                { error: "No AI response." },
                { status: 500 }
            );
        }

        return NextResponse.json(JSON.parse(content));
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Failed to evaluate answer." },
            { status: 500 }
        );
    }
}