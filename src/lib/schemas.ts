import { z } from "zod";

export const INPUT_LIMITS = {
    resumeText: 50_000,
    jobDescription: 20_000,
    targetRole: 100,
    question: 2_000,
    answer: 10_000,
} as const;

export const categoryNames = [
    "Impact",
    "Clarity",
    "Metrics",
    "Relevance",
    "Formatting",
] as const;

export const reviewCategorySchema = z.object({
    name: z.enum(categoryNames),
    score: z.number().min(0).max(20),
    feedback: z.string(),
    suggestions: z.array(z.string()),
});

export const positionSuggestionSchema = z.object({
    positionTitle: z.string(),
    company: z.string(),
    positionScore: z.number().min(0).max(10),
    feedback: z.string(),
    suggestions: z.array(z.string()),
    rewrittenBullets: z.array(z.string()),
});

export const matchAnalysisSchema = z.object({
    matchScore: z.number().min(0).max(100),
    summary: z.string(),
    missingKeywords: z.array(z.string()),
    strongMatches: z.array(z.string()),
});

// Keep this schema free of application-only refinements because it is sent to
// OpenAI as a Structured Outputs JSON schema.
export const reviewOutputSchema = z.object({
    overallScore: z.number().min(0).max(100),
    matchAnalysis: matchAnalysisSchema.nullable(),
    categories: z.array(reviewCategorySchema).length(5),
    positionSuggestions: z.array(positionSuggestionSchema),
    improvedBullets: z.array(z.string()),
});

// Enforce business rules that Structured Outputs cannot express directly.
export const reviewResultSchema = reviewOutputSchema.superRefine((review, context) => {
    const actualNames = new Set(review.categories.map((category) => category.name));

    if (
        actualNames.size !== categoryNames.length ||
        categoryNames.some((name) => !actualNames.has(name))
    ) {
        context.addIssue({
            code: "custom",
            path: ["categories"],
            message: "Categories must contain each expected category exactly once.",
        });
    }

    const categoryTotal = review.categories.reduce(
        (total, category) => total + category.score,
        0
    );

    if (review.overallScore !== categoryTotal) {
        context.addIssue({
            code: "custom",
            path: ["overallScore"],
            message: "Overall score must equal the sum of category scores.",
        });
    }
});

export const interviewQuestionSchema = z.object({
    id: z.number().int().positive(),
    type: z.enum(["behavioral", "technical", "project"]),
    question: z.string().min(1),
});

const questionsOutputArraySchema = z.array(interviewQuestionSchema).length(8);

// This plain object schema is safe to pass to zodResponseFormat.
export const interviewQuestionsOutputSchema = z.object({
    questions: questionsOutputArraySchema,
});

// Check composition and uniqueness after OpenAI has produced the basic JSON shape.
export const interviewQuestionsSchema = interviewQuestionsOutputSchema.superRefine(
    ({ questions }, context) => {
        const ids = new Set(questions.map((question) => question.id));

        if (ids.size !== questions.length) {
            context.addIssue({
                code: "custom",
                path: ["questions"],
                message: "Interview question IDs must be unique.",
            });
        }

        const normalizedQuestions = questions.map((question) =>
            question.question.trim().toLocaleLowerCase()
        );

        if (new Set(normalizedQuestions).size !== normalizedQuestions.length) {
            context.addIssue({
                code: "custom",
                path: ["questions"],
                message: "Interview questions must not be duplicated.",
            });
        }

        const counts = questions.reduce(
            (result, question) => {
                result[question.type] += 1;
                return result;
            },
            { behavioral: 0, technical: 0, project: 0 }
        );

        if (
            counts.behavioral !== 3 ||
            counts.technical !== 3 ||
            counts.project !== 2
        ) {
            context.addIssue({
                code: "custom",
                path: ["questions"],
                message:
                    "Interview must contain three behavioral, three technical, and two project questions.",
            });
        }
    }
);

export const interviewFeedbackSchema = z.object({
    score: z.number().min(0).max(10),
    communication: z.number().min(0).max(10),
    technicalDepth: z.number().min(0).max(10),
    clarity: z.number().min(0).max(10),
    completeness: z.number().min(0).max(10),
    relevance: z.number().min(0).max(10),
    specificity: z.number().min(0).max(10),
    feedback: z.string(),
    improvedAnswer: z.string(),
    strengths: z.array(z.string()),
    improvements: z.array(z.string()),
    redFlags: z.array(z.string()),
    missingElements: z.array(z.string()),
});

export const savedReviewDataSchema = z.object({
    resumeText: z.string(),
    jobDescription: z.string(),
    targetRole: z.string(),
    customRole: z.string(),
    fileName: z.string(),
    review: reviewResultSchema,
});

export const mockInterviewDataSchema = z.object({
    resumeText: z.string(),
    jobDescription: z.string(),
    targetRole: z.string(),
    review: reviewResultSchema,
});

export const interviewSessionSchema = z
    .object({
        questions: questionsOutputArraySchema,
        answers: z.array(z.string()),
        feedbacks: z.array(interviewFeedbackSchema.nullable()),
        currentIndex: z.number().int().nonnegative(),
        completed: z.boolean(),
    })
    .superRefine((session, context) => {
        // A restored session must contain the same valid question mix as a new one.
        const questionValidation = interviewQuestionsSchema.safeParse({
            questions: session.questions,
        });

        if (!questionValidation.success) {
            for (const issue of questionValidation.error.issues) {
                context.addIssue({
                    code: "custom",
                    path: issue.path,
                    message: issue.message,
                });
            }
        }

        if (
            session.answers.length > session.questions.length ||
            session.feedbacks.length > session.questions.length
        ) {
            context.addIssue({
                code: "custom",
                message: "Session answers and feedback cannot exceed the question count.",
            });
        }

        const expectedIndex = session.questions.length;

        if (
            (session.completed && session.currentIndex !== expectedIndex) ||
            (!session.completed && session.currentIndex >= expectedIndex)
        ) {
            context.addIssue({
                code: "custom",
                path: ["currentIndex"],
                message: "Session index and completed status are inconsistent.",
            });
        }
    });

export const reviewRequestSchema = z.object({
    resumeText: z.string().trim().min(1).max(INPUT_LIMITS.resumeText),
    jobDescription: z.string().trim().max(INPUT_LIMITS.jobDescription).optional(),
    targetRole: z.string().trim().max(INPUT_LIMITS.targetRole).optional(),
});

export const interviewGenerateRequestSchema = z.object({
    resumeText: z.string().trim().min(1).max(INPUT_LIMITS.resumeText),
    jobDescription: z.string().trim().max(INPUT_LIMITS.jobDescription).optional(),
    targetRole: z.string().trim().min(1).max(INPUT_LIMITS.targetRole),
    review: reviewResultSchema,
});

export const interviewScoreRequestSchema = z.object({
    question: z.string().trim().min(1).max(INPUT_LIMITS.question),
    answer: z.string().trim().min(1).max(INPUT_LIMITS.answer),
    type: z.enum(["behavioral", "technical", "project"]),
    targetRole: z.string().trim().min(1).max(INPUT_LIMITS.targetRole),
});

export type ReviewCategory = z.infer<typeof reviewCategorySchema>;
export type PositionSuggestion = z.infer<typeof positionSuggestionSchema>;
export type MatchAnalysis = z.infer<typeof matchAnalysisSchema>;
export type ReviewResult = z.infer<typeof reviewResultSchema>;
export type InterviewQuestion = z.infer<typeof interviewQuestionSchema>;
export type InterviewQuestions = z.infer<typeof interviewQuestionsSchema>;
export type InterviewFeedback = z.infer<typeof interviewFeedbackSchema>;
export type SavedReviewData = z.infer<typeof savedReviewDataSchema>;
export type MockInterviewData = z.infer<typeof mockInterviewDataSchema>;
export type InterviewSession = z.infer<typeof interviewSessionSchema>;
