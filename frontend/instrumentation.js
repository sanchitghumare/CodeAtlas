export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const [{ default: ConnectDb }, { recoverStaleAnalyses }] = await Promise.all([
    import("@/lib/mongodb"),
    import("@/lib/analysis-lifecycle"),
  ]);
  await ConnectDb();
  await recoverStaleAnalyses();
}
