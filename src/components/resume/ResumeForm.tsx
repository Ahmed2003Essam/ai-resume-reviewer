import type { RefObject } from "react";
import ErrorMessage from "@/components/ErrorMessage";
import ResumeUploader from "./ResumeUploader";

type ResumeFormProps = {
    resumeText: string;
    jobDescription: string;
    targetRole: string;
    customRole: string;
    fileName: string;
    isParsing: boolean;
    isDragging: boolean;
    loading: boolean;
    progress: number;
    error: string | null;
    fileInputRef: RefObject<HTMLInputElement | null>;
    onResumeTextChange: (value: string) => void;
    onJobDescriptionChange: (value: string) => void;
    onTargetRoleChange: (value: string) => void;
    onCustomRoleChange: (value: string) => void;
    onDraggingChange: (value: boolean) => void;
    onFile: (file: File) => void;
    onReview: () => void;
    onReset: () => void;
};

const targetRoles = [
    "Software Engineer",
    "Data Analyst",
    "Data Scientist",
    "Machine Learning Engineer",
    "Cybersecurity Analyst",
    "Product Manager",
    "IT Support Specialist",
    "Other",
];

export default function ResumeForm({
    resumeText,
    jobDescription,
    targetRole,
    customRole,
    fileName,
    isParsing,
    isDragging,
    loading,
    progress,
    error,
    fileInputRef,
    onResumeTextChange,
    onJobDescriptionChange,
    onTargetRoleChange,
    onCustomRoleChange,
    onDraggingChange,
    onFile,
    onReview,
    onReset,
}: ResumeFormProps) {
    return (
        <div className="space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-md">
            <ResumeUploader
                fileName={fileName}
                isParsing={isParsing}
                isDragging={isDragging}
                fileInputRef={fileInputRef}
                onDraggingChange={onDraggingChange}
                onFile={onFile}
            />

            <div>
                <label className="block font-medium text-gray-800">
                    Resume Text (Editable)
                </label>
                <textarea
                    className="mt-2 h-64 w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-gray-900 shadow-sm outline-none transition focus:border-black focus:bg-white"
                    placeholder="Your resume text will appear here after upload..."
                    value={resumeText}
                    onChange={(event) => onResumeTextChange(event.target.value)}
                />
            </div>

            <div>
                <label className="block font-medium text-gray-800">Target Role</label>
                <select
                    value={targetRole}
                    onChange={(event) => onTargetRoleChange(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 p-3 text-gray-900 shadow-sm outline-none transition focus:border-black focus:bg-white"
                >
                    {targetRoles.map((role) => (
                        <option key={role}>{role}</option>
                    ))}
                </select>
            </div>

            {targetRole === "Other" && (
                <input
                    type="text"
                    placeholder="Enter target role..."
                    value={customRole}
                    onChange={(event) => onCustomRoleChange(event.target.value)}
                    className="mt-3 w-full rounded-xl border border-gray-300 bg-white p-3 text-gray-900"
                />
            )}

            <div>
                <label className="block font-medium text-gray-800">
                    Job Description (Optional)
                </label>
                <textarea
                    className="mt-2 h-40 w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-gray-900 shadow-sm outline-none transition focus:border-black focus:bg-white"
                    placeholder="Paste a job description here..."
                    value={jobDescription}
                    onChange={(event) => onJobDescriptionChange(event.target.value)}
                />
            </div>

            <div className="flex gap-4">
                <button
                    onClick={onReview}
                    disabled={loading || !resumeText}
                    className="flex-1 rounded-2xl bg-gray-900 px-6 py-4 text-lg font-semibold text-white shadow-xl transition-all hover:-translate-y-1 hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading ? "Reviewing..." : "Review Resume"}
                </button>
                <button
                    onClick={onReset}
                    className="rounded-2xl border border-gray-300 bg-white px-6 py-4 text-lg font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100"
                >
                    Reset
                </button>
            </div>

            {error && <ErrorMessage message={error} />}

            {loading && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
                    <div className="mb-2 flex items-center justify-between">
                        <p className="font-medium text-blue-900">
                            Reviewing your resume...
                        </p>
                        <p className="text-sm font-semibold text-blue-700">{progress}%</p>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-blue-100">
                        <div
                            className="h-full rounded-full bg-blue-600 transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="mt-3 text-sm text-blue-700">
                        Analyzing impact, clarity, metrics, role fit, and position-level
                        feedback.
                    </p>
                </div>
            )}
        </div>
    );
}
