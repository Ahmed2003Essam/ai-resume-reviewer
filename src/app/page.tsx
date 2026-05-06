"use client";

import { useState } from "react";
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
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [customRole, setCustomRole] = useState("");

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

    setReview(data);
    setLoading(false);
  }
  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);

    setTimeout(() => {
      setCopiedId(null);
    }, 1500);
  }
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900">
          AI Resume Reviewer
        </h1>

        <p className="mt-3 text-gray-600">
          Upload your resume and get AI-powered feedback, scoring, and improved bullet points.
        </p>

        <div className="mt-8 space-y-6">
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
              className="mt-2 h-64 w-full rounded-xl border border-gray-300 bg-white p-4 text-gray-900"
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
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white p-3 text-gray-900"
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
              className="mt-2 h-40 w-full rounded-xl border border-gray-300 bg-white p-4 text-gray-900"
              placeholder="Paste a job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>

          {/* BUTTON */}
          <button
            onClick={handleReview}
            disabled={loading || !resumeText}
            className="rounded-xl bg-black px-6 py-3 font-medium text-white disabled:opacity-50"
          >
            {loading ? "Reviewing..." : "Review Resume"}
          </button>

          {/* RESULTS */}
          {review && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">Review Results</h2>

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
                  <div key={index} className="rounded-lg border p-4">

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
                    <div key={index} className="rounded-lg border p-4 bg-white">

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
    </main>
  );
}