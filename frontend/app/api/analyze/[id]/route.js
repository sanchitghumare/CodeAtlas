import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import User from "@/models/user";
import Analysis from "@/models/analysis";
import ConnectDb from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { recoverStaleAnalyses } from "@/lib/analysis-lifecycle";

export async function GET(req, { params }) {
  await ConnectDb();
  await recoverStaleAnalyses();

  const session = await getServerSession(authOptions);
  const { id } = await params;

  let analysis;
  if (session?.user?.email) {
    const user = await User.findOne({ email: session.user.email });
    analysis = await Analysis.findOne({ _id: id, user: user?._id });
  } else {
    analysis = await Analysis.findOne({ _id: id, user: null });
  }

  if (!analysis) {
    return NextResponse.json(
      { error: "Analysis not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(analysis);
}
