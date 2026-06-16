"use client";

import { useState } from "react";
import { HelpCenterSearch } from "@/components/help/help-center-search";
import { FloatingWidget } from "@/components/widget/floating-widget";

type HelpArticle = {
  id: string;
  title: string;
  chunks: Array<{ id: string; content: string; chunkIndex: number }>;
};

type HelpCenterExperienceProps = {
  articles: HelpArticle[];
  widgetKey?: string | null;
  hasDocuments: boolean;
  welcomeMessage?: string;
};

export function HelpCenterExperience({
  articles,
  widgetKey,
  hasDocuments,
  welcomeMessage,
}: HelpCenterExperienceProps) {
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);

  function handleAskAi(question: string) {
    if (!widgetKey) return;
    setPendingQuestion(question.trim());
    setWidgetOpen(true);
  }

  return (
    <>
      <HelpCenterSearch
        articles={articles}
        widgetKey={widgetKey}
        onAskAi={widgetKey ? handleAskAi : undefined}
      />

      {widgetKey ? (
        <FloatingWidget
          key={pendingQuestion ?? "idle"}
          hasDocuments={hasDocuments}
          welcomeMessage={welcomeMessage}
          widgetKey={widgetKey}
          widgetChannel="HELP_CENTER"
          initialQuestion={pendingQuestion}
          open={widgetOpen}
          onOpenChange={setWidgetOpen}
          defaultOpen={Boolean(pendingQuestion)}
        />
      ) : null}
    </>
  );
}
