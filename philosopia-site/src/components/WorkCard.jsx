import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { texts } from '../i18n/texts';

export function WorkCard({ work, lang }) {
    const t = texts[lang];
    const isRtl = lang === 'he';

    return (
        <div className={cn(
            "group relative flex flex-col justify-between p-6 border rounded-lg transition-all duration-300",
            "bg-card hover:bg-accent/5 hover:shadow-lg border-border/50 hover:border-primary/20",
            isRtl ? "text-right" : "text-left"
        )}>
            {/* Decorative Spine Line */}
            <div className={cn(
                "absolute top-4 bottom-4 w-1 bg-primary/10 rounded-full",
                isRtl ? "right-2" : "left-2"
            )} />

            <div className="ps-6">
                <h3 className="text-xl font-serif font-bold text-foreground group-hover:text-primary transition-colors">
                    {work.title[lang] || work.title.en}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                    {work.philosopher?.name?.[lang]}
                </p>
            </div>

            <div className="ps-6 mt-6 flex items-center justify-between text-xs text-muted-foreground/60 border-t border-border/40 pt-3">
                <span>{t.published_in} {work.publicationYear}</span>
                {work.wikiLink && (
                    <a
                        href={work.wikiLink}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-primary transition-colors"
                    >
                        Wiki &rarr;
                    </a>
                )}
            </div>
        </div>
    );
}
