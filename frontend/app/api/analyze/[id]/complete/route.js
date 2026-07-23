import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import User from "@/models/user";
import Analysis from "@/models/analysis";
import ConnectDb from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function POST(_request, { params }) {
  console.log("Complete request received");
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ConnectDb();
  const user = await User.findOne({ email: session.user.email }).select("_id");
  const { id: jobId } = await params;
  console.log(`Loading analysis for job ${jobId}`);
  const analysis = await Analysis.findOne({ jobId, user: user?._id });
  if (!analysis) return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
  if (analysis.status === "Completed") return NextResponse.json(analysis);

  console.log(`Fetching completed result for job ${jobId}`);
  const result = await fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL}/review/analyze/${jobId}/result`, { cache: "no-store" });
  if (!result.ok) return NextResponse.json({ error: "Analysis is not complete" }, { status: 409 });
  console.log(`Result received; saving analysis ${analysis._id}`);
  analysis.response = await result.json();
  analysis.status = "Completed";
  await analysis.save();
  console.log(`Analysis saved: ${analysis._id}`);
  return NextResponse.json(analysis);
}
