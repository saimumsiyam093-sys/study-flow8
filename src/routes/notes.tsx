import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { EmptyState, SubjectDot } from "@/components/study/Bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uid, useStudyStore } from "@/lib/study-store";

const TITLE = "Notes — StudyFlow Study Planner";
const DESC = "Keep quick revision notes attached to each subject, searchable and saved on your device.";

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: NotesPage,
});

function NotesPage() {
  const { notes, subjects, update } = useStudyStore();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [body, setBody] = useState("");
  const [query, setQuery] = useState("");

  const reset = () => {
    setOpen(false);
    setTitle("");
    setSubjectId("");
    setBody("");
  };

  const save = () => {
    if (!title.trim()) return;
    update((d) => ({
      ...d,
      notes: [
        {
          id: uid(),
          title: title.trim(),
          subjectId: subjectId || undefined,
          body: body.trim(),
          updated: new Date().toISOString(),
        },
        ...d.notes,
      ],
    }));
    reset();
  };

  const remove = (id: string) => update((d) => ({ ...d, notes: d.notes.filter((n) => n.id !== id) }));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes.filter((n) => (q ? (n.title + n.body).toLowerCase().includes(q) : true));
  }, [notes, query]);

  return (
    <AppShell>
      <PageHeader
        title="Notes"
        subtitle="Short, searchable revision notes for every subject."
        action={
          <Button className="rounded-xl" onClick={() => (open ? reset() : setOpen(true))}>
            <Plus className="size-4" /> {open ? "Close" : "New note"}
          </Button>
        }
      />

      {open ? (
        <div className="card-surface animate-rise mb-6 grid gap-4 p-6 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="n-title">Title</Label>
            <Input id="n-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Trig identities" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="n-subject">Subject</Label>
            <select
              id="n-subject"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">General</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="n-body">Note</Label>
            <Textarea id="n-body" rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Button className="rounded-xl" onClick={save}>
              Save note
            </Button>
            <Button variant="ghost" className="rounded-xl" onClick={reset}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      <div className="relative mb-6 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes…"
          className="pl-9"
          aria-label="Search notes"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No notes found" hint="Write your first note to remember the tricky bits." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((n, i) => (
            <div
              key={n.id}
              className="card-surface card-surface-hover animate-rise flex flex-col p-5"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <p className="font-semibold">{n.title}</p>
              <div className="mt-1">
                <SubjectDot subject={subjects.find((s) => s.id === n.subjectId)} />
              </div>
              <p className="mt-3 flex-1 whitespace-pre-wrap text-sm text-muted-foreground">{n.body}</p>
              <Button
                size="sm"
                variant="ghost"
                className="mt-4 self-start rounded-lg text-destructive"
                onClick={() => remove(n.id)}
              >
                <Trash2 className="size-4" /> Delete
              </Button>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}