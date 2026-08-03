import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

type ChatRequestBody = { messages?: unknown; context?: unknown };

const SYSTEM_PROMPT = `You are "StudyFlow AI Helper", a friendly study assistant for school students.

Scope: Math, Science, English, Bangla, History, Geography, ICT and General Knowledge.

How you answer:
- Use simple, encouraging language suitable for school students.
- ALWAYS explain the reasoning, never just the final answer.
- For math, show clear numbered step-by-step working, then the final answer.
- For summaries, produce short bullet-point notes.
- For quizzes, produce exactly the requested number of questions (5, 10 or 20) with options where useful, and put the answer key with explanations at the end.
- For flashcards, use a markdown table with "Front" and "Back" columns.
- For study plans, use the student's homework and exam data (given below when available) and produce a realistic day-by-day plan with time blocks.
- For grammar/spelling corrections, show the corrected text first, then a short list of what changed and why.
- Give motivational tips and time-management advice when asked.
- Reply in the language the student writes in (English or Bangla).
- Use markdown headings, bullets and bold text so answers are easy to scan. Keep answers focused.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as ChatRequestBody;
        const messages = body.messages;
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) {
          return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        }

        const context =
          typeof body.context === "string" && body.context.trim().length > 0
            ? `\n\nThe student's current planner data:\n${body.context}`
            : "";

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3.6-flash"),
          system: SYSTEM_PROMPT + context,
          messages: await convertToModelMessages(messages as UIMessage[]),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages as UIMessage[],
        });
      },
    },
  },
});