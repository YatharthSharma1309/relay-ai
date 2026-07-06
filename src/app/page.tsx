import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  Briefcase,
  Headphones,
  Zap,
} from "lucide-react";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { buttonClassName } from "@/components/ui/button";
import {
  demoModuleLinks,
  isMarketingDemoMode,
} from "@/lib/env/marketing-demo";

const features = [
  {
    icon: BookOpen,
    title: "Multi-document knowledge base",
    description:
      "Upload PDFs, DOCX, and FAQs. Documents are chunked and indexed for semantic retrieval.",
  },
  {
    icon: Bot,
    title: "RAG-powered AI chatbot",
    description:
      "Answers are grounded in your docs with visible citations and a live retrieval pipeline.",
  },
  {
    icon: Headphones,
    title: "Smart ticket escalation",
    description:
      "Escalate from chat with full transcript attached. Agents resolve with full context.",
  },
  {
    icon: BarChart3,
    title: "Support analytics",
    description:
      "Track deflection rate, ticket trends, resolution time, and knowledge gaps.",
  },
  {
    icon: Briefcase,
    title: "AI recruitment",
    description:
      "Screen resumes against job criteria, score candidates, surface skill gaps, and manage hiring pipelines.",
  },
];

export default function LandingPage() {
  const demoMode = isMarketingDemoMode();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader />

      <main id="main-content" className="flex-1">
        <section className="hero-gradient mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pt-16">
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
              <Zap className="h-3.5 w-3.5" />
              {demoMode
                ? "Relay AI · Support + Recruitment"
                : "RAG-powered · Support + Recruitment"}
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl md:leading-tight">
              One platform for{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                support and hiring AI
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Answer customers with cited RAG chat, escalate to tickets, screen
              resumes against job criteria, and run hiring pipelines — all in one
              multi-tenant workspace.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={demoMode ? "/dashboard" : "/sign-up"}
                className={buttonClassName({ size: "lg" })}
              >
                {demoMode ? "Open live demo" : "Get started free"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={demoMode ? "/recruitment" : "/help"}
                className={buttonClassName({ variant: "secondary", size: "lg" })}
              >
                {demoMode ? "View recruitment" : "Browse help center"}
              </Link>
            </div>
            {demoMode ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {demoModuleLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-full border border-indigo-100 bg-white/80 px-3 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-50"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {[
              { label: "RAG pipeline", value: "Live source citations" },
              { label: "AI engine", value: "Streaming grounded answers" },
              { label: "Workflow", value: "Chat → Ticket → Analytics" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/80 bg-white/70 p-5 shadow-sm"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {item.label}
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="features"
          className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6"
        >
          <h2 className="text-2xl font-semibold text-slate-900">
            Everything your support team needs
          </h2>
          <p className="mt-2 max-w-2xl text-slate-600">
            Knowledge, AI chat, human handoff, embeddable widget, and analytics
            in a single product surface.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                >
                  <div className="inline-flex rounded-xl bg-indigo-50 p-3 text-indigo-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
            <h2 className="text-2xl font-semibold text-slate-900">
              {demoMode ? "Explore the full platform" : "Ready to transform your support?"}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-slate-600">
              {demoMode
                ? "Walk through support AI, ticket workflows, recruitment scoring, and analytics — no sign-in required."
                : "Launch a cited AI helpdesk, embed it on your site, and measure deflection in minutes."}
            </p>
            <Link
              href={demoMode ? "/dashboard" : "/sign-up"}
              className={buttonClassName({ size: "lg", className: "mt-8" })}
            >
              {demoMode ? "Open live demo" : "Start your workspace"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
