import type { ReviewCategory } from "@/lib/schemas";
import ScoreBar from "./ScoreBar";

type CategoryScoresProps = {
    categories: ReviewCategory[];
};

export default function CategoryScores({ categories }: CategoryScoresProps) {
    return (
        <div className="mt-6 space-y-4">
            {categories.map((category) => (
                <div
                    key={category.name}
                    className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                >
                    <h3 className="font-semibold">
                        {category.name}: {category.score}/20
                    </h3>
                    <ScoreBar score={category.score} max={20} />
                    <p className="mt-2 text-sm text-gray-700">{category.feedback}</p>
                    <ul className="mt-2 list-disc pl-5 text-sm text-gray-700">
                        {category.suggestions.map((suggestion) => (
                            <li key={suggestion}>{suggestion}</li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
}
