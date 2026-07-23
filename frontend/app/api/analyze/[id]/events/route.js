import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import User from "@/models/user";
import Analysis from "@/models/analysis";
import ConnectDb from "@/lib/mongodb";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  console.log("SSE proxy request received");
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ConnectDb();
  const user = await User.findOne({ email: session.user.email }).select("_id");
  const { id: jobId } = await params;
  console.log(`Opening upstream SSE connection for job ${jobId}`);
  const analysis = await Analysis.findOne({ jobId, user: user?._id, status: "In Progress" }).select("_id status");
  if (!analysis) return NextResponse.json({ error: "Analysis not found" }, { status: 404 });

  const upstream = await fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL}/review/analyze/${jobId}/events`, { cache: "no-store" });
  if (!upstream.ok || !upstream.body) return NextResponse.json({ error: "Progress stream unavailable" }, { status: upstream.status });
  console.log(`Upstream SSE connection opened for job ${jobId}`);

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
