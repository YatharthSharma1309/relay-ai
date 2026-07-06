import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/auth/auth-provider";
import { assertAuthBypassNotInProduction } from "@/lib/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OpsAI | AI Operations Platform",
  description:
    "Unified AI operations platform — RAG customer support, recruitment pipelines, tickets, and analytics for SaaS teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  assertAuthBypassNotInProduction();

  return (
    <AuthProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full bg-background font-sans text-slate-900">
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          {children}
        </body>
      </html>
    </AuthProvider>
  );
}
