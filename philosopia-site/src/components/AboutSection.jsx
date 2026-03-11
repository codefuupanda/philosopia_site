import React from "react";
import { BookOpen, Users, Scale, Lightbulb } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { texts } from "../i18n/texts";

const icons = [Users, BookOpen, Scale, Lightbulb];

function AboutSection() {
  const { language } = useLanguage();
  const t = texts[language];

  return (
    <section className="max-w-9xl mx-auto px-4">
      <div className="rounded-3xl border border-border bg-card p-8 md:p-12 space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
            {t.about_section_title}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t.about_section_text}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          {t.about_section_features.map((feature, i) => {
            const Icon = icons[i];
            return (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-border bg-background p-4"
              >
                <div className="shrink-0 w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm text-foreground leading-relaxed flex-1 text-center">
                  {feature}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default AboutSection;
