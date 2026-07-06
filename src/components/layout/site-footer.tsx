import Link from "next/link";
import { BrandLogo } from "@/components/layout/brand-logo";
import { cn } from "@/lib/utils";

type SiteFooterProps = {
  variant?: "full" | "minimal";
  className?: string;
};

const productLinks = [
  { href: "/sign-up", label: "Get started" },
  { href: "/sign-in", label: "Sign in" },
  { href: "/help", label: "Help center" },
];

const resourceLinks = [
  { href: "/#features", label: "Features" },
  { href: "/sign-up", label: "Start free" },
];

export function SiteFooter({ variant = "full", className }: SiteFooterProps) {
  const year = new Date().getFullYear();

  if (variant === "minimal") {
    return (
      <footer
        className={cn("border-t border-slate-200 bg-white py-6", className)}
      >
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 text-center sm:flex-row sm:px-6 sm:text-left">
          <BrandLogo href="/" size="sm" />
          <p className="text-sm text-slate-500">
            Powered by{" "}
            <Link href="/" className="font-medium text-indigo-600 hover:text-indigo-500">
              Relay AI
            </Link>
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer className={cn("border-t border-slate-200 bg-white", className)}>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <BrandLogo showTagline />
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-600">
              RAG customer support, AI recruitment pipelines, and multi-tenant
              ops workflows — one workspace for support and hiring teams.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Product
            </p>
            <ul className="mt-4 space-y-2">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-600 transition hover:text-indigo-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Resources
            </p>
            <ul className="mt-4 space-y-2">
              {resourceLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-600 transition hover:text-indigo-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 py-6 text-center text-sm text-slate-500">
        © {year} Relay AI. All rights reserved.
      </div>
    </footer>
  );
}
