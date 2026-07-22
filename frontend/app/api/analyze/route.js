import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import ConnectDb from "@/lib/mongodb";
import User from "@/models/user";
import Analysis from "@/models/analysis";

export async function POST(req) {
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

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }
        const { repo_url } = await req.json();

        if (!repo_url) {
            return NextResponse.json(
                { error: "Repository URL is required" },
                { status: 400 }
            );
        }

        const fastApiResponse = await fetch(
            "http://127.0.0.1:8000/review/analyze",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    repo_url,
                }),
            }
        );

        const contentType =
            fastApiResponse.headers.get("content-type") || "";

        const payload = contentType.includes("application/json")
            ? await fastApiResponse.json()
            : await fastApiResponse.text();

        if (!fastApiResponse.ok) {
            return NextResponse.json(
                { error: payload },
                { status: fastApiResponse.status }
            );
        }

        const analysis = await Analysis.create({
            user: user._id,
            repository: repo_url.split("/").pop(),
            repoUrl: repo_url,
            response: payload,
        });
        console.log("Saved analysis:", analysis._id);
        return NextResponse.json({
            analysisId: analysis._id,
        });
    } catch (err) {
        console.error(err);

        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}