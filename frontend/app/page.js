

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  GitBranch,
  GitPullRequest,
  Layers3,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const examples = ["vercel/next.js", "facebook/react", "shadcn-ui/ui"];

const features = [
  {
    icon: Zap,
    title: "Parallel file analysis",
    description: "Review more code without the long wait.",
  },
  {
    icon: Layers3,
    title: "Architecture reasoning",
    description: "Spot concerns that only appear across files.",
  },
  {
    icon: ShieldCheck,
    title: "Self-evaluated output",
    description: "Every report is graded before it reaches you.",
    featured: true,
  },
  {
    icon: GitPullRequest,
    title: "Actionable fixes",
    description: "Know what matters most and where to start.",
  },
];

function RepositoryInput({ value, onChange, onSubmit, loading, compact = false }) {
  return (
    <form onSubmit={onSubmit} className={compact ? "w-full" : "w-full max-w-2xl"}>
      <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/3 p-2 shadow-2xl shadow-black/20 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
          <GitBranch className="size-5 shrink-0 text-zinc-400" aria-hidden="true" />
          <Input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="github.com/owner/repo"
            aria-label="GitHub repository URL"
            className="h-11 border-0 bg-transparent px-0 font-mono text-sm shadow-none focus-visible:ring-0"
          />
        </div>
        <Button type="submit" size="lg" disabled={loading || !value.trim()} className="h-11 bg-blue-500 px-5 text-white hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-40" >
          {loading ? "Analyzing..." : "Analyze"}
          {!loading && <ArrowRight className="size-4" aria-hidden="true" />}
        </Button>
      </div>
    </form>
  );
}

function DashboardPreview() {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#111216] text-left shadow-2xl shadow-black/30">
      <div className="flex h-10 items-center gap-2 border-b border-white/10 px-4">
        <span className="size-2 rounded-full bg-zinc-600" />
        <span className="size-2 rounded-full bg-zinc-600" />
        <span className="size-2 rounded-full bg-zinc-600" />
        <div className="ml-3 h-5 w-44 rounded bg-white/5" />
      </div>
      <div className="grid min-h-80 grid-cols-[110px_1fr] sm:min-h-96 sm:grid-cols-[150px_1fr]">
        <aside className="border-r border-white/10 p-3 text-[10px] text-zinc-500 sm:p-4 sm:text-xs">
          <div className="mb-6 flex items-center gap-1.5 text-zinc-300">
            <GitBranch className="size-3" />
            <span className="truncate font-mono">acme/web</span>
          </div>
          {["Overview", "Files", "Architecture", "Trust", "Report"].map((item, index) => (
            <div key={item} className={`mb-1 rounded-md px-2 py-1.5 ${index === 0 ? "bg-white/10 text-white" : ""}`}>
              {item}
            </div>
          ))}
        </aside>
        <div className="p-4 sm:p-7">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-xs text-zinc-500">Review overview</p>
              <p className="mt-1 text-sm font-medium text-white sm:text-base">What needs your attention</p>
            </div>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 font-mono text-[10px] text-emerald-300">83 / 100</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {[["Health", "83"], ["Files", "24"], ["Critical", "3"], ["Confidence", "0.89"]].map(([label, score]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/2.5 p-2.5 sm:p-3">
                <p className="text-[9px] text-zinc-500 sm:text-[10px]">{label}</p>
                <p className="mt-1 font-mono text-base text-white sm:text-lg">{score}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-white/10 bg-white/2.5 p-3 sm:mt-5 sm:p-4">
            <div className="mb-3 flex items-center justify-between text-[10px] text-zinc-400">
              <span>FIX FIRST</span><span>3 findings</span>
            </div>
            {["Missing authorization boundary", "Request retries can duplicate writes", "Shared state escapes module"].map((item, index) => (
              <div key={item} className="flex items-center gap-2 border-t border-white/5 py-2 text-[10px] text-zinc-300 first:border-0 sm:text-xs">
                <span className={`size-1.5 rounded-full ${index === 0 ? "bg-red-400" : index === 1 ? "bg-amber-400" : "bg-yellow-300"}`} />
                <span className="truncate">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [repository, setRepository] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function continueToDashboard(event) {
    event.preventDefault();
    const trimmedRepository = repository.trim();
    if (!trimmedRepository) return;

    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo_url: trimmedRepository }),
      });
      const contentType = res.headers.get("content-type") ?? "";
      const payload = contentType.includes("application/json") ? await res.json() : await res.text();
      if (!res.ok) throw new Error(typeof payload === "string" ? payload : JSON.stringify(payload));

      sessionStorage.setItem("reviewforge-analysis", JSON.stringify({ repository: trimmedRepository, response: payload }));
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#09090b] text-zinc-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-152 bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.16),transparent_62%)]" />
      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8">
        <header className="flex h-20 items-center justify-between border-b border-white/10">
          <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight text-white" aria-label="ReviewForge home">
            <span className="grid size-8 place-items-center rounded-lg bg-blue-500 text-white"><BrainCircuit className="size-4" /></span>
            ReviewForge
          </Link>
          <Link href="/login" className="text-sm text-zinc-400 transition-colors hover:text-white">Sign in</Link>
        </header>

        <section className="flex flex-col items-center pb-24 pt-24 text-center sm:pb-32 sm:pt-32">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-xs font-medium text-blue-200">
            <Sparkles className="size-3.5" />
            Reviews that show their work
          </div>
          <h1 className="max-w-4xl text-balance text-4xl font-semibold tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
            AI code review that grades its own work before you see it.
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-zinc-400 sm:text-lg">
            ReviewForge reasons across your repository, evaluates the quality of every finding, and gives you a report you can trust.
          </p>
          <div className="mt-10 w-full max-w-2xl">
            <RepositoryInput value={repository} onChange={setRepository} onSubmit={continueToDashboard} loading={loading} />
            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-500">
              <span>Try an example:</span>
              {examples.map((example) => (
                <button key={example} type="button" onClick={() => setRepository(example)} className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-zinc-400 transition-colors hover:border-white/20 hover:bg-white/5 hover:text-zinc-200">
                  {example}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="grid border-y border-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, description, featured }) => (
            <article key={title} className={`border-white/10 px-6 py-7 sm:border-r sm:last:border-r-0 lg:px-7 ${featured ? "bg-blue-400/[0.035]" : ""}`}>
              <Icon className={`mb-4 size-5 ${featured ? "text-blue-300" : "text-zinc-400"}`} strokeWidth={1.5} />
              <h2 className="text-sm font-medium text-zinc-100">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-500">{description}</p>
            </article>
          ))}
        </section>

        <section className="grid items-center gap-12 py-24 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 sm:py-32">
          <div>
            <p className="text-sm font-medium text-blue-300">A review you can inspect</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">See what matters. Understand why it matters.</h2>
            <p className="mt-5 max-w-md text-base leading-7 text-zinc-400">From the first critical issue to the final report, ReviewForge makes its analysis clear, prioritized, and ready to act on.</p>
            <div className="mt-7 space-y-3">
              {["Repository-level context, not isolated comments", "Priorities ranked across every reviewed file", "Confidence and evaluator evidence alongside findings"].map((point) => (
                <p key={point} className="flex gap-3 text-sm text-zinc-300"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-blue-300" />{point}</p>
              ))}
            </div>
          </div>
          <DashboardPreview />
        </section>

        <section className="mb-16 rounded-2xl border border-white/10 bg-linear-to-br from-blue-500/10 to-transparent px-6 py-12 text-center sm:mb-24 sm:px-12 sm:py-16">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">Ready to see your codebase clearly?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-400">Start with a public GitHub repository. Your review will show every stage of its reasoning.</p>
          <div className="mx-auto mt-7 max-w-2xl"><RepositoryInput value={repository} onChange={setRepository} onSubmit={continueToDashboard} loading={loading} compact /></div>
        </section>
      </div>
    </main>
  );
}
