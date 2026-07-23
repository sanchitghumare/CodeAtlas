"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  GitPullRequest, Bell, ChevronRight, Sparkles, GitBranch, ArrowUpRight, History,
  PlayCircle,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import RepoCard from "@/components/ui/RepoCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { useRouter } from "next/navigation";
import RepositoryInput from "@/components/ui/RepositoryInput";
const scoreClass = (score) =>
  score >= 80
    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
    : score >= 50
      ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
      : "border-rose-500/30 bg-rose-500/10 text-rose-300";

export default function Home() {
  const [showAllRepos, setShowAllRepos] = useState(false);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [repositories, setRepositories] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [recentReviews, setRecentReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  useEffect(() => {
    async function fetchRepos() {
      try {
        const res = await fetch("/api/github/repos");
        const data = await res.json();

        setRepositories(
          data.map((repo) => ({
            id: repo.id,
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description || "No description available.",
            language: repo.language || "Unknown",
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            updatedAt: repo.updated_at,
            isPrivate: repo.private,
            htmlUrl: repo.html_url,
          }))
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingRepos(false);
      }
    }

    fetchRepos();
  }, []);
  useEffect(() => {
    async function fetchRecentReviews() {
      try {
        const res = await fetch("/api/analyze");
        if (!res.ok) throw new Error("Unable to load recent reviews");
        setRecentReviews(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingReviews(false);
      }
    }

    fetchRecentReviews();
  }, []);
  const session = useSession();
  const user = session?.data?.user?.username || null;
  const avatarUrl = session?.data?.user?.image || null;

  const visibleRepos = showAllRepos ? repositories : repositories.slice(0, 3);

  async function handleAnalyze(repo) {
    console.log("handleAnalyze called", repo);
    setAnalyzingId(repo.id);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repo_url: repo.htmlUrl,
        }),
      });
      console.log("Status:", res.status);

      const data = await res.json();
      console.log("Response:", data);

      if (!res.ok) {
        throw new Error(data.error || "Analysis failed");
      }
      router.push(`/analysis/${data.analysisId}?jobId=${encodeURIComponent(data.jobId)}`);
    } finally {
      setAnalyzingId(null);
    }
    setTimeout(() => setAnalyzingId(null), 1600);
  }
  const [showInput, setShowInput] = useState(false);
  async function handleAnalyzeUrl(e) {
    e.preventDefault();

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repo_url: repoUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      router.push(`/analysis/${data.analysisId}?jobId=${encodeURIComponent(data.jobId)}`);
    } catch (err) {
      console.error(err);
    }
  }
  return (
    <main className="min-h-screen overflow-hidden bg-[#09090b] text-zinc-100">
      {/* Top Navigation */}
      <header className="sticky top-0 z-20  bg-black
border-b border-zinc-900">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5 font-semibold tracking-tight text-white"
          >
            <span className="grid size-8 place-items-center rounded-lg bg-blue-500 text-white">
              <GitPullRequest className="size-4" />
            </span>
            <span className="hidden sm:inline">CodeAtlas</span>
          </Link>

          <div className="flex items-center gap-3">
            
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user || "User avatar"}
                className="size-9 shrink-0 rounded-full border border-white/10 object-cover"
              />
            ) : (
              <div className="grid size-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-xs font-medium text-zinc-300">
                {user ? user.slice(0, 2).toUpperCase() : "?"}
              </div>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-red-400"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8 pb-24">
        {/* Welcome Section */}
        <section className="flex flex-col items-start justify-between gap-6 py-10 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user || "User avatar"}
                className="size-14 rounded-full border border-white/10 object-cover"
              />
            ) : (
              <div className="grid size-14 place-items-center rounded-full border border-white/10 bg-white/5 text-sm font-medium text-zinc-300">
                {user ? user.slice(0, 2).toUpperCase() : "?"}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                Welcome back{user ? `, ${user}` : ""}
              </h1>
              <p className="mt-1 text-sm text-zinc-400">
                Review your repositories using
                AI-powered repository analysis.
              </p>
            </div>
          </div>

          {!showInput ? (
            <Button onClick={() => setShowInput(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-400">
              <Sparkles className="size-4" />
              Analyze New Repository
            </Button>
          ) : (
            <RepositoryInput
              value={repoUrl}
              onChange={setRepoUrl}
              onSubmit={handleAnalyzeUrl}
              loading={loading}
              compact
            />
          )}
        </section>

        {/* Quick Stats */}
        {/* <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </section> */}

        {/* GitHub Repositories */}
        <section id="repositories" className="mt-12 scroll-mt-20">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-400">
                Your Repositories
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                Connected via GitHub &middot; {repositories.length} total
              </p>
            </div>
            {repositories.length > 3 && (
              <button
                onClick={() => setShowAllRepos((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 transition-colors hover:text-blue-300"
              >
                {showAllRepos ? "Show less" : "View All"}
                <ChevronRight className="size-3.5" />
              </button>
            )}
          </div>

          {repositories.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 p-10 text-center">
              <GitBranch className="mx-auto size-6 text-zinc-600" />
              <p className="mt-3 text-sm text-zinc-400">
                No repositories found yet.
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Connect a GitHub account to start reviewing code.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleRepos.map((repo) => (
                <RepoCard
                  key={repo.id}
                  repo={repo}
                  onAnalyze={() => handleAnalyze(repo)}
                  analyzing={analyzingId === repo.id}
                />
              ))}
            </div>
          )}
        </section>

        {/* Recent Reviews */}
        <section id="recent-reviews" className="mt-12 scroll-mt-20">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-400">
            Recent Reviews
          </h2>

          {loadingReviews ? (
            <div className="rounded-xl border border-white/10 bg-[#111216] p-5">
              <div className="space-y-3 animate-pulse">
                {[0, 1, 2].map((item) => <div key={item} className="h-10 rounded-lg bg-white/5" />)}
              </div>
            </div>
          ) : recentReviews.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 p-10 text-center">
              <History className="mx-auto size-6 text-zinc-600" />
              <p className="mt-3 text-sm text-zinc-400">No reviews yet.</p>
              <p className="mt-1 text-xs text-zinc-500">
                Analyze a repository above to see results here.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-white/10 bg-[#111216]">
              {/* Header row - desktop only */}
              <div className="hidden grid-cols-[1.5fr_1fr_1fr_0.7fr] gap-4 border-b border-white/10 px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 sm:grid">
                <span>Repository</span>
                <span>Date</span>
                <span>Status</span>
                <span className="text-right">Score</span>
              </div>

              <div className="divide-y divide-white/5">
                {recentReviews.map((r) => (
                  <Link
                    href={`/analysis/${r.id}`}
                    key={r.id}
                    className="grid grid-cols-2 gap-4 px-5 py-4 text-sm transition-colors hover:bg-white/5 sm:grid-cols-[1.5fr_1fr_1fr_0.7fr] sm:items-center"
                  >
                    <span className="col-span-2 truncate font-mono text-zinc-200 sm:col-span-1">
                      {r.repository}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {new Date(r.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span>
                      <StatusBadge status={r.status} />
                    </span>
                    <span className="text-right font-mono text-xs">
                      {r.score !== null ? (
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 font-semibold ${scoreClass(
                            r.score
                          )}`}
                        >
                          {r.score}
                        </span>
                      ) : (
                        <span className="text-zinc-600">&mdash;</span>
                      )}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section className="mt-12">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-400">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link
              href="#repositories"
              className="group flex items-center gap-3 rounded-xl border border-white/10 bg-[#111216] p-4 transition-colors hover:border-blue-500/30"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-500/10 text-blue-400">
                <PlayCircle className="size-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-zinc-100">
                  Analyze New Repository
                </p>
                <p className="text-xs text-zinc-500">Pick a repo and run a review</p>
              </div>
              <ArrowUpRight className="ml-auto size-4 text-zinc-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>


            <Link
              href="#recent-reviews"
              className="group flex items-center gap-3 rounded-xl border border-white/10 bg-[#111216] p-4 transition-colors hover:border-blue-500/30"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-500/10 text-blue-400">
                <History className="size-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-zinc-100">
                  View Review History
                </p>
                <p className="text-xs text-zinc-500">Browse all past reviews</p>
              </div>
              <ArrowUpRight className="ml-auto size-4 text-zinc-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
