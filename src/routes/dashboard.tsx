import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, ClipboardList, Timer } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { EmptyState, StatCard, SubjectDot } from "@/components/study/Bits";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { daysUntil, formatDate, todayISO, useStudyStore } from "@/lib/study-store";

const TITLE = "Dashboard — StudyFlow Study Planner";
const DESC = "Today's tasks, homework progress, exam countdowns and a monthly calendar of every deadline.";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: Dashboard,
});

const pad = (n: number) => String(n).padStart(2, "0");

function Dashboard() {
  const { homework, exams, subjects, update, ready } = useStudyStore();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const today = todayISO();
  const todays = homework.filter((h) => h.due === today);
  const overdue = homework.filter((h) => !h.done && daysUntil(h.due) < 0);
  const done = homework.filter((h) => h.done).length;
  const pct = homework.length ? Math.round((done / homework.length) * 100) : 0;
  const nextExam = [...exams].filter((e) => daysUntil(e.date) >= 0).sort((a, b) => a.date.localeCompare(b.date))[0];

  const toggle = (id: string) =>
    update((d) => ({ ...d, homework: d.homework.map((h) => (h.id === id ? { ...h, done: !h.done } : h)) }));

  const cells = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const startPad = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const out: (string | null)[] = Array.from({ length: startPad }, () => null);
    for (let i = 1; i <= daysInMonth; i++) out.push(`${cursor.y}-${pad(cursor.m + 1)}-${pad(i)}`);
    return out;
  }, [cursor]);

  const monthLabel = new Date(cursor.y, cursor.m, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const shift = (n: number) =>
    setCursor((c) => {
      const d = new Date(c.y, c.m + n, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        subtitle={ready ? "Here's where you stand right now." : "Loading your planner…"}
        action={
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/homework">Manage homework</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Due today" value={todays.length} icon={<ClipboardList className="size-5" />} />
        <StatCard label="Overdue" value={overdue.length} icon={<Timer className="size-5" />} tone="warning" />
        <StatCard label="Completed" value={`${done}/${homework.length}`} icon={<CheckCircle2 className="size-5" />} tone="success" />
        <StatCard
          label={nextExam ? `Next exam · ${nextExam.title}` : "No upcoming exams"}
          value={nextExam ? `${daysUntil(nextExam.date)}d` : "—"}
          icon={<CalendarDays className="size-5" />}
        />
      </div>

      <div className="card-surface animate-rise mt-6 p-6">
        <div className="flex items-center justify-between text-sm font-medium">
          <span>Homework progress</span>
          <span className="text-muted-foreground">{pct}%</span>
        </div>
        <Progress value={pct} className="mt-3" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-xl font-bold">Today's tasks</h2>
          {todays.length === 0 ? (
            <EmptyState title="Nothing due today" hint="Enjoy it — or get ahead on this week's work." />
          ) : (
            <div className="grid gap-3">
              {todays.map((h) => (
                <div key={h.id} className="card-surface card-surface-hover flex items-center gap-3 p-4">
                  <Checkbox checked={h.done} onCheckedChange={() => toggle(h.id)} aria-label="Mark complete" />
                  <div className="min-w-0">
                    <p className={`truncate font-medium ${h.done ? "text-muted-foreground line-through" : ""}`}>
                      {h.title}
                    </p>
                    <SubjectDot subject={subjects.find((s) => s.id === h.subjectId)} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <h2 className="mb-3 mt-8 text-xl font-bold">Upcoming exams</h2>
          {exams.length === 0 ? (
            <EmptyState title="No exams yet" />
          ) : (
            <div className="grid gap-3">
              {[...exams]
                .sort((a, b) => a.date.localeCompare(b.date))
                .slice(0, 4)
                .map((e) => (
                  <div key={e.id} className="card-surface flex items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-medium">{e.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(e.date)}</p>
                    </div>
                    <span className="rounded-full bg-primary/12 px-3 py-1 text-sm font-semibold text-primary">
                      {daysUntil(e.date) < 0 ? "Done" : `${daysUntil(e.date)}d`}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-bold">{monthLabel}</h2>
            <div className="flex gap-1">
              <Button size="icon" variant="outline" aria-label="Previous month" onClick={() => shift(-1)}>
                <ChevronLeft className="size-4" />
              </Button>
              <Button size="icon" variant="outline" aria-label="Next month" onClick={() => shift(1)}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
          <div className="card-surface p-4">
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-muted-foreground">
              {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {cells.map((iso, i) => {
                if (!iso) return <div key={`p${i}`} />;
                const hw = homework.filter((h) => h.due === iso);
                const ex = exams.filter((e) => e.date === iso);
                const isToday = iso === today;
                return (
                  <div
                    key={iso}
                    className={`min-h-14 rounded-lg border p-1.5 text-left transition-colors ${
                      isToday ? "border-primary bg-primary/10" : "border-border/60 hover:bg-muted"
                    }`}
                  >
                    <span className={`text-xs font-semibold ${isToday ? "text-primary" : ""}`}>
                      {Number(iso.slice(8))}
                    </span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {hw.slice(0, 3).map((h) => (
                        <span
                          key={h.id}
                          title={h.title}
                          className="size-1.5 rounded-full"
                          style={{
                            backgroundColor:
                              subjects.find((s) => s.id === h.subjectId)?.color ?? "var(--color-muted-foreground)",
                          }}
                        />
                      ))}
                      {ex.length ? <span className="size-1.5 rounded-full bg-destructive" title="Exam" /> : null}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Coloured dots are homework by subject · red dots are exams.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}