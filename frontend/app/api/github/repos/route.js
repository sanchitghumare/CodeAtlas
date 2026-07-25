import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getInstallationToken } from "@/lib/githubApp";
import ConnectDb from "@/lib/mongodb";
import User from "@/models/user";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await ConnectDb();

    const user = await User.findOne({
      email: session.user.email,
    });

    if (!user?.githubInstallationId) {
      return NextResponse.json(
        { error: "GitHub App not installed" },
        { status: 400 }
      );
    }
    const token = await getInstallationToken(user.githubInstallationId);
    const githubResponse = await fetch(
      "https://api.github.com/installation/repositories?per_page=100",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
        cache: "no-store",
      }
    );

    if (!githubResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch repositories" },
        { status: githubResponse.status }
      );
    }

    const { repositories } = await githubResponse.json();
    const sorted = (repositories ?? []).sort(
      (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
    );
    return NextResponse.json(sorted);
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}