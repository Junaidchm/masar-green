import { ExternalLink, Leaf } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

// Verbatim English excerpt from the chairman's introduction.
// Arabic is our translation, explicitly labeled rather than presented as official.
const SOURCE = 'https://www.ead.gov.ae/-/media/Project/EAD/EAD/Documents/Resources/EAD-Strategy-Report-Digital-EN.pdf';

export function SustainabilityQuote() {
  const { t, lang } = useI18n();
  return (
    <aside className="sustainability-quote" aria-label={t('quote.label')} data-testid="sustainability-quote">
      <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-4 md:gap-4 md:px-6">
        <span className="quote-icon" aria-hidden><Leaf className="h-5 w-5" /></span>
        <figure className="min-w-0 flex-1">
          <div className="quote-eyebrow">{t('quote.label')}{lang === 'ar' && <span className="ms-2 font-normal tracking-normal">· {t('quote.translation')}</span>}</div>
          <blockquote className="mt-1 text-sm font-medium leading-relaxed">“{t('quote.text')}”</blockquote>
          <figcaption className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] leading-relaxed">
            <span className="quote-author">— {t('quote.author')}</span>
            <a href={SOURCE} target="_blank" rel="noopener noreferrer" className="quote-source inline-flex min-h-8 items-center gap-1.5 underline decoration-current/40 underline-offset-4 hover:decoration-current" data-testid="link-quote-source">
              {t('quote.source')}<ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
            </a>
          </figcaption>
        </figure>
      </div>
    </aside>
  );
}
