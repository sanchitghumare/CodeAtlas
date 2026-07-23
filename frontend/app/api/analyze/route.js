import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import ConnectDb from "@/lib/mongodb";
import User from "@/models/user";
import Analysis from "@/models/analysis";
import { randomUUID } from "crypto";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await ConnectDb();
        const user = await User.findOne({ email: session.user.email }).select("_id");

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const analyses = await Analysis.find({ user: user._id })
            .sort({ createdAt: -1 })
            .limit(10)
            .select("repository createdAt status response.reviews.score")
            .lean();

        const recentAnalyses = analyses.map((analysis) => {
            const scores = analysis.response?.reviews
                ?.map((review) => review.score)
                .filter(Number.isFinite) || [];

            return {
                id: analysis._id.toString(),
                repository: analysis.repository,
                date: analysis.createdAt,
                status: analysis.status,
                score: scores.length
                    ? Math.round(scores.reduce((total, score) => total + score, 0) / scores.length)
                    : null,
            };
        });

        return NextResponse.json(recentAnalyses);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req) {
    let analysis;
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

        const jobId = randomUUID();
        analysis = await Analysis.create({
            user: user._id,
            repository: repo_url.split("/").pop(),
            repoUrl: repo_url,
            jobId,
            status: "In Progress",
        });

        const fastApiResponse = await fetch(
            `${process.env.NEXT_PUBLIC_FASTAPI_URL}/review/analyze/start`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    repo_url,
                    job_id: jobId,
                }),
            }
        );

        if (!fastApiResponse.ok) {
            await Analysis.findByIdAndUpdate(analysis._id, { status: "Failed" });
            const payload = await fastApiResponse.text();
            return NextResponse.json(
                { error: payload },
                { status: fastApiResponse.status }
            );
        }
        return NextResponse.json({
            analysisId: analysis._id,
            jobId,
        });
    } catch (err) {
        console.error(err);
        if (analysis?._id) {
            await Analysis.findByIdAndUpdate(analysis._id, { status: "Failed" });
        }

        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
