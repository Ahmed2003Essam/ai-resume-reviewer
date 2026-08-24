import { describe, expect, it } from "vitest";
import {
    categoryNames,
    interviewQuestionsSchema,
    interviewSessionSchema,
    reviewResultSchema,
} from "./schemas";

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
    { id: 1, type: "behavioral" as const, question: "Behavioral question one?" },
    { id: 2, type: "behavioral" as const, question: "Behavioral question two?" },
    { id: 3, type: "behavioral" as const, question: "Behavioral question three?" },
    { id: 4, type: "technical" as const, question: "Technical question one?" },
    { id: 5, type: "technical" as const, question: "Technical question two?" },
    { id: 6, type: "technical" as const, question: "Technical question three?" },
    { id: 7, type: "project" as const, question: "Project question one?" },
    { id: 8, type: "project" as const, question: "Project question two?" },
];

describe("reviewResultSchema", () => {
    it("accepts a valid five-category review with a consistent overall score", () => {
        expect(reviewResultSchema.safeParse(validReview).success).toBe(true);
    });

    it("requires exactly five categories", () => {
        const result = reviewResultSchema.safeParse({
            ...validReview,
            categories: validReview.categories.slice(0, 4),
            overallScore: 60,
        });

        expect(result.success).toBe(false);
    });

    it("requires every expected category exactly once", () => {
        const duplicateCategoryReview = {
            ...validReview,
            categories: validReview.categories.map((category, index) =>
                index === 4 ? { ...category, name: "Impact" as const } : category
            ),
        };

        expect(reviewResultSchema.safeParse(duplicateCategoryReview).success).toBe(false);
    });

    it("rejects an overall score that differs from the category total", () => {
        expect(
            reviewResultSchema.safeParse({ ...validReview, overallScore: 74 }).success
        ).toBe(false);
    });

    it("enforces category and overall score ranges", () => {
        const invalidScoreReview = {
            ...validReview,
            overallScore: 101,
            categories: validReview.categories.map((category, index) =>
                index === 0 ? { ...category, score: 21 } : category
            ),
        };

        expect(reviewResultSchema.safeParse(invalidScoreReview).success).toBe(false);
    });
});

describe("interviewQuestionsSchema", () => {
    it("accepts the required three behavioral, three technical, and two project questions", () => {
        expect(
            interviewQuestionsSchema.safeParse({ questions: validQuestions }).success
        ).toBe(true);
    });

    it("requires exactly eight questions", () => {
        expect(
            interviewQuestionsSchema.safeParse({
                questions: validQuestions.slice(0, 7),
            }).success
        ).toBe(false);
    });

    it("requires unique question IDs", () => {
        const duplicateIdQuestions = validQuestions.map((question, index) =>
            index === 7 ? { ...question, id: 7 } : question
        );

        expect(
            interviewQuestionsSchema.safeParse({ questions: duplicateIdQuestions }).success
        ).toBe(false);
    });

    it("rejects duplicate question text regardless of case or surrounding whitespace", () => {
        const duplicateQuestions = validQuestions.map((question, index) =>
            index === 7
                ? { ...question, question: "  BEHAVIORAL QUESTION ONE?  " }
                : question
        );

        expect(
            interviewQuestionsSchema.safeParse({ questions: duplicateQuestions }).success
        ).toBe(false);
    });

    it("rejects an incorrect question-type composition", () => {
        const incorrectComposition = validQuestions.map((question, index) =>
            index === 7 ? { ...question, type: "technical" as const } : question
        );

        expect(
            interviewQuestionsSchema.safeParse({ questions: incorrectComposition }).success
        ).toBe(false);
    });
});

describe("interviewSessionSchema", () => {
    it("accepts an active session at a valid question index", () => {
        expect(
            interviewSessionSchema.safeParse({
                questions: validQuestions,
                answers: [],
                feedbacks: [],
                currentIndex: 0,
                completed: false,
            }).success
        ).toBe(true);
    });

    it("rejects inconsistent completed status and current index", () => {
        expect(
            interviewSessionSchema.safeParse({
                questions: validQuestions,
                answers: [],
                feedbacks: [],
                currentIndex: 7,
                completed: true,
            }).success
        ).toBe(false);
    });
});
