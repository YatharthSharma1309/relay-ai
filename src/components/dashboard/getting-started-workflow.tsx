"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, MessageSquare, Sparkles, Ticket } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const steps = [
  {
    step: "01",
    title: "Add knowledge",
    description: "Upload FAQs and product docs so the AI can cite real answers.",
    href: "/knowledge",
    icon: BookOpen,
    color: "text-indigo-600 bg-indigo-50",
  },
  {
    step: "02",
    title: "Test the chatbot",
    description: "Ask a support question and verify sources appear with each reply.",
    href: "/chat",
    icon: MessageSquare,
    color: "text-cyan-600 bg-cyan-50",
  },
  {
    step: "03",
    title: "Handle escalations",
    description: "Escalate from chat, resolve tickets, and track deflection in analytics.",
    href: "/tickets",
    icon: Ticket,
    color: "text-violet-600 bg-violet-50",
  },
  {
    step: "04",
    title: "Embed the widget",
    description: "Copy the embed snippet and add the chat bubble to your product.",
    href: "/widget",
    icon: Sparkles,
    color: "text-emerald-600 bg-emerald-50",
  },
];

export function GettingStartedWorkflow() {
  return (
    <Card>
      <CardTitle>Getting started</CardTitle>
      <CardDescription>
        Set up your workspace — knowledge, AI chat, tickets, and embeddable widget.
      </CardDescription>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {steps.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.step}
              href={item.href}
              className="group rounded-2xl border border-slate-100 p-4 transition-all hover:border-indigo-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Step {item.step}
                </span>
                <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500" />
              </div>
              <div className={`mt-3 inline-flex rounded-xl p-2.5 ${item.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="mt-3 font-medium text-slate-900">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {item.description}
              </p>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
