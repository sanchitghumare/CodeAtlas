import { useState } from "react";
import { Check, Minus, Plus } from "lucide-react";

function severityColor(severity) {
  const s = severity ? severity.toLowerCase() : "";
  if (s.includes("high") || s.includes("critical"))
    return "bg-red-500/15 text-red-400 border border-red-500/20";
  if (s.includes("medium") || s.includes("moderate"))
    return "bg-amber-500/15 text-amber-400 border border-amber-500/20";
  return "bg-zinc-800 text-zinc-300 border border-zinc-700";
}
export default function FileReviewCard({ review }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-white/10 rounded-xl bg-[#111216] overflow-hidden transition-colors hover:border-white/20">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-white/2 transition-colors"
      >
        <div className="min-w-0">
          <p className="font-mono text-sm text-zinc-200 truncate">
            {review.path}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            {review.issues.length} issue
            {review.issues.length === 1 ? "" : "s"} &middot;{" "}
            {review.strengths.length} strength
            {review.strengths.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span
            className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-full border ${scoreColor(
              review.score
            )}`}
          >
            {review.score} / 100
          </span>
          <span className="text-zinc-500 text-sm">
            {open ? <Minus className="size-4" /> : <Plus className="size-4" />}
          </span>
        </div>
      </button>

      {open && (
        <div className="border-t border-white/10 px-4 py-4 space-y-4 bg-zinc-950/50">
          {review.strengths && review.strengths.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                Strengths
              </p>
              <ul className="space-y-1.5">
                {review.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-zinc-300 flex gap-2">
                    <Check className="size-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {review.issues && review.issues.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                Issues
              </p>
              <div className="space-y-2">
                {review.issues.map((issue, i) => (
                  <div
                    key={i}
                    className="border border-white/10 rounded-lg bg-[#111216] p-3 text-xs"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded ${severityColor(
                          issue.severity
                        )}`}
                      >
                        {issue.severity}
                      </span>
                      <span className="text-[11px] font-mono text-zinc-500">
                        {issue.category}
                      </span>
                    </div>
                    <p className="text-zinc-200 leading-relaxed">
                      {issue.description}
                    </p>
                    <p className="text-zinc-400 mt-2 pt-2 border-t border-white/5">
                      <span className="font-medium text-blue-400">Fix: </span>
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