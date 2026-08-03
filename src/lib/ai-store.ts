import { useCallback, useEffect, useState } from "react";
import type { UIMessage } from "ai";

export type ChatThread = {
  id: string;
  title: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
  messages: UIMessage[];
};

export type StoredFile = {
  id: string;
  name: string;
  kind: "pdf" | "docx" | "pptx" | "txt" | "image";
  mime: string;
  size: number;
  addedAt: number;
  text: string;
  /** data URL preview, images only */
  preview?: string;
  error?: string;
};

export const AI_MODELS = [
  { id: "google/gemini-3.6-flash", label: "Gemini 3.6 Flash — fast, balanced" },
  { id: "google/gemini-3.1-pro-preview", label: "Gemini 3.1 Pro — deepest reasoning" },
  { id: "openai/gpt-5.4-mini", label: "GPT-5.4 Mini — quick answers" },
  { id: "openai/gpt-5.5", label: "GPT-5.5 — highest quality" },
] as const;

export const AI_LANGUAGES = [
  { id: "auto", label: "Match my message" },
  { id: "English", label: "English" },
  { id: "Bangla", label: "Bangla (বাংলা)" },
  { id: "Hindi", label: "Hindi" },
  { id: "Arabic", label: "Arabic" },
] as const;

export type AiSettings = {
  model: string;
  language: string;
  fontSize: number; // px base for chat text
};

export type AiStats = {
  messagesSent: number;
  filesUploaded: number;
  charsGenerated: number;
};

export type AiData = {
  threads: ChatThread[];
  files: StoredFile[];
  settings: AiSettings;
  stats: AiStats;
};

export const DEFAULT_SETTINGS: AiSettings = {
  model: AI_MODELS[0].id,
  language: "auto",
  fontSize: 15,
};

const empty: AiData = {
  threads: [],
  files: [],
  settings: DEFAULT_SETTINGS,
  stats: { messagesSent: 0, filesUploaded: 0, charsGenerated: 0 },
};

const KEY = "study-ai-v2";
const LEGACY_KEY = "study-ai-chat-v1";
const EVENT = "study-ai-change";

export const aiUid = () => Math.random().toString(36).slice(2, 10);

export function newThread(): ChatThread {
  const now = Date.now();
  return { id: aiUid(), title: "New chat", pinned: false, createdAt: now, updatedAt: now, messages: [] };
}

function migrate(): ChatThread[] {
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as UIMessage[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [];
    const t = newThread();
    t.messages = parsed;
    t.title = threadTitle(parsed) ?? "Imported chat";
    window.localStorage.removeItem(LEGACY_KEY);
    return [t];
  } catch {
    return [];
  }
}

export function messageText(message: UIMessage) {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

export function threadTitle(messages: UIMessage[]) {
  const first = messages.find((m) => m.role === "user");
  if (!first) return null;
  const text = messageText(first).replace(/\s+/g, " ").trim();
  if (!text) return null;
  return text.length > 48 ? `${text.slice(0, 48)}…` : text;
}

export function readAi(): AiData {
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      const migrated = { ...empty, threads: migrate() };
      window.localStorage.setItem(KEY, JSON.stringify(migrated));
      return migrated;
    }
    const parsed = JSON.parse(raw) as Partial<AiData>;
    return {
      threads: Array.isArray(parsed.threads) ? parsed.threads : [],
      files: Array.isArray(parsed.files) ? parsed.files : [],
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
      stats: { ...empty.stats, ...(parsed.stats ?? {}) },
    };
  } catch {
    return empty;
  }
}

export function writeAi(next: AiData) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage full — drop the heaviest file texts and retry once.
    const trimmed: AiData = { ...next, files: next.files.slice(0, 5) };
    try {
      window.localStorage.setItem(KEY, JSON.stringify(trimmed));
    } catch {
      /* give up silently, in-memory state still works */
    }
  }
  window.dispatchEvent(new Event(EVENT));
}

export function useAiStore() {
  const [data, setData] = useState<AiData>(empty);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setData(readAi());
    setReady(true);
    const sync = () => setData(readAi());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const update = useCallback((fn: (d: AiData) => AiData) => {
    const next = fn(readAi());
    writeAi(next);
    setData(next);
    return next;
  }, []);

  return { ...data, ready, update };
}

export function sortThreads(threads: ChatThread[]) {
  return [...threads].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.updatedAt - a.updatedAt;
  });
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function formatWhen(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
