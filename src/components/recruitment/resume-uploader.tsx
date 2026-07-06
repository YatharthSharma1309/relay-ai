"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Button, buttonClassName } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ResumeUploaderProps = {
  jobId: string;
  className?: string;
};

export function ResumeUploader({ jobId, className }: ResumeUploaderProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function uploadFile(file: File) {
    setBusy(true);
    setError(null);

    const formData = new FormData();
    formData.append("jobId", jobId);
    formData.append("file", file);

    const response = await fetch("/api/recruitment/upload", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Upload failed");
      setBusy(false);
      return;
    }

    router.refresh();
    setBusy(false);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      void uploadFile(file);
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      void uploadFile(file);
    }
  }

  return (
    <div className={className}>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition",
          dragOver
            ? "border-indigo-400 bg-indigo-50/50"
            : "border-slate-200 bg-slate-50/50",
        )}
      >
        <Upload className="mb-3 h-8 w-8 text-indigo-600" />
        <p className="text-sm font-medium text-slate-900">Upload resume</p>
        <p className="mt-1 text-xs text-slate-500">PDF or DOCX, up to 5MB</p>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFileChange}
          className="sr-only"
          id={`resume-upload-${jobId}`}
          disabled={busy}
        />

        <label
          htmlFor={`resume-upload-${jobId}`}
          className={buttonClassName({
            variant: "secondary",
            size: "sm",
            className: cn("mt-4 cursor-pointer", busy && "pointer-events-none opacity-60"),
          })}
        >
          {busy ? "Uploading..." : "Choose file"}
        </label>
      </div>

      {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
