import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import { toast } from "sonner";

import { AppShell, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { exportThreads, parseImportedThreads } from "@/lib/ai-export";
import { AI_LANGUAGES, AI_MODELS, useAiStore } from "@/lib/ai-store";

const TITLE = "AI Settings — StudyFlow";
const DESC = "Choose your AI model and language, adjust chat font size, and export, import or clear your chat history.";

export const Route = createFileRoute("/ai-settings")({
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
  component: AiSettingsPage,
});

function AiSettingsPage() {
  const ai = useAiStore();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const setSetting = (patch: Partial<typeof ai.settings>) =>
    ai.update((d) => ({ ...d, settings: { ...d.settings, ...patch } }));

  return (
    <AppShell>
      <PageHeader title="AI Settings" subtitle="Model, language, font size and chat history." />

      <div className="grid gap-4 md:grid-cols-2">
        <section className="glass-card animate-rise space-y-4 p-5">
          <div className="space-y-2">
            <Label htmlFor="model">AI model</Label>
            <select
              id="model"
              value={ai.settings.model}
              onChange={(e) => setSetting({ model: e.target.value })}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            >
              {AI_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Answer language</Label>
            <select
              id="language"
              value={ai.settings.language}
              onChange={(e) => setSetting({ language: e.target.value })}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            >
              {AI_LANGUAGES.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Chat font size — {ai.settings.fontSize}px</Label>
            <Slider
              value={[ai.settings.fontSize]}
              min={13}
              max={22}
              step={1}
              onValueChange={([v]) => setSetting({ fontSize: v ?? 15 })}
            />
          </div>
        </section>

        <section className="glass-card animate-rise space-y-3 p-5">
          <h2 className="font-display text-base font-semibold">Chat history</h2>
          <p className="text-sm text-muted-foreground">
            {ai.threads.length} chats · {ai.files.length} uploaded files · {ai.stats.messagesSent} questions asked.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => exportThreads(ai.threads)} disabled={ai.threads.length === 0}>
              Export chats
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              Import chats
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                ai.update((d) => ({ ...d, threads: [] }));
                toast.success("All chats cleared");
              }}
            >
              Clear all chats
            </Button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              try {
                const imported = parseImportedThreads(await file.text());
                if (imported.length === 0) throw new Error("No chats found in that file");
                ai.update((d) => {
                  const ids = new Set(d.threads.map((t) => t.id));
                  return { ...d, threads: [...imported.filter((t) => !ids.has(t.id)), ...d.threads] };
                });
                toast.success(`Imported ${imported.length} chats`);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Could not import that file");
              }
            }}
          />
        </section>
      </div>
    </AppShell>
  );
}
