import OpenAI from "openai";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { categoryNames, INPUT_LIMITS } from "@/lib/schemas";

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

const validReview = {
    overallScore: 75,
    matchAnalysis: null,
    categories: categoryNames.map((name) => ({
        name,
        score: 15,
        feedback: `${name} feedback`,
        suggestions: [`Improve ${name}`],
    })),
    positionSuggestions: [],
    improvedBullets: ["Improved a resume bullet with measurable impact."],
};

const validQuestions = [
    { id: 1, type: "behavioral", question: "Behavioral question one?" },
    { id: 2, type: "behavioral", question: "Behavioral question two?" },
    { id: 3, type: "behavioral", question: "Behavioral question three?" },
    { id: 4, type: "technical", question: "Technical question one?" },
    { id: 5, type: "technical", question: "Technical question two?" },
    { id: 6, type: "technical", question: "Technical question three?" },
    { id: 7, type: "project", question: "Project question one?" },
    { id: 8, type: "project", question: "Project question two?" },
];

const validRequestBody = {
    resumeText: "Experienced software engineer with TypeScript projects.",
    jobDescription: "Build reliable web applications.",
    targetRole: "Software Engineer",
    review: validReview,
};

function createRequest(body: unknown) {
    return new Request("http://localhost/api/interview/generate", {
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

describe("POST /api/interview/generate", () => {
    beforeEach(() => {
        parseMock.mockReset();
    });

    it("returns 400 for missing input", async () => {
        const response = await POST(createRequest({}));

        expect(response.status).toBe(400);
        expect(parseMock).not.toHaveBeenCalled();
    });

    it("returns 400 for oversized resume input", async () => {
        const response = await POST(
            createRequest({
                ...validRequestBody,
                resumeText: "x".repeat(INPUT_LIMITS.resumeText + 1),
            })
        );

        expect(response.status).toBe(400);
        expect(parseMock).not.toHaveBeenCalled();
    });

    it("returns 200 for valid structured output", async () => {
        mockCompletion({ questions: validQuestions });

        const response = await POST(createRequest(validRequestBody));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.questions).toHaveLength(8);
        expect(parseMock).toHaveBeenCalledOnce();
    });

    it("returns 502 when parsed model output is missing", async () => {
        mockCompletion(null);

        const response = await POST(createRequest(validRequestBody));

        expect(response.status).toBe(502);
    });

    it("returns 502 for invalid structured output", async () => {
        mockCompletion({ questions: [{ id: 1, type: "behavioral", question: "Only one" }] });

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

    it("rejects output with the wrong interview composition", async () => {
        const invalidComposition = validQuestions.map((question, index) =>
            index === 7 ? { ...question, type: "technical" } : question
        );
        mockCompletion({ questions: invalidComposition });

        const response = await POST(createRequest(validRequestBody));

        expect(response.status).toBe(502);
    });
});
