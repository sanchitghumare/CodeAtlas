import Analysis from "@/models/analysis";

const staleTimeoutMs = Number(process.env.STALE_JOB_TIMEOUT_MS || 30 * 60 * 1000);

export async function recoverStaleAnalyses() {
  const cutoff = new Date(Date.now() - staleTimeoutMs);
  return Analysis.updateMany(
    { status: "In Progress", startedAt: { $lt: cutoff } },
    {
      $set: {
        status: "Failed",
        error: "Analysis timed out before completion. Please run it again.",
        completedAt: new Date(),
      },
    }
  );
}

export function analysisErrorMessage(payload, fallback = "Analysis failed unexpectedly. Please try again.") {
  const detail = typeof payload === "string" ? payload : payload?.detail || payload?.error || "";
  const message = String(detail).toLowerCase();
  if (message.includes("clone")) return "Unable to clone the repository. Check the URL and network access.";
  if (message.includes("ai analysis")) return "AI analysis timed out. Please try again.";
  if (message.includes("timeout") || message.includes("timed out")) return "Analysis timed out. Please try again.";
  if (message.includes("evaluation")) return "Evaluation failed. Please try again.";
  return fallback;
}
