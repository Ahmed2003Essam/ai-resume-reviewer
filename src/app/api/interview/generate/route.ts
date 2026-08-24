import { NextResponse } from "next/server";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { getOpenAIClient } from "@/lib/openai";
import {
    interviewGenerateRequestSchema,
    interviewQuestionsOutputSchema,
    interviewQuestionsSchema,
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

/** Generates and validates exactly eight role-specific interview questions. */
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

    const requestResult = interviewGenerateRequestSchema.safeParse(requestBody);

    if (!requestResult.success) {
        return errorResponse(
            "Resume text, target role, and a valid resume review are required and must be within the supported size limits.",
            "INVALID_REQUEST",
            400
        );
    }

    const { resumeText, jobDescription, targetRole, review } = requestResult.data;
    const client = getOpenAIClient();

    if (!client) {
        console.error("Interview generation is missing OPENAI_API_KEY.");
        return errorResponse(
            "Interview generation is temporarily unavailable.",
            "SERVICE_NOT_CONFIGURED",
            500
        );
    }

    try {
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

Rules:
- Generate exactly 8 questions.
- Include exactly 3 behavioral questions.
- Include exactly 3 technical questions.
- Include exactly 2 project deep-dive questions.
- Questions should be specific to the candidate's resume.
- Questions should match the target role.
- Give every question a unique positive integer ID.
- Do not repeat questions.
`;

        const completion = await client.chat.completions.parse({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.5,
            response_format: zodResponseFormat(
                interviewQuestionsOutputSchema,
                "interview_questions"
            ),
        });

        const message = completion.choices[0]?.message;

        if (message?.refusal) {
            console.warn("Interview generation was refused by the model.");
            return errorResponse(
                "The AI service could not generate questions for this request.",
                "AI_REFUSAL",
                502
            );
        }

        if (!message?.parsed) {
            return errorResponse(
                "The AI service returned no usable question set. Please try again.",
                "EMPTY_AI_RESPONSE",
                502,
                true
            );
        }

        const questionsResult = interviewQuestionsSchema.safeParse(message.parsed);

        if (!questionsResult.success) {
            console.error("Invalid interview question composition:", {
                issues: questionsResult.error.issues,
            });
            return errorResponse(
                "The AI service returned an invalid question set. Please try again.",
                "INVALID_AI_RESPONSE",
                502,
                true
            );
        }

        return NextResponse.json(questionsResult.data);
    } catch (error) {
        if (error instanceof OpenAI.APIError) {
            console.error("OpenAI interview generation error:", {
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
                    "Interview generation is temporarily unavailable.",
                    "AI_CONFIGURATION_ERROR",
                    500
                );
            }

            return errorResponse(
                "The AI service could not generate interview questions.",
                "AI_REQUEST_FAILED",
                502
            );
        }

        console.error("Interview generation error:", error);
        return errorResponse(
            "Failed to generate interview questions.",
            "INTERVIEW_GENERATION_FAILED",
            500
        );
    }
}
