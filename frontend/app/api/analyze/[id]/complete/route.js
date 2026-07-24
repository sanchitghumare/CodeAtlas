import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "../../../auth/[...nextauth]/route";
import { analysisErrorMessage, recoverStaleAnalyses } from "@/lib/analysis-lifecycle";
import ConnectDb from "@/lib/mongodb";
import Analysis from "@/models/analysis";
import User from "@/models/user";

async function failAnalysis(analysis, payload) {
  const error = analysisErrorMessage(payload);
  analysis.status = "Failed";
  analysis.error = error;
  analysis.completedAt = new Date();
  await analysis.save();
  return NextResponse.json({ error }, { status: 500 });
}

export async function POST(_request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ConnectDb();
  await recoverStaleAnalyses();
  const user = await User.findOne({ email: session.user.email }).select("_id");
  const { id: jobId } = await params;
  const analysis = await Analysis.findOne({ jobId, user: user?._id });
  if (!analysis) return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
  if (analysis.status === "Completed") return NextResponse.json(analysis);
  if (analysis.status === "Failed") return NextResponse.json({ error: analysis.error || "Analysis failed." }, { status: 500 });

  try {
    const result = await fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL}/review/analyze/${jobId}/result`, { cache: "no-store", headers: { "X-Internal-Token": process.env.INTERNAL_API_TOKEN } });
    if (!result.ok) {
      const payload = await result.json().catch(() => ({}));
      return failAnalysis(analysis, payload);
    }
    analysis.response = await result.json();
    analysis.status = "Completed";
    analysis.error = null;
    analysis.completedAt = new Date();
    await analysis.save();
    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Unable to persist completed analysis", error);
    return failAnalysis(analysis, { error: "Unable to retrieve the completed analysis." });
  }
}
