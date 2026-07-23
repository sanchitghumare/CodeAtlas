"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BrainCircuit, Check, ChevronRight, FileSearch, GitBranch, ShieldCheck, Sparkles } from "lucide-react";
import RepositoryInput from "@/components/ui/RepositoryInput";

const examples = ["vercel/next.js", "facebook/react", "shadcn-ui/ui"];

const features = [
  { icon: FileSearch, title: "Review the connected code", description: "Findings are grounded in the files, dependencies, and patterns already in your repository." },
  { icon: GitBranch, title: "Follow the architecture", description: "Trace risks across modules instead of treating every file as an isolated review." },
  { icon: ShieldCheck, title: "Prioritize what matters", description: "Surface security, reliability, and maintainability work with a concrete next step." },
];

function TerminalPreview() {
  return (
    <div className="border border-[#30363D] bg-[#161B22] text-left shadow-sm">
      <div className="flex h-10 items-center gap-2 border-b border-[#30363D] px-4 text-xs text-[#8B949E]">
        <span className="size-2 rounded-full bg-[#DA3633]" />
        <span className="size-2 rounded-full bg-[#D29922]" />
        <span className="size-2 rounded-full bg-[#238636]" />
        <span className="ml-2 font-mono">reviewforge — analysis</span>
      </div>
      <div className="space-y-3 p-5 font-mono text-xs leading-6 sm:p-6 sm:text-sm">
        <p><span className="text-[#3B82F6]">$</span> reviewforge analyze github.com/acme/payments</p>
        <p className="text-[#8B949E]">Connecting repository…</p>
        <p><span className="text-[#238636]">✓</span> 28 files mapped</p>
        <p><span className="text-[#238636]">✓</span> 14 files reviewed</p>
        <p><span className="text-[#D29922]">!</span> 3 cross-file risks identified</p>
        <div className="mt-5 border-t border-[#30363D] pt-4">
          <p className="text-[#F0F6FC]">Review ready</p>
          <p className="mt-1 text-[#8B949E]">2 high priority findings · 6 improvements</p>
        </div>
      </div>
    </div>
  );
}

function DiffPreview() {
  return (
    <div className="overflow-hidden border border-[#30363D] bg-[#161B22]">
      <div className="flex items-center justify-between border-b border-[#30363D] px-4 py-3 text-xs">
        <span className="font-mono text-[#F0F6FC]">actions/createPayment.ts</span>
        <span className="text-[#8B949E]">ReviewForge finding</span>
      </div>
      <div className="overflow-x-auto font-mono text-xs leading-6 sm:text-sm">
        <div className="min-w-145 p-4">
          <div className="grid grid-cols-[28px_1fr] text-[#8B949E]"><span>41</span><code>export async function createPayment(input) &#123;</code></div>
          <div className="grid grid-cols-[28px_1fr] bg-[#238636]/15 text-[#d8f5df]"><span className="text-[#8B949E]">42</span><code>+  const user = await getCurrentUser();</code></div>
          <div className="grid grid-cols-[28px_1fr] bg-[#DA3633]/15 text-[#ffd8d5]"><span className="text-[#8B949E]">43</span><code>-  return db.payment.create(&#123; data: input &#125;);</code></div>
          <div className="grid grid-cols-[28px_1fr] bg-[#238636]/15 text-[#d8f5df]"><span className="text-[#8B949E]">43</span><code>+  return db.payment.create(&#123; data: &#123; ...input, userId: user.id &#125; &#125;);</code></div>
          <div className="grid grid-cols-[28px_1fr] text-[#8B949E]"><span>44</span><code>&#125;</code></div>
        </div>
      </div>
      <div className="border-t border-[#30363D] px-4 py-4">
        <div className="flex gap-3">
          <span className="mt-1 size-2 shrink-0 rounded-full bg-[#D29922]" />
          <div><p className="text-sm font-medium text-[#F0F6FC]">Verify ownership before creating the record.</p><p className="mt-1 text-sm leading-6 text-[#8B949E]">The previous implementation accepted a caller-controlled user ID. Enforce the authenticated identity at this boundary to prevent cross-account writes.</p></div>
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
    <main className="min-h-screen bg-[#0D1117] text-[#F0F6FC]">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <header className="flex h-16 items-center justify-between border-b border-[#30363D]">
          <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight" aria-label="ReviewForge home">
            <span className="grid size-7 place-items-center rounded-md bg-[#3B82F6] text-white"><BrainCircuit className="size-4" /></span>
            <span>ReviewForge</span>
          </Link>
          <Link href="/login" className="text-sm text-[#8B949E] transition-colors hover:text-[#F0F6FC]">Sign in</Link>
        </header>

        <section className="grid gap-12 py-18 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:py-28">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-[#3B82F6]">Code review for the codebase, not just the diff.</p>
            <h1 className="mt-5 text-balance text-4xl font-semibold tracking-[-0.045em] sm:text-6xl lg:text-[4.2rem] lg:leading-[1.02]">Find the change that matters before it becomes an incident.</h1>
            <p className="mt-6 max-w-xl text-pretty text-base leading-7 text-[#8B949E] sm:text-lg">ReviewForge analyzes your repository, connects findings across files, and gives you a report that is ready for an engineering decision.</p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a href="#analyze" className="inline-flex h-10 items-center gap-2 rounded-md bg-[#3B82F6] px-4 text-sm font-medium text-white transition-colors hover:bg-[#2563EB]">Analyze Repository <ArrowRight className="size-4" /></a>
              <a href="#sample-review" className="inline-flex h-10 items-center gap-2 rounded-md border border-[#30363D] px-4 text-sm font-medium text-[#F0F6FC] transition-colors hover:bg-[#161B22]">View Demo <ChevronRight className="size-4" /></a>
            </div>
            <p className="mt-5 text-sm text-[#8B949E]">Public GitHub repositories supported.</p>
          </div>
          <TerminalPreview />
        </section>

        <section className="border-y border-[#30363D] py-16 sm:py-20">
          <div className="max-w-xl"><p className="text-sm font-medium text-[#3B82F6]">How it works</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">A review with a clear path to action.</h2></div>
          <div className="mt-12 grid gap-8 md:grid-cols-3 md:gap-12">
            {[['01', 'Connect repository', 'Paste a GitHub repository URL and start an analysis.'], ['02', 'Analyze the codebase', 'ReviewForge maps files, dependencies, and repository-level patterns.'], ['03', 'Use the report', 'Review prioritized findings, inspect the evidence, and decide what to fix.']].map(([number, title, description]) => <div key={number} className="border-t border-[#30363D] pt-5"><p className="font-mono text-xs text-[#3B82F6]">{number}</p><h3 className="mt-5 text-base font-medium">{title}</h3><p className="mt-2 text-sm leading-6 text-[#8B949E]">{description}</p></div>)}
          </div>
        </section>

        <section className="py-20 sm:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
            <div><p className="text-sm font-medium text-[#3B82F6]">What it looks for</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">Useful feedback starts with context.</h2><p className="mt-5 text-base leading-7 text-[#8B949E]">A good review should explain what changed, why it matters, and where the risk travels next.</p></div>
            <div className="divide-y divide-[#30363D] border-y border-[#30363D]">{features.map(({ icon: Icon, title, description }) => <article key={title} className="grid grid-cols-[32px_1fr] gap-4 py-5"><Icon className="mt-0.5 size-4 text-[#3B82F6]" /><div><h3 className="text-sm font-medium">{title}</h3><p className="mt-1 text-sm leading-6 text-[#8B949E]">{description}</p></div></article>)}</div>
          </div>
        </section>

        <section id="sample-review" className="scroll-mt-8 border-y border-[#30363D] py-16 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start lg:gap-16">
            <div><p className="text-sm font-medium text-[#3B82F6]">Sample review</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">Comments that explain the impact.</h2><p className="mt-5 text-base leading-7 text-[#8B949E]">Every finding should point to the code, explain the consequence, and suggest a safe direction—not just flag a line.</p><ul className="mt-7 space-y-3 text-sm text-[#8B949E]"><li className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0 text-[#238636]" />Grounded in the repository analysis</li><li className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0 text-[#238636]" />Ranked by severity and scope</li><li className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0 text-[#238636]" />Written for a human review workflow</li></ul></div>
            <DiffPreview />
          </div>
        </section>

        <section className="py-20 sm:py-28">
          <div className="max-w-2xl"><p className="text-sm font-medium text-[#3B82F6]">Why teams use it</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">More signal before review time gets expensive.</h2></div>
          <div className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-3"><div><h3 className="text-base font-medium">Faster triage</h3><p className="mt-2 text-sm leading-6 text-[#8B949E]">Start from the most consequential work instead of reading every file with equal weight.</p></div><div><h3 className="text-base font-medium">Architectural insight</h3><p className="mt-2 text-sm leading-6 text-[#8B949E]">See how local decisions affect boundaries, dependencies, and shared behavior.</p></div><div><h3 className="text-base font-medium">Security context</h3><p className="mt-2 text-sm leading-6 text-[#8B949E]">Identify risky trust boundaries and data flows before they make it into production.</p></div></div>
        </section>

        <section id="analyze" className="scroll-mt-8 border-t border-[#30363D] py-16 text-center sm:py-24">
          <p className="text-sm font-medium text-[#3B82F6]">Start a review</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-balance text-3xl font-semibold tracking-[-0.03em]">Bring context to your next code review.</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#8B949E]">Paste a public GitHub repository to generate a focused codebase report.</p>
          <div className="mx-auto mt-8 max-w-2xl text-left"><RepositoryInput value={repository} onChange={setRepository} onSubmit={continueToDashboard} loading={loading} compact />{error && <p className="mt-3 text-sm text-[#DA3633]">{error}</p>}<div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-[#8B949E]"><span>Try:</span>{examples.map((example) => <button key={example} type="button" onClick={() => setRepository(example)} className="border border-[#30363D] px-2 py-1 font-mono transition-colors hover:bg-[#161B22] hover:text-[#F0F6FC]">{example}</button>)}</div></div>
        </section>
      </div>
    </main>
  );
}
