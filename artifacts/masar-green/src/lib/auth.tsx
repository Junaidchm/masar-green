import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { getGetMeQueryKey, useGetMe, useLogin, useLogout, type User, type Session } from '@workspace/api-client-react';
import { useI18n } from './i18n';
import { toast } from '@/hooks/use-toast';
import { pendingReferral, clearReferral } from './referral-invite';

export function errStatus(e: unknown): number | undefined {
  return (e as { status?: number } | null)?.status;
}

export function friendlyError(e: unknown, t: (k: string) => string): string {
  const s = errStatus(e);
  if (s === 401) return t('err.auth');
  if (s === 429) return t('err.rate');
  const data = (e as { data?: unknown } | null)?.data as Record<string, unknown> | null | undefined;
  const msg = data && (typeof data.error === 'string' ? data.error : typeof data.message === 'string' ? data.message : undefined);
  if (msg) return t(msg);
  if (e instanceof TypeError) return t('err.network');
  return t('err.generic');
}

interface AuthCtx {
  user: User | null; isGuest: boolean; loading: boolean; needsOnboarding: boolean;
  openLogin: () => void; closeLogin: () => void; loginOpen: boolean;
  requireAuth: (fn: () => void) => void;
  signIn: (cardNumber: string, pin: string) => Promise<Session | null>; signingIn: boolean;
  signOut: () => void;
}
const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const { t, setLang, setDark } = useI18n();
  const [, navigate] = useLocation();
  const me = useGetMe({ query: { queryKey: getGetMeQueryKey(), retry: false, staleTime: 30_000 } });
  const [loginOpen, setLoginOpen] = useState(false);
  const user = me.data?.user ?? null;
  const needsOnboarding = !!me.data?.needsOnboarding;
  const synced = useRef<number | null>(null);

  useEffect(() => {
    if (user && synced.current !== user.id) {
      synced.current = user.id;
      setLang(user.language);
      setDark(user.darkMode);
    }
    if (!user) synced.current = null;
  }, [user, setLang, setDark]);

  const login = useLogin();
  const logout = useLogout();
  const loginRef = useRef(login.mutateAsync);
  loginRef.current = login.mutateAsync;

  const signIn = useCallback(async (cardNumber: string, pin: string) => {
    try {
      const referralCode = pendingReferral();
      const s = await loginRef.current({ data: { cardNumber, pin, ...(referralCode ? {referralCode} : {}) } });
      if (referralCode) clearReferral();
      // Private complaint/enquiry caches must never flash from a previous account.
      await qc.cancelQueries({ predicate: (q) => q.queryKey[0] !== getGetMeQueryKey()[0] });
      qc.removeQueries({ predicate: (q) => q.queryKey[0] !== getGetMeQueryKey()[0] });
      qc.setQueryData(getGetMeQueryKey(), s);
      setLoginOpen(false);
      toast({ title: `${t('login.welcome')}${s.user?.name ? ', ' + s.user.name : ''}` });
      if (s.needsOnboarding) navigate('/onboarding');
      else if (s.user?.role === 'employer') navigate('/employer');
      else if (s.user?.role === 'city') navigate('/city');
      else if (window.location.pathname.endsWith('/login')) navigate('/');
      return s;
    } catch (e) {
      toast({ title: friendlyError(e, t), variant: 'destructive' });
      return null;
    }
  }, [qc, t, navigate]);

  const logoutRef = useRef(logout.mutate);
  logoutRef.current = logout.mutate;
  const signOut = useCallback(() => {
    logoutRef.current(undefined, {
      onSuccess: () => {
        qc.setQueryData(getGetMeQueryKey(), { user: null, needsOnboarding: false });
        qc.removeQueries({ predicate: (q) => q.queryKey[0] !== getGetMeQueryKey()[0] });
        navigate('/');
      },
      onError: (e) => toast({title:friendlyError(e,t),variant:'destructive'}),
    });
  }, [qc, navigate, t]);

  const requireAuth = useCallback((fn: () => void) => {
    if (user) fn(); else setLoginOpen(true);
  }, [user]);

  return (
    <Ctx.Provider value={{
      user, isGuest: !user, loading: me.isLoading, needsOnboarding,
      openLogin: () => setLoginOpen(true), closeLogin: () => setLoginOpen(false), loginOpen,
      requireAuth, signIn, signingIn: login.isPending, signOut,
    }}>{children}</Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('AuthProvider missing');
  return c;
}
