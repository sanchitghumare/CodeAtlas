"use client";

import { useState } from "react";

type ReviewIssue = {
  severity: string;
  category: string;
  description: string;
  suggestion: string;
};

type FileReview = {
  path: string;
  score: number;
  strengths: string[];
  issues: ReviewIssue[];
};

type Summary = {
  project_type: string;
  purpose: string;
  architecture: string;
  technologies: string[];
  frameworks: string[];
  languages: string[];
  review_targets: string[];
  entry_points: string[];
  confidence: number;
};

type ReviewResponse = {
  summary: Summary;
  reviews: FileReview[];
  files_to_review: string[];
  final_report: string;
};

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-600 border-emerald-200 bg-emerald-50";
  if (score >= 50) return "text-yellow-600 border-yellow-200 bg-yellow-50";
  return "text-red-600 border-red-200 bg-red-50";
}

function severityColor(severity: string) {
  const s = severity.toLowerCase();
  if (s.includes("high") || s.includes("critical"))
    return "bg-red-100 text-red-700";
  if (s.includes("medium") || s.includes("moderate"))
    return "bg-amber-100 text-amber-700";
  return "bg-gray-200 text-gray-700";
}

function Tag({ label }: { label: string }) {
  return (
    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
      {label}
    </span>
  );
}

function FileReviewCard({ review }: { review: FileReview }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-gray-50"
      >
        <div className="min-w-0">
          <p className="font-mono text-sm text-gray-900 truncate">
            {review.path}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {review.issues.length} issue
            {review.issues.length === 1 ? "" : "s"} &middot;{" "}
            {review.strengths.length} strength
            {review.strengths.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span
            className={`text-sm font-semibold px-3 py-1 rounded-full border ${scoreColor(
              review.score
            )}`}
          >
            {review.score}/100
          </span>
          <span className="text-gray-400 text-sm">{open ? "−" : "+"}</span>
        </div>
      </button>

      {open && (
        <div className="border-t px-4 py-4 space-y-4 bg-gray-50">
          {review.strengths.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                Strengths
              </p>
              <ul className="space-y-1">
                {review.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-gray-800 flex gap-2">
                    <span className="text-emerald-600">✓</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {review.issues.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                Issues
              </p>
              <div className="space-y-2">
                {review.issues.map((issue, i) => (
                  <div
                    key={i}
                    className="border rounded-md bg-white p-3 text-sm"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded ${severityColor(
                          issue.severity
                        )}`}
                      >
                        {issue.severity}
                      </span>
                      <span className="text-xs text-gray-500">
                        {issue.category}
                      </span>
                    </div>
                    <p className="text-gray-800">{issue.description}</p>
                    <p className="text-gray-500 mt-1">
                      <span className="font-medium text-gray-600">Fix: </span>
                      {issue.suggestion}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const [response, setResponse] = useState<ReviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function analyzeRepo() {
    if (!repoUrl.trim()) return;

    setError(null);
    setResponse(null);
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/review/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repo_url: repoUrl,
        }),
      });

      const contentType = res.headers.get("content-type") ?? "";
      const payload = contentType.includes("application/json")
        ? await res.json()
        : await res.text();

      if (!res.ok) {
        throw new Error(
          typeof payload === "string" ? payload : JSON.stringify(payload)
        );
      }

      setResponse(payload as ReviewResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  const avgScore =
    response && response.reviews.length > 0
      ? Math.round(
          response.reviews.reduce((sum, r) => sum + r.score, 0) /
            response.reviews.length
        )
      : null;

  return (
    <main className="min-h-screen bg-black">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-semibold text-blue-500 mb-1">
          ReviewForge
        </h1>
        <p className="text-gray-500 mb-6">
          Paste a GitHub repo URL and get an AI code review.
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="https://github.com/owner/repo"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && analyzeRepo()}
            className="flex-1 border border-gray-300 p-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
          <button
            onClick={analyzeRepo}
            disabled={loading || !repoUrl.trim()}
            className="bg-blue-700 text-white px-4 py-2 rounded-md text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>

        {loading && (
          <div className="mt-6 text-sm text-gray-500 flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full border-2 border-gray-300 border-t-black animate-spin" />
            Cloning, scanning, and reviewing files — this can take a few
            minutes on local models.
          </div>
        )}

        {error && (
          <div className="mt-6 border border-red-200 bg-red-50 text-red-700 text-sm rounded-md p-3">
            {error}
          </div>
        )}

        {response && (
          <div className="mt-8 space-y-8">
            {/* Summary */}
            <section className="border rounded-lg bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">
                    {response.summary.project_type}
                  </p>
                  <p className="text-gray-800 text-sm leading-relaxed">
                    {response.summary.purpose}
                  </p>
                </div>
                {avgScore !== null && (
                  <span
                    className={`shrink-0 text-lg font-semibold px-3 py-1.5 rounded-full border ${scoreColor(
                      avgScore
                    )}`}
                  >
                    {avgScore}/100
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-600 mt-3">
                {response.summary.architecture}
              </p>

              <div className="flex flex-wrap gap-2 mt-4">
                {response.summary.languages.map((l) => (
                  <Tag key={l} label={l} />
                ))}
                {response.summary.frameworks.map((f) => (
                  <Tag key={f} label={f} />
                ))}
              </div>
            </section>

            {/* File reviews */}
            {response.reviews.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
                  File Reviews ({response.reviews.length})
                </h2>
                <div className="space-y-3">
                  {response.reviews.map((review) => (
                    <FileReviewCard key={review.path} review={review} />
                  ))}
                </div>
              </section>
            )}

            {/* Final report */}
            {response.final_report && (
              <section className="border rounded-lg bg-white p-5">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
                  Final Report
                </h2>
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {response.final_report}
                </p>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
