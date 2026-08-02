import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { EmptyState } from "@/components/study/Bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SUBJECT_COLORS, pickColor, uid, useStudyStore, type Subject } from "@/lib/study-store";

const TITLE = "Subjects — StudyFlow Study Planner";
const DESC = "Create, edit and delete colour-coded subjects to organise your homework and exams.";

export const Route = createFileRoute("/subjects")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: SubjectsPage,
});

function SubjectsPage() {
  const { subjects, homework, exams, update } = useStudyStore();
  const [editing, setEditing] = useState<Subject | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [teacher, setTeacher] = useState("");
  const [color, setColor] = useState(pickColor(0));

  const reset = () => {
    setEditing(null);
    setOpen(false);
    setName("");
    setTeacher("");
    setColor(pickColor(subjects.length));
  };

  const startEdit = (s: Subject) => {
    setEditing(s);
    setOpen(true);
    setName(s.name);
    setTeacher(s.teacher ?? "");
    setColor(s.color);
  };

  const save = () => {
    if (!name.trim()) return;
    update((d) =>
      editing
        ? {
            ...d,
            subjects: d.subjects.map((s) =>
              s.id === editing.id ? { ...s, name: name.trim(), teacher: teacher.trim(), color } : s,
            ),
          }
        : {
            ...d,
            subjects: [...d.subjects, { id: uid(), name: name.trim(), teacher: teacher.trim(), color }],
          },
    );
    reset();
  };

  const remove = (id: string) =>
    update((d) => ({
      ...d,
      subjects: d.subjects.filter((s) => s.id !== id),
      homework: d.homework.filter((h) => h.subjectId !== id),
      exams: d.exams.filter((e) => e.subjectId !== id),
      notes: d.notes.filter((n) => n.subjectId !== id),
    }));

  return (
    <AppShell>
      <PageHeader
        title="Subjects"
        subtitle="Colour-code your classes so everything else stays organised."
        action={
          <Button className="rounded-xl" onClick={() => (open ? reset() : setOpen(true))}>
            <Plus className="size-4" /> {open ? "Close" : "New subject"}
          </Button>
        }
      />

      {open ? (
        <div className="card-surface animate-rise mb-8 grid gap-4 p-6 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="s-name">Subject name</Label>
            <Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Physics" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="s-teacher">Teacher (optional)</Label>
            <Input
              id="s-teacher"
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              placeholder="Mr. Smith"
            />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label>Colour</Label>
            <div className="flex gap-2">
              {SUBJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Choose colour ${c}`}
                  onClick={() => setColor(c)}
                  className={`size-8 rounded-full transition-transform ${color === c ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : "hover:scale-110"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Button className="rounded-xl" onClick={save}>
              {editing ? "Save changes" : "Add subject"}
            </Button>
            <Button variant="ghost" className="rounded-xl" onClick={reset}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {subjects.length === 0 ? (
        <EmptyState title="No subjects yet" hint="Add your first class to get started." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((s, i) => {
            const hw = homework.filter((h) => h.subjectId === s.id);
            const done = hw.filter((h) => h.done).length;
            return (
              <div
                key={s.id}
                className="card-surface card-surface-hover animate-rise overflow-hidden"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="h-2 w-full" style={{ backgroundColor: s.color }} />
                <div className="p-5">
                  <p className="text-lg font-semibold">{s.name}</p>
                  <p className="text-sm text-muted-foreground">{s.teacher || "No teacher set"}</p>
                  <p className="mt-4 text-sm text-muted-foreground">
                    {done}/{hw.length} homework done · {exams.filter((e) => e.subjectId === s.id).length} exams
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline" className="rounded-lg" onClick={() => startEdit(s)}>
                      <Pencil className="size-4" /> Edit
                    </Button>
                    <Button size="sm" variant="ghost" className="rounded-lg text-destructive" onClick={() => remove(s.id)}>
                      <Trash2 className="size-4" /> Delete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}