import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { SendAssistantMessageBody } from "@workspace/api-zod";
import { assistantInstructions, containsSensitiveChatText } from "../masar/assistant-knowledge";

export const assistantRouter = Router();
const chatLimiter = rateLimit({
  windowMs: 10 * 60000, limit: 8, standardHeaders: "draft-7", legacyHeaders: false,
  message: { error: "chat.rate" },
});
let activeRequests = 0;
let windowStart = Date.now(), windowRequests = 0;

assistantRouter.post("/openai/assistant/messages", chatLimiter, async (req, res): Promise<void> => {
  const input = SendAssistantMessageBody.safeParse(req.body);
  if (!input.success) { res.status(400).json({ error: "chat.invalid" }); return; }
  const { language, messages } = input.data;
  if (messages.at(-1)?.role !== "user" || messages.some(m => !m.content.trim()) || messages.reduce((n, m) => n + m.content.length, 0) > 16000) {
    res.status(400).json({ error: "chat.invalid" }); return;
  }
  if (messages.some(m => containsSensitiveChatText(m.content))) {
    res.status(400).json({ error: "chat.sensitive" }); return;
  }
  if (Date.now() - windowStart >= 3600000) { windowStart = Date.now(); windowRequests = 0; }
  // Basic process-local spending/concurrency guards for this prototype.
  if (activeRequests >= 3 || windowRequests >= 120) { res.status(429).json({ error: "chat.rate" }); return; }
  if (!process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || !process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
    res.status(503).json({ error: "chat.unavailable" }); return;
  }
  activeRequests++; windowRequests++;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort("timeout"), 60000);
  const close = () => { if (!res.writableEnded) controller.abort("disconnected"); };
  res.on("close", close);
  const emit = (event: Record<string, unknown>) => {
    if (!res.destroyed && !res.writableEnded) res.write(`data: ${JSON.stringify(event)}\n\n`);
  };
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  try {
    // Lazy import: a missing provider must not prevent the rest of the app starting.
    const { openai } = await import("@workspace/integrations-openai-ai-server");
    const stream = await openai.chat.completions.create({
      model: "gpt-5.4-mini",
      max_completion_tokens: 8192,
      messages: [{ role: "system", content: assistantInstructions(language) }, ...messages],
      stream: true,
    }, { signal: controller.signal, timeout: 60000, maxRetries: 1 });
    if (controller.signal.aborted) { stream.controller.abort(); return; }
    res.status(200).set({
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.flushHeaders();
    heartbeat = setInterval(() => { if (!res.destroyed && !res.writableEnded) res.write(": keepalive\n\n"); }, 10000);
    let length = 0;
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        // Keep every completed turn within the public conversation contract.
        const text = content.slice(0, 2000 - length);
        if (text) { emit({ content: text }); length += text.length; }
        if (length >= 2000) { stream.controller.abort(); break; }
      }
    }
    if (!length) emit({ error: "chat.unavailable" });
    else emit({ done: true });
  } catch (error) {
    // Do not log provider request objects (which contain chat text and headers).
    if (!res.destroyed) {
      const code = controller.signal.aborted ? "chat.timeout" : "chat.unavailable";
      req.log.warn({ code }, "Assistant request did not complete");
      if (res.headersSent) emit({ error: code });
      else res.status(503).json({ error: code });
    }
  } finally {
    clearTimeout(timer);
    if (heartbeat) clearInterval(heartbeat);
    res.off("close", close);
    activeRequests--;
    if (!res.destroyed && !res.writableEnded) res.end();
  }
});
