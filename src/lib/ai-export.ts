import type { ChatThread } from "@/lib/ai-store";
import { messageText } from "@/lib/ai-store";

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

const safeName = (name: string) =>
  name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 40) || "studyflow";

export function downloadTxt(text: string, name: string) {
  download(new Blob([text], { type: "text/plain;charset=utf-8" }), `${safeName(name)}.txt`);
}

export async function downloadPdf(text: string, name: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const width = doc.internal.pageSize.getWidth() - margin * 2;
  const height = doc.internal.pageSize.getHeight() - margin;
  doc.setFontSize(11);
  const lines = doc.splitTextToSize(text, width) as string[];
  let y = margin;
  for (const line of lines) {
    if (y > height - 16) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += 16;
  }
  doc.save(`${safeName(name)}.pdf`);
}

export function threadToText(thread: ChatThread) {
  const header = `${thread.title}\n${new Date(thread.updatedAt).toLocaleString()}\n\n`;
  return (
    header +
    thread.messages
      .map((m) => `${m.role === "user" ? "You" : "AI Study Helper"}:\n${messageText(m)}`)
      .join("\n\n---\n\n")
  );
}

export function exportThreads(threads: ChatThread[]) {
  const payload = JSON.stringify({ app: "studyflow-ai", version: 1, threads }, null, 2);
  download(new Blob([payload], { type: "application/json" }), "studyflow-chats.json");
}

export function parseImportedThreads(raw: string): ChatThread[] {
  const parsed = JSON.parse(raw) as { threads?: unknown } | unknown[];
  const list = Array.isArray(parsed) ? parsed : (parsed.threads ?? []);
  if (!Array.isArray(list)) throw new Error("This file does not contain any chats");
  return list.filter(
    (t): t is ChatThread =>
      !!t && typeof t === "object" && Array.isArray((t as ChatThread).messages) && typeof (t as ChatThread).id === "string",
  );
}
