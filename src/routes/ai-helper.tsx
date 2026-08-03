import { createFileRoute } from "@tanstack/react-router";

import { AppShell, PageHeader } from "@/components/AppShell";
import { AiHelper } from "@/components/study/AiHelper";

export const Route = createFileRoute("/ai-helper")({
  head: () => ({
    meta: [
      { title: "AI Study Helper — StudyFlow" },
      {
        name: "description",
        content:
          "Ask the StudyFlow AI Study Helper to explain topics, solve maths step by step, build quizzes and flashcards, and plan your study week.",
      },
      { property: "og:title", content: "AI Study Helper — StudyFlow" },
      {
        property: "og:description",
        content:
          "A friendly AI tutor for Math, Science, English, Bangla, History, Geography, ICT and General Knowledge.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AiHelperPage,
});

function AiHelperPage() {
  return (
    <AppShell>
      <PageHeader
        title="AI Study Helper"
        subtitle="Your friendly tutor — explanations, step-by-step maths, quizzes, flashcards and study plans."
      />
      <AiHelper />
    </AppShell>
  );
}