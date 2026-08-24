import ErrorMessage from "@/components/ErrorMessage";

type InterviewIntroductionProps = {
    targetRole: string;
    error: string | null;
    onGenerate: () => void;
};

export default function InterviewIntroduction({
    targetRole,
    error,
    onGenerate,
}: InterviewIntroductionProps) {
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
                    <p className="mt-1 text-gray-700">{targetRole}</p>
                </div>

                {error && (
                    <div className="mt-6">
                        <ErrorMessage message={error} />
                    </div>
                )}

                <button
                    onClick={onGenerate}
                    className="mt-8 w-full rounded-2xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-blue-700"
                >
                    Generate Interview Questions
                </button>
            </div>
        </main>
    );
}
