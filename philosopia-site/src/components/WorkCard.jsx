import React from 'react';
import { cn } from '../lib/utils';
import { ExternalLink } from 'lucide-react';

export const WorkCard = React.memo(function WorkCard({ work, lang }) {
    const isRtl = lang === 'he';
    const title = work.title[lang] || work.title.en;
    const philosopherName = work.philosopher?.name?.[lang] || work.philosopherId;

    return (
        <div className={cn(
            "group relative flex flex-col justify-between p-5 border rounded-lg transition-all duration-300",
            "bg-card hover:bg-accent/5 border-border/40 hover:border-amber-500/30 hover:shadow-md",
            isRtl ? "text-right" : "text-left"
        )}>
            {/* Decorative spine */}
            <div className={cn(
                "absolute top-3 bottom-3 w-[3px] rounded-full bg-amber-500/20 group-hover:bg-amber-500/50 transition-colors",
                isRtl ? "right-1.5" : "left-1.5"
            )} />

            <div className="ps-5">
                <h3 className="text-lg font-serif font-bold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-snug">
                    {title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1.5">
                    {philosopherName}
                </p>
            </div>

            <div className="ps-5 mt-4 flex items-center justify-between text-xs text-muted-foreground/70 border-t border-border/30 pt-3">
                {work.publicationYear && (
                    <span className="font-mono tabular-nums">
                        {work.publicationYear}
                    </span>
                )}
                {work.wikiLink && (
                    <a
                        href={work.wikiLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-muted-foreground/50 hover:text-amber-500 transition-colors"
                    >
                        <ExternalLink size={12} />
                        <span>Wiki</span>
                    </a>
                )}
            </div>
        </div>
    );
});
