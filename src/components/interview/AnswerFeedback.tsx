import type { InterviewFeedback } from "@/lib/schemas";
import InterviewScoreCard from "./InterviewScoreCard";

type AnswerFeedbackProps = {
    feedback: InterviewFeedback;
    onContinue: () => void;
};

export default function AnswerFeedback({
    feedback,
    onContinue,
}: AnswerFeedbackProps) {
    return (
        <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-6">
            <h3 className="text-2xl font-bold text-gray-900">AI Feedback</h3>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
                <InterviewScoreCard label="Overall" score={feedback.score} compact />
                <InterviewScoreCard
                    label="Technical"
                    score={feedback.technicalDepth}
                    compact
                />
                <InterviewScoreCard label="Clarity" score={feedback.clarity} compact />
            </div>

            <div className="mt-6">
                <h4 className="font-semibold text-gray-900">Feedback</h4>
                <p className="mt-2 text-gray-700">{feedback.feedback}</p>
            </div>

            <div className="mt-6">
                <h4 className="font-semibold text-gray-900">Improved Answer</h4>
                <p className="mt-2 rounded-xl bg-white p-4 text-gray-700">
                    {feedback.improvedAnswer}
                </p>
            </div>

            <button
                onClick={onContinue}
                className="mt-6 w-full rounded-2xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-blue-700"
            >
                Continue Interview
            </button>
        </div>
    );
}
