"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Bot,
  Headphones,
  HelpCircle,
  Inbox,
  LayoutDashboard,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MemberRole } from "@/generated/prisma/client";

const baseNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, adminOnly: false },
  { href: "/knowledge", label: "Knowledge Base", icon: BookOpen, adminOnly: false },
  { href: "/chat", label: "AI Chatbot", icon: Bot, adminOnly: false },
  { href: "/inbox", label: "Agent Inbox", icon: Inbox, adminOnly: false },
  { href: "/tickets", label: "Tickets", icon: Headphones, adminOnly: false },
  { href: "/analytics", label: "Analytics", icon: BarChart3, adminOnly: false },
  { href: "/settings", label: "AI Settings", icon: Settings, adminOnly: true },
];

type SidebarContentProps = {
  onNavigate?: () => void;
  className?: string;
  organizationSlug?: string;
  role?: MemberRole;
};

export function SidebarContent({
  onNavigate,
  className,
  organizationSlug,
  role = "AGENT",
}: SidebarContentProps) {
  const pathname = usePathname();
  const helpHref = organizationSlug ? `/help/${organizationSlug}` : "/help";
  const navItems = [
    ...baseNavItems.filter((item) => role === "ADMIN" || !item.adminOnly),
    {
      href: helpHref,
      label: "Public help center",
      icon: HelpCircle,
      adminOnly: false,
    },
  ];

  return (
    <div className={cn("flex h-full flex-col bg-white", className)}>
      <div className="border-b border-slate-200 px-6 py-5">
        <Link
          href="/dashboard"
          className="flex items-center gap-3"
          onClick={onNavigate}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-cyan-500 text-white shadow-lg shadow-indigo-200">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">SupportAI</p>
            <p className="text-xs text-slate-500">RAG Support Platform</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-gradient-to-r from-indigo-50 to-cyan-50 text-indigo-700 ring-1 ring-indigo-100"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4",
                  isActive
                    ? "text-indigo-600"
                    : "text-slate-400 group-hover:text-slate-600",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 px-6 py-4">
        <Link
          href="/widget"
          onClick={onNavigate}
          className="mb-3 flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50/60 px-3 py-2.5 text-sm font-medium text-indigo-700 transition hover:bg-indigo-50"
        >
          Preview embed widget
          <span aria-hidden>→</span>
        </Link>
        {role === "ADMIN" ? (
          <Link
            href="/settings"
            onClick={onNavigate}
            className="text-xs text-slate-500 transition hover:text-indigo-600"
          >
            Workspace settings
          </Link>
        ) : null}
      </div>
    </div>
  );
}

type SidebarProps = {
  organizationSlug?: string;
  role?: MemberRole;
};

export function Sidebar({ organizationSlug, role }: SidebarProps) {
  return (
    <aside className="hidden h-full w-64 shrink-0 border-r border-slate-200 lg:flex">
      <SidebarContent
        className="w-full"
        organizationSlug={organizationSlug}
        role={role}
      />
    </aside>
  );
}
