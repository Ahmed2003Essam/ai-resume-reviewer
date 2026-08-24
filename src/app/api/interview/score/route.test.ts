import OpenAI from "openai";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { INPUT_LIMITS } from "@/lib/schemas";

const { parseMock } = vi.hoisted(() => ({
    parseMock: vi.fn(),
}));

vi.mock("@/lib/openai", () => ({
    getOpenAIClient: () => ({
        chat: {
            completions: {
                parse: parseMock,
            },
        },
    }),
}));

import { POST } from "./route";

const validFeedback = {
    score: 8,
    communication: 8,
    technicalDepth: 7,
    clarity: 8,
    completeness: 8,
    relevance: 9,
    specificity: 7,
    feedback: "A strong answer with room for more technical detail.",
    improvedAnswer: "A stronger answer with a specific example and result.",
    strengths: ["Clear structure"],
    improvements: ["Add technical tradeoffs"],
    redFlags: [],
    missingElements: ["Measurable result"],
};

const validRequestBody = {
    question: "Tell me about a challenging engineering project.",
    answer: "I led a TypeScript project and improved response times by 30 percent.",
    type: "project",
    targetRole: "Software Engineer",
};

function createRequest(body: unknown) {
    return new Request("http://localhost/api/interview/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
}

function mockCompletion(parsed: unknown, refusal: string | null = null) {
    parseMock.mockResolvedValue({
        choices: [{ message: { parsed, refusal } }],
    });
}

describe("POST /api/interview/score", () => {
    beforeEach(() => {
        parseMock.mockReset();
    });

    it("returns 400 for missing input", async () => {
        const response = await POST(createRequest({}));

        expect(response.status).toBe(400);
        expect(parseMock).not.toHaveBeenCalled();
    });

    it("returns 400 for an oversized answer", async () => {
        const response = await POST(
            createRequest({
                ...validRequestBody,
                answer: "x".repeat(INPUT_LIMITS.answer + 1),
            })
        );

        expect(response.status).toBe(400);
        expect(parseMock).not.toHaveBeenCalled();
    });

    it("returns 200 for valid structured feedback", async () => {
        mockCompletion(validFeedback);

        const response = await POST(createRequest(validRequestBody));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.score).toBe(8);
        expect(parseMock).toHaveBeenCalledOnce();
    });

    it("returns 502 when parsed model output is missing", async () => {
        mockCompletion(null);

        const response = await POST(createRequest(validRequestBody));

        expect(response.status).toBe(502);
    });

    it("returns 502 for feedback outside the score range", async () => {
        mockCompletion({ ...validFeedback, score: 11 });

        const response = await POST(createRequest(validRequestBody));

        expect(response.status).toBe(502);
    });

    it("returns 502 when the model refuses the request", async () => {
        mockCompletion(null, "I cannot process this request.");

        const response = await POST(createRequest(validRequestBody));
        const body = await response.json();

        expect(response.status).toBe(502);
        expect(body.code).toBe("AI_REFUSAL");
    });

    it("returns 429 when OpenAI rate-limits the request", async () => {
        parseMock.mockRejectedValue(
            new OpenAI.RateLimitError(
                429,
                { code: "rate_limit_exceeded" },
                "Rate limited",
                new Headers()
            )
        );

        const response = await POST(createRequest(validRequestBody));

        expect(response.status).toBe(429);
    });
});
