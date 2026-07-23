"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  GitPullRequest,
  FileCode2,
  GitBranch,
  Layers3,
  ShieldCheck,
  Sparkles,
  Loader2,
  Wrench,
} from "lucide-react";
import FileReviewCard from "@/components/ui/FileReviewCard";
import AskAiChat from "@/components/ui/AskAiChat";
import { Button } from "@/components/ui/button";

const scoreClass = (score) =>
  score >= 80
    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
    : score >= 50
      ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
      : "border-rose-500/30 bg-rose-500/10 text-rose-300";

const riskForScore = (score) => {
  if (score >= 80) return { label: "Low risk", className: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25" };
  if (score >= 50) return { label: "Medium risk", className: "bg-amber-500/10 text-amber-300 border-amber-500/25" };
  return { label: "High risk", className: "bg-rose-500/10 text-rose-300 border-rose-500/25" };
};

function SectionTitle({ eyebrow, title, description }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-300">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">{title}</h2>
      {description && <p className="mt-1 text-sm text-zinc-400">{description}</p>}
    </div>
  );
}

function MetricCard({ label, value, detail, icon: Icon, tone = "indigo" }) {
  const tones = {
    indigo: "bg-indigo-500/10 text-indigo-300 ring-indigo-500/20",
    sky: "bg-sky-500/10 text-sky-300 ring-sky-500/20",
    rose: "bg-rose-500/10 text-rose-300 ring-rose-500/20",
    amber: "bg-amber-500/10 text-amber-300 ring-amber-500/20",
    emerald: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20",
  };
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/5.5">
      <div className="flex items-center justify-between">
        <span className={`grid size-9 place-items-center rounded-xl ring-1 ${tones[tone]}`}><Icon className="size-4" /></span>
        <span className="text-[11px] font-medium text-zinc-500">{label}</span>
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{detail}</p>
    </div>
  );
}

function LoadingReport() {
  return <div className="mx-auto max-w-7xl animate-pulse space-y-6 px-4 py-8 sm:px-6 lg:px-8"><div className="h-7 w-64 rounded bg-white/10" /><div className="h-52 rounded-2xl bg-white/6" /><div className="grid grid-cols-2 gap-4 lg:grid-cols-5">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-36 rounded-2xl bg-white/6" />)}</div><div className="h-64 rounded-2xl bg-white/6" /></div>;
}

function LiveActivity({ jobId, repository, onComplete }) {
  const [events, setEvents] = useState(["Preparing your AI review"]);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log(`Opening SSE connection for job ${jobId}`);
    const stream = new EventSource(`/api/analyze/${jobId}/events`);
    stream.addEventListener("progress", (event) => {
      const data = JSON.parse(event.data);
      setEvents((current) => [...current, data.message]);
    });
    stream.addEventListener("complete", async (event) => {
      const data = JSON.parse(event.data);
      console.log(`Received complete SSE event for job ${jobId}`);
      stream.close();
      if (data.error) {
        setError(data.error);
        return;
      }
      try {
        console.log(`Requesting persisted analysis for job ${jobId}`);
        const response = await fetch(`/api/analyze/${jobId}/complete`, { method: "POST" });
        if (!response.ok) throw new Error("Unable to load the completed report");
        console.log(`Persisted analysis returned for job ${jobId}`);
        onComplete(await response.json());
      } catch (completionError) {
        setError(completionError.message);
      }
    });
    stream.onerror = () => {
      console.error(`SSE connection failed for job ${jobId}`);
      stream.close();
      setError("The progress connection was interrupted. Refresh this page to check the completed report.");
    };
    return () => stream.close();
  }, [jobId, onComplete]);

  return (
    <div className="min-h-screen bg-[#09090b] px-4 py-12 text-zinc-100 sm:px-6">
      <div className="mx-auto max-w-3xl"><div className="rounded-2xl border border-white/10 bg-[#111216] p-6 shadow-xl"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-indigo-500/10 text-indigo-300"><Loader2 className="size-5 animate-spin" /></span><div><p className="font-medium text-white">Reviewing {repository}</p><p className="text-sm text-zinc-400">Your report will appear here when the analysis finishes.</p></div></div><div className="mt-6 space-y-3 border-t border-white/10 pt-5">{events.map((message, index) => <div key={`${message}-${index}`} className="flex items-center gap-3 text-sm text-zinc-300"><span className="size-1.5 rounded-full bg-indigo-400" />{message}</div>)}</div>{error && <p className="mt-5 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}</div></div></div>
  );
}

export default function AnalysisPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const jobId = searchParams.get("jobId");

  useEffect(() => {
    async function fetchAnalysis() {
      try {
        const res = await fetch(`/api/analyze/${id}`);
        if (!res.ok) throw new Error("Analysis unavailable");
        setAnalysis(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalysis();
  }, [id]);

  const report = useMemo(() => {
    const response = analysis?.response || {};
    const reviews = response.reviews || [];
    const issues = reviews.flatMap((review) => (review.issues || []).map((issue) => ({ ...issue, path: review.path })));
    const score = reviews.length ? Math.round(reviews.reduce((sum, review) => sum + (review.score || 0), 0) / reviews.length) : 0;
    const critical = issues.filter((issue) => /critical|high/i.test(issue.severity || "")).length;
    return { response, reviews, issues, score, critical };
  }, [analysis]);

  if (loading) return <LoadingReport />;
  if (!analysis) return <div className="mx-auto max-w-3xl px-6 py-24 text-center text-zinc-400">Analysis not found.</div>;
  const hasActiveJob = analysis.status === "In Progress" && jobId && analysis.jobId === jobId;
  console.log("Analysis page mode", {
    analysisId: id,
    persistedJobId: analysis.jobId,
    requestedJobId: jobId,
    status: analysis.status,
    hasActiveJob,
  });
  if (hasActiveJob) {
    return <LiveActivity jobId={jobId} repository={analysis.repository || "repository"} onComplete={setAnalysis} />;
  }
  if (analysis.status === "In Progress" || !analysis.response) {
    return <div className="mx-auto max-w-3xl px-6 py-24 text-center text-zinc-400">This analysis is still processing. Return to the dashboard and open the active review from the current session.</div>;
  }

  const { response, reviews, issues, score, critical } = report;
  const risk = riskForScore(score);
  const repository = analysis.repository || "Repository review";
  const reviewedAt = analysis.createdAt ? new Date(analysis.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Just now";
  const topIssues = [...issues].sort((a, b) => (/critical|high/i.test(b.severity || "") ? 1 : 0) - (/critical|high/i.test(a.severity || "") ? 1 : 0)).slice(0, 3);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#09090b]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"><ArrowLeft className="size-4" /> Dashboard</Link>
          <div className="hidden items-center gap-1 sm:flex"><span className="rounded-md bg-indigo-500/10 px-2 py-1 text-xs font-medium text-indigo-300">AI review</span><span className="text-xs text-zinc-600">#{String(id).slice(-6)}</span></div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-12 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <section className="flex flex-col justify-between gap-5 border-b border-white/10 pb-8 md:flex-row md:items-end">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2 text-sm text-zinc-400"><GitBranch className="size-4" /><span>Code review report</span></div>
            <h1 className="truncate text-3xl font-semibold tracking-tight text-white sm:text-4xl">{repository}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-500"><span className="inline-flex items-center gap-1.5"><GitBranch className="size-3.5" />Repository analysis</span><span>Reviewed {reviewedAt}</span></div>
          </div>
          <div className="flex items-center gap-3"><span className={`rounded-xl border px-3 py-2 text-sm font-semibold ${scoreClass(score)}`}>{score}<span className="ml-1 text-xs font-medium opacity-70">/ 100</span></span></div>
        </section>

        <div className="flex w-full gap-1 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.035] p-1 sm:w-fit" role="tablist" aria-label="Analysis sections">
          {[{ id: "overview", label: "Overview" }, { id: "files", label: "File Reviews" }, { id: "ask-ai", label: "Ask AI" }].map((tab) => <Button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} variant={activeTab === tab.id ? "secondary" : "ghost"} size="sm" onClick={() => setActiveTab(tab.id)} className={activeTab === tab.id ? "bg-indigo-500/15 text-indigo-100 hover:bg-indigo-500/20" : "text-zinc-400 hover:text-white"}>{tab.label}</Button>)}
        </div>

        {activeTab === "overview" && <>
          <section id="overview" className="rounded-3xl border border-white/10 bg-linear-to-br from-indigo-500/12 via-[#121217] to-[#111116] p-6 shadow-2xl shadow-black/20 sm:p-8">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl"><div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-400/20"><GitPullRequest className="size-5" /></div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">Executive summary</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">{response.summary?.project_type || "AI-powered project health review"}</h2><p className="mt-3 text-sm leading-6 text-zinc-300">{response.summary?.purpose || "Your codebase has been reviewed for quality, maintainability, and risks across the analyzed files."}</p><div className="mt-5 flex flex-wrap gap-2">{[...(response.summary?.languages || []), ...(response.summary?.frameworks || [])].map((tag) => <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-300">{tag}</span>)}</div></div>
              <div className="flex items-center gap-5 rounded-2xl border border-white/10 bg-black/20 p-5"><div className="relative grid size-24 place-items-center rounded-full bg-[conic-gradient(#818cf8_var(--score),#27272a_0)]" style={{ "--score": `${score}%` }}><div className="grid size-19.5 place-items-center rounded-full bg-[#15151b]"><span className="text-xl font-semibold">{score}</span></div></div><div><p className="text-xs uppercase tracking-wider text-zinc-500">Project health</p><p className="mt-1 text-lg font-semibold text-white">{score >= 80 ? "Healthy" : score >= 50 ? "Needs attention" : "At risk"}</p><span className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${risk.className}`}>{risk.label}</span></div></div>
            </div>
          </section>

          <section><SectionTitle eyebrow="At a glance" title="Review metrics" description="A quick read on codebase quality and review coverage." /><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"><MetricCard label="Files reviewed" value={reviews.length} detail="Analyzed files" icon={FileCode2} tone="sky" /><MetricCard label="Issues found" value={issues.length} detail="Across all files" icon={AlertTriangle} tone="amber" /><MetricCard label="Critical issues" value={critical} detail="High-priority findings" icon={ShieldCheck} tone="rose" /><MetricCard label="Average score" value={`${score}%`} detail="Quality index" icon={Sparkles} tone="indigo" /><MetricCard label="Maintainability" value={score >= 80 ? "High" : score >= 50 ? "Fair" : "Low"} detail="Estimated outlook" icon={Layers3} tone="emerald" /></div></section>

          {topIssues.length > 0 && <section id="recommendations"><SectionTitle eyebrow="AI guidance" title="Recommended next steps" description="Prioritized improvements surfaced from the review." /><div className="mt-5 grid gap-4 lg:grid-cols-3">{topIssues.map((issue, index) => <article key={`${issue.path}-${index}`} className="group rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition hover:border-indigo-400/30 hover:bg-white/5.5"><div className="flex items-start justify-between gap-3"><span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${/critical|high/i.test(issue.severity || "") ? "border-rose-500/25 bg-rose-500/10 text-rose-300" : "border-amber-500/25 bg-amber-500/10 text-amber-300"}`}>{issue.severity || "Priority"}</span><span className="font-mono text-[11px] text-zinc-500">{issue.path}</span></div><h3 className="mt-4 font-medium text-white">{issue.category || "Improve code quality"}</h3><p className="mt-2 text-sm leading-6 text-zinc-400">{issue.description}</p>{issue.suggestion && <div className="mt-4 border-t border-white/10 pt-3 text-sm leading-6 text-zinc-300"><Wrench className="mr-2 inline size-3.5 text-indigo-300" /><span className="font-medium text-indigo-200">Suggested fix: </span>{issue.suggestion}</div>}</article>)}</div></section>}

          {response.summary?.architecture && <section><div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.07] p-6"><div className="flex gap-4"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-500/15 text-indigo-300"><GitBranch className="size-5" /></div><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">Cross-file analysis</p><h2 className="mt-1 text-lg font-semibold text-white">Architecture observations</h2><p className="mt-3 max-w-4xl text-sm leading-6 text-zinc-300">{response.summary.architecture}</p></div></div></div></section>}

          {response.final_report && <section id="report"><SectionTitle eyebrow="Complete analysis" title="Final report" description="A consolidated AI assessment of the reviewed codebase." /><article className="mt-5 rounded-2xl border border-white/10 bg-white/[0.035] p-6 sm:p-8"><div className="prose prose-invert max-w-none prose-p:leading-7 prose-p:text-zinc-300 prose-headings:text-white">{response.final_report.split(/\n{2,}/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div></article></section>}
        </>}
        {activeTab === "files" && <section id="files"><SectionTitle eyebrow="Detailed review" title={`Per-file reviews (${reviews.length})`} description="Expand a file to inspect strengths, issues, and concrete fixes." />{reviews.length > 0 ? <div className="mt-5 space-y-3">{reviews.map((review) => <FileReviewCard key={review.path} review={review} />)}</div> : <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.035] p-6 text-sm text-zinc-400">No file reviews are available for this analysis.</div>}</section>}
        {activeTab === "ask-ai" && <AskAiChat analysisId={id} repository={repository} />}
      </main>
    </div>
  );
}
