import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { resumeReviewPrompt } from "@/lib/prompts";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { resumeText, jobDescription, targetRole } = body;

        if (!resumeText) {
            return NextResponse.json(
                { error: "Resume text is required." },
                { status: 400 }
            );
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "user",
                    content: resumeReviewPrompt(resumeText, jobDescription, targetRole),
                },
            ],
            temperature: 0.3,
        });

        const reviewText = completion.choices[0]?.message?.content || "{}";

        let parsed;

        try {
            // extract JSON if AI adds extra text
            const jsonMatch = reviewText.match(/\{[\s\S]*\}/);
            const cleanJson = jsonMatch ? jsonMatch[0] : reviewText;

            parsed = JSON.parse(cleanJson);
            if (Array.isArray(parsed.categories)) {
                parsed.overallScore = parsed.categories.reduce(
                    (sum: number, cat: { score: number }) => sum + Number(cat.score || 0),
                    0
                );
            }
        } catch {
            console.error("JSON PARSE ERROR:", reviewText);

            return NextResponse.json(
                { error: "Invalid AI response", raw: reviewText },
                { status: 500 }
            );
        }

        return NextResponse.json(parsed);
    } catch (error) {
        console.error("REVIEW ERROR:", error);

        return NextResponse.json(
            { error: "Something went wrong while reviewing the resume." },
            { status: 500 }
        );
    }
}