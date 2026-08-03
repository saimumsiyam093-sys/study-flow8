import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { AppShell, PageHeader } from "@/components/AppShell";
import { AiHelper } from "@/components/study/AiHelper";
import { AiSidebar } from "@/components/study/AiSidebar";
import { newThread, sortThreads, useAiStore } from "@/lib/ai-store";

const TITLE = "AI Study Helper — StudyFlow";
const DESC =
  "Ask questions, upload documents and images, and get step-by-step explanations, quizzes, flashcards and study plans.";

export const Route = createFileRoute("/ai-helper/$threadId")({
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
  component: AiHelperThread,
});

function AiHelperThread() {
  const { threadId } = Route.useParams();
  const navigate = useNavigate();
  const ai = useAiStore();

  const goTo = (id: string) => void navigate({ to: "/ai-helper/$threadId", params: { threadId: id } });

  const createThread = () => {
    const thread = newThread();
    ai.update((d) => ({ ...d, threads: [thread, ...d.threads] }));
    goTo(thread.id);
  };

  const deleteThread = (id: string) => {
    const next = ai.update((d) => ({ ...d, threads: d.threads.filter((t) => t.id !== id) }));
    if (id !== threadId) return;
    const first = sortThreads(next.threads)[0];
    if (first) {
      goTo(first.id);
      return;
    }
    const thread = newThread();
    ai.update((d) => ({ ...d, threads: [thread] }));
    goTo(thread.id);
  };

  return (
    <AppShell>
      <PageHeader
        title="AI Study Helper"
        subtitle="Chat, upload documents and images, and get explanations, quizzes, flashcards and study plans."
      />
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <AiSidebar
          threads={ai.threads}
          activeId={threadId}
          onNew={createThread}
          onPin={(id) =>
            ai.update((d) => ({
              ...d,
              threads: d.threads.map((t) => (t.id === id ? { ...t, pinned: !t.pinned } : t)),
            }))
          }
          onDelete={deleteThread}
        />
        <AiHelper key={threadId} threadId={threadId} />
      </div>
    </AppShell>
  );
}
