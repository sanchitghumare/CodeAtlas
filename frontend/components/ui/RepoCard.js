import { Lock, Globe2, Star, GitFork, Loader2, Sparkles } from "lucide-react";
export default function RepoCard({ repo, onAnalyze, analyzing }) {
    const LANGUAGE_COLORS = {
        JavaScript: "bg-yellow-400",
        TypeScript: "bg-blue-400",
        Python: "bg-emerald-400",
        Go: "bg-cyan-400",
        Rust: "bg-orange-400",
        HCL: "bg-purple-400",
        default: "bg-zinc-500",
    };
    const dot = LANGUAGE_COLORS[repo.language] || LANGUAGE_COLORS.default;

    return (
        <div className="group flex flex-col justify-between rounded-xl border border-white/10 bg-[#111216] p-6  hover:border-zinc-600
        hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <div>
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="truncate font-semibold text-base text-zinc-100">
                                {repo.name}
                            </p>
                            <span
                                className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${repo.isPrivate
                                    ? "text-zinc-400 border-white/10 bg-white/5"
                                    : "text-blue-400 border-blue-500/20 bg-blue-500/10"
                                    }`}
                            >
                                {repo.isPrivate ? (
                                    <Lock className="size-2.5" />
                                ) : (
                                    <Globe2 className="size-2.5" />
                                )}
                                {repo.isPrivate ? "Private" : "Public"}
                            </span>
                        </div>
                        <p className="mt-1 text-xs text-zinc-500 truncate">
                            {repo.fullName}
                        </p>
                    </div>
                </div>

                <p className="mt-3 text-sm text-zinc-400 leading-relaxed line-clamp-2">
                    {repo.description}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-500">
                    <span className="inline-flex items-center gap-1.5">
                        <span className={`size-2 rounded-full ${dot}`} />
                        {repo.language}
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <Star className="size-3.5" />
                        {repo.stars.toLocaleString()}
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <GitFork className="size-3.5" />
                        {repo.forks.toLocaleString()}
                    </span>
                    <span>
                        Updated{" "}
                        {new Date(repo.updatedAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                        })}
                    </span>
                </div>
            </div>

            <button
                onClick={onAnalyze}
                disabled={analyzing}
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {analyzing ? (
                    <>
                        <Loader2 className="size-3.5 animate-spin" />
                        Reviewing...

                    </>
                ) : (
                    <>

                        Analyze →
                    </>
                )}
            </button>
        </div>
    );
}