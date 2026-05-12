"use client";
import { useRef, useState } from "react";
type ReviewCategory = {
  name: string;
  score: number;
  feedback: string;
  suggestions: string[];
};

type PositionSuggestion = {
  positionTitle: string;
  company: string;
  positionScore: number;
  feedback: string;
  suggestions: string[];
  rewrittenBullets: string[];
};

type MatchAnalysis = {
  matchScore: number;
  summary: string;
  missingKeywords: string[];
  strongMatches: string[];
};

type ReviewResult = {
  overallScore: number;
  matchAnalysis?: MatchAnalysis;
  categories: ReviewCategory[];
  positionSuggestions?: PositionSuggestion[];
  improvedBullets: string[];
};

function getSavedReviewData() {
  if (typeof window === "undefined") return null;

  const saved = localStorage.getItem("resumeReviewData");

  if (!saved) return null;

  try {
    return JSON.parse(saved);
  } catch {
    localStorage.removeItem("resumeReviewData");
    return null;
  }
}

function getScoreColor(score: number, max: number) {
  const percentage = (score / max) * 100;

  if (percentage >= 80) return "bg-green-500";
  if (percentage >= 60) return "bg-yellow-500";
  return "bg-red-500";
}

function ScoreBar({
  score,
  max,
}: {
  score: number;
  max: number;
}) {
  const percentage = Math.min((score / max) * 100, 100);

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

export default function Home() {
  const savedReviewData = getSavedReviewData();
  const [resumeText, setResumeText] = useState(
    savedReviewData?.resumeText || ""
  );
  const [jobDescription, setJobDescription] = useState(
    savedReviewData?.jobDescription || ""
  );
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<ReviewResult | null>(
    savedReviewData?.review || null
  );
  const [fileName, setFileName] = useState(
    savedReviewData?.fileName || ""
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [targetRole, setTargetRole] = useState(
    savedReviewData?.targetRole || "Software Engineer"
  );

  const [customRole, setCustomRole] = useState(
    savedReviewData?.customRole || ""
  );
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const hasInterviewData =
    typeof window !== "undefined" &&
    localStorage.getItem("mockInterviewSession")

  // file upload handler
  async function handleFile(file: File) {
    setFileName(file.name);
    setIsParsing(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.text) {
        setResumeText(data.text);
      } else {
        alert(data.error || "No text returned from parser");
      }
    } catch (error) {
      console.error("Frontend parse error:", error);
      alert("Failed to parse file.");
    } finally {
      setIsParsing(false);
    }
  }
  // review button handler
  async function handleReview() {
    if (!resumeText) return;

    setLoading(true);
    setReview(null);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 30) return prev + 4;
        if (prev < 60) return prev + 3;
        if (prev < 80) return prev + 2;
        if (prev < 92) return prev + 1;
        return prev; // wait here until API finishes
      });
    }, 500);

    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeText,
          jobDescription,
          targetRole: targetRole === "Other" ? customRole : targetRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.log("RAW ERROR:", data.raw);
        alert(data.error || "Review failed");
        return;
      }

      setProgress(100);

      setTimeout(() => {
        setReview(data);

        localStorage.setItem(
          "resumeReviewData",
          JSON.stringify({
            resumeText,
            jobDescription,
            targetRole,
            customRole,
            fileName,
            review: data,
          })
        );
        setLoading(false);
        setProgress(0);
      }, 500);
    } catch (error) {
      console.error("Review error:", error);
      alert("Review failed.");
      setLoading(false);
      setProgress(0);
    } finally {
      clearInterval(interval);
    }
  }

  function resetReview() {
    setResumeText("");
    setJobDescription("");
    setReview(null);
    setFileName("");
    setLoading(false);
    setProgress(0);
    setTargetRole("Software Engineer");
    setCustomRole("");

    localStorage.removeItem("resumeReviewData");
    localStorage.removeItem("mockInterviewData");
    localStorage.removeItem("mockInterviewSession");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);

    setTimeout(() => {
      setCopiedId(null);
    }, 1500);
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
          Upload your resume and get AI-powered feedback, scoring, and improved bullet points.
        </p>

        <div className="mt-8 grid items-start gap-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-lg lg:grid-cols-[420px_1fr]">
          <div className="space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-md">
            {/* FILE UPLOAD */}
            <div>
              <label className="block font-medium text-gray-800">
                Upload Resume (PDF or DOCX)
              </label>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);

                  const file = e.dataTransfer.files?.[0];
                  if (!file) return;

                  handleFile(file);
                }}
                className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 ${isDragging
                  ? "scale-[1.02] border-black bg-gray-100"
                  : "border-gray-300 bg-white hover:border-black hover:bg-gray-50"
                  }`}
              >
                <label className="cursor-pointer">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      handleFile(file);
                    }}
                    className="hidden"
                  />

                  <div className="text-5xl">
                    {isParsing ? "⏳" : fileName ? "✅" : "📄"}
                  </div>

                  <p className="mt-3 font-semibold text-gray-900">
                    {isParsing
                      ? "Parsing resume..."
                      : fileName
                        ? "Resume uploaded"
                        : "Drag & drop your resume here"}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    or click to browse PDF/DOCX
                  </p>

                  {fileName && (
                    <p className="mt-3 rounded-full bg-gray-100 px-4 py-1 text-sm text-gray-700">
                      {fileName}
                    </p>
                  )}
                </label>
              </div>
            </div>

            {/* TEXTAREA (AUTO-FILLED) */}
            <div>
              <label className="block font-medium text-gray-800">
                Resume Text (Editable)
              </label>
              <textarea
                className="mt-2 h-64 w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-gray-900 shadow-sm outline-none transition focus:border-black focus:bg-white"
                placeholder="Your resume text will appear here after upload..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-medium text-gray-800">
                Target Role
              </label>

              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 p-3 text-gray-900 shadow-sm outline-none transition focus:border-black focus:bg-white"
              >
                <option>Software Engineer</option>
                <option>Data Analyst</option>
                <option>Data Scientist</option>
                <option>Machine Learning Engineer</option>
                <option>Cybersecurity Analyst</option>
                <option>Product Manager</option>
                <option>IT Support Specialist</option>
                <option>Other</option>
              </select>
            </div>
            {targetRole === "Other" && (
              <input
                type="text"
                placeholder="Enter target role..."
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                className="mt-3 w-full rounded-xl border border-gray-300 bg-white p-3 text-gray-900"
              />
            )}

            {/* JOB DESCRIPTION */}
            <div>
              <label className="block font-medium text-gray-800">
                Job Description (Optional)
              </label>
              <textarea
                className="mt-2 h-40 w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-gray-900 shadow-sm outline-none transition focus:border-black focus:bg-white"
                placeholder="Paste a job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>

            {/* BUTTON */}
            <div className="flex gap-4">
              <button
                onClick={handleReview}
                disabled={loading || !resumeText}
                className="flex-1 rounded-2xl bg-gray-900 px-6 py-4 text-lg font-semibold text-white shadow-xl transition-all hover:-translate-y-1 hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Reviewing..." : "Review Resume"}
              </button>

              <button
                onClick={resetReview}
                className="rounded-2xl border border-gray-300 bg-white px-6 py-4 text-lg font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100"
              >
                Reset
              </button>
            </div>
            {loading && (
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-medium text-blue-900">
                    Reviewing your resume...
                  </p>
                  <p className="text-sm font-semibold text-blue-700">
                    {progress}%
                  </p>
                </div>

                <div className="h-3 w-full overflow-hidden rounded-full bg-blue-100">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <p className="mt-3 text-sm text-blue-700">
                  Analyzing impact, clarity, metrics, role fit, and position-level feedback.
                </p>
              </div>
            )}

          </div>

          {/* RESULTS */}
          <div className="space-y-6">
            {!review && !loading && (
              <div className="flex min-h-[500px] items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-white p-8 text-center">
                <div>
                  <div className="text-5xl">📊</div>
                  <h2 className="mt-4 text-2xl font-bold text-gray-900">
                    Your review will appear here
                  </h2>
                  <p className="mt-2 max-w-md text-gray-600">
                    Upload a resume, choose a target role, and click Review Resume to see
                    scoring, job matching, position feedback, and improved bullets.
                  </p>
                </div>
              </div>
            )}

            {review && (
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-lg">
                <h2 className="mb-6 text-3xl font-bold tracking-tight">Review Results</h2>
                <p className="mt-2 text-gray-600">
                  Your resume has been analyzed successfully. Continue with an AI-powered mock interview tailored to your target role.
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.setItem(
                        "mockInterviewData",
                        JSON.stringify({
                          resumeText,
                          jobDescription,
                          targetRole:
                            targetRole === "Other"
                              ? customRole
                              : targetRole,
                          review,
                        })
                      );

                      window.location.href = "/interview";
                    }}
                    className="rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-blue-700"
                  >
                    Start Mock Interview
                  </button>

                  {hasInterviewData && (
                    <button
                      type="button"
                      onClick={() => {
                        window.location.href = "/interview";
                      }}
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
                  <div className="mt-4 rounded-lg border bg-white p-4">
                    <h3 className="text-lg font-semibold">
                      Job Match Score: {review.matchAnalysis.matchScore}/100
                    </h3>

                    <ScoreBar score={review.matchAnalysis.matchScore} max={100} />

                    <p className="mt-3 text-sm text-gray-700">
                      {review.matchAnalysis.summary}
                    </p>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="font-medium text-sm">Missing Keywords</h4>
                        <ul className="mt-2 list-disc pl-5 text-sm text-gray-700">
                          {review.matchAnalysis.missingKeywords?.map((keyword, index) => (
                            <li key={index}>{keyword}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm">Strong Matches</h4>
                        <ul className="mt-2 list-disc pl-5 text-sm text-gray-700">
                          {review.matchAnalysis.strongMatches?.map((match, index) => (
                            <li key={index}>{match}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 space-y-4">
                  {review.categories?.map((cat: ReviewCategory, index: number) => (
                    <div key={index} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">

                      <h3 className="font-semibold">
                        {cat.name}: {cat.score}/20
                      </h3>
                      <ScoreBar score={cat.score} max={20} />

                      <p className="mt-2 text-sm text-gray-700">{cat.feedback}</p>

                      <ul className="mt-2 list-disc pl-5 text-sm text-gray-700">
                        {cat.suggestions?.map((s: string, i: number) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {review.positionSuggestions && (
                  <div className="mt-6 space-y-4">
                    <h2 className="text-xl font-semibold">Position Feedback</h2>

                    {review.positionSuggestions.map((pos: PositionSuggestion, index: number) => (
                      <div key={index} className="rounded-2xl border border-gray-200 bg-white p-4">

                        <div className="flex justify-between">
                          <h3 className="font-semibold">
                            {pos.positionTitle} {pos.company && `@ ${pos.company}`}
                          </h3>

                          <span className="bg-blue-100 px-2 py-1 rounded text-sm">
                            {pos.positionScore}/10
                          </span>
                        </div>

                        <ScoreBar score={pos.positionScore} max={10} />

                        <p className="mt-2 text-sm text-gray-700">{pos.feedback}</p>

                        <ul className="mt-2 list-disc pl-5 text-sm">
                          {pos.suggestions?.map((s: string, i: number) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>

                        <div className="mt-3">
                          <p className="font-medium text-sm">Rewritten Bullets:</p>
                          <ul className="list-disc pl-5 text-sm">
                            {pos.rewrittenBullets?.map((b: string, i: number) => (
                              <li key={i} className="mt-2 flex items-start justify-between gap-3">
                                <span>{b}</span>

                                <button
                                  onClick={() => copyToClipboard(b, `position-${index}-${i}`)}
                                  className="w-20 flex-shrink-0 rounded-md bg-black px-2 py-1 text-xs text-white hover:bg-gray-800"
                                >
                                  {copiedId === `position-${index}-${i}` ? "Copied" : "Copy"}
                                </button>

                              </li>
                            ))}


                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 rounded-lg border p-4">
                  <h3 className="font-semibold">Improved Bullets</h3>

                  <div className="mt-3 space-y-3">
                    {review.improvedBullets?.map((bullet: string, index: number) => (
                      <div
                        key={index}
                        className="flex items-start justify-between gap-4 rounded-lg bg-gray-50 p-3"
                      >
                        <p className="text-sm text-gray-700">{bullet}</p>

                        <button
                          onClick={() => copyToClipboard(bullet, `improved-${index}`)}
                          className="w-20 flex-shrink-0 rounded-lg bg-black px-2 py-1 text-xs text-white hover:bg-gray-800"
                        >
                          {copiedId === `improved-${index}` ? "Copied" : "Copy"}
                        </button>

                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>



        </div>
      </div>
    </main>
  );
}