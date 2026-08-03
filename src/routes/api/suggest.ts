import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";

type Body = { question?: unknown; answer?: unknown };

export const Route = createFileRoute("/api/suggest")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as Body;
        const question = typeof body.question === "string" ? body.question.slice(0, 2000) : "";
        const answer = typeof body.answer === "string" ? body.answer.slice(0, 4000) : "";
        if (!answer) return Response.json({ suggestions: [] });

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return Response.json({ suggestions: [] });

        try {
          const gateway = createLovableAiGatewayProvider(key);
          const result = await generateText({
            model: gateway("google/gemini-3.6-flash"),
            system:
              "You suggest short follow-up questions a school student could ask next. Reply with ONLY a JSON array of exactly 3 strings, each under 60 characters. No markdown, no extra text.",
            prompt: `Student asked: ${question}\n\nTutor answered: ${answer}`,
          });
          const match = result.text.match(/\[[\s\S]*\]/);
          const parsed = match ? (JSON.parse(match[0]) as unknown) : [];
          const suggestions = Array.isArray(parsed)
            ? parsed.filter((s): s is string => typeof s === "string").slice(0, 3)
            : [];
          return Response.json({ suggestions });
        } catch {
          return Response.json({ suggestions: [] });
        }
      },
    },
  },
});
