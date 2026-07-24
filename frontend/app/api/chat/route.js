import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

import ConnectDb from "@/lib/mongodb";
import Analysis from "@/models/analysis";
import Chat from "@/models/chat";

export async function GET(req) {
  try {
    await ConnectDb();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const analysisId = new URL(req.url).searchParams.get("analysisId");
    if (!analysisId) return NextResponse.json({ error: "Missing analysisId" }, { status: 400 });

    const analysis = await Analysis.findById(analysisId);
    if (!analysis) return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    if (analysis.user.toString() !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const chat = await Chat.findOne({ analysisId, userId: session.user.id }).lean();
    return NextResponse.json({ messages: chat?.messages || [] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await ConnectDb();

    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { analysisId, message } = await req.json();

    if (!analysisId || !message) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    // Load analysis
    const analysis = await Analysis.findById(analysisId);

    if (!analysis) {
      return NextResponse.json(
        { error: "Analysis not found" },
        { status: 404 }
      );
    }

    // Verify owner
    if (analysis.user.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Find or create chat
    let chat = await Chat.findOne({
      analysisId,
    });

    if (!chat) {
      chat = await Chat.create({
        analysisId,
        userId: session.user.id,
        messages: [],
      });
    }

    // Save user message
    chat.messages.push({
      role: "user",
      content: message,
    });

    // Call FastAPI
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_FASTAPI_URL}/chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          analysis: analysis.response,
          history: chat.messages.slice(-10),
          question: message,
        }),
      }
    );

    if (!response.ok || !response.body) {
      return NextResponse.json(
        { error: "Chat service unavailable" },
        { status: 500 }
      );
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const reader = response.body.getReader();
    let answer = "";

    const stream = new ReadableStream({
      async pull(controller) {
        try {
          const { done, value } = await reader.read();
          if (done) {
            if (answer) {
              chat.messages.push({ role: "assistant", content: answer });
              await chat.save();
            }
            controller.close();
            return;
          }

          const chunk = decoder.decode(value, { stream: true });
          answer += chunk;
          controller.enqueue(encoder.encode(chunk));
        } catch (streamError) {
          console.error(streamError);
          controller.error(streamError);
        }
      },
      async cancel() {
        await reader.cancel();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
