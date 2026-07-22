import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import User from "@/models/user";
import Analysis from "@/models/analysis";
import ConnectDb from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  await ConnectDb();

  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await User.findOne({ email: session.user.email });

  const { id } = await params;

  const analysis = await Analysis.findOne({
    _id: id,
    user: user._id,
  });

  if (!analysis) {
    return NextResponse.json(
      { error: "Analysis not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(analysis);
}