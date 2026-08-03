import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";

type Body = { dataUrl?: unknown };

export const Route = createFileRoute("/api/ocr")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as Body;
        const dataUrl = body.dataUrl;
        if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
          return new Response("An image is required", { status: 400 });
        }
        if (dataUrl.length > 12_000_000) {
          return new Response("Image is too large", { status: 413 });
        }

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        try {
          const gateway = createLovableAiGatewayProvider(key);
          const result = await generateText({
            model: gateway("google/gemini-3.6-flash"),
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Extract every piece of text from this image exactly as written (OCR). Keep the reading order and line breaks. If there is no text, briefly describe what the image shows instead.",
                  },
                  { type: "image", image: new URL(dataUrl) },
                ],
              },
            ],
          });
          return Response.json({ text: result.text });
        } catch (error) {
          const message = error instanceof Error ? error.message : "OCR failed";
          return new Response(message, { status: 502 });
        }
      },
    },
  },
});
