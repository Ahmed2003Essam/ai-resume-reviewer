type ScoreBarProps = {
    score: number;
    max: number;
};

function getScoreColor(score: number, max: number) {
    const percentage = (score / max) * 100;

    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-yellow-500";
    return "bg-red-500";
}

export default function ScoreBar({ score, max }: ScoreBarProps) {
    const percentage = Math.min(Math.max((score / max) * 100, 0), 100);

    return (
        <div className="mt-2">
            <div className="h-3 w-full rounded-full bg-gray-200">
                <div
                    className={`h-3 rounded-full ${getScoreColor(score, max)}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
