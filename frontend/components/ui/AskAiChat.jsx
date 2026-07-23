"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send, Sparkles, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const suggestions = [
  "✨ Explain the architecture",
  "🔒 Security issues",
  "⚡ Performance improvements",
  "🛠️ Refactoring suggestions",
  "📋 Summarize this repository",
];

export default function AskAiChat({ analysisId, repository }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);
  const messageIdRef = useRef(0);
  const streamedAnswerRef = useRef("");

  useEffect(() => {
    let active = true;

    async function loadMessages() {
      setIsLoadingHistory(true);
      setError("");
      try {
        const response = await fetch(`/api/chat?analysisId=${encodeURIComponent(analysisId)}`);
        if (!response.ok) throw new Error("Could not load this conversation.");
        const data = await response.json();
        if (active) setMessages(data.messages || []);
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setIsLoadingHistory(false);
      }
    }

    if (analysisId) loadMessages();
    return () => { active = false; };
  }, [analysisId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending, isLoadingHistory]);

  async function sendMessage(value = input) {
    const message = value.trim();
    if (!message || isSending) return;

    messageIdRef.current += 1;
    const assistantMessageId = `assistant-${messageIdRef.current}`;
    setMessages((current) => [
      ...current,
      { role: "user", content: message },
      { id: assistantMessageId, role: "assistant", content: "" },
    ]);
    setInput("");
    setError("");
    setIsSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId, message }),
      });
      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Could not get an answer.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      streamedAnswerRef.current = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        streamedAnswerRef.current += decoder.decode(value, { stream: true });
        setMessages((current) => current.map((item) => item.id === assistantMessageId ? { ...item, content: streamedAnswerRef.current } : item));
      }

      streamedAnswerRef.current += decoder.decode();
      setMessages((current) => current.map((item) => item.id === assistantMessageId ? { ...item, content: streamedAnswerRef.current } : item));
    } catch (sendError) {
      setError(sendError.message);
      setMessages((current) => current.filter((item) => item.id !== assistantMessageId));
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#111216] shadow-2xl shadow-black/20">
      <div className="flex items-center gap-3 border-b border-white/10 bg-linear-to-r from-indigo-500/10 to-transparent px-5 py-4 sm:px-6">
        <span className="grid size-9 place-items-center rounded-xl bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-400/20"><Sparkles className="size-4" /></span>
        <div><h2 className="font-semibold text-white">Ask AI about this review</h2><p className="text-sm text-zinc-400">Get answers grounded in {repository || "this repository"}.</p></div>
      </div>

      <div className="flex h-[min(65vh,680px)] min-h-[440px] flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {isLoadingHistory ? (
            <div className="flex h-full items-center justify-center gap-3 text-sm text-zinc-400"><Loader2 className="size-4 animate-spin text-indigo-300" />Loading conversation…</div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-4 text-center"><span className="grid size-12 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-300"><Bot className="size-6" /></span><h3 className="mt-4 font-medium text-white">What would you like to explore?</h3><p className="mt-1 max-w-md text-sm leading-6 text-zinc-400">Ask about the findings, architecture, risks, or next improvements for this codebase.</p></div>
          ) : (
            <div className="mx-auto max-w-4xl space-y-5">
              {messages.map((message, index) => <Message key={message.id || `${message.role}-${index}-${message.content.slice(0, 20)}`} message={message} isStreaming={isSending && message.id?.startsWith("assistant-") && !message.content} />)}
            </div>
          )}
          {error && <p className="mx-auto mt-4 max-w-4xl rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>}
          <div ref={endRef} />
        </div>

        <div className="sticky bottom-0 border-t border-white/10 bg-[#111216]/95 px-4 py-4 backdrop-blur sm:px-6">
          <div className="mx-auto max-w-4xl"><div className="mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">{suggestions.map((suggestion) => <Button key={suggestion} type="button" variant="outline" size="sm" disabled={isSending} onClick={() => sendMessage(suggestion)} className="shrink-0 border-white/10 bg-white/[0.035] text-zinc-300 hover:border-indigo-400/30 hover:bg-indigo-500/10 hover:text-indigo-100">{suggestion}</Button>)}</div><form className="flex items-center gap-2" onSubmit={(event) => { event.preventDefault(); sendMessage(); }}><Input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about this repository…" disabled={isSending || isLoadingHistory} className="h-11 border-white/10 bg-black/20 px-4 text-zinc-100 placeholder:text-zinc-500 focus-visible:border-indigo-400/60" /><Button type="submit" size="icon-lg" disabled={!input.trim() || isSending || isLoadingHistory} className="h-11 bg-indigo-500 text-white hover:bg-indigo-400"><Send className="size-4" /><span className="sr-only">Send message</span></Button></form><p className="mt-2 text-xs text-zinc-500">AI answers are based on this repository’s analysis.</p></div>
        </div>
      </div>
    </section>
  );
}

function Message({ message, isStreaming }) {
  const isUser = message.role === "user";
  return <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}><span className={`grid size-8 shrink-0 place-items-center rounded-lg ${isUser ? "bg-zinc-700 text-zinc-200" : "bg-indigo-500/15 text-indigo-300"}`}>{isUser ? <UserRound className="size-4" /> : <Bot className="size-4" />}</span><div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${isUser ? "rounded-tr-md bg-indigo-500 text-white" : "rounded-tl-md border border-white/10 bg-white/[0.045] text-zinc-200"}`}>{isStreaming ? <span className="flex items-center gap-1"><span className="size-1.5 animate-bounce rounded-full bg-indigo-300 [animation-delay:-0.2s]" /><span className="size-1.5 animate-bounce rounded-full bg-indigo-300 [animation-delay:-0.1s]" /><span className="size-1.5 animate-bounce rounded-full bg-indigo-300" /></span> : message.content}</div></div>;
}
