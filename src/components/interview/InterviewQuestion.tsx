import ErrorMessage from "@/components/ErrorMessage";
import type {
    InterviewFeedback,
    InterviewQuestion as InterviewQuestionData,
} from "@/lib/schemas";
import AnswerFeedback from "./AnswerFeedback";

type InterviewQuestionProps = {
    question: InterviewQuestionData;
    currentIndex: number;
    totalQuestions: number;
    answer: string;
    feedback: InterviewFeedback | null;
    error: string | null;
    scoring: boolean;
    onAnswerChange: (answer: string) => void;
    onBack: () => void;
    onSubmit: () => void;
    onContinue: () => void;
};

export default function InterviewQuestion({
    question,
    currentIndex,
    totalQuestions,
    answer,
    feedback,
    error,
    scoring,
    onAnswerChange,
    onBack,
    onSubmit,
    onContinue,
}: InterviewQuestionProps) {
    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 px-6 py-10">
            <div className="mx-auto max-w-4xl rounded-3xl border bg-white p-8 shadow-2xl">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold uppercase text-blue-600">
                            {question.type}
                        </p>
                        <h1 className="mt-2 text-3xl font-bold text-gray-900">
                            Question {currentIndex + 1} of {totalQuestions}
                        </h1>
                    </div>

                    <div className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700">
                        {Math.round(((currentIndex + 1) / totalQuestions) * 100)}%
                    </div>
                </div>

                <div className="rounded-2xl bg-gray-50 p-6">
                    <p className="text-xl font-semibold leading-relaxed text-gray-900">
                        {question.question}
                    </p>
                </div>

                <textarea
                    value={answer}
                    onChange={(event) => onAnswerChange(event.target.value)}
                    placeholder="Type your answer here..."
                    className="mt-6 h-56 w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-gray-900 shadow-sm outline-none transition focus:border-black focus:bg-white"
                />

                {error && (
                    <div className="mt-6">
                        <ErrorMessage message={error} />
                    </div>
                )}

                {feedback && (
                    <AnswerFeedback feedback={feedback} onContinue={onContinue} />
                )}

                <div className="mt-6 flex gap-4">
                    <button
                        onClick={onBack}
                        disabled={currentIndex === 0 || scoring}
                        className="flex-1 rounded-2xl border border-gray-300 bg-white px-6 py-4 text-lg font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Back
                    </button>

                    <button
                        onClick={onSubmit}
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
