import { createContext, useContext, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Leaf, Clock } from 'lucide-react';
import type { Trip } from '@workspace/api-client-react';
import { useI18n } from '@/lib/i18n';

const Ctx = createContext<(t: Trip, creditsPerAed?: number) => void>(() => undefined);
export const useCelebrate = () => useContext(Ctx);

export function CelebrationProvider({ children }: { children: ReactNode }) {
  const [trip, setTrip] = useState<{ trip: Trip; rate: number } | null>(null);
  const { t, num, aed } = useI18n();
  const pending = trip ? trip.trip.status.toLowerCase().includes('pend') : false;
  return (
    <Ctx.Provider value={(tr, rate = 100) => setTrip({ trip: tr, rate })}>
      {children}
      <AnimatePresence>
        {trip && (
          <motion.div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setTrip(null)}>
            <motion.div role="dialog" aria-modal onClick={(e) => e.stopPropagation()} initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ type: 'spring', damping: 18 }}
              className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-card p-7 text-center shadow-2xl" data-testid="dialog-celebration">
              {!pending && [...Array(14)].map((_, i) => (
                <motion.span key={i} className="absolute h-2 w-2 rounded-full" style={{ left: '50%', top: '30%', background: ['#00732F', '#C8102E', '#B8964B', '#111111'][i % 4] }}
                  initial={{ x: 0, y: 0, opacity: 1 }} animate={{ x: Math.cos(i * 0.45) * 150, y: Math.sin(i * 0.45) * 110 - 20, opacity: 0 }} transition={{ duration: 1.3, delay: 0.15 }} />
              ))}
              <div className="relative mx-auto mb-4 grid h-20 w-20 place-items-center">
                <span className={`pulse-dot absolute inset-0 rounded-full ${pending ? 'bg-amber-500/30' : 'bg-[#00732F]/30'}`} />
                <span className={`relative grid h-20 w-20 place-items-center rounded-full text-white ${pending ? 'bg-amber-600' : 'bg-[#00732F]'}`}>
                  {pending ? <Clock className="h-9 w-9" /> : <Leaf className="h-9 w-9" />}
                </span>
              </div>
              <h2 className="text-xl font-extrabold">{pending ? t('celebrate.pending') : t('celebrate.title')}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{trip.trip.from} → {trip.trip.to}</p>
              {pending ? (
                <p className="mt-4 text-sm">{t('celebrate.pendingDesc')}</p>
              ) : (
                <p className="mt-4 text-base leading-relaxed" data-testid="text-celebration">
                  {t('celebrate.saved')} <b className="text-[#00732F] dark:text-emerald-400">{num(trip.trip.saved, 2)} {t('kg')} CO₂</b> {t('celebrate.earned')}{' '}
                  <b>{num(trip.trip.credits)} {t('credits')}</b> <span className="text-[#8a6d2f] dark:text-[#d9bd7f]">({aed(trip.trip.credits / trip.rate)})</span>
                </p>
              )}
              <div className="mt-3 text-xs text-muted-foreground">{t('celebrate.verify')}: <span className="num font-semibold">{num(trip.trip.verificationScore * (trip.trip.verificationScore <= 1 ? 100 : 1))}%</span></div>
              <button onClick={() => setTrip(null)} className="mt-6 h-11 w-full rounded-lg bg-foreground font-semibold text-background" data-testid="button-celebration-close">{t('celebrate.done')}</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  );
}
