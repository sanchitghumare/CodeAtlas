"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import FileReviewCard from "@/components/ui/FileReviewCard";
function scoreColor(score) {
  if (score >= 80)
    return "text-emerald-400 border-emerald-500/20 bg-emerald-500/10";
  if (score >= 50)
    return "text-amber-400 border-amber-500/20 bg-amber-500/10";
  return "text-red-400 border-red-500/20 bg-red-500/10";
}
function Tag({ label }) {
    return (
        <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-zinc-300 border border-white/10 font-mono">
            {label}
        </span>
    );
}
export default function AnalysisPage() {
    const { id } = useParams();

    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAnalysis() {
            try {
                const res = await fetch(`/api/analyze/${id}`);
                const data = await res.json();

                setAnalysis(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        fetchAnalysis();
    }, [id]);
    const response = analysis?.response;
    const repository = analysis?.repository;

    if (loading) return <p>Loading...</p>;

    if (!analysis) return <p>Analysis not found.</p>;
    const avgScore =
        response && response.reviews && response.reviews.length > 0
            ? Math.round(
                response.reviews.reduce((sum, r) => sum + r.score, 0) /
                response.reviews.length
            )
            : null;
    return (
        <div>
            <Link href="/dashboard">
                ← Back to Dashboard
            </Link>
            {response && (
                <div className="mt-16 space-y-8">
                    <div className="flex items-center gap-3 border-t border-white/10 pt-10">
                        <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-400">
                            Analysis Report{repository ? ` — ${repository}` : ""}
                        </h2>
                    </div>

                    {response.summary && (
                        <section className="border border-white/10 rounded-xl bg-[#111216] p-6 shadow-xl">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-[10px] uppercase font-mono tracking-wider text-blue-400 mb-1">
                                        {response.summary.project_type}
                                    </p>
                                    <p className="text-zinc-200 text-sm leading-relaxed">
                                        {response.summary.purpose}
                                    </p>
                                </div>
                                {avgScore !== null && (
                                    <span
                                        className={`shrink-0 text-base font-mono font-semibold px-3 py-1.5 rounded-full border ${scoreColor(
                                            avgScore
                                        )}`}
                                    >
                                        {avgScore} / 100
                                    </span>
                                )}
                            </div>

                            <p className="text-xs text-zinc-400 mt-4 leading-relaxed">
                                {response.summary.architecture}
                            </p>

                            <div className="flex flex-wrap gap-2 mt-5">
                                {response.summary.languages?.map((l) => (
                                    <Tag key={l} label={l} />
                                ))}
                                {response.summary.frameworks?.map((f) => (
                                    <Tag key={f} label={f} />
                                ))}
                            </div>
                        </section>
                    )}

                    {response.reviews && response.reviews.length > 0 && (
                        <section>
                            <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-3">
                                File Reviews ({response.reviews.length})
                            </h2>
                            <div className="space-y-3">
                                {response.reviews.map((review) => (
                                    <FileReviewCard key={review.path} review={review} />
                                ))}
                            </div>
                        </section>
                    )}

                    {response.final_report && (
                        <section className="border border-white/10 rounded-xl bg-[#111216] p-6 shadow-xl">
                            <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-3">
                                Final Report
                            </h2>
                            <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed font-mono bg-zinc-950/50 p-4 rounded-lg border border-white/5">
                                {response.final_report}
                            </p>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}