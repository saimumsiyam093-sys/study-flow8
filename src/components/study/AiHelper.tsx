import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Eraser } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { useStudyStore, formatDate } from "@/lib/study-store";

const STORAGE_KEY = "study-ai-chat-v1";

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

function messageText(message: UIMessage) {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

function loadSaved(): UIMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as UIMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

export function AiHelper() {
  const store = useStudyStore();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [input, setInput] = useState("");

  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const { messages, setMessages, sendMessage, status, error } = useChat({
    id: "study-ai-helper",
    transport,
  });

  // Restore the saved conversation from this browser.
  useEffect(() => {
    const saved = loadSaved();
    if (saved.length > 0) setMessages(saved);
  }, [setMessages]);

  // Persist locally whenever the conversation settles or grows.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (messages.length === 0) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (error) toast.error(error.message || "The AI helper could not answer right now.");
  }, [error]);

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (!busy) textareaRef.current?.focus();
  }, [busy]);

  const plannerContext = useMemo(() => {
    const name = (id?: string) => store.subjects.find((s) => s.id === id)?.name ?? "General";
    const hw = store.homework
      .filter((h) => !h.done)
      .slice(0, 12)
      .map((h) => `- Homework: ${h.title} (${name(h.subjectId)}) due ${formatDate(h.due)}`);
    const ex = store.exams
      .slice(0, 12)
      .map((e) => `- Exam: ${e.title} (${name(e.subjectId)}) on ${formatDate(e.date)}`);
    const subs = store.subjects.map((s) => s.name).join(", ");
    return [subs ? `Subjects: ${subs}` : "", ...hw, ...ex].filter(Boolean).join("\n");
  }, [store.subjects, store.homework, store.exams]);

  const submit = useCallback(
    (text: string) => {
      const value = text.trim();
      if (!value || busy) return;
      setInput("");
      void sendMessage({ text: value }, { body: { context: plannerContext } });
    },
    [busy, plannerContext, sendMessage],
  );

  const clearChat = () => {
    setMessages([]);
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
    toast.success("Chat cleared");
  };

  return (
    <div className="glass-card animate-rise overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-border/60 bg-gradient-ai px-4 py-4 text-primary-foreground sm:px-6">
        <img
          src={mascot}
          alt="StudyFlow AI Helper mascot"
          width={512}
          height={512}
          className="size-11 shrink-0 drop-shadow"
        />
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

      <Conversation className="h-[58vh] min-h-[380px]">
        <ConversationContent className="gap-5">
          {messages.length === 0 ? (
            <div className="mx-auto max-w-md py-10 text-center">
              <img
                src={mascot}
                alt=""
                width={512}
                height={512}
                loading="lazy"
                className="mx-auto size-20 animate-rise"
              />
              <h2 className="mt-4 text-xl font-semibold">Hi! What are we studying today?</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Ask me to explain a topic, solve a maths problem step by step, summarise notes,
                build a quiz or plan your week.
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
                  {message.role === "assistant" && text ? <CopyButton text={text} /> : null}
                </Message>
              );
            })
          )}
          {status === "submitted" ? <Shimmer>Thinking…</Shimmer> : null}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t border-border/60 p-3 sm:p-4">
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {QUICK_PROMPTS.map((prompt) => (
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
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} disabled={!input.trim() || busy} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}