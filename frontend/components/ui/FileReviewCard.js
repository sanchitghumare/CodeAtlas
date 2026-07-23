import { useState } from "react";
import { CheckCircle2, ChevronDown, Wrench } from "lucide-react";

const scoreClass = (score) => score >= 80 ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : score >= 50 ? "border-amber-500/30 bg-amber-500/10 text-amber-300" : "border-rose-500/30 bg-rose-500/10 text-rose-300";
const severityClass = (severity = "") => /critical|high/i.test(severity) ? "border-rose-500/25 bg-rose-500/10 text-rose-300" : /medium|moderate/i.test(severity) ? "border-amber-500/25 bg-amber-500/10 text-amber-300" : "border-sky-500/25 bg-sky-500/10 text-sky-300";

export default function FileReviewCard({ review }) {
  const [open, setOpen] = useState(false);
  const issues = review.issues || [];
  const strengths = review.strengths || [];
  return <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] transition hover:border-white/20">
    <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center justify-between gap-4 p-4 text-left transition hover:bg-white/[0.035] sm:p-5">
      <div className="min-w-0"><p className="truncate font-mono text-sm font-medium text-zinc-100">{review.path}</p><p className="mt-1 text-xs text-zinc-500">{issues.length} {issues.length === 1 ? "issue" : "issues"} · {strengths.length} {strengths.length === 1 ? "strength" : "strengths"}</p></div>
      <div className="flex shrink-0 items-center gap-3"><span className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${scoreClass(review.score)}`}>{review.score}/100</span><ChevronDown className={`size-4 text-zinc-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`} /></div>
    </button>
    <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}><div className="overflow-hidden"><div className="grid gap-6 border-t border-white/10 bg-black/15 p-4 sm:grid-cols-2 sm:p-5">
      <div><p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-300">Strengths</p>{strengths.length ? <ul className="space-y-2.5">{strengths.map((strength, index) => <li key={index} className="flex gap-2 text-sm leading-5 text-zinc-300"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />{strength}</li>)}</ul> : <p className="text-sm text-zinc-500">No strengths were highlighted.</p>}</div>
      <div><p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300">Issues & fixes</p>{issues.length ? <div className="space-y-3">{issues.map((issue, index) => <div key={index} className="rounded-xl border border-white/10 bg-white/[0.035] p-3.5"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${severityClass(issue.severity)}`}>{issue.severity || "Info"}</span>{issue.category && <span className="text-xs text-zinc-500">{issue.category}</span>}</div><p className="mt-2 text-sm leading-5 text-zinc-200">{issue.description}</p>{issue.suggestion && <p className="mt-3 border-t border-white/10 pt-3 text-sm leading-5 text-zinc-400"><Wrench className="mr-1.5 inline size-3.5 text-indigo-300" /><span className="font-medium text-indigo-200">Fix: </span>{issue.suggestion}</p>}</div>)}</div> : <p className="flex items-center gap-2 text-sm text-emerald-300"><CheckCircle2 className="size-4" />No issues found in this file.</p>}</div>
    </div></div></div>
  </article>;
}
