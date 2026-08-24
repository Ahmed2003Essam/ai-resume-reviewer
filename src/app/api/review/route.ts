import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { getOpenAIClient } from "@/lib/openai";
import { resumeReviewPrompt } from "@/lib/prompts";
import {
    reviewOutputSchema,
    reviewRequestSchema,
    reviewResultSchema,
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

/** Validates resume input, requests structured AI feedback, and verifies its invariants. */
export async function POST(req: NextRequest) {
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

    const requestResult = reviewRequestSchema.safeParse(requestBody);

    if (!requestResult.success) {
        return errorResponse(
            "Resume text is required and all inputs must be within the supported size limits.",
            "INVALID_REQUEST",
            400
        );
    }

    const { resumeText, jobDescription, targetRole } = requestResult.data;
    const client = getOpenAIClient();

    if (!client) {
        console.error("Resume review is missing OPENAI_API_KEY.");
        return errorResponse(
            "Resume review is temporarily unavailable.",
            "SERVICE_NOT_CONFIGURED",
            500
        );
    }

    try {
        const completion = await client.chat.completions.parse({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "user",
                    content: resumeReviewPrompt(
                        resumeText,
                        jobDescription,
                        targetRole
                    ),
                },
            ],
            temperature: 0.3,
            response_format: zodResponseFormat(
                reviewOutputSchema,
                "resume_review"
            ),
        });

        const message = completion.choices[0]?.message;

        if (message?.refusal) {
            console.warn("Resume review was refused by the model.");
            return errorResponse(
                "The AI service could not review this resume.",
                "AI_REFUSAL",
                502
            );
        }

        if (!message?.parsed) {
            return errorResponse(
                "The AI service returned no usable review. Please try again.",
                "EMPTY_AI_RESPONSE",
                502,
                true
            );
        }

        const reviewResult = reviewResultSchema.safeParse(message.parsed);

        if (!reviewResult.success) {
            console.error("Invalid resume review structure:", {
                issues: reviewResult.error.issues,
            });
            return errorResponse(
                "The AI service returned an inconsistent review. Please try again.",
                "INVALID_AI_RESPONSE",
                502,
                true
            );
        }

        return NextResponse.json(reviewResult.data);
    } catch (error) {
        if (error instanceof OpenAI.APIError) {
            console.error("OpenAI resume review error:", {
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
                    "Resume review is temporarily unavailable.",
                    "AI_CONFIGURATION_ERROR",
                    500
                );
            }

            return errorResponse(
                "The AI service could not review the resume.",
                "AI_REQUEST_FAILED",
                502
            );
        }

        console.error("Resume review error:", error);
        return errorResponse(
            "Something went wrong while reviewing the resume.",
            "RESUME_REVIEW_FAILED",
            500
        );
    }
}
