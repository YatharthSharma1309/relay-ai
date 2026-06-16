import Link from "next/link";
import { ArrowLeft, Bot, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { buttonClassName } from "@/components/ui/button";
import { RelativeTime } from "@/components/ui/relative-time";

type ReviewMessage = {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
  helpful: boolean | null;
  sources?: unknown;
};

type ConversationReviewProps = {
  conversation: {
    id: string;
    title: string | null;
    channel: string;
    updatedAt: Date;
    messages: ReviewMessage[];
    tickets: Array<{ id: string; status: string }>;
  };
};

export function ConversationReview({ conversation }: ConversationReviewProps) {
  const linkedTicket = conversation.tickets[0];
  const visibleMessages = conversation.messages.filter(
    (message) => message.role === "USER" || message.role === "ASSISTANT",
  );

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/inbox"
          className={buttonClassName({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to inbox
        </Link>
        <div className="flex flex-wrap gap-2">
          <Badge tone="info">
            {conversation.channel === "HELP_CENTER" ? "Help center" : "Widget"}
          </Badge>
          {linkedTicket ? (
            <Badge tone="warning">Escalated</Badge>
          ) : (
            <Badge tone="success">AI handled</Badge>
          )}
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {conversation.title ?? "Customer conversation"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Read-only transcript · updated{" "}
            <RelativeTime date={conversation.updatedAt} />
          </p>
        </div>

        <div className="max-h-[min(70vh,640px)] space-y-4 overflow-y-auto px-6 py-5">
          {visibleMessages.length === 0 ? (
            <p className="text-sm text-slate-500">No messages in this conversation.</p>
          ) : (
            visibleMessages.map((message) => {
              const isUser = message.role === "USER";
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isUser ? "" : "flex-row-reverse"}`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      isUser ? "bg-slate-100 text-slate-600" : "bg-indigo-100 text-indigo-600"
                    }`}
                  >
                    {isUser ? (
                      <UserRound className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                      isUser
                        ? "bg-slate-100 text-slate-800"
                        : "bg-indigo-50 text-slate-800"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {message.helpful !== null ? (
                      <p className="mt-2 text-xs text-slate-500">
                        Feedback: {message.helpful ? "Helpful" : "Not helpful"}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4">
          <p className="text-sm text-slate-500">
            Agents review customer threads here without sending new AI messages.
          </p>
          {linkedTicket ? (
            <Link
              href={`/tickets/${linkedTicket.id}`}
              className={buttonClassName({ size: "sm" })}
            >
              Open ticket
            </Link>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
