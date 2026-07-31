import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Network, Landmark } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { texts } from '../i18n/texts';

// Minimalist, quote-first homepage (2026-07-12 redesign): a breathable hero
// around Aristotle's swallow line, one hook paragraph, three feature cards.
// All copy lives in texts.js; every surface uses the shadcn theme tokens.
function HomePage() {
  const { language } = useLanguage();
  const t = texts[language];
  const isHebrew = language === 'he';
  const basePath = isHebrew ? '/he' : '/en';

  const features = [
    {
      key: 'timeline',
      Icon: Clock,
      title: t.home_card_timeline_title,
      desc: t.home_card_timeline_desc,
      to: `${basePath}/philosophers`,
    },
    {
      key: 'graph',
      Icon: Network,
      title: t.home_card_graph_title,
      desc: t.home_card_graph_desc,
      to: `${basePath}/philosophers?view=graph`,
    },
    {
      key: 'schools',
      Icon: Landmark,
      title: t.home_card_schools_title,
      desc: t.home_card_schools_desc,
      to: `${basePath}/schools`,
    },
  ];

  const ctaArrow = (
    <ArrowRight
      className={`w-4 h-4 transition-transform duration-300 ${
        isHebrew ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'
      }`}
    />
  );

  return (
    <div dir={isHebrew ? 'rtl' : 'ltr'} className="pb-24">

      {/* HERO — the quote, given room to breathe */}
      <section className="min-h-[70vh] flex items-center justify-center px-6">
        <div className="max-w-3xl mx-auto text-center">
          <blockquote
            /* Frank Ruhl Libre has no italics — only the Latin serif slants */
            className={`font-serif text-2xl md:text-4xl leading-relaxed md:leading-relaxed text-foreground ${
              isHebrew ? '' : 'italic'
            }`}
          >
            {t.home_quote}
          </blockquote>

          <p className="mt-8 text-sm md:text-base tracking-wide text-muted-foreground">
            {t.home_quote_citation}
          </p>

          <div className="mt-12">
            <Link
              to={`${basePath}/philosophers`}
              className="group inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-primary text-primary-foreground font-medium shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              <span>{t.home_cta}</span>
              {ctaArrow}
            </Link>
          </div>
        </div>
      </section>

      {/* THE HOOK */}
      <section className="max-w-2xl mx-auto px-6 text-center mt-4 mb-16">
        <p className="text-lg md:text-xl leading-relaxed text-muted-foreground">
          {t.home_hook}
        </p>
      </section>

      {/* FEATURE CARDS */}
      <section className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map(({ key, Icon, title, desc, to }) => (
            <Link
              key={key}
              to={to}
              className="group flex flex-col bg-card border border-border rounded-2xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-primary/40 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <Icon className="w-6 h-6" />
              </div>

              <h3 className="font-serif font-bold text-xl text-foreground mb-2 group-hover:text-primary transition-colors">
                {title}
              </h3>

              <p className="text-sm leading-relaxed text-muted-foreground flex-1">
                {desc}
              </p>

              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary opacity-70 group-hover:opacity-100 transition-opacity">
                {t.home_card_cta}
                {ctaArrow}
              </span>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}

export default HomePage;
