import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { EmptyState, SubjectDot } from "@/components/study/Bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { daysUntil, formatDate, todayISO, uid, useStudyStore } from "@/lib/study-store";

const TITLE = "Exams — StudyFlow Study Planner";
const DESC = "Schedule your exams and see a live countdown of how many days you have left to revise.";

export const Route = createFileRoute("/exams")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: ExamsPage,
});

function ExamsPage() {
  const { exams, subjects, update } = useStudyStore();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("09:00");
  const [room, setRoom] = useState("");

  const reset = () => {
    setOpen(false);
    setTitle("");
    setSubjectId("");
    setDate(todayISO());
    setTime("09:00");
    setRoom("");
  };

  const save = () => {
    if (!title.trim()) return;
    update((d) => ({
      ...d,
      exams: [
        ...d.exams,
        { id: uid(), title: title.trim(), subjectId: subjectId || undefined, date, time, room: room.trim() },
      ],
    }));
    reset();
  };

  const remove = (id: string) => update((d) => ({ ...d, exams: d.exams.filter((e) => e.id !== id) }));

  const sorted = [...exams].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <AppShell>
      <PageHeader
        title="Exams"
        subtitle="Countdowns so nothing ever sneaks up on you."
        action={
          <Button className="rounded-xl" onClick={() => (open ? reset() : setOpen(true))}>
            <Plus className="size-4" /> {open ? "Close" : "New exam"}
          </Button>
        }
      />

      {open ? (
        <div className="card-surface animate-rise mb-8 grid gap-4 p-6 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="e-title">Exam name</Label>
            <Input id="e-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Chemistry Final" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="e-subject">Subject</Label>
            <select
              id="e-subject"
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
            <Label htmlFor="e-date">Date</Label>
            <Input id="e-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="e-time">Time</Label>
            <Input id="e-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="e-room">Room</Label>
            <Input id="e-room" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="A21" />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Button className="rounded-xl" onClick={save}>
              Add exam
            </Button>
            <Button variant="ghost" className="rounded-xl" onClick={reset}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {sorted.length === 0 ? (
        <EmptyState title="No exams scheduled" hint="Add one to start the countdown." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sorted.map((e, i) => {
            const left = daysUntil(e.date);
            const subject = subjects.find((s) => s.id === e.subjectId);
            return (
              <div
                key={e.id}
                className="card-surface card-surface-hover animate-rise relative overflow-hidden p-5"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-brand" />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{e.title}</p>
                    <div className="mt-1">
                      <SubjectDot subject={subject} />
                    </div>
                  </div>
                  <div className="rounded-xl bg-primary/12 px-3 py-2 text-center text-primary">
                    <p className="text-xl font-bold leading-none">{left < 0 ? "—" : left}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wide">
                      {left < 0 ? "done" : left === 1 ? "day" : "days"}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  {formatDate(e.date)}
                  {e.time ? ` · ${e.time}` : ""}
                  {e.room ? ` · Room ${e.room}` : ""}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-3 rounded-lg text-destructive"
                  onClick={() => remove(e.id)}
                >
                  <Trash2 className="size-4" /> Delete
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}