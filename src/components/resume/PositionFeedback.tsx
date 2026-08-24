import type { PositionSuggestion } from "@/lib/schemas";
import ScoreBar from "./ScoreBar";

type PositionFeedbackProps = {
    positions: PositionSuggestion[];
    copiedId: string | null;
    onCopy: (text: string, id: string) => void;
};

export default function PositionFeedback({
    positions,
    copiedId,
    onCopy,
}: PositionFeedbackProps) {
    if (positions.length === 0) return null;

    return (
        <div className="mt-6 space-y-4">
            <h2 className="text-xl font-semibold">Position Feedback</h2>

            {positions.map((position, positionIndex) => (
                <div
                    key={`${position.positionTitle}-${position.company}-${positionIndex}`}
                    className="rounded-2xl border border-gray-200 bg-white p-4"
                >
                    <div className="flex justify-between">
                        <h3 className="font-semibold">
                            {position.positionTitle}{" "}
                            {position.company && `@ ${position.company}`}
                        </h3>
                        <span className="rounded bg-blue-100 px-2 py-1 text-sm">
                            {position.positionScore}/10
                        </span>
                    </div>

                    <ScoreBar score={position.positionScore} max={10} />
                    <p className="mt-2 text-sm text-gray-700">{position.feedback}</p>
                    <ul className="mt-2 list-disc pl-5 text-sm">
                        {position.suggestions.map((suggestion) => (
                            <li key={suggestion}>{suggestion}</li>
                        ))}
                    </ul>

                    <div className="mt-3">
                        <p className="text-sm font-medium">Rewritten Bullets:</p>
                        <ul className="list-disc pl-5 text-sm">
                            {position.rewrittenBullets.map((bullet, bulletIndex) => {
                                const copyId = `position-${positionIndex}-${bulletIndex}`;

                                return (
                                    <li
                                        key={copyId}
                                        className="mt-2 flex items-start justify-between gap-3"
                                    >
                                        <span>{bullet}</span>
                                        <button
                                            onClick={() => onCopy(bullet, copyId)}
                                            className="w-20 flex-shrink-0 rounded-md bg-black px-2 py-1 text-xs text-white hover:bg-gray-800"
                                        >
                                            {copiedId === copyId ? "Copied" : "Copy"}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            ))}
        </div>
    );
}
