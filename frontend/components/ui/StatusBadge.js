export default function StatusBadge({ status }) {
  const map = {
    Completed: {
      cls: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
      Icon: CheckCircle2,
    },
    "In Progress": {
      cls: "text-blue-400 border-blue-500/20 bg-blue-500/10",
      Icon: Loader2,
    },
    Failed: {
      cls: "text-red-400 border-red-500/20 bg-red-500/10",
      Icon: XCircle,
    },
  };
  const { cls, Icon } = map[status] || map.Completed;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${cls}`}
    >
      <Icon className={`size-3 ${status === "In Progress" ? "animate-spin" : ""}`} />
      {status}
    </span>
  );
}