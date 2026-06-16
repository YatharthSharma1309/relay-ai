"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  BookOpen,
  Bot,
  CheckCircle2,
  Circle,
  Loader2,
  Sparkles,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const showDemoSeed =
  process.env.NEXT_PUBLIC_AUTH_BYPASS === "true" &&
  process.env.NODE_ENV !== "production";

type SetupHealthCardProps = {
  readyDocuments: number;
  conversations: number;
  aiConfigured: boolean;
  embeddingEnabled: boolean;
};

export function SetupHealthCard({
  readyDocuments,
  conversations,
  aiConfigured,
  embeddingEnabled,
}: SetupHealthCardProps) {
  const router = useRouter();
  const [isSeeding, setIsSeeding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const steps = [
    {
      label: "Knowledge base loaded",
      done: readyDocuments > 0,
      hint: "Upload PDFs, DOCX, or text files",
    },
    {
      label: aiConfigured ? "OpenRouter AI connected" : "Keyword search ready",
      done: true,
      hint: aiConfigured
        ? "Streaming answers via OpenRouter"
        : "Add OPENROUTER_API_KEY for LLM replies",
    },
    {
      label: "Chat tested",
      done: conversations > 0,
      hint: "Ask a question in AI Chatbot",
    },
  ];

  const readiness = Math.round(
    (steps.filter((step) => step.done).length / steps.length) * 100,
  );

  async function loadSampleData() {
    setIsSeeding(true);
    setMessage(null);

    try {
      const response = await fetch("/api/demo/seed", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load sample data");
      }

      setMessage(
        data.workspaceCreated || data.knowledgeCreated
          ? "Sample FAQ, conversations, and tickets loaded."
          : "Sample data was already present.",
      );
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not load sample data",
      );
    } finally {
      setIsSeeding(false);
    }
  }

  return (
    <Card className="hero-gradient overflow-hidden border-indigo-100 p-0">
      <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
            <Sparkles className="h-3.5 w-3.5" />
            Workspace readiness
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Support Health Command Center
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
            Upload knowledge, test the chatbot, and embed the widget on your site
            when you are ready to go live.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={() => router.push("/knowledge")}>
              <Upload className="h-4 w-4" />
              Upload documents
            </Button>
            <Button variant="secondary" onClick={() => router.push("/chat")}>
              <Bot className="h-4 w-4" />
              Open chatbot
            </Button>
            {showDemoSeed ? (
              <Button
                variant="ghost"
                onClick={loadSampleData}
                disabled={isSeeding}
              >
                {isSeeding ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading sample...
                  </>
                ) : (
                  <>
                    <BookOpen className="h-4 w-4" />
                    Load sample data
                  </>
                )}
              </Button>
            ) : null}
          </div>

          {message ? (
            <p className="mt-3 text-sm text-emerald-700">{message}</p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">Setup progress</p>
            <span className="text-2xl font-semibold text-indigo-600">
              {readiness}%
            </span>
          </div>
          <div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-500"
              style={{ width: `${readiness}%` }}
            />
          </div>
          <div className="space-y-3">
            {steps.map((step) => (
              <div key={step.label} className="flex items-start gap-3">
                {step.done ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                ) : (
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
                )}
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {step.label}
                  </p>
                  <p className="text-xs text-slate-500">{step.hint}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-400">
            Retrieval: {embeddingEnabled ? "vector + keyword" : "keyword (free)"}
          </p>
        </div>
      </div>
    </Card>
  );
}
