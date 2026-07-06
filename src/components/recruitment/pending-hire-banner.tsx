"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PendingHireDTO } from "@/lib/recruitment/types";

type PendingHireBannerProps = {
  jobId: string;
  pendingHire: PendingHireDTO;
};

export function PendingHireBanner({ jobId, pendingHire }: PendingHireBannerProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<"undo" | "finalize" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const expiresAt = new Date(pendingHire.expiresAt);
  const expiresLabel = expiresAt.toLocaleString();

  async function handleUndo() {
    setBusy("undo");
    setError(null);

    const response = await fetch(`/api/recruitment/jobs/${jobId}/hire/undo`, {
      method: "POST",
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Failed to undo hire");
      setBusy(null);
      return;
    }

    router.refresh();
    setBusy(null);
  }

  async function handleFinalize() {
    if (
      !window.confirm(
        `Permanently remove ${pendingHire.archivedCount} archived candidate record(s)? This cannot be undone.`,
      )
    ) {
      return;
    }

    setBusy("finalize");
    setError(null);

    const response = await fetch(`/api/recruitment/jobs/${jobId}/hire/finalize`, {
      method: "POST",
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Failed to finalize hire");
      setBusy(null);
      return;
    }

    router.refresh();
    setBusy(null);
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-medium text-amber-900">
              Hire pending for {pendingHire.hiredDisplayName}
            </p>
            <p className="mt-1 text-sm text-amber-800">
              {pendingHire.archivedCount} other candidate
              {pendingHire.archivedCount === 1 ? " was" : "s were"} archived. Undo before{" "}
              {expiresLabel}, or finalize to permanently remove archived records.
            </p>
            {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleUndo}
            disabled={busy !== null}
          >
            {busy === "undo" ? "Undoing..." : "Undo hire"}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleFinalize}
            disabled={busy !== null}
          >
            {busy === "finalize" ? "Finalizing..." : "Finalize hire"}
          </Button>
        </div>
      </div>
    </div>
  );
}
