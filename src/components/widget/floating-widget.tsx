"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { ChatPanel } from "@/components/chat/chat-panel";
import { cn } from "@/lib/utils";

type FloatingWidgetProps = {
  hasDocuments: boolean;
  welcomeMessage?: string;
  widgetKey: string;
  widgetChannel?: "WIDGET" | "HELP_CENTER";
  initialQuestion?: string | null;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function FloatingWidget({
  hasDocuments,
  welcomeMessage,
  widgetKey,
  widgetChannel = "WIDGET",
  initialQuestion = null,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
}: FloatingWidgetProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  function setOpen(next: boolean) {
    if (!isControlled) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6">
      <div className="pointer-events-auto flex flex-col items-end gap-3">
        <div
          className={cn(
            "origin-bottom-right transition-all duration-300",
            open
              ? "scale-100 opacity-100"
              : "pointer-events-none scale-95 opacity-0",
          )}
        >
          <div className="w-[min(100vw-2rem,400px)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <ChatPanel
              hasDocuments={hasDocuments}
              welcomeMessage={welcomeMessage}
              mode="widget"
              widgetKey={widgetKey}
              widgetChannel={widgetChannel}
              initialQuestion={initialQuestion}
              compact
            />
          </div>
        </div>

        <button
          type="button"
          aria-label={open ? "Close support chat" : "Open support chat"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 via-violet-600 to-cyan-500 text-white shadow-lg shadow-indigo-300/40 transition hover:scale-105"
        >
          {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </button>
      </div>
    </div>
  );
}
