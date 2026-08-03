import { Link } from "@tanstack/react-router";
import { FileText, MessageSquare, Sparkles } from "lucide-react";

import { formatBytes, formatWhen, sortThreads, useAiStore } from "@/lib/ai-store";
import { daysUntil, formatDate, useStudyStore } from "@/lib/study-store";

export function AiDashboardCards() {
  const ai = useAiStore();
  const study = useStudyStore();
  const chats = sortThreads(ai.threads).filter((t) => t.messages.length > 0).slice(0, 4);
  const files = ai.files.slice(0, 4);

  const recommendations = [
    ...study.homework
      .filter((h) => !h.done)
      .sort((a, b) => a.due.localeCompare(b.due))
      .slice(0, 2)
      .map((h) => `Ask the AI to break "${h.title}" into small steps — due ${formatDate(h.due)}.`),
    ...study.exams
      .filter((e) => daysUntil(e.date) >= 0)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 2)
      .map((e) => `Generate a 20 question quiz for "${e.title}" — ${daysUntil(e.date)} days left.`),
  ];

  return (
    <section className="grid gap-4 md:grid-cols-3">
      <div className="glass-card animate-rise p-4">
        <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold">
          <MessageSquare className="size-4" /> Recent AI chats
        </h3>
        {chats.length === 0 ? (
          <p className="text-sm text-muted-foreground">No chats yet.</p>
        ) : (
          <ul className="space-y-2">
            {chats.map((t) => (
              <li key={t.id}>
                <Link
                  to="/ai-helper/$threadId"
                  params={{ threadId: t.id }}
                  className="block truncate text-sm hover:text-primary"
                >
                  {t.pinned ? "📌 " : ""}
                  {t.title}
                  <span className="ml-1 text-xs text-muted-foreground">{formatWhen(t.updatedAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="glass-card animate-rise p-4">
        <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold">
          <FileText className="size-4" /> Recent uploads
        </h3>
        {files.length === 0 ? (
          <p className="text-sm text-muted-foreground">No files uploaded yet.</p>
        ) : (
          <ul className="space-y-2">
            {files.map((f) => (
              <li key={f.id} className="truncate text-sm">
                {f.name}
                <span className="ml-1 text-xs text-muted-foreground">{formatBytes(f.size)}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          {ai.stats.messagesSent} questions asked · {ai.stats.filesUploaded} files studied · {ai.threads.length} chats
        </p>
      </div>

      <div className="glass-card animate-rise p-4">
        <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold">
          <Sparkles className="size-4" /> Study recommendations
        </h3>
        {recommendations.length === 0 ? (
          <p className="text-sm text-muted-foreground">Add homework or exams to get suggestions.</p>
        ) : (
          <ul className="space-y-2 text-sm text-muted-foreground">
            {recommendations.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        )}
        <Link to="/ai-helper" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
          Open AI Helper →
        </Link>
      </div>
    </section>
  );
}
