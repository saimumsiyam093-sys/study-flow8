import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Download, Eraser, FileDown, Mic, Square, Volume2 } from "lucide-react";
import { toast } from "sonner";

import mascot from "@/assets/ai-helper-mascot.png";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { AiFiles } from "@/components/study/AiFiles";
import { Button } from "@/components/ui/button";
import { useVoiceInput, useSpeaker } from "@/hooks/use-speech";
import { downloadPdf, downloadTxt } from "@/lib/ai-export";
import {
  messageText,
  readAi,
  threadTitle,
  useAiStore,
  type StoredFile,
} from "@/lib/ai-store";
import { useStudyStore, formatDate } from "@/lib/study-store";

const QUICK_PROMPTS = [
  "Explain photosynthesis in simple words",
  "Solve 2x² − 5x + 3 = 0 step by step",
  "Summarise this paragraph into short notes: ",
  "Make a 10 question quiz on World War II",
  "Create flashcards for ICT number systems",
  "Plan my study week using my homework and exams",
  "Check the grammar of this text: ",
  "Give me time management tips for exams",
];

const DOC_PROMPTS = [
  "Summarise the uploaded file",
  "Extract the most important points",
  "Make a 10 question quiz from the file",
  "Create flashcards from the file",
];

function MessageTools({ id, text }: { id: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const { speak, speakingId, supported } = useSpeaker();

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            toast.error("Copying is blocked in this browser");
          }
        }}
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        {copied ? "Copied" : "Copy"}
      </Button>
      {supported ? (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
          onClick={() => speak(id, text)}
        >
          {speakingId === id ? <Square className="size-3.5" /> : <Volume2 className="size-3.5" />}
          {speakingId === id ? "Stop" : "Listen"}
        </Button>
      ) : null}
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
        onClick={() => downloadTxt(text, "studyflow-answer")}
      >
        <Download className="size-3.5" /> TXT
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
        onClick={() => {
          void downloadPdf(text, "studyflow-answer").catch(() => toast.error("Could not create the PDF"));
        }}
      >
        <FileDown className="size-3.5" /> PDF
      </Button>
    </div>
  );
}

export function AiHelper({ threadId }: { threadId: string }) {
  const study = useStudyStore();
  const ai = useAiStore();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [input, setInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const initialMessages = useMemo(
    () => readAi().threads.find((t) => t.id === threadId)?.messages ?? [],
    [threadId],
  );

  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const { messages, setMessages, sendMessage, status, error } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
  });

  const busy = status === "submitted" || status === "streaming";

  // Persist this thread whenever it changes.
  useEffect(() => {
    if (messages.length === 0) return;
    ai.update((d) => {
      const existing = d.threads.find((t) => t.id === threadId);
      const title = existing?.title && existing.title !== "New chat" ? existing.title : threadTitle(messages) ?? "New chat";
      const updated = {
        id: threadId,
        pinned: existing?.pinned ?? false,
        createdAt: existing?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
        title,
        messages,
      };
      return {
        ...d,
        threads: existing
          ? d.threads.map((t) => (t.id === threadId ? updated : t))
          : [updated, ...d.threads],
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, threadId]);

  useEffect(() => {
    if (error) toast.error(error.message || "The AI helper could not answer right now.");
  }, [error]);

  useEffect(() => {
    if (!busy) textareaRef.current?.focus();
  }, [busy, threadId]);

  const plannerContext = useMemo(() => {
    const name = (id?: string) => study.subjects.find((s) => s.id === id)?.name ?? "General";
    const hw = study.homework
      .filter((h) => !h.done)
      .slice(0, 12)
      .map((h) => `- Homework: ${h.title} (${name(h.subjectId)}) due ${formatDate(h.due)}`);
    const ex = study.exams
      .slice(0, 12)
      .map((e) => `- Exam: ${e.title} (${name(e.subjectId)}) on ${formatDate(e.date)}`);
    const subs = study.subjects.map((s) => s.name).join(", ");
    return [subs ? `Subjects: ${subs}` : "", ...hw, ...ex].filter(Boolean).join("\n");
  }, [study.subjects, study.homework, study.exams]);

  const documents = useMemo(
    () =>
      ai.files
        .filter((f) => selectedFiles.includes(f.id) && f.text)
        .map((f) => `### File: ${f.name}\n${f.text}`)
        .join("\n\n"),
    [ai.files, selectedFiles],
  );

  const fetchSuggestions = useCallback(async (question: string, answer: string) => {
    try {
      const response = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, answer }),
      });
      if (!response.ok) return;
      const data = (await response.json()) as { suggestions?: string[] };
      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
    } catch {
      setSuggestions([]);
    }
  }, []);

  const lastAssistant = messages.filter((m) => m.role === "assistant").at(-1);
  const lastUser = messages.filter((m) => m.role === "user").at(-1);
  const lastAssistantId = lastAssistant?.id;

  useEffect(() => {
    if (status !== "ready" || !lastAssistantId) return;
    const answer = lastAssistant ? messageText(lastAssistant) : "";
    if (!answer) return;
    void fetchSuggestions(lastUser ? messageText(lastUser) : "", answer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, lastAssistantId]);

  const submit = useCallback(
    (text: string) => {
      const value = text.trim();
      if (!value || busy) return;
      setInput("");
      setSuggestions([]);
      ai.update((d) => ({ ...d, stats: { ...d.stats, messagesSent: d.stats.messagesSent + 1 } }));
      void sendMessage(
        { text: value },
        {
          body: {
            context: plannerContext,
            documents,
            model: ai.settings.model,
            language: ai.settings.language,
          },
        },
      );
    },
    [busy, plannerContext, documents, ai, sendMessage],
  );

  const voice = useVoiceInput((text) => setInput((prev) => (prev ? `${prev} ${text}` : text)));

  const addFiles = (incoming: StoredFile[]) => {
    const usable = incoming.filter((f) => !f.error);
    ai.update((d) => ({
      ...d,
      files: [...incoming, ...d.files].slice(0, 30),
      stats: { ...d.stats, filesUploaded: d.stats.filesUploaded + usable.length },
    }));
    setSelectedFiles((prev) => [...usable.map((f) => f.id), ...prev]);
  };

  const clearChat = () => {
    setMessages([]);
    setSuggestions([]);
    ai.update((d) => ({ ...d, threads: d.threads.filter((t) => t.id !== threadId) }));
    toast.success("Chat cleared");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="glass-card animate-rise overflow-hidden" style={{ fontSize: ai.settings.fontSize }}>
        <div className="flex flex-wrap items-center gap-3 border-b border-border/60 bg-gradient-ai px-4 py-4 text-primary-foreground sm:px-6">
          <img src={mascot} alt="StudyFlow AI Helper mascot" width={512} height={512} className="size-11 shrink-0 drop-shadow" />
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold leading-tight">AI Study Helper</p>
            <p className="truncate text-xs opacity-90">
              Math • Science • English • Bangla • History • Geography • ICT • GK
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="ml-auto gap-1.5"
            onClick={clearChat}
            disabled={messages.length === 0}
          >
            <Eraser className="size-4" />
            Clear chat
          </Button>
        </div>

        <Conversation className="h-[54vh] min-h-[360px]">
          <ConversationContent className="gap-5">
            {messages.length === 0 ? (
              <div className="mx-auto max-w-md py-10 text-center">
                <img src={mascot} alt="" width={512} height={512} loading="lazy" className="mx-auto size-20 animate-rise" />
                <h2 className="mt-4 text-xl font-semibold">Hi! What are we studying today?</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Ask me anything, or upload your notes, slides and photos and I will explain, summarise, quiz
                  and make flashcards from them.
                </p>
              </div>
            ) : (
              messages.map((message) => {
                const text = messageText(message);
                return (
                  <Message key={message.id} from={message.role} className="animate-rise">
                    <MessageContent>
                      <MessageResponse>{text}</MessageResponse>
                    </MessageContent>
                    {message.role === "assistant" && text ? <MessageTools id={message.id} text={text} /> : null}
                  </Message>
                );
              })
            )}
            {status === "submitted" ? <Shimmer>Thinking…</Shimmer> : null}
            {!busy && suggestions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => submit(s)}
                    className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-primary/10"
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : null}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="border-t border-border/60 p-3 sm:p-4">
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            {(selectedFiles.length > 0 ? [...DOC_PROMPTS, ...QUICK_PROMPTS] : QUICK_PROMPTS).map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => {
                  if (prompt.endsWith(": ")) {
                    setInput(prompt);
                    textareaRef.current?.focus();
                  } else {
                    submit(prompt);
                  }
                }}
                className="shrink-0 rounded-full border border-border/70 bg-background/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {prompt.replace(": ", "")}
              </button>
            ))}
          </div>

          <PromptInput
            onSubmit={(_message, event) => {
              event.preventDefault();
              submit(input);
            }}
          >
            <PromptInputTextarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your studies…"
              autoFocus
            />
            <PromptInputFooter className="justify-end gap-2">
              {voice.supported ? (
                <Button
                  type="button"
                  variant={voice.listening ? "default" : "ghost"}
                  size="icon-sm"
                  aria-label={voice.listening ? "Stop dictation" : "Start voice input"}
                  onClick={voice.toggle}
                >
                  <Mic className="size-4" />
                </Button>
              ) : null}
              <PromptInputSubmit status={status} disabled={!input.trim() || busy} />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>

      <div className="glass-card animate-rise p-3 sm:p-4">
        <h2 className="mb-3 font-display text-base font-semibold">Study materials</h2>
        <AiFiles
          files={ai.files}
          selected={selectedFiles}
          onAdd={addFiles}
          onRemove={(id) => {
            ai.update((d) => ({ ...d, files: d.files.filter((f) => f.id !== id) }));
            setSelectedFiles((prev) => prev.filter((f) => f !== id));
          }}
          onToggle={(id) =>
            setSelectedFiles((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]))
          }
        />
      </div>
    </div>
  );
}
