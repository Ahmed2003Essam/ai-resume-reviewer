import type { ReviewResult } from "@/lib/schemas";
import CategoryScores from "./CategoryScores";
import MatchAnalysis from "./MatchAnalysis";
import PositionFeedback from "./PositionFeedback";
import ScoreBar from "./ScoreBar";

type ReviewResultsProps = {
    review: ReviewResult | null;
    loading: boolean;
    hasInterviewData: boolean;
    copiedId: string | null;
    onCopy: (text: string, id: string) => void;
    onStartInterview: () => void;
    onBackToInterview: () => void;
};

export default function ReviewResults({
    review,
    loading,
    hasInterviewData,
    copiedId,
    onCopy,
    onStartInterview,
    onBackToInterview,
}: ReviewResultsProps) {
    if (!review) {
        if (loading) return <div className="space-y-6" />;

        return (
            <div className="space-y-6">
                <div className="flex min-h-[500px] items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-white p-8 text-center">
                    <div>
                        <div className="text-5xl">📊</div>
                        <h2 className="mt-4 text-2xl font-bold text-gray-900">
                            Your review will appear here
                        </h2>
                        <p className="mt-2 max-w-md text-gray-600">
                            Upload a resume, choose a target role, and click Review Resume
                            to see scoring, job matching, position feedback, and improved
                            bullets.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-lg">
                <h2 className="mb-6 text-3xl font-bold tracking-tight">
                    Review Results
                </h2>
                <p className="mt-2 text-gray-600">
                    Your resume has been analyzed successfully. Continue with an
                    AI-powered mock interview tailored to your target role.
                </p>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <button
                        type="button"
                        onClick={onStartInterview}
                        className="rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-blue-700"
                    >
                        Start Mock Interview
                    </button>
                    {hasInterviewData && (
                        <button
                            type="button"
                            onClick={onBackToInterview}
                            className="rounded-2xl border border-blue-200 bg-blue-50 px-6 py-3 font-semibold text-blue-700 transition hover:bg-blue-100"
                        >
                            Back to Interview Feedback
                        </button>
                    )}
                </div>

                <div className="mt-4 rounded-lg bg-gray-100 p-4">
                    <p className="text-lg font-bold">
                        Overall Score: {review.overallScore}/100
                    </p>
                    <ScoreBar score={review.overallScore} max={100} />
                </div>

                {review.matchAnalysis && (
                    <MatchAnalysis analysis={review.matchAnalysis} />
                )}
                <CategoryScores categories={review.categories} />
                <PositionFeedback
                    positions={review.positionSuggestions}
                    copiedId={copiedId}
                    onCopy={onCopy}
                />

                <div className="mt-6 rounded-lg border p-4">
                    <h3 className="font-semibold">Improved Bullets</h3>
                    <div className="mt-3 space-y-3">
                        {review.improvedBullets.map((bullet, index) => {
                            const copyId = `improved-${index}`;

                            return (
                                <div
                                    key={copyId}
                                    className="flex items-start justify-between gap-4 rounded-lg bg-gray-50 p-3"
                                >
                                    <p className="text-sm text-gray-700">{bullet}</p>
                                    <button
                                        onClick={() => onCopy(bullet, copyId)}
                                        className="w-20 flex-shrink-0 rounded-lg bg-black px-2 py-1 text-xs text-white hover:bg-gray-800"
                                    >
                                        {copiedId === copyId ? "Copied" : "Copy"}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
