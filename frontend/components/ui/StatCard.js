export default function StatCard({ label, value, hint, icon: Icon }) {
    return (
        <div className="group relative overflow-hidden rounded-lg bg-blue-600
               hover:bg-blue-500 border border-white/10  p-5 transition-colors hover:border-white/20">
            <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-zinc-400">{label}</p>
                <span className="grid size-8 place-items-center rounded-lg bg-white/5 text-zinc-400 border border-white/10">
                    <Icon className="size-4" />
                </span>
            </div>
            <p className="mt-4 text-2xl font-semibold tracking-tight text-white">
                {value}
            </p>
            <p className="mt-1 text-xs text-zinc-500">{hint}</p>
        </div>
    );
}
