import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Link } from 'wouter';
import { ArrowUp, Square, RotateCcw, Plus, ShieldAlert, Route as RouteIcon, Wallet, Bell, MessageSquareWarning, Sparkles, CircleStop, AlertTriangle, ArrowRight } from 'lucide-react';
import type { AssistantTurn } from '@workspace/api-client-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { FlagStripe } from '@/components/common';
import { streamAssistant, capHistory, looksSensitive, ChatError, MAX_CHARS, type ChatErrorCode } from '@/lib/assistant-stream';

type Status = 'done' | 'streaming' | 'stopped';
interface Msg { id: number; role: 'user' | 'assistant'; content: string; status: Status }

const STARTERS = ['as.s1', 'as.s2', 'as.s3', 'as.s4'] as const;
const QUICK = [
  { href: '/plan', key: 'as.q.plan', icon: RouteIcon },
  { href: '/wallet', key: 'as.q.wallet', icon: Wallet },
  { href: '/notifications', key: 'as.q.alerts', icon: Bell },
  { href: '/feedback', key: 'as.q.feedback', icon: MessageSquareWarning },
] as const;

/** Only complete user→assistant pairs go into request history. */
function completedHistory(msgs: Msg[]): AssistantTurn[] {
  const out: AssistantTurn[] = [];
  for (let i = 0; i < msgs.length - 1; i++) {
    const a = msgs[i], b = msgs[i + 1];
    if (a.role === 'user' && b.role === 'assistant' && b.status === 'done' && b.content.trim()) {
      out.push({ role: 'user', content: a.content }, { role: 'assistant', content: b.content.slice(0, MAX_CHARS) });
      i++;
    }
  }
  return out;
}

export default function AssistantPage() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ code: ChatErrorCode | 'as.err.tooLong' | 'as.err.private'; retry?: string } | null>(null);
  const [trimmed, setTrimmed] = useState(false);
  const [live, setLive] = useState('');
  const gen = useRef(0);
  const ctrl = useRef<AbortController | null>(null);
  const idSeq = useRef(1);
  const msgsRef = useRef(msgs); msgsRef.current = msgs;
  const taRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const reset = useCallback(() => {
    gen.current++;
    ctrl.current?.abort(); ctrl.current = null;
    setMsgs([]); setBusy(false); setError(null); setTrimmed(false); setLive('');
  }, []);

  // Clear on account switch / sign-out; abort on unmount.
  const uid = user?.id ?? null;
  const lastUid = useRef(uid);
  useEffect(() => { if (lastUid.current !== uid) { lastUid.current = uid; reset(); setDraft(''); } }, [uid, reset]);
  useEffect(() => () => { gen.current++; ctrl.current?.abort(); }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }); }, [msgs, error]);

  const send = useCallback(async (raw: string) => {
    const text = raw.trim();
    if (!text || ctrl.current) return;
    if (text.length > MAX_CHARS) { setError({ code: 'as.err.tooLong' }); return; }
    if (looksSensitive(text)) { setError({ code: 'as.err.private' }); return; }
    // Drop any stopped/unanswered tail so history stays consistent.
    const base = msgsRef.current;
    const cap = capHistory([...completedHistory(base), { role: 'user', content: text }]);
    setTrimmed(cap.trimmed);
    const my = ++gen.current;
    const ac = new AbortController(); ctrl.current = ac;
    const uId = idSeq.current++, aId = idSeq.current++;
    setMsgs([...base, { id: uId, role: 'user', content: text, status: 'done' }, { id: aId, role: 'assistant', content: '', status: 'streaming' }]);
    setDraft(''); setError(null); setBusy(true); setLive(t('as.status.streaming'));
    const patch = (fn: (m: Msg) => Msg) => setMsgs((ms) => ms.map((m) => (m.id === aId ? fn(m) : m)));
    try {
      await streamAssistant({ language: lang, messages: cap.turns }, ac.signal, (d) => {
        if (gen.current === my) patch((m) => ({ ...m, content: m.content + d }));
      });
      if (gen.current !== my) return;
      patch((m) => ({ ...m, status: 'done' }));
      setLive(t('as.status.done'));
    } catch (e) {
      if (gen.current !== my) return;
      if ((e as Error)?.name === 'AbortError') {
        // Stopped by user: keep visible partial, marked; excluded from history.
        setMsgs((ms) => ms.flatMap((m) => (m.id !== aId ? [m] : m.content ? [{ ...m, status: 'stopped' as const }] : [])));
        setLive(t('as.status.stopped'));
      } else {
        const code = e instanceof ChatError ? e.code : 'chat.unavailable';
        setMsgs((ms) => ms.filter((m) => m.id !== aId && m.id !== uId));
        setError({ code, retry: text });
        setDraft((d) => d || text);
        setLive(t(code));
      }
    } finally {
      if (gen.current === my) { ctrl.current = null; setBusy(false); }
    }
  }, [lang, t]);

  const stop = () => { ctrl.current?.abort(); };
  const newChat = () => { reset(); setDraft(''); taRef.current?.focus(); };
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void send(draft); }
    if (e.key === 'Escape' && busy) { e.preventDefault(); stop(); }
  };
  useEffect(() => {
    const ta = taRef.current; if (!ta) return;
    ta.style.height = 'auto'; ta.style.height = `${Math.min(ta.scrollHeight, 180)}px`;
  }, [draft]);

  const empty = msgs.length === 0;
  const over = draft.length > MAX_CHARS;

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_300px]" data-testid="page-assistant">
      <section className="card-soft flex h-[calc(100dvh-18rem)] min-h-[460px] flex-col overflow-hidden lg:h-[calc(100dvh-10rem)] lg:min-h-[560px]">
        <header className="chat-header relative shrink-0 overflow-hidden">
          <FlagStripe />
          <div className="flex items-center gap-3 px-4 py-3.5 md:px-5">
            <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#00732F]">
              <Sparkles className="h-5 w-5" />
              {busy && <span className="pulse-dot absolute inset-0 rounded-full bg-[#00732F]" aria-hidden />}
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="flex items-center gap-2 text-lg font-extrabold tracking-tight" data-testid="text-assistant-title">
                {t('as.title')}
                <span className="rounded-full border border-[#B8964B]/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#E2C987]">{t('as.badge')}</span>
              </h1>
              <p className="truncate text-xs text-white/60">{t('as.sub')}</p>
            </div>
            <button onClick={newChat} disabled={empty && !error} className="inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm font-semibold text-white/80 hover:bg-white/10 disabled:opacity-40" data-testid="button-new-chat">
              <Plus className="h-4 w-4" /><span className="hidden sm:inline">{t('as.new')}</span><span className="sr-only sm:hidden">{t('as.new')}</span>
            </button>
          </div>
        </header>

        <div className="relative min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6" role="log" aria-label={t('as.log')} aria-busy={busy}>
          {empty ? (
            <div className="rise mx-auto flex max-w-lg flex-col items-center py-8 text-center">
              <svg viewBox="0 0 120 40" className="mb-5 h-10 w-32" aria-hidden>
                <path d="M6 30 C 36 30, 40 10, 60 10 S 90 30, 114 30" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 7" />
                <circle cx="6" cy="30" r="5" fill="#00732F" /><circle cx="60" cy="10" r="4" fill="hsl(var(--card))" stroke="#111" strokeWidth="2" className="dark:stroke-white" /><circle cx="114" cy="30" r="5" fill="#C8102E" />
              </svg>
              <h2 className="text-2xl font-extrabold tracking-tight">{t('as.empty.title')}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{t('as.empty.body')}</p>
              <p className="mt-7 self-start text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('as.starters')}</p>
              <div className="mt-2 grid w-full gap-2 sm:grid-cols-2">
                {STARTERS.map((k, i) => (
                  <button key={k} onClick={() => void send(t(k))} style={{ animationDelay: `${80 + i * 60}ms` }}
                    className="rise group flex items-start gap-2.5 rounded-lg border bg-background/60 px-3.5 py-3 text-start text-sm font-medium transition-colors hover:border-primary/50 hover:bg-accent/40" data-testid={`button-starter-${i}`}>
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full border-2 border-primary transition-transform group-hover:scale-125" />
                    <span className="flex-1">{t(k)}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <ol className="relative space-y-5">
              <span className="absolute bottom-2 start-[15px] top-2 w-[2px] bg-gradient-to-b from-[#00732F]/50 via-border to-[#C8102E]/50" aria-hidden />
              {msgs.map((m) => (
                <li key={m.id} className="rise relative flex gap-3" data-testid={`msg-${m.role}-${m.id}`}>
                  <span className={`relative z-10 mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-[10px] font-bold ring-4 ring-card ${m.role === 'user' ? 'bg-[#111111] text-white dark:bg-white dark:text-[#111111]' : 'bg-[#00732F] text-white'}`}>
                    {m.role === 'user' ? t('as.you').slice(0, 2) : <Sparkles className="h-3.5 w-3.5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{m.role === 'user' ? t('as.you') : t('as.bot')}</p>
                    {m.role === 'assistant' && m.status === 'streaming' && !m.content ? (
                      <div className="space-y-2 pt-1" aria-label={t('as.thinking')}>
                        <p className="text-sm text-muted-foreground">{t('as.thinking')}</p>
                        <div className="h-2.5 w-3/4 animate-pulse rounded bg-muted" /><div className="h-2.5 w-1/2 animate-pulse rounded bg-muted" />
                      </div>
                    ) : (
                      <div className={`whitespace-pre-wrap break-words text-[15px] leading-relaxed ${m.role === 'user' ? 'inline-block rounded-lg rounded-ss-sm bg-muted px-3.5 py-2.5' : ''} ${m.status === 'stopped' ? 'text-muted-foreground' : ''}`}>
                        {m.content}
                        {m.status === 'streaming' && <span className="ms-0.5 inline-block h-4 w-[3px] translate-y-0.5 animate-pulse bg-primary" aria-hidden />}
                      </div>
                    )}
                    {m.status === 'stopped' && (
                      <p className="mt-2 inline-flex items-center gap-1.5 rounded border border-dashed border-[#B8964B]/70 px-2 py-1 text-xs font-semibold text-[#8a6d2c] dark:text-[#E2C987]" data-testid={`status-stopped-${m.id}`}>
                        <CircleStop className="h-3.5 w-3.5" />{t('as.stopped')}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
          {error && (
            <div role="alert" className="rise mt-5 flex flex-wrap items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/8 px-4 py-3 text-sm" data-testid="status-chat-error">
              <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
              <span className="flex-1">{t(error.code)}</span>
              {error.retry && (
                <button onClick={() => { const r = error.retry!; void send(r); }} disabled={busy} className="inline-flex items-center gap-1.5 rounded-md bg-destructive px-3 py-1.5 text-xs font-bold text-destructive-foreground hover:brightness-110 disabled:opacity-50" data-testid="button-retry">
                  <RotateCcw className="h-3.5 w-3.5" />{t('as.retry')}
                </button>
              )}
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="sr-only" aria-live="polite" role="status">{live}</div>

        <form onSubmit={(e) => { e.preventDefault(); void send(draft); }} className="shrink-0 border-t bg-card px-3 pb-3 pt-2.5 md:px-4">
          <p className="mb-2 text-[11px] text-muted-foreground">{t('as.notice.provider')} {t('as.notice.private')}</p>
          {trimmed && <p className="mb-2 text-xs text-muted-foreground" data-testid="text-trimmed">{t('as.trimmed')}</p>}
          <div className="flex items-end gap-2 rounded-xl border bg-background px-2 py-1.5 transition-shadow focus-within:border-primary/60 focus-within:shadow-[0_0_0_3px_hsl(var(--primary)/0.12)]">
            <label htmlFor="assistant-input" className="sr-only">{t('as.input')}</label>
            <textarea id="assistant-input" ref={taRef} value={draft} onChange={(e) => { setDraft(e.target.value); if (error && !error.retry) setError(null); }} onKeyDown={onKey}
              rows={1} placeholder={t('as.placeholder')} aria-describedby="assistant-hint" aria-invalid={over}
              className="max-h-[180px] min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-[15px] outline-none placeholder:text-muted-foreground" data-testid="input-assistant" />
            {busy ? (
              <button type="button" onClick={stop} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#111111] text-white hover:brightness-125 dark:bg-white dark:text-[#111111]" aria-label={t('as.stop')} data-testid="button-stop">
                <Square className="h-4 w-4 fill-current" />
              </button>
            ) : (
              <button type="submit" disabled={!draft.trim() || over} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground transition-transform hover:brightness-110 active:scale-95 disabled:opacity-40" aria-label={t('as.send')} data-testid="button-send">
                <ArrowUp className="h-5 w-5" />
              </button>
            )}
          </div>
          <div id="assistant-hint" className="mt-1.5 flex items-center justify-between gap-2 px-1 text-[11px] text-muted-foreground">
            <span className="hidden sm:inline">{t('as.hint')}</span>
            <span className={`num ms-auto ${over ? 'font-bold text-destructive' : ''}`} data-testid="text-char-count">{draft.length} / {MAX_CHARS} {t('as.chars')}</span>
          </div>
          <p className="mt-1 flex items-start gap-1.5 px-1 text-[11px] text-muted-foreground"><ShieldAlert className="mt-px h-3.5 w-3.5 shrink-0" />{t('as.readonly')}</p>
        </form>
      </section>

      <aside className="space-y-4">
        <div className="card-soft p-4" data-testid="panel-assistant-notice">
          <h2 className="text-sm font-extrabold">{t('as.notice.title')}</h2>
          <ul className="mt-3 space-y-2.5 text-[13px] leading-snug text-muted-foreground">
            {(['as.notice.ai', 'as.notice.sim', 'as.notice.alerts', 'as.notice.provider', 'as.notice.private'] as const).map((k, i) => (
              <li key={k} className="flex gap-2.5">
                <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${i === 4 ? 'bg-[#C8102E]' : 'bg-[#00732F]'}`} />
                <span className={i === 4 ? 'font-semibold text-foreground' : ''}>{t(k)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card-soft p-4">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('as.quick')}</h2>
          <div className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-1">
            {QUICK.map((q) => (
              <Link key={q.href} href={q.href} className="group flex items-center gap-2.5 rounded-md border px-3 py-2.5 text-sm font-semibold hover:border-primary/50 hover:bg-muted" data-testid={`link-assistant-${q.href.slice(1)}`}>
                <q.icon className="h-4 w-4 text-primary" /><span className="flex-1">{t(q.key)}</span>
                <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-60 rtl:rotate-180" />
              </Link>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
