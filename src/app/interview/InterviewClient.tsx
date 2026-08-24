"use client";

import { useState } from "react";
import InterviewIntroduction from "@/components/interview/InterviewIntroduction";
import InterviewQuestion from "@/components/interview/InterviewQuestion";
import InterviewReport from "@/components/interview/InterviewReport";
import {
    interviewFeedbackSchema,
    interviewQuestionsSchema,
    interviewSessionSchema,
    mockInterviewDataSchema,
    type InterviewFeedback,
    type InterviewQuestion as InterviewQuestionData,
} from "@/lib/schemas";
import { readStorage, removeStorage, writeStorage } from "@/lib/storage";

// API errors are untrusted JSON, so only expose a string message to the UI.
function getApiErrorMessage(result: unknown, fallback: string) {
    if (!result || typeof result !== "object") return fallback;

    const error = (result as { error?: unknown }).error;
    return typeof error === "string" ? error : fallback;
}

export default function InterviewPage() {
    // Resume context and session state are restored independently after a refresh.
    const [data] = useState(() =>
        readStorage("mockInterviewData", mockInterviewDataSchema)
    );
    const [savedSession] = useState(() =>
        readStorage("mockInterviewSession", interviewSessionSchema)
    );
    const savedIndex = savedSession?.completed
        ? savedSession.questions.length
        : savedSession?.currentIndex ?? 0;
    const [questions, setQuestions] = useState<InterviewQuestionData[]>(
        savedSession?.questions ?? []
    );
    const [currentIndex, setCurrentIndex] = useState(savedIndex);
    const [answer, setAnswer] = useState(
        savedSession?.answers[savedIndex] ?? ""
    );
    const [answers, setAnswers] = useState<string[]>(
        savedSession?.answers ?? []
    );
    const [feedback, setFeedback] = useState<InterviewFeedback | null>(
        savedSession?.feedbacks[savedIndex] ?? null
    );
    const [feedbacks, setFeedbacks] = useState<(InterviewFeedback | null)[]>(
        savedSession?.feedbacks ?? []
    );
    const [started, setStarted] = useState(
        (savedSession?.questions.length ?? 0) > 0
    );
    const [loading, setLoading] = useState(false);
    const [scoring, setScoring] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Generates one validated 3/3/2 question set and starts a fresh saved session.
    async function generateQuestions() {
        if (!data) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/interview/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const result: unknown = await response.json();

            if (!response.ok) {
                setStarted(false);
                setError(
                    getApiErrorMessage(
                        result,
                        "Failed to generate interview questions. Please try again."
                    )
                );
                return;
            }

            const questionsResult = interviewQuestionsSchema.safeParse(result);

            if (!questionsResult.success) {
                setStarted(false);
                setError(
                    "The interview service returned an invalid question set. Please try again."
                );
                return;
            }

            const generatedQuestions = questionsResult.data.questions;
            const initialSession = {
                questions: generatedQuestions,
                answers: [],
                feedbacks: [],
                currentIndex: 0,
                completed: false,
            };

            setQuestions(generatedQuestions);
            setCurrentIndex(0);
            setAnswer("");
            setAnswers([]);
            setFeedback(null);
            setFeedbacks([]);
            writeStorage("mockInterviewSession", initialSession);
            setStarted(true);
        } catch (requestError) {
            console.error("Interview generation request failed:", requestError);
            setStarted(false);
            setError(
                "Unable to generate interview questions right now. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }

    // Scores the current answer and saves the answer/feedback pair atomically.
    async function submitAnswer() {
        const currentQuestion = questions[currentIndex];

        if (!answer.trim() || !currentQuestion) return;

        setScoring(true);
        setError(null);

        try {
            const response = await fetch("/api/interview/score", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: currentQuestion.question,
                    answer,
                    type: currentQuestion.type,
                    targetRole: data?.targetRole,
                }),
            });
            const result: unknown = await response.json();

            if (!response.ok) {
                setError(
                    getApiErrorMessage(
                        result,
                        "Failed to score your answer. Please try again."
                    )
                );
                return;
            }

            const feedbackResult = interviewFeedbackSchema.safeParse(result);

            if (!feedbackResult.success) {
                setError(
                    "The interview service returned invalid feedback. Please try again."
                );
                return;
            }

            const updatedAnswers = [...answers];
            const updatedFeedbacks = [...feedbacks];

            updatedAnswers[currentIndex] = answer;
            updatedFeedbacks[currentIndex] = feedbackResult.data;

            setAnswers(updatedAnswers);
            setFeedback(feedbackResult.data);
            setFeedbacks(updatedFeedbacks);
            writeStorage("mockInterviewSession", {
                questions,
                answers: updatedAnswers,
                feedbacks: updatedFeedbacks,
                currentIndex,
                completed: false,
            });
        } catch (requestError) {
            console.error("Interview scoring request failed:", requestError);
            setError("Unable to score your answer right now. Please try again.");
        } finally {
            setScoring(false);
        }
    }

    // Moves backward without discarding answers or feedback already received.
    function previousQuestion() {
        if (currentIndex === 0) return;

        const newIndex = currentIndex - 1;

        setCurrentIndex(newIndex);
        setAnswer(answers[newIndex] ?? "");
        setFeedback(feedbacks[newIndex] ?? null);
        setError(null);
        writeStorage("mockInterviewSession", {
            questions,
            answers,
            feedbacks,
            currentIndex: newIndex,
            completed: false,
        });
    }

    // Advances to the next saved question and marks the session complete after question 8.
    function continueInterview() {
        const updatedAnswers = [...answers];
        updatedAnswers[currentIndex] = answer;

        const newIndex = currentIndex + 1;
        const isCompleted = newIndex >= questions.length;

        setAnswers(updatedAnswers);
        setCurrentIndex(newIndex);
        setAnswer(updatedAnswers[newIndex] ?? "");
        setFeedback(feedbacks[newIndex] ?? null);
        setError(null);
        writeStorage("mockInterviewSession", {
            questions,
            answers: updatedAnswers,
            feedbacks,
            currentIndex: newIndex,
            completed: isCompleted,
        });
    }

    if (!data) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
                <div className="max-w-md rounded-3xl border bg-white p-8 text-center shadow-xl">
                    <h1 className="text-2xl font-bold text-gray-900">
                        No interview data found
                    </h1>
                    <p className="mt-3 text-gray-600">
                        Please review your resume first, then click Start Mock Interview.
                    </p>
                    <button
                        onClick={() => (window.location.href = "/")}
                        className="mt-6 rounded-2xl bg-gray-900 px-6 py-3 font-semibold text-white"
                    >
                        Go Back
                    </button>
                </div>
            </main>
        );
    }

    if (!started && !loading) {
        return (
            <InterviewIntroduction
                targetRole={data.targetRole}
                error={error}
                onGenerate={generateQuestions}
            />
        );
    }

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="rounded-3xl border bg-white p-8 text-center shadow-xl">
                    <div className="text-5xl">🧠</div>
                    <p className="mt-4 text-lg font-semibold text-gray-900">
                        Generating your interview...
                    </p>
                    <p className="mt-2 text-gray-600">
                        Creating questions based on your resume and target role.
                    </p>
                </div>
            </main>
        );
    }

    if (questions.length === 0) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-50">
                <p className="text-gray-600">No questions generated.</p>
            </main>
        );
    }

    const completed = currentIndex >= questions.length;

    if (completed) {
        return (
            <InterviewReport
                questions={questions}
                answers={answers}
                feedbacks={feedbacks}
                onRestart={() => {
                    removeStorage("mockInterviewSession");
                    window.location.href = "/interview";
                }}
                onBackToReview={() => (window.location.href = "/")}
            />
        );
    }

    return (
        <InterviewQuestion
            question={questions[currentIndex]}
            currentIndex={currentIndex}
            totalQuestions={questions.length}
            answer={answer}
            feedback={feedback}
            error={error}
            scoring={scoring}
            onAnswerChange={setAnswer}
            onBack={previousQuestion}
            onSubmit={submitAnswer}
            onContinue={continueInterview}
        />
    );
}
