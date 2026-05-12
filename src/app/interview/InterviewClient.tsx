"use client";

import { useState } from "react";

type InterviewQuestion = {
    id: number;
    type: "behavioral" | "technical" | "project";
    question: string;
};

type MockInterviewData = {
    resumeText: string;
    jobDescription: string;
    targetRole: string;
    review: unknown;
};
type InterviewFeedback = {
    score: number;
    communication: number;
    technicalDepth: number;
    clarity: number;
    completeness: number;
    relevance: number;
    specificity: number;
    feedback: string;
    improvedAnswer: string;
    strengths: string[];
    improvements: string[];
    redFlags: string[];
    missingElements: string[];
};

function getAverage(values: number[]) {
    if (values.length === 0) return 0;

    const total = values.reduce((sum, value) => sum + value, 0);
    return Math.round((total / values.length) * 10) / 10;
}

export default function InterviewPage() {
    const [data] = useState<MockInterviewData | null>(() => {
        const saved = localStorage.getItem("mockInterviewData");

        if (!saved) return null;

        try {
            return JSON.parse(saved);
        } catch {
            return null;
        }
    });
    const [savedSession] = useState(() => {

        const saved = localStorage.getItem("mockInterviewSession");

        if (!saved) return null;

        try {
            return JSON.parse(saved);
        } catch {
            return null;
        }
    });
    const [feedback, setFeedback] =
        useState<InterviewFeedback | null>(null);
    const [scoring, setScoring] = useState(false);
    const [questions, setQuestions] = useState<InterviewQuestion[]>(
        savedSession?.questions || []
    );

    const [currentIndex, setCurrentIndex] = useState(
        savedSession?.completed
            ? savedSession.questions.length
            : savedSession?.currentIndex || 0
    );
    const [answer, setAnswer] = useState(
        savedSession?.answers?.[savedSession?.currentIndex || 0] || ""
    );

    const [answers, setAnswers] = useState<string[]>(
        savedSession?.answers || []
    );

    const [loading, setLoading] = useState(false);
    const [feedbacks, setFeedbacks] = useState<(InterviewFeedback | null)[]>(
        savedSession?.feedbacks || []
    );
    const [started, setStarted] = useState(
        savedSession?.questions?.length > 0
    );

    async function generateQuestions() {
        if (!data) return;

        setStarted(true);
        setLoading(true);

        try {
            const res = await fetch("/api/interview/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    resumeText: data.resumeText,
                    jobDescription: data.jobDescription,
                    targetRole: data.targetRole,
                    review: data.review,
                }),
            });

            const text = await res.text();

            let result;

            try {
                result = JSON.parse(text);
            } catch {
                console.error("Non-JSON response:", text);
                alert("API route returned HTML instead of JSON. Check your route path.");
                return;
            }

            if (!res.ok) {
                alert(result.error || "Failed to generate questions.");
                return;
            }

            setQuestions(result.questions || []);
        } catch (error) {
            console.error(error);
            alert("Something went wrong.");
        } finally {
            setLoading(false);
        }
    }

    async function submitAnswer() {
        if (!answer.trim()) return;

        setScoring(true);

        try {
            const res = await fetch("/api/interview/score", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    question: currentQuestion.question,
                    answer,
                    type: currentQuestion.type,
                    targetRole: data?.targetRole,
                }),
            });

            const result = await res.json();

            if (!res.ok) {
                alert(result.error || "Failed to score answer.");
                return;
            }

            setFeedback(result);
            setFeedbacks((prev) => {
                const updated = [...prev];
                updated[currentIndex] = result;

                saveInterviewSession(answers, updated);

                return updated;
            });
        } catch (error) {
            console.error(error);
            alert("Something went wrong.");
        } finally {
            setScoring(false);
        }
    }
    function previousQuestion() {
        if (currentIndex === 0) return;

        const newIndex = currentIndex - 1;

        setCurrentIndex(newIndex);
        setAnswer(answers[newIndex] || "");
        setFeedback(feedbacks[newIndex] || null);
    }
    function continueInterview() {
        const updatedAnswers = [...answers];
        updatedAnswers[currentIndex] = answer;

        setAnswers(updatedAnswers);

        const newIndex = currentIndex + 1;
        const isCompleted = newIndex >= questions.length;

        setCurrentIndex(newIndex);

        setAnswer(answers[newIndex] || "");
        setFeedback(feedbacks[newIndex] || null);

        localStorage.setItem(
            "mockInterviewSession",
            JSON.stringify({
                questions,
                answers: updatedAnswers,
                feedbacks,
                currentIndex: newIndex,
                completed: isCompleted,
            })
        );
    }
    function saveInterviewSession(updatedAnswers = answers, updatedFeedbacks = feedbacks) {
        localStorage.setItem(
            "mockInterviewSession",
            JSON.stringify({
                questions,
                answers: updatedAnswers,
                feedbacks: updatedFeedbacks,
                currentIndex,
                completed,
            })
        );
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

    if (!started) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 px-6 py-10">
                <div className="mx-auto max-w-3xl rounded-3xl border bg-white p-8 shadow-2xl">
                    <div className="mb-4 w-fit rounded-full border border-blue-200 bg-blue-50 px-4 py-1 text-sm font-medium text-blue-700">
                        AI Mock Interview
                    </div>

                    <h1 className="text-4xl font-bold text-gray-900">
                        Ready for your mock interview?
                    </h1>

                    <p className="mt-4 text-gray-600">
                        This interview will be tailored to your resume, target role, job
                        description, and resume review feedback.
                    </p>

                    <div className="mt-6 rounded-2xl bg-gray-50 p-5">
                        <p className="font-semibold text-gray-900">Target Role</p>
                        <p className="mt-1 text-gray-700">{data.targetRole}</p>
                    </div>

                    <button
                        onClick={generateQuestions}
                        className="mt-8 w-full rounded-2xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-blue-700"
                    >
                        Generate Interview Questions
                    </button>
                </div>
            </main>
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
    const currentQuestion = questions[currentIndex];

    if (completed) {
        const completedFeedbacks = feedbacks.filter(
            (item): item is InterviewFeedback => item !== null
        );

        const averageOverall = getAverage(
            completedFeedbacks.map((item) => item.score)
        );

        const averageCommunication = getAverage(
            completedFeedbacks.map((item) => item.communication)
        );

        const averageTechnical = getAverage(
            completedFeedbacks.map((item) => item.technicalDepth)
        );

        const averageClarity = getAverage(
            completedFeedbacks.map((item) => item.clarity)
        );

        const strongestIndex = completedFeedbacks.length
            ? feedbacks.findIndex(
                (item) =>
                    item?.score ===
                    Math.max(...completedFeedbacks.map((feedbackItem) => feedbackItem.score))
            )
            : -1;

        const weakestIndex = completedFeedbacks.length
            ? feedbacks.findIndex(
                (item) =>
                    item?.score ===
                    Math.min(...completedFeedbacks.map((feedbackItem) => feedbackItem.score))
            )
            : -1;

        return (
            <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 px-6 py-10">
                <div className="mx-auto max-w-6xl">
                    <div className="rounded-3xl border bg-white p-8 shadow-2xl">
                        <div className="mb-8">
                            <div className="mb-4 w-fit rounded-full border border-blue-200 bg-blue-50 px-4 py-1 text-sm font-medium text-blue-700">
                                Interview Report
                            </div>

                            <h1 className="text-4xl font-bold text-gray-900">
                                Mock Interview Complete 🎉
                            </h1>

                            <p className="mt-3 text-gray-600">
                                Here is your performance summary based on your answers and AI feedback.
                            </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-4">
                            <div className="rounded-2xl bg-gray-50 p-5 shadow-sm">
                                <p className="text-sm text-gray-500">Overall</p>
                                <p className="mt-2 text-3xl font-bold text-gray-900">
                                    {averageOverall}/10
                                </p>
                            </div>

                            <div className="rounded-2xl bg-gray-50 p-5 shadow-sm">
                                <p className="text-sm text-gray-500">Communication</p>
                                <p className="mt-2 text-3xl font-bold text-gray-900">
                                    {averageCommunication}/10
                                </p>
                            </div>

                            <div className="rounded-2xl bg-gray-50 p-5 shadow-sm">
                                <p className="text-sm text-gray-500">Technical Depth</p>
                                <p className="mt-2 text-3xl font-bold text-gray-900">
                                    {averageTechnical}/10
                                </p>
                            </div>

                            <div className="rounded-2xl bg-gray-50 p-5 shadow-sm">
                                <p className="text-sm text-gray-500">Clarity</p>
                                <p className="mt-2 text-3xl font-bold text-gray-900">
                                    {averageClarity}/10
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 grid gap-6 md:grid-cols-2">
                            <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                                <h2 className="text-lg font-bold text-green-900">
                                    Strongest Answer
                                </h2>

                                {strongestIndex >= 0 ? (
                                    <>
                                        <p className="mt-3 font-medium text-green-950">
                                            {questions[strongestIndex]?.question}
                                        </p>
                                        <p className="mt-3 text-sm text-green-800">
                                            Score: {feedbacks[strongestIndex]?.score}/10
                                        </p>
                                    </>
                                ) : (
                                    <p className="mt-3 text-sm text-green-800">
                                        No scored answers yet.
                                    </p>
                                )}
                            </div>

                            <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                                <h2 className="text-lg font-bold text-red-900">
                                    Weakest Answer
                                </h2>

                                {weakestIndex >= 0 ? (
                                    <>
                                        <p className="mt-3 font-medium text-red-950">
                                            {questions[weakestIndex]?.question}
                                        </p>
                                        <p className="mt-3 text-sm text-red-800">
                                            Score: {feedbacks[weakestIndex]?.score}/10
                                        </p>
                                    </>
                                ) : (
                                    <p className="mt-3 text-sm text-red-800">
                                        No scored answers yet.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 rounded-2xl border bg-white p-6">
                            <h2 className="text-2xl font-bold text-gray-900">
                                Recommended Practice Areas
                            </h2>

                            <ul className="mt-4 list-disc space-y-2 pl-5 text-gray-700">
                                {averageCommunication < 8 && (
                                    <li>Practice structuring behavioral answers using the STAR method.</li>
                                )}

                                {averageTechnical < 8 && (
                                    <li>Strengthen technical explanations with specific tools, tradeoffs, and results.</li>
                                )}

                                {averageClarity < 8 && (
                                    <li>Make answers more concise and easier to follow.</li>
                                )}

                                {averageOverall >= 8 && (
                                    <li>Good performance. Focus on adding sharper examples and stronger measurable impact.</li>
                                )}
                            </ul>
                        </div>

                        <div className="mt-8 space-y-5">
                            <h2 className="text-2xl font-bold text-gray-900">
                                Question-by-Question Review
                            </h2>

                            {questions.map((q, index) => (
                                <div key={q.id} className="rounded-2xl border bg-gray-50 p-5">
                                    <div className="flex items-center justify-between gap-4">
                                        <p className="text-sm font-semibold uppercase text-blue-600">
                                            {q.type}
                                        </p>

                                        <p className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-gray-700">
                                            {feedbacks[index]?.score ?? "N/A"}/10
                                        </p>
                                    </div>

                                    <p className="mt-3 font-semibold text-gray-900">
                                        {q.question}
                                    </p>

                                    <div className="mt-4 rounded-xl bg-white p-4">
                                        <p className="text-sm font-semibold text-gray-900">
                                            Your Answer
                                        </p>
                                        <p className="mt-2 text-sm text-gray-700">
                                            {answers[index] || "No answer saved."}
                                        </p>
                                    </div>

                                    {feedbacks[index] && (
                                        <>
                                            <div className="mt-4 rounded-xl bg-white p-4">
                                                <p className="text-sm font-semibold text-gray-900">
                                                    Feedback
                                                </p>
                                                <p className="mt-2 text-sm text-gray-700">
                                                    {feedbacks[index]?.feedback}
                                                </p>
                                            </div>

                                            <div className="mt-4 rounded-xl bg-white p-4">
                                                <p className="text-sm font-semibold text-gray-900">
                                                    Improved Answer
                                                </p>
                                                <p className="mt-2 text-sm text-gray-700">
                                                    {feedbacks[index]?.improvedAnswer}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                            <button
                                onClick={() => {
                                    localStorage.removeItem("mockInterviewSession");

                                    window.location.href = "/interview";
                                }}
                                className="flex-1 rounded-2xl border border-gray-300 bg-white px-6 py-4 font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100"
                            >
                                Restart Interview
                            </button>

                            <button
                                onClick={() => (window.location.href = "/")}
                                className="flex-1 rounded-2xl bg-gray-900 px-6 py-4 font-semibold text-white shadow-lg transition hover:bg-black"
                            >
                                Back to Resume Review
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        );
    }
    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 px-6 py-10">
            <div className="mx-auto max-w-4xl rounded-3xl border bg-white p-8 shadow-2xl">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold uppercase text-blue-600">
                            {currentQuestion.type}
                        </p>
                        <h1 className="mt-2 text-3xl font-bold text-gray-900">
                            Question {currentIndex + 1} of {questions.length}
                        </h1>
                    </div>

                    <div className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700">
                        {Math.round(((currentIndex + 1) / questions.length) * 100)}%
                    </div>
                </div>

                <div className="rounded-2xl bg-gray-50 p-6">
                    <p className="text-xl font-semibold leading-relaxed text-gray-900">
                        {currentQuestion.question}
                    </p>
                </div>

                <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    className="mt-6 h-56 w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-gray-900 shadow-sm outline-none transition focus:border-black focus:bg-white"
                />
                {feedback && (
                    <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-6">
                        <h3 className="text-2xl font-bold text-gray-900">
                            AI Feedback
                        </h3>

                        <div className="mt-4 grid gap-4 md:grid-cols-3">
                            <div className="rounded-xl bg-white p-4 shadow-sm">
                                <p className="text-sm text-gray-500">Overall</p>
                                <p className="text-2xl font-bold">{feedback.score}/10</p>
                            </div>

                            <div className="rounded-xl bg-white p-4 shadow-sm">
                                <p className="text-sm text-gray-500">Technical</p>
                                <p className="text-2xl font-bold">
                                    {feedback.technicalDepth}/10
                                </p>
                            </div>

                            <div className="rounded-xl bg-white p-4 shadow-sm">
                                <p className="text-sm text-gray-500">Clarity</p>
                                <p className="text-2xl font-bold">
                                    {feedback.clarity}/10
                                </p>
                            </div>
                        </div>

                        <div className="mt-6">
                            <h4 className="font-semibold text-gray-900">Feedback</h4>
                            <p className="mt-2 text-gray-700">
                                {feedback.feedback}
                            </p>
                        </div>

                        <div className="mt-6">
                            <h4 className="font-semibold text-gray-900">
                                Improved Answer
                            </h4>
                            <p className="mt-2 rounded-xl bg-white p-4 text-gray-700">
                                {feedback.improvedAnswer}
                            </p>
                        </div>

                        <button
                            onClick={continueInterview}
                            className="mt-6 w-full rounded-2xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-blue-700"
                        >
                            Continue Interview
                        </button>
                    </div>
                )}

                <div className="mt-6 flex gap-4">
                    <button
                        onClick={previousQuestion}
                        disabled={currentIndex === 0 || scoring}
                        className="flex-1 rounded-2xl border border-gray-300 bg-white px-6 py-4 text-lg font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Back
                    </button>

                    <button
                        onClick={submitAnswer}
                        disabled={!answer.trim() || scoring}
                        className="flex-1 rounded-2xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {scoring ? "Evaluating Answer..." : "Submit Answer"}
                    </button>
                </div>
            </div>
        </main>
    );
}