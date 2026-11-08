import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { Download, Trash2, LogOut, Smartphone, ShieldCheck, ChevronRight, History, Trophy, Calculator, Building2, Landmark, Loader2, LogIn } from 'lucide-react';
import {
  useUpdateProfile, useDeleteTrips, exportMyData, getGetMeQueryKey, getGetDashboardQueryKey, getGetTripsQueryKey,
  getGetChallengesQueryKey, getGetLeaderboardQueryKey, getGetWalletQueryKey, type ProfileInput,
} from '@workspace/api-client-react';
import { useI18n } from '@/lib/i18n';
import { friendlyError, useAuth } from '@/lib/auth';
import { canInstall, downloadFile, isIos, isStandalone, onInstallChange, promptInstall } from '@/lib/pwa';
import { toast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { PageHeader, SectionTitle } from '@/components/common';

function Row({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-4 py-3.5">
      <div className="flex-1"><div className="text-sm font-semibold">{title}</div>{desc && <div className="text-xs text-muted-foreground">{desc}</div>}</div>
      {children}
    </div>
  );
}

export default function ProfilePage() {
  const { t, lang, setLang, dark, setDark } = useI18n();
  const { user, openLogin, signOut } = useAuth();
  const qc = useQueryClient();
  const upd = useUpdateProfile();
  const del = useDeleteTrips();
  const [name, setName] = useState(user?.name ?? '');
  const [confirmDel, setConfirmDel] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [, force] = useState(0);
  useEffect(() => onInstallChange(() => force((x) => x + 1)), []);
  useEffect(() => { setName(user?.name ?? ''); }, [user?.name]);

  const save = (data: ProfileInput) => {
    if (data.language) setLang(data.language);
    if (data.darkMode !== undefined) setDark(data.darkMode);
    if (!user) return;
    upd.mutate({ data }, {
      onSuccess: (u) => { qc.setQueryData(getGetMeQueryKey(), { user: u, needsOnboarding: !u.onboarded }); void qc.invalidateQueries({ queryKey: getGetDashboardQueryKey() }); toast({ title: t('profile.saved') }); },
      onError: (e) => toast({ title: friendlyError(e, t), variant: 'destructive' }),
    });
  };

  const doExport = async () => {
    setExporting(true);
    try {
      const d = await exportMyData();
      downloadFile(`masar-green-my-data-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(d, null, 2), 'application/json');
    } catch (e) { toast({ title: friendlyError(e, t), variant: 'destructive' }); }
    setExporting(false);
  };

  const doDelete = () => del.mutate(undefined, {
    onSuccess: () => {
      [getGetTripsQueryKey(), getGetDashboardQueryKey(), getGetChallengesQueryKey(), getGetLeaderboardQueryKey(), getGetWalletQueryKey()].forEach((k) => void qc.invalidateQueries({ queryKey: k }));
      toast({ title: t('profile.deleted') }); setConfirmDel(false);
    },
    onError: (e) => toast({ title: friendlyError(e, t), variant: 'destructive' }),
  });

  const more = [
    { href: '/trips', icon: History, label: t('nav.trips') },
    { href: '/challenges', icon: Trophy, label: t('nav.challenges') },
    { href: '/carbon', icon: Calculator, label: t('nav.carbon') },
    ...(user?.role === 'employer' ? [{ href: '/employer', icon: Building2, label: t('nav.employer') }] : []),
    ...(user?.role === 'city' ? [{ href: '/city', icon: Landmark, label: t('nav.city') }] : []),
  ];

  const install = async () => { const ok = await promptInstall(); if (!ok) toast({ title: t('profile.installNo') }); };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={t('profile.title')} />
      {user ? (
        <section className="flex items-center gap-4 rounded-2xl bg-[#111111] p-5 text-[#F5F6F7]">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-[#00732F] text-lg font-extrabold">{user.name.slice(0, 2).toUpperCase()}</span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-lg font-bold" data-testid="text-profile-name">{user.name}</div>
            <div className="text-sm text-white/60">{t(`role.${user.role}`)} · {t('profile.card')} <span dir="ltr" className="num font-mono">•••• {user.cardNumber.slice(-4)}</span></div>
          </div>
        </section>
      ) : (
        <section className="card-soft flex flex-wrap items-center gap-4 p-5">
          <p className="flex-1 text-sm">{t('profile.guest')}</p>
          <button onClick={openLogin} className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-4 font-semibold text-primary-foreground" data-testid="button-profile-signin"><LogIn className="h-4 w-4 rtl:rotate-180" />{t('signInNol')}</button>
        </section>
      )}

      <section className="card-soft px-5 py-2 lg:hidden">
        {more.map((m) => (
          <Link key={m.href} href={m.href} className="flex items-center gap-3 border-b py-3.5 text-sm font-semibold last:border-0" data-testid={`link-more-${m.href.slice(1)}`}>
            <m.icon className="h-4 w-4 text-muted-foreground" />{m.label}<ChevronRight className="ms-auto h-4 w-4 text-muted-foreground rtl:rotate-180" />
          </Link>
        ))}
      </section>

      <section className="card-soft p-5">
        <SectionTitle>{t('profile.settings')}</SectionTitle>
        <div className="divide-y">
          {user && (
            <div className="flex flex-wrap items-end gap-2 pb-4">
              <label className="flex-1"><span className="mb-1 block text-sm font-semibold">{t('profile.name')}</span>
                <input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} className="h-11 w-full rounded-lg border border-input bg-card px-3" data-testid="input-name" /></label>
              <button disabled={!name.trim() || name === user.name || upd.isPending} onClick={() => save({ name: name.trim() })} className="h-11 rounded-lg bg-foreground px-4 text-sm font-semibold text-background disabled:opacity-40" data-testid="button-save-name">{t('profile.save')}</button>
            </div>
          )}
          <Row title={t('profile.language')}>
            <div className="grid grid-cols-2 rounded-lg bg-muted p-1">
              {(['en', 'ar'] as const).map((l) => <button key={l} onClick={() => save({ language: l })} className={`h-8 rounded-md px-3 text-sm font-semibold ${lang === l ? 'bg-card shadow-sm' : 'text-muted-foreground'}`} data-testid={`button-lang-${l}`}>{l === 'en' ? 'English' : 'العربية'}</button>)}
            </div>
          </Row>
          <Row title={t('profile.dark')}><Switch checked={dark} onCheckedChange={(v) => save({ darkMode: v })} data-testid="switch-dark" /></Row>
          <Row title={t('profile.notifications')} desc={t('profile.notificationsDesc')}><Switch disabled={!user} checked={!!user?.notifications} onCheckedChange={(v) => save({ notifications: v })} data-testid="switch-notifications" /></Row>
        </div>
      </section>

      <section className="card-soft p-5">
        <SectionTitle>{t('profile.privacy')}</SectionTitle>
        <div className="mb-2 flex gap-3 rounded-lg bg-accent p-3 text-sm text-accent-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /><div><div className="font-bold">{t('profile.collect')}</div><p>{t('profile.collectBody')}</p></div></div>
        <div className="divide-y">
          <Row title={t('profile.location')} desc={t('profile.locationDesc')}><Switch disabled={!user} checked={!!user?.locationConsent} onCheckedChange={(v) => save({ locationConsent: v })} data-testid="switch-location" /></Row>
          <Row title={t('profile.tracking')} desc={t('profile.trackingDesc')}><Switch disabled={!user} checked={!!user?.trackingConsent} onCheckedChange={(v) => save({ trackingConsent: v })} data-testid="switch-tracking" /></Row>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button disabled={!user || exporting} onClick={doExport} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border text-sm font-semibold hover:bg-muted disabled:opacity-40" data-testid="button-export">{exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}{t('profile.export')}</button>
          <button disabled={!user} onClick={() => setConfirmDel(true)} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-primary/40 text-sm font-semibold text-primary hover:bg-primary/5 disabled:opacity-40" data-testid="button-delete-history"><Trash2 className="h-4 w-4" />{t('profile.delete')}</button>
        </div>
      </section>

      <section className="card-soft p-5">
        <SectionTitle>{t('profile.install')}</SectionTitle>
        <p className="text-sm text-muted-foreground">{t('profile.installDesc')}</p>
        <div className="mt-3">
          {isStandalone() ? <span className="text-sm font-semibold text-[#00732F]">{t('profile.installed')}</span>
            : canInstall() ? <button onClick={install} className="inline-flex h-11 items-center gap-2 rounded-lg bg-foreground px-4 text-sm font-semibold text-background" data-testid="button-install"><Smartphone className="h-4 w-4" />{t('profile.installBtn')}</button>
            : <p className="text-sm">{isIos() ? t('profile.installIos') : t('profile.installNo')}</p>}
        </div>
      </section>

      {user && <button onClick={signOut} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border text-sm font-semibold hover:bg-muted" data-testid="button-logout"><LogOut className="h-4 w-4 rtl:rotate-180" />{t('signOut')}</button>}

      <AlertDialog open={confirmDel} onOpenChange={setConfirmDel}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t('profile.deleteConfirm')}</AlertDialogTitle><AlertDialogDescription>{t('profile.deleteBody')}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('profile.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); doDelete(); }} className="bg-primary text-primary-foreground" data-testid="button-confirm-delete">{del.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}{t('profile.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
