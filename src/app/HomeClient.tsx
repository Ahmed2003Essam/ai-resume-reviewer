"use client";

import { useRef, useState } from "react";
import ResumeForm from "@/components/resume/ResumeForm";
import ReviewResults from "@/components/resume/ReviewResults";
import {
    interviewSessionSchema,
    mockInterviewDataSchema,
    reviewResultSchema,
    savedReviewDataSchema,
    type ReviewResult,
} from "@/lib/schemas";
import { readStorage, removeStorage, writeStorage } from "@/lib/storage";

// API errors are untrusted JSON, so only expose a string message to the UI.
function getApiErrorMessage(result: unknown, fallback: string) {
    if (!result || typeof result !== "object") return fallback;

    const error = (result as { error?: unknown }).error;
    return typeof error === "string" ? error : fallback;
}

export default function Home() {
    // Restore only previously saved review data that still matches the current schema.
    const savedReviewData = readStorage(
        "resumeReviewData",
        savedReviewDataSchema
    );
    const [resumeText, setResumeText] = useState(
        savedReviewData?.resumeText ?? ""
    );
    const [jobDescription, setJobDescription] = useState(
        savedReviewData?.jobDescription ?? ""
    );
    const [targetRole, setTargetRole] = useState(
        savedReviewData?.targetRole ?? "Software Engineer"
    );
    const [customRole, setCustomRole] = useState(
        savedReviewData?.customRole ?? ""
    );
    const [review, setReview] = useState<ReviewResult | null>(
        savedReviewData?.review ?? null
    );
    const [fileName, setFileName] = useState(savedReviewData?.fileName ?? "");
    const [loading, setLoading] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const hasInterviewData =
        readStorage("mockInterviewSession", interviewSessionSchema) !== null;

    // Sends an uploaded PDF or DOCX to the parser and places extracted text in the form.
    async function handleFile(file: File) {
        setFileName(file.name);
        setIsParsing(true);
        setError(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("/api/parse", {
                method: "POST",
                body: formData,
            });
            const result: unknown = await response.json();

            if (
                response.ok &&
                result &&
                typeof result === "object" &&
                typeof (result as { text?: unknown }).text === "string"
            ) {
                setResumeText((result as { text: string }).text);
                return;
            }

            setError(
                getApiErrorMessage(
                    result,
                    "No text was found in the uploaded file."
                )
            );
        } catch (requestError) {
            console.error("Resume parsing request failed:", requestError);
            setError(
                "Failed to parse the file. Please try another PDF or DOCX file."
            );
        } finally {
            setIsParsing(false);
        }
    }

    // Requests an AI review, validates the response, and persists a successful result.
    async function handleReview() {
        if (!resumeText.trim()) return;

        setLoading(true);
        setReview(null);
        setProgress(0);
        setError(null);

        // This is visual progress only; it slows near completion until the API responds.
        const interval = window.setInterval(() => {
            setProgress((previous) => {
                if (previous < 30) return previous + 4;
                if (previous < 60) return previous + 3;
                if (previous < 80) return previous + 2;
                if (previous < 92) return previous + 1;
                return previous;
            });
        }, 500);

        try {
            const response = await fetch("/api/review", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    resumeText,
                    jobDescription,
                    targetRole: targetRole === "Other" ? customRole : targetRole,
                }),
            });
            const result: unknown = await response.json();

            if (!response.ok) {
                setError(
                    getApiErrorMessage(
                        result,
                        "The resume review failed. Please try again."
                    )
                );
                setLoading(false);
                setProgress(0);
                return;
            }

            const reviewResult = reviewResultSchema.safeParse(result);

            if (!reviewResult.success) {
                setError(
                    "The review service returned invalid feedback. Please try again."
                );
                setLoading(false);
                setProgress(0);
                return;
            }

            setProgress(100);
            window.setTimeout(() => {
                setReview(reviewResult.data);
                writeStorage("resumeReviewData", {
                    resumeText,
                    jobDescription,
                    targetRole,
                    customRole,
                    fileName,
                    review: reviewResult.data,
                });
                setLoading(false);
                setProgress(0);
            }, 500);
        } catch (requestError) {
            console.error("Resume review request failed:", requestError);
            setError("The resume review failed. Please try again.");
            setLoading(false);
            setProgress(0);
        } finally {
            window.clearInterval(interval);
        }
    }

    // Returns the page to a clean state and removes data tied to the previous resume.
    function resetReview() {
        setResumeText("");
        setJobDescription("");
        setReview(null);
        setFileName("");
        setLoading(false);
        setProgress(0);
        setTargetRole("Software Engineer");
        setCustomRole("");
        setError(null);
        removeStorage("resumeReviewData");
        removeStorage("mockInterviewData");
        removeStorage("mockInterviewSession");

        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    // Tracks the copied item briefly so its button can show confirmation feedback.
    function copyToClipboard(text: string, id: string) {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        window.setTimeout(() => setCopiedId(null), 1500);
    }

    // Saves the validated interview context before navigating to the interview page.
    function startInterview() {
        if (!review) return;

        const interviewData = mockInterviewDataSchema.safeParse({
            resumeText,
            jobDescription,
            targetRole: targetRole === "Other" ? customRole : targetRole,
            review,
        });

        if (!interviewData.success) {
            setError("Unable to prepare the interview from this review.");
            return;
        }

        writeStorage("mockInterviewData", interviewData.data);
        window.location.href = "/interview";
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 px-6 py-10">
            <div className="mx-auto max-w-7xl">
                <div className="mx-auto mb-4 w-fit rounded-full border border-blue-200 bg-blue-50 px-4 py-1 text-sm font-medium text-blue-700">
                    AI-Powered Resume Analysis
                </div>
                <h1 className="text-center text-5xl font-bold tracking-tight text-gray-900 md:text-6xl">
                    AI Resume Reviewer
                </h1>
                <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-gray-600">
                    Upload your resume and get AI-powered feedback, scoring, and improved
                    bullet points.
                </p>

                <div className="mt-8 grid items-start gap-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-lg lg:grid-cols-[420px_1fr]">
                    <ResumeForm
                        resumeText={resumeText}
                        jobDescription={jobDescription}
                        targetRole={targetRole}
                        customRole={customRole}
                        fileName={fileName}
                        isParsing={isParsing}
                        isDragging={isDragging}
                        loading={loading}
                        progress={progress}
                        error={error}
                        fileInputRef={fileInputRef}
                        onResumeTextChange={setResumeText}
                        onJobDescriptionChange={setJobDescription}
                        onTargetRoleChange={setTargetRole}
                        onCustomRoleChange={setCustomRole}
                        onDraggingChange={setIsDragging}
                        onFile={handleFile}
                        onReview={handleReview}
                        onReset={resetReview}
                    />
                    <ReviewResults
                        review={review}
                        loading={loading}
                        hasInterviewData={hasInterviewData}
                        copiedId={copiedId}
                        onCopy={copyToClipboard}
                        onStartInterview={startInterview}
                        onBackToInterview={() => (window.location.href = "/interview")}
                    />
                </div>
            </div>
        </main>
    );
}
