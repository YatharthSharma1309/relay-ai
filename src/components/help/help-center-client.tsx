"use client";

import { useCallback, useState } from "react";
import { HelpCenterSearch } from "@/components/help/help-center-search";
import { FloatingWidget } from "@/components/widget/floating-widget";

type HelpArticle = {
  id: string;
  title: string;
  chunks: Array<{ id: string; content: string; chunkIndex: number }>;
};

type HelpCenterClientProps = {
  articles: HelpArticle[];
  hasDocuments: boolean;
  welcomeMessage?: string;
  widgetKey?: string | null;
};

export function HelpCenterClient({
  articles,
  hasDocuments,
  welcomeMessage,
  widgetKey,
}: HelpCenterClientProps) {
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [questionSession, setQuestionSession] = useState<{
    key: number;
    question: string | null;
  }>({ key: 0, question: null });

  const handleAskAi = useCallback((question: string) => {
    const trimmed = question.trim();
    if (trimmed) {
      setQuestionSession((current) => ({
        key: current.key + 1,
        question: trimmed,
      }));
    }
    setWidgetOpen(true);
  }, []);

  return (
    <>
      <HelpCenterSearch
        articles={articles}
        widgetKey={widgetKey}
        onAskAi={widgetKey ? handleAskAi : undefined}
      />
      {widgetKey ? (
        <FloatingWidget
          key={questionSession.key}
          hasDocuments={hasDocuments}
          welcomeMessage={welcomeMessage}
          widgetKey={widgetKey}
          widgetChannel="HELP_CENTER"
          initialQuestion={questionSession.question}
          open={widgetOpen}
          onOpenChange={setWidgetOpen}
        />
      ) : null}
    </>
  );
}
