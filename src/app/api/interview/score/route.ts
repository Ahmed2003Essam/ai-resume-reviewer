import { NextResponse } from "next/server";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { getOpenAIClient } from "@/lib/openai";
import {
    interviewFeedbackSchema,
    interviewScoreRequestSchema,
} from "@/lib/schemas";

// Keeps every API failure in the same client-friendly response shape.
function errorResponse(
    error: string,
    code: string,
    status: number,
    retryable = false
) {
    return NextResponse.json({ error, code, retryable }, { status });
}

/** Validates one answer and returns structured, bounded interview feedback. */
export async function POST(req: Request) {
    let requestBody: unknown;

    try {
        requestBody = await req.json();
    } catch {
        return errorResponse(
            "Request body must be valid JSON.",
            "INVALID_JSON",
            400
        );
    }

    const requestResult = interviewScoreRequestSchema.safeParse(requestBody);

    if (!requestResult.success) {
        return errorResponse(
            "Question, answer, question type, and target role are required and must be within the supported size limits.",
            "INVALID_REQUEST",
            400
        );
    }

    const { question, answer, type, targetRole } = requestResult.data;
    const client = getOpenAIClient();

    if (!client) {
        console.error("Interview scoring is missing OPENAI_API_KEY.");
        return errorResponse(
            "Interview scoring is temporarily unavailable.",
            "SERVICE_NOT_CONFIGURED",
            500
        );
    }

    try {
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
- If the answer gives no specific example, reasoning, technical detail, or measurable result, the score must be low.
- Do not give partial credit just because the answer contains a relevant keyword.
- For behavioral questions, expect STAR structure: Situation, Task, Action, Result.
- For technical questions, expect clear explanation, tools, reasoning, tradeoffs, and correctness.
- For project questions, expect the goal, implementation details, challenges, impact, and lessons learned.
- Be honest and critical, but constructive.

Scoring scale:
0-2 = unacceptable or extremely incomplete
3-4 = weak answer with major missing pieces
5-6 = partially acceptable but vague or underdeveloped
7-8 = strong answer with clear structure and details
9-10 = excellent, specific, role-aligned, polished answer

All scores must be from 0 to 10. Mention exactly what is missing and provide a strong professional improved answer.
`;

        const completion = await client.chat.completions.parse({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            response_format: zodResponseFormat(
                interviewFeedbackSchema,
                "interview_feedback"
            ),
            temperature: 0.4,
        });

        const message = completion.choices[0]?.message;

        if (message?.refusal) {
            console.warn("Interview scoring was refused by the model.");
            return errorResponse(
                "The AI service could not evaluate this answer.",
                "AI_REFUSAL",
                502
            );
        }

        if (!message?.parsed) {
            return errorResponse(
                "The AI service returned no usable feedback. Please try again.",
                "EMPTY_AI_RESPONSE",
                502,
                true
            );
        }

        const feedbackResult = interviewFeedbackSchema.safeParse(message.parsed);

        if (!feedbackResult.success) {
            console.error("Invalid interview feedback structure:", {
                issues: feedbackResult.error.issues,
            });
            return errorResponse(
                "The AI service returned invalid feedback. Please try again.",
                "INVALID_AI_RESPONSE",
                502,
                true
            );
        }

        return NextResponse.json(feedbackResult.data);
    } catch (error) {
        if (error instanceof OpenAI.APIError) {
            console.error("OpenAI interview scoring error:", {
                name: error.name,
                status: error.status,
                requestId: error.requestID,
            });

            if (error.status === 429) {
                return errorResponse(
                    "The AI service is busy. Please wait a moment and try again.",
                    "AI_RATE_LIMITED",
                    429,
                    true
                );
            }

            if (!error.status || error.status >= 500) {
                return errorResponse(
                    "The AI service is temporarily unavailable. Please try again.",
                    "AI_SERVICE_UNAVAILABLE",
                    503,
                    true
                );
            }

            if (error.status === 401 || error.status === 403) {
                return errorResponse(
                    "Interview scoring is temporarily unavailable.",
                    "AI_CONFIGURATION_ERROR",
                    500
                );
            }

            return errorResponse(
                "The AI service could not evaluate the answer.",
                "AI_REQUEST_FAILED",
                502
            );
        }

        console.error("Interview scoring error:", error);
        return errorResponse(
            "Failed to evaluate answer.",
            "INTERVIEW_SCORING_FAILED",
            500
        );
    }
}
