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

type ReviewResponse = {
  summary: {
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
  reviews: FileReview[];
  files_to_review: string[];
  final_report: string;
};

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const [response, setResponse] = useState<ReviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function analyzeRepo() {
    setError(null);
    setResponse(null);

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

      setResponse(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4">
      <input
        type="text"
        placeholder="GitHub Repository URL"
        value={repoUrl}
        onChange={(e) => setRepoUrl(e.target.value)}
        className="border p-2 rounded w-125"
      />

      <button
        onClick={analyzeRepo}
        className="bg-black text-white px-4 py-2 rounded"
      >
        Analyze Repository
      </button>

      {error && <p className="text-red-600">{error}</p>}

      {response && (
        <pre className="bg-gray-100 p-4 rounded text-black">
          {JSON.stringify(response, null, 2)}
        </pre>
      )}
    </main>
  );
}
