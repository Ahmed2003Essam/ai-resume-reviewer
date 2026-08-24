type InterviewScoreCardProps = {
    label: string;
    score: number;
    compact?: boolean;
};

export default function InterviewScoreCard({
    label,
    score,
    compact = false,
}: InterviewScoreCardProps) {
    return (
        <div
            className={
                compact
                    ? "rounded-xl bg-white p-4 shadow-sm"
                    : "rounded-2xl bg-gray-50 p-5 shadow-sm"
            }
        >
            <p className="text-sm text-gray-500">{label}</p>
            <p
                className={
                    compact
                        ? "text-2xl font-bold"
                        : "mt-2 text-3xl font-bold text-gray-900"
                }
            >
                {score}/10
            </p>
        </div>
    );
}
