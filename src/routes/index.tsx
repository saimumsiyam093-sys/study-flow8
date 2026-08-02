import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Moon,
  NotebookPen,
  Search,
  Timer,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

const TITLE = "StudyFlow — Study Planner for Students";
const DESC =
  "Plan subjects, homework, exams and notes in one colorful study planner. Countdowns, progress tracking and a calendar — saved on your device, no login.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: Index,
});

const FEATURES = [
  { icon: BookOpen, title: "Subjects", text: "Create colour-coded subjects with teachers." },
  { icon: ClipboardList, title: "Homework", text: "Due dates, filters and one-tap completion." },
  { icon: Timer, title: "Exam countdown", text: "See exactly how many days you have left." },
  { icon: CalendarDays, title: "Calendar view", text: "Every deadline on a monthly grid." },
  { icon: NotebookPen, title: "Notes", text: "Quick revision notes attached to subjects." },
  { icon: Search, title: "Search & filter", text: "Find any task in a second." },
  { icon: CheckCircle2, title: "Progress bars", text: "Watch your completed work grow." },
  { icon: Moon, title: "Dark mode", text: "Comfortable late-night study sessions." },
];

function Index() {
  return (
    <AppShell>
      <section className="card-surface bg-gradient-soft animate-rise overflow-hidden p-8 md:p-14">
        <span className="inline-flex rounded-full bg-primary/12 px-3 py-1 text-xs font-semibold text-primary">
          No login · Saved on your device
        </span>
        <h1 className="mt-5 max-w-2xl text-4xl font-bold leading-tight md:text-6xl">
          Stay ahead of every{" "}
          <span className="bg-gradient-brand bg-clip-text text-transparent">deadline</span>
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          StudyFlow keeps your subjects, homework, exams and notes in one clean, colourful planner
          that works on phone, tablet and desktop.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" className="rounded-xl">
            <Link to="/dashboard">Open dashboard</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-xl">
            <Link to="/homework">Add homework</Link>
          </Button>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">Everything a student needs</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="card-surface card-surface-hover animate-rise p-5"
              style={{ animationDelay: `${i * 45}ms` }}
            >
              <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                <f.icon className="size-5" />
              </span>
              <p className="mt-4 font-semibold">{f.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
