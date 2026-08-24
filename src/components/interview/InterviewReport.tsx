import type { InterviewFeedback, InterviewQuestion } from "@/lib/schemas";
import InterviewScoreCard from "./InterviewScoreCard";

type InterviewReportProps = {
    questions: InterviewQuestion[];
    answers: string[];
    feedbacks: (InterviewFeedback | null)[];
    onRestart: () => void;
    onBackToReview: () => void;
};

function getAverage(values: number[]) {
    if (values.length === 0) return 0;

    const total = values.reduce((sum, value) => sum + value, 0);
    return Math.round((total / values.length) * 10) / 10;
}

export default function InterviewReport({
    questions,
    answers,
    feedbacks,
    onRestart,
    onBackToReview,
}: InterviewReportProps) {
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
    const strongestScore = completedFeedbacks.length
        ? Math.max(...completedFeedbacks.map((item) => item.score))
        : null;
    const weakestScore = completedFeedbacks.length
        ? Math.min(...completedFeedbacks.map((item) => item.score))
        : null;
    const strongestIndex = feedbacks.findIndex(
        (item) => item?.score === strongestScore
    );
    const weakestIndex = feedbacks.findIndex(
        (item) => item?.score === weakestScore
    );

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
                            Here is your performance summary based on your answers and AI
                            feedback.
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4">
                        <InterviewScoreCard label="Overall" score={averageOverall} />
                        <InterviewScoreCard
                            label="Communication"
                            score={averageCommunication}
                        />
                        <InterviewScoreCard
                            label="Technical Depth"
                            score={averageTechnical}
                        />
                        <InterviewScoreCard label="Clarity" score={averageClarity} />
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
                                <li>
                                    Practice structuring behavioral answers using the STAR
                                    method.
                                </li>
                            )}
                            {averageTechnical < 8 && (
                                <li>
                                    Strengthen technical explanations with specific tools,
                                    tradeoffs, and results.
                                </li>
                            )}
                            {averageClarity < 8 && (
                                <li>Make answers more concise and easier to follow.</li>
                            )}
                            {averageOverall >= 8 && (
                                <li>
                                    Good performance. Focus on sharper examples and stronger
                                    measurable impact.
                                </li>
                            )}
                        </ul>
                    </div>

                    <div className="mt-8 space-y-5">
                        <h2 className="text-2xl font-bold text-gray-900">
                            Question-by-Question Review
                        </h2>

                        {questions.map((question, index) => (
                            <div
                                key={question.id}
                                className="rounded-2xl border bg-gray-50 p-5"
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <p className="text-sm font-semibold uppercase text-blue-600">
                                        {question.type}
                                    </p>
                                    <p className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-gray-700">
                                        {feedbacks[index]?.score ?? "N/A"}/10
                                    </p>
                                </div>

                                <p className="mt-3 font-semibold text-gray-900">
                                    {question.question}
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
                            onClick={onRestart}
                            className="flex-1 rounded-2xl border border-gray-300 bg-white px-6 py-4 font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100"
                        >
                            Restart Interview
                        </button>
                        <button
                            onClick={onBackToReview}
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
