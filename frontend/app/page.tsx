"use client";

import { useState } from "react";

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const [response, setResponse] = useState<any>(null);

  async function analyzeRepo() {
    const res = await fetch("http://127.0.0.1:8000/review/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        repo_url: repoUrl,
      }),
    });

    const data = await res.json();
    setResponse(data);
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

      {response && (
        <pre className="bg-gray-100 p-4 rounded text-black">
          {JSON.stringify(response, null, 2)}
        </pre>
      )}
    </main>
  );
}
