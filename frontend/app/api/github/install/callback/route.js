import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import ConnectDb from "@/lib/mongodb";
import User from "@/models/user";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const installationId = new URL(req.url).searchParams.get("installation_id");
  if (installationId) {
    await ConnectDb();
    await User.findOneAndUpdate(
      { email: session.user.email },
      { githubInstallationId: installationId }
    );
  }

  return NextResponse.redirect(new URL("/dashboard", req.url));
}