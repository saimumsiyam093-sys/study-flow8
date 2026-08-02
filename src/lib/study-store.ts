import { useCallback, useEffect, useState } from "react";

export type Subject = {
  id: string;
  name: string;
  teacher?: string;
  color: string;
};

export type Homework = {
  id: string;
  title: string;
  subjectId?: string;
  due: string; // yyyy-mm-dd
  notes?: string;
  done: boolean;
};

export type Exam = {
  id: string;
  title: string;
  subjectId?: string;
  date: string; // yyyy-mm-dd
  time?: string;
  room?: string;
};

export type Note = {
  id: string;
  title: string;
  subjectId?: string;
  body: string;
  updated: string;
};

export const SUBJECT_COLORS = [
  "var(--accent-1)",
  "var(--accent-2)",
  "var(--accent-3)",
  "var(--accent-4)",
  "var(--accent-5)",
  "var(--accent-6)",
];

export const uid = () => Math.random().toString(36).slice(2, 10);

const KEY = "study-planner-v1";

export type StoreData = {
  subjects: Subject[];
  homework: Homework[];
  exams: Exam[];
  notes: Note[];
};

const seed = (): StoreData => {
  const today = new Date();
  const d = (n: number) => {
    const x = new Date(today);
    x.setDate(x.getDate() + n);
    return x.toISOString().slice(0, 10);
  };
  const math = uid();
  const bio = uid();
  const hist = uid();
  return {
    subjects: [
      { id: math, name: "Mathematics", teacher: "Ms. Alvarez", color: SUBJECT_COLORS[0] },
      { id: bio, name: "Biology", teacher: "Mr. Chen", color: SUBJECT_COLORS[1] },
      { id: hist, name: "History", teacher: "Mrs. Okafor", color: SUBJECT_COLORS[2] },
    ],
    homework: [
      { id: uid(), title: "Quadratic equations worksheet", subjectId: math, due: d(0), done: false },
      { id: uid(), title: "Cell division lab report", subjectId: bio, due: d(2), done: false },
      { id: uid(), title: "Essay draft: Industrial Revolution", subjectId: hist, due: d(5), done: true },
    ],
    exams: [
      { id: uid(), title: "Algebra Midterm", subjectId: math, date: d(7), time: "09:00", room: "B12" },
      { id: uid(), title: "Biology Unit Test", subjectId: bio, date: d(14), time: "13:30", room: "Lab 3" },
    ],
    notes: [
      {
        id: uid(),
        title: "Photosynthesis summary",
        subjectId: bio,
        body: "Light reactions happen in the thylakoid membrane; Calvin cycle in the stroma.",
        updated: new Date().toISOString(),
      },
    ],
  };
};

const empty: StoreData = { subjects: [], homework: [], exams: [], notes: [] };

function read(): StoreData {
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      const s = seed();
      window.localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    }
    return { ...empty, ...(JSON.parse(raw) as StoreData) };
  } catch {
    return empty;
  }
}

const EVENT = "study-planner-change";

export function useStudyStore() {
  const [data, setData] = useState<StoreData>(empty);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setData(read());
    setReady(true);
    const sync = () => setData(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const update = useCallback((fn: (d: StoreData) => StoreData) => {
    const next = fn(read());
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(EVENT));
    setData(next);
  }, []);

  return { ...data, ready, update };
}

export const todayISO = () => new Date().toISOString().slice(0, 10);

export function daysUntil(dateISO: string) {
  const a = new Date(todayISO() + "T00:00:00").getTime();
  const b = new Date(dateISO + "T00:00:00").getTime();
  return Math.round((b - a) / 86400000);
}

export function formatDate(dateISO: string) {
  const d = new Date(dateISO + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}