import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, MapPin, Leaf, Languages } from 'lucide-react';
import { useUpdateProfile, getGetMeQueryKey, getGetDashboardQueryKey } from '@workspace/api-client-react';
import { useI18n, type Lang } from '@/lib/i18n';
import { friendlyError, useAuth } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { BrandMark } from '@/components/common';
import { LoginForm } from '@/components/login-form';

export function LoginPage() {
  const { t } = useI18n();
  return (
    <div className="grid min-h-[70dvh] gap-8 py-4 lg:grid-cols-2 lg:items-center">
      <div className="rise hidden lg:block">
        <BrandMark className="h-14 w-14" />
        <h1 className="mt-6 text-5xl font-extrabold leading-[1.05] tracking-tight">Every greener ride<br /><span className="text-[#00732F]">adds up.</span></h1>
        <p className="mt-4 max-w-md text-lg text-muted-foreground">{t('login.explain')}</p>
        <Link href="/" className="mt-6 inline-block text-sm font-semibold text-primary">{t('guest.label')} →</Link>
      </div>
      <div className="card-soft mx-auto w-full max-w-md p-6">
        <h2 className="mb-4 text-2xl font-extrabold">{t('login.title')}</h2>
        <LoginForm />
      </div>
    </div>
  );
}

export function OnboardingPage() {
  const { t, lang, setLang } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const upd = useUpdateProfile();
  const [name, setName] = useState(user?.name && !/^card|^new/i.test(user.name) ? user.name : '');
  const [language, setLanguage] = useState<Lang>(lang);
  const [loc, setLoc] = useState(false);
  const [track, setTrack] = useState(false);
  const [err, setErr] = useState('');

  if (!user) return (
    <div className="py-16 text-center"><Link href="/login" className="rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground">{t('signIn')}</Link></div>
  );

  const finish = () => {
    if (!name.trim()) { setErr(t('onb.nameErr')); return; }
    upd.mutate({ data: { name: name.trim(), language, locationConsent: loc, trackingConsent: track, onboarded: true } }, {
      onSuccess: (u) => {
        qc.setQueryData(getGetMeQueryKey(), { user: u, needsOnboarding: false });
        void qc.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        navigate('/');
      },
      onError: (e) => toast({ title: friendlyError(e, t), variant: 'destructive' }),
    });
  };

  return (
    <div className="mx-auto max-w-lg py-4">
      <div className="rise card-soft overflow-hidden">
        <div className="bg-[#111111] p-6 text-[#F5F6F7]">
          <BrandMark className="h-10 w-10" />
          <h1 className="mt-4 text-2xl font-extrabold">{t('onb.title')}</h1>
          <p className="text-sm text-white/70">{t('onb.sub')}</p>
        </div>
        <div className="space-y-6 p-6">
          <label className="block">
            <span className="mb-1 block text-sm font-bold">1 · {t('onb.name')}</span>
            <input value={name} maxLength={80} onChange={(e) => { setName(e.target.value); setErr(''); }} className="h-12 w-full rounded-lg border border-input bg-card px-3" data-testid="input-onboarding-name" />
            {err && <span className="mt-1 block text-xs text-primary">{err}</span>}
          </label>
          <div>
            <span className="mb-2 flex items-center gap-2 text-sm font-bold"><Languages className="h-4 w-4" />2 · {t('onb.lang')}</span>
            <div className="grid grid-cols-2 gap-2">
              {(['en', 'ar'] as const).map((l) => (
                <button key={l} type="button" onClick={() => { setLanguage(l); setLang(l); }} className={`h-12 rounded-lg border-2 font-semibold ${language === l ? 'border-foreground bg-muted' : ''}`} data-testid={`button-onboarding-lang-${l}`}>{l === 'en' ? 'English' : 'العربية'}</button>
              ))}
            </div>
          </div>
          <div>
            <span className="mb-1 block text-sm font-bold">3 · {t('onb.consent')}</span>
            <p className="mb-2 text-xs text-muted-foreground">{t('onb.consentNote')}</p>
            <div className="space-y-2">
              <label className="flex items-start gap-3 rounded-lg border p-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /><span className="flex-1"><span className="block text-sm font-semibold">{t('profile.location')}</span><span className="text-xs text-muted-foreground">{t('profile.locationDesc')}</span></span><Switch checked={loc} onCheckedChange={setLoc} data-testid="switch-onboarding-location" /></label>
              <label className="flex items-start gap-3 rounded-lg border p-3"><Leaf className="mt-0.5 h-4 w-4 shrink-0" /><span className="flex-1"><span className="block text-sm font-semibold">{t('profile.tracking')}</span><span className="text-xs text-muted-foreground">{t('profile.trackingDesc')}</span></span><Switch checked={track} onCheckedChange={setTrack} data-testid="switch-onboarding-tracking" /></label>
            </div>
          </div>
          <button disabled={upd.isPending} onClick={finish} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-primary-foreground" data-testid="button-finish-onboarding">{upd.isPending && <Loader2 className="h-4 w-4 animate-spin" />}{t('onb.finish')}</button>
        </div>
      </div>
    </div>
  );
}

export function NotFoundPage() {
  const { t } = useI18n();
  return (
    <div className="py-20 text-center">
      <div className="num text-7xl font-extrabold text-primary">404</div>
      <h1 className="mt-3 text-2xl font-extrabold">{t('nf.title')}</h1>
      <p className="mt-2 text-muted-foreground">{t('nf.body')}</p>
      <Link href="/" className="mt-6 inline-block rounded-lg bg-foreground px-5 py-3 font-semibold text-background">{t('nf.home')}</Link>
    </div>
  );
}
