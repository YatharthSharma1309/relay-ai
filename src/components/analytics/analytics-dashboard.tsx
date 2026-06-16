"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Clock,
  FileText,
  MessageSquare,
  Percent,
  Ticket,
  ThumbsUp,
  TrendingUp,
} from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";

type AnalyticsDashboardProps = {
  overview: {
    totalConversations: number;
    totalMessages: number;
    totalTickets: number;
    openTickets: number;
    resolvedTickets: number;
    readyDocuments: number;
    deflectionRate: number;
    avgResolutionHours: number | null;
    helpfulRate: number | null;
    feedbackCount: number;
  };
  ticketsByStatus: Array<{ status: string; count: number }>;
  activityByDay: Array<{ date: string; conversations: number; tickets: number }>;
  knowledgeGaps: Array<{ topic: string; count: number }>;
  conversationsByChannel: Array<{ channel: string; count: number }>;
};

export function AnalyticsDashboard({
  overview,
  ticketsByStatus,
  activityByDay,
  knowledgeGaps,
  conversationsByChannel,
}: AnalyticsDashboardProps) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={MessageSquare}
          label="Conversations"
          value={overview.totalConversations}
        />
        <StatCard
          icon={TrendingUp}
          label="Messages"
          value={overview.totalMessages}
        />
        <StatCard
          icon={Ticket}
          label="Open tickets"
          value={overview.openTickets}
        />
        <StatCard
          icon={Percent}
          label="Deflection rate"
          value={`${overview.deflectionRate}%`}
          hint="Chats resolved without escalation"
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={ThumbsUp}
          label="Helpful rate"
          value={
            overview.helpfulRate !== null
              ? `${overview.helpfulRate}%`
              : "N/A"
          }
          hint={
            overview.feedbackCount > 0
              ? `${overview.feedbackCount} ratings collected`
              : "Rate AI answers from chat"
          }
        />
        <StatCard
          icon={Ticket}
          label="Total tickets"
          value={overview.totalTickets}
        />
        <StatCard
          icon={Clock}
          label="Avg resolution"
          value={
            overview.avgResolutionHours !== null
              ? `${overview.avgResolutionHours}h`
              : "N/A"
          }
        />
        <StatCard
          icon={FileText}
          label="Ready documents"
          value={overview.readyDocuments}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Conversations by channel</CardTitle>
          <CardDescription>
            Widget embed and help center customer traffic.
          </CardDescription>
          <div className="mt-6 h-72">
            {conversationsByChannel.length === 0 ? (
              <p className="text-sm text-slate-500">No conversations yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conversationsByChannel}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="channel" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    name="Conversations"
                    dataKey="count"
                    fill="#22c55e"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardTitle>Tickets by status</CardTitle>
          <CardDescription>Current workload distribution.</CardDescription>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ticketsByStatus}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar
                  name="Tickets"
                  dataKey="count"
                  fill="#4f46e5"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardTitle>7-day activity</CardTitle>
          <CardDescription>Conversations and tickets created per day.</CardDescription>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityByDay}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar
                  name="Conversations"
                  dataKey="conversations"
                  fill="#6366f1"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  name="Tickets"
                  dataKey="tickets"
                  fill="#f59e0b"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <Card>
        <CardTitle>Knowledge gaps</CardTitle>
        <CardDescription>
          Topics escalated from chat — add these to your knowledge base to improve
          deflection.
        </CardDescription>
        <div className="mt-5 space-y-3">
          {knowledgeGaps.length === 0 ? (
            <p className="text-sm text-slate-500">
              No escalations yet. When users escalate from chat, topics appear here.
            </p>
          ) : (
            knowledgeGaps.map((gap, index) => (
              <div
                key={`${gap.topic}-${index}`}
                className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50/50 px-4 py-3"
              >
                <p className="text-sm font-medium text-slate-800">{gap.topic}</p>
                <span className="text-xs text-amber-700">
                  Escalated{gap.count > 1 ? ` · ${gap.count}x` : ""}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
