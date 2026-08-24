import type { MatchAnalysis as MatchAnalysisData } from "@/lib/schemas";
import ScoreBar from "./ScoreBar";

type MatchAnalysisProps = {
    analysis: MatchAnalysisData;
};

export default function MatchAnalysis({ analysis }: MatchAnalysisProps) {
    return (
        <div className="mt-4 rounded-lg border bg-white p-4">
            <h3 className="text-lg font-semibold">
                Job Match Score: {analysis.matchScore}/100
            </h3>
            <ScoreBar score={analysis.matchScore} max={100} />
            <p className="mt-3 text-sm text-gray-700">{analysis.summary}</p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                    <h4 className="text-sm font-medium">Missing Keywords</h4>
                    <ul className="mt-2 list-disc pl-5 text-sm text-gray-700">
                        {analysis.missingKeywords.map((keyword) => (
                            <li key={keyword}>{keyword}</li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h4 className="text-sm font-medium">Strong Matches</h4>
                    <ul className="mt-2 list-disc pl-5 text-sm text-gray-700">
                        {analysis.strongMatches.map((match) => (
                            <li key={match}>{match}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
