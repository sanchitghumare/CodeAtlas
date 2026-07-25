import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import ConnectDb from "@/lib/mongodb";
import User from "@/models/user";
import Analysis from "@/models/analysis";
import { randomUUID } from "crypto";
import { recoverStaleAnalyses } from "@/lib/analysis-lifecycle";

function normalizeGithubUrl(input) {
    const trimmed = input.trim().replace(/\.git$/, "").replace(/\/$/, "");
    const match = trimmed.match(
        /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/\s]+)\/([^/\s]+)$/
    ) || trimmed.match(/^([^/\s]+)\/([^/\s]+)$/);

    if (!match) return null;
    const [, owner, repo] = match;
    return `https://github.com/${owner}/${repo}`;
}
function isLikelyPublicGithubUrl(url) {
    return /^https:\/\/github\.com\/[^/]+\/[^/]+$/.test(url);
}
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await ConnectDb();
        await recoverStaleAnalyses();
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
        await ConnectDb();
        await recoverStaleAnalyses();

        let user = null;
        if (session?.user?.email) {
            user = await User.findOne({ email: session.user.email });
            if (!user) {
                return NextResponse.json(
                    { error: "User not found" },
                    { status: 404 }
                );
            }
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
                    "X-Internal-Token": process.env.INTERNAL_API_TOKEN,
                },
                body: JSON.stringify({
                    repo_url,
                    job_id: jobId,
                    installation_id: user.githubInstallationId,
                }),
            }
        );
        if (!fastApiResponse.ok) {
            await Analysis.findByIdAndUpdate(analysis._id, { status: "Failed", error: "Unable to start the analysis service.", completedAt: new Date() });
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
            await Analysis.findByIdAndUpdate(analysis._id, { status: "Failed", error: "Unable to start the analysis service.", completedAt: new Date() });
        }

        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
