import type { StoredFile } from "@/lib/ai-store";
import { aiUid } from "@/lib/ai-store";

export const ACCEPTED_EXT = [".pdf", ".docx", ".txt", ".md", ".pptx", ".jpg", ".jpeg", ".png"];
export const ACCEPT_ATTR = ACCEPTED_EXT.join(",");
export const MAX_FILE_BYTES = 15 * 1024 * 1024;
const MAX_TEXT = 24_000;

function kindOf(name: string): StoredFile["kind"] | null {
  const ext = name.toLowerCase().slice(name.lastIndexOf("."));
  if (ext === ".pdf") return "pdf";
  if (ext === ".docx") return "docx";
  if (ext === ".pptx") return "pptx";
  if (ext === ".txt" || ext === ".md") return "txt";
  if (ext === ".jpg" || ext === ".jpeg" || ext === ".png") return "image";
  return null;
}

const clip = (s: string) => {
  const clean = s.replace(/\u0000/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return clean.length > MAX_TEXT ? `${clean.slice(0, MAX_TEXT)}\n\n…(truncated)` : clean;
};

async function readDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the file"));
    reader.readAsDataURL(file);
  });
}

async function extractPdf(file: File) {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages: string[] = [];
  const max = Math.min(doc.numPages, 40);
  for (let i = 1; i <= max; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ");
    pages.push(`--- Page ${i} ---\n${text}`);
  }
  await doc.destroy();
  return pages.join("\n\n");
}

async function extractDocx(file: File) {
  const mammoth = await import("mammoth/mammoth.browser.js");
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return result.value;
}

async function extractPptx(file: File) {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const slideNames = Object.keys(zip.files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => {
      const n = (s: string) => Number(s.replace(/\D/g, ""));
      return n(a) - n(b);
    });
  const out: string[] = [];
  for (const [index, name] of slideNames.entries()) {
    const xml = await zip.files[name]!.async("string");
    const texts = [...xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((m) =>
      m[1]!.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&"),
    );
    out.push(`--- Slide ${index + 1} ---\n${texts.join("\n")}`);
  }
  return out.join("\n\n");
}

async function ocrImage(dataUrl: string) {
  const response = await fetch("/api/ocr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataUrl }),
  });
  if (!response.ok) {
    throw new Error((await response.text().catch(() => "")) || "Could not read text from the image");
  }
  const data = (await response.json()) as { text?: string };
  return data.text ?? "";
}

export async function extractFile(file: File): Promise<StoredFile> {
  const kind = kindOf(file.name);
  const base: StoredFile = {
    id: aiUid(),
    name: file.name,
    kind: kind ?? "txt",
    mime: file.type,
    size: file.size,
    addedAt: Date.now(),
    text: "",
  };

  if (!kind) return { ...base, error: "Unsupported file type" };
  if (file.size > MAX_FILE_BYTES) return { ...base, error: "File is larger than 15 MB" };

  try {
    if (kind === "txt") return { ...base, text: clip(await file.text()) };
    if (kind === "pdf") return { ...base, text: clip(await extractPdf(file)) };
    if (kind === "docx") return { ...base, text: clip(await extractDocx(file)) };
    if (kind === "pptx") return { ...base, text: clip(await extractPptx(file)) };
    const preview = await readDataUrl(file);
    return { ...base, preview, text: clip(await ocrImage(preview)) };
  } catch (error) {
    return { ...base, error: error instanceof Error ? error.message : "Could not read this file" };
  }
}
