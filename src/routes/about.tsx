import { createFileRoute, Link } from "@tanstack/react-router";
import { Database, Rocket, ShieldCheck, Smartphone } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

const TITLE = "About StudyFlow — Free Study Planner";
const DESC = "StudyFlow is a free, private study planner that stores everything in your browser. No accounts, no tracking, works offline-friendly on any device.";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: AboutPage,
});

const POINTS = [
  { icon: Database, title: "Local storage only", text: "Your planner lives in this browser — nothing is uploaded." },
  { icon: ShieldCheck, title: "No login needed", text: "Open the site and start planning immediately." },
  { icon: Smartphone, title: "Works everywhere", text: "Responsive layouts for phone, tablet and desktop." },
  { icon: Rocket, title: "Fast and light", text: "Instant page changes and smooth animations." },
];

function AboutPage() {
  return (
    <AppShell>
      <PageHeader title="About StudyFlow" subtitle="A calm, colourful planner built for students." />

      <div className="card-surface bg-gradient-soft animate-rise p-8">
        <p className="max-w-2xl text-lg text-muted-foreground">
          StudyFlow brings subjects, homework, exams and revision notes into one place so you always know what
          to do next. Track progress, watch exam countdowns, and see every deadline on a monthly calendar.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {POINTS.map((p, i) => (
          <div
            key={p.title}
            className="card-surface card-surface-hover animate-rise p-5"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground">
              <p.icon className="size-5" />
            </span>
            <p className="mt-4 font-semibold">{p.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{p.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <Button asChild size="lg" className="rounded-xl">
          <Link to="/dashboard">Go to dashboard</Link>
        </Button>
      </div>
    </AppShell>
  );
}