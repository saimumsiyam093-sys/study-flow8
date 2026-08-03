import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import { AppShell } from "@/components/AppShell";
import { newThread, readAi, sortThreads, writeAi } from "@/lib/ai-store";

const TITLE = "AI Study Helper — StudyFlow";
const DESC =
  "Chat with the StudyFlow AI tutor, upload PDFs, slides, notes and photos, and get summaries, quizzes, flashcards and study plans.";

export const Route = createFileRoute("/ai-helper/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AiHelperIndex,
});

function AiHelperIndex() {
  const navigate = useNavigate();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const data = readAi();
    const existing = sortThreads(data.threads)[0];
    if (existing) {
      void navigate({ to: "/ai-helper/$threadId", params: { threadId: existing.id }, replace: true });
      return;
    }
    const thread = newThread();
    writeAi({ ...data, threads: [thread] });
    void navigate({ to: "/ai-helper/$threadId", params: { threadId: thread.id }, replace: true });
  }, [navigate]);

  return (
    <AppShell>
      <p className="py-20 text-center text-sm text-muted-foreground">Opening your AI Study Helper…</p>
    </AppShell>
  );
}
