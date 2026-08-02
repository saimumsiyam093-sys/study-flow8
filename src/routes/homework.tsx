import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { EmptyState, SubjectDot } from "@/components/study/Bits";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  daysUntil,
  formatDate,
  todayISO,
  uid,
  useStudyStore,
  type Homework,
} from "@/lib/study-store";

const TITLE = "Homework — StudyFlow Study Planner";
const DESC = "Add homework with due dates, filter by subject or status, and tick tasks off as you finish them.";

export const Route = createFileRoute("/homework")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: HomeworkPage,
});

type Filter = "all" | "todo" | "done" | "today" | "overdue";

function HomeworkPage() {
  const { homework, subjects, update } = useStudyStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Homework | null>(null);
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [due, setDue] = useState(todayISO());
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const reset = () => {
    setOpen(false);
    setEditing(null);
    setTitle("");
    setSubjectId("");
    setDue(todayISO());
  };

  const save = () => {
    if (!title.trim()) return;
    update((d) =>
      editing
        ? {
            ...d,
            homework: d.homework.map((h) =>
              h.id === editing.id ? { ...h, title: title.trim(), subjectId: subjectId || undefined, due } : h,
            ),
          }
        : {
            ...d,
            homework: [
              ...d.homework,
              { id: uid(), title: title.trim(), subjectId: subjectId || undefined, due, done: false },
            ],
          },
    );
    reset();
  };

  const toggle = (id: string) =>
    update((d) => ({
      ...d,
      homework: d.homework.map((h) => (h.id === id ? { ...h, done: !h.done } : h)),
    }));

  const remove = (id: string) =>
    update((d) => ({ ...d, homework: d.homework.filter((h) => h.id !== id) }));

  const startEdit = (h: Homework) => {
    setEditing(h);
    setOpen(true);
    setTitle(h.title);
    setSubjectId(h.subjectId ?? "");
    setDue(h.due);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...homework]
      .filter((h) => (q ? h.title.toLowerCase().includes(q) : true))
      .filter((h) => {
        if (filter === "todo") return !h.done;
        if (filter === "done") return h.done;
        if (filter === "today") return h.due === todayISO();
        if (filter === "overdue") return !h.done && daysUntil(h.due) < 0;
        return true;
      })
      .sort((a, b) => Number(a.done) - Number(b.done) || a.due.localeCompare(b.due));
  }, [homework, query, filter]);

  const done = homework.filter((h) => h.done).length;
  const pct = homework.length ? Math.round((done / homework.length) * 100) : 0;

  return (
    <AppShell>
      <PageHeader
        title="Homework"
        subtitle="Everything you owe, sorted by what's due first."
        action={
          <Button className="rounded-xl" onClick={() => (open ? reset() : setOpen(true))}>
            <Plus className="size-4" /> {open ? "Close" : "New homework"}
          </Button>
        }
      />

      <div className="card-surface animate-rise mb-6 p-5">
        <div className="flex items-center justify-between text-sm font-medium">
          <span>Overall progress</span>
          <span className="text-muted-foreground">
            {done}/{homework.length} · {pct}%
          </span>
        </div>
        <Progress value={pct} className="mt-3" />
      </div>

      {open ? (
        <div className="card-surface animate-rise mb-6 grid gap-4 p-6 sm:grid-cols-3">
          <div className="grid gap-2 sm:col-span-3">
            <Label htmlFor="h-title">Task</Label>
            <Input id="h-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Chapter 4 exercises" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="h-subject">Subject</Label>
            <select
              id="h-subject"
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
          <div className="grid gap-2">
            <Label htmlFor="h-due">Due date</Label>
            <Input id="h-due" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </div>
          <div className="flex items-end gap-2">
            <Button className="rounded-xl" onClick={save}>
              {editing ? "Save" : "Add"}
            </Button>
            <Button variant="ghost" className="rounded-xl" onClick={reset}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks…"
            className="pl-9"
            aria-label="Search tasks"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "todo", "today", "overdue", "done"] as Filter[]).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              className="rounded-full capitalize"
              onClick={() => setFilter(f)}
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Nothing here" hint="Try a different filter or add a new task." />
      ) : (
        <div className="grid gap-3">
          {filtered.map((h, i) => {
            const subject = subjects.find((s) => s.id === h.subjectId);
            const left = daysUntil(h.due);
            return (
              <div
                key={h.id}
                className="card-surface card-surface-hover animate-rise flex items-center gap-4 p-4"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <Checkbox checked={h.done} onCheckedChange={() => toggle(h.id)} aria-label="Mark complete" />
                <div className="min-w-0 flex-1">
                  <p className={`truncate font-medium ${h.done ? "text-muted-foreground line-through" : ""}`}>
                    {h.title}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-3">
                    <SubjectDot subject={subject} />
                    <span className="text-xs text-muted-foreground">{formatDate(h.due)}</span>
                    {!h.done ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          left < 0
                            ? "bg-destructive/12 text-destructive"
                            : left === 0
                              ? "bg-warning/20 text-warning"
                              : "bg-success/15 text-success"
                        }`}
                      >
                        {left < 0 ? `${-left}d overdue` : left === 0 ? "Due today" : `${left}d left`}
                      </span>
                    ) : null}
                  </div>
                </div>
                <Button size="icon" variant="ghost" aria-label="Edit task" onClick={() => startEdit(h)}>
                  <Pencil className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Delete task"
                  className="text-destructive"
                  onClick={() => remove(h.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}