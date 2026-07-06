"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getAnalyzeActionLabel,
  isResumeReady,
} from "@/lib/recruitment/candidate-actions";
import type { ParseStatus } from "@/lib/recruitment/types";

type AnalyzeButtonProps = {
  candidateId: string;
  parseStatus: ParseStatus;
  hasAnalysis: boolean;
  onComplete?: () => void;
};

export function AnalyzeButton({
  candidateId,
  parseStatus,
  hasAnalysis,
  onComplete,
}: AnalyzeButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resumeReady = isResumeReady(parseStatus);
  const label = getAnalyzeActionLabel({
    analyzeBusy: busy,
    resumeReady,
    hasAnalysis,
  });

  async function handleAnalyze() {
    if (!resumeReady || busy) return;

    setBusy(true);
    setError(null);

    const response = await fetch("/api/recruitment/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateId }),
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Analysis failed");
      setBusy(false);
      return;
    }

    onComplete?.();
    router.refresh();
    setBusy(false);
  }

  return (
    <div>
      <Button
        type="button"
        onClick={handleAnalyze}
        disabled={!resumeReady || busy}
      >
        <Sparkles className="h-4 w-4" />
        {label}
      </Button>
      {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
