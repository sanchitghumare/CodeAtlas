import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

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

    if (!user?.githubAccessToken) {
      return NextResponse.json(
        { error: "GitHub token not found" },
        { status: 400 }
      );
    }

    const githubResponse = await fetch(
      "https://api.github.com/user/repos?sort=updated&per_page=100",
      {
        headers: {
          Authorization: `Bearer ${user.githubAccessToken}`,
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

    const repos = await githubResponse.json();

    return NextResponse.json(repos);
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}