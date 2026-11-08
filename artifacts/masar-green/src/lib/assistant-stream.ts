import type { AssistantInput, AssistantTurn } from '@workspace/api-client-react';

export type ChatErrorCode = 'chat.invalid' | 'chat.rate' | 'chat.unavailable' | 'chat.sensitive' | 'chat.timeout' | 'chat.network';
const KNOWN: ChatErrorCode[] = ['chat.invalid', 'chat.rate', 'chat.unavailable', 'chat.sensitive', 'chat.timeout'];

export class ChatError extends Error {
  constructor(public code: ChatErrorCode) { super(code); }
}

export const MAX_TURNS = 20;
export const MAX_CHARS = 2000;
export const MAX_TOTAL = 16000;

/** Keep the newest turns within 20 turns / 16000 chars; result always starts with a user turn. */
export function capHistory(turns: AssistantTurn[]): { turns: AssistantTurn[]; trimmed: boolean } {
  const out: AssistantTurn[] = [];
  let total = 0;
  for (let i = turns.length - 1; i >= 0; i--) {
    const c = turns[i].content.length;
    if (out.length >= MAX_TURNS || total + c > MAX_TOTAL) break;
    out.unshift(turns[i]); total += c;
  }
  while (out.length > 1 && out[0].role !== 'user') out.shift();
  return { turns: out, trimmed: out.length < turns.length };
}

export function looksSensitive(s: string): boolean {
  if (/[^\s@]+@[^\s@]+\.[^\s@]{2,}/.test(s)) return true;
  if (/(?:\d[\s-]?){8,19}/.test(s)) return true;
  if (/\b(pin|password|رمز)\b[^\d]{0,12}\d{4,6}\b/i.test(s)) return true;
  return false;
}

/** Streams SSE `data:` frames. Resolves on {done:true}; throws ChatError otherwise. AbortError propagates. */
export async function streamAssistant(input: AssistantInput, signal: AbortSignal, onDelta: (text: string) => void): Promise<void> {
  let res: Response;
  try {
    res = await fetch('/api/openai/assistant/messages', {
      method: 'POST', credentials: 'same-origin', signal,
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(input),
    });
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') throw e;
    throw new ChatError('chat.network');
  }
  if (!res.ok) {
    let code: ChatErrorCode = res.status === 429 ? 'chat.rate' : res.status === 400 ? 'chat.invalid' : 'chat.unavailable';
    try { const j = await res.json() as { error?: string }; if (j?.error && (KNOWN as string[]).includes(j.error)) code = j.error as ChatErrorCode; } catch { /* non-JSON body */ }
    throw new ChatError(code);
  }
  if (!res.body) throw new ChatError('chat.unavailable');
  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buf = '';
  const handleEvent = (raw: string): boolean => {
    const data = raw.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5).replace(/^ /, '')).join('\n');
    if (!data) return false;
    let msg: { content?: unknown; done?: unknown; error?: unknown };
    try { msg = JSON.parse(data); } catch { return false; }
    if (typeof msg.error === 'string') throw new ChatError((KNOWN as string[]).includes(msg.error) ? msg.error as ChatErrorCode : 'chat.unavailable');
    if (typeof msg.content === 'string' && msg.content) onDelta(msg.content);
    return msg.done === true;
  };
  try {
    for (;;) {
      const { value, done } = await reader.read();
      buf += done ? decoder.decode() : decoder.decode(value, { stream: true });
      buf = buf.replace(/\r\n?/g, '\n');
      let idx: number;
      while ((idx = buf.indexOf('\n\n')) !== -1) {
        const ev = buf.slice(0, idx); buf = buf.slice(idx + 2);
        if (handleEvent(ev)) { void reader.cancel().catch(() => {}); return; }
      }
      if (done) {
        if (buf.trim() && handleEvent(buf)) return;
        throw new ChatError('chat.timeout');
      }
    }
  } catch (e) {
    if (e instanceof ChatError || (e as Error)?.name === 'AbortError') throw e;
    throw new ChatError('chat.network');
  } finally {
    try { reader.releaseLock(); } catch { /* already released */ }
  }
}
