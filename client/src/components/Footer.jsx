import { Zap } from 'lucide-react';
import { brand, footer } from '../content/siteContent';

export default function Footer() {
  return (
    <footer className="bg-panel border-t border-line mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-8">
        <div className="grid sm:grid-cols-[1.5fr,1fr,1fr] gap-10">
          <div>
            <div className="flex items-center gap-1.5 font-display font-bold text-lg text-ink">
              <Zap className="w-5 h-5 text-volt" fill="currentColor" />
              {brand.name}
            </div>
            <p className="mt-3 text-sm text-ink-muted max-w-xs leading-relaxed">{footer.description}</p>
          </div>

          {footer.columns.map((col) => (
            <div key={col.title}>
              <h4 className="font-display font-semibold text-sm text-ink mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-ink-muted hover:text-ink transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-line flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-ink-faint">{footer.copyright}</span>
          <div className="flex items-center gap-5">
            {footer.social.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="text-xs text-ink-muted hover:text-ink transition-colors">
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
