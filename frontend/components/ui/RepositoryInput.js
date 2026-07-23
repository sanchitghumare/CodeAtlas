import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, GitBranch } from "lucide-react";
export default function RepositoryInput({ value, onChange, onSubmit, loading, compact = false }) {
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