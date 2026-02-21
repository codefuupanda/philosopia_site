import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { texts } from '../i18n/texts';
import { cn } from '../lib/utils';
import { Copy, Check, Flame } from 'lucide-react';
import { Loader } from '../components/ui/Loader';

const QuoteCard = React.memo(function QuoteCard({ quote, lang, isRtl, copiedId, onCopy, t }) {
    const content = quote.content[lang] || quote.content.en;
    const isCopied = copiedId === quote._id;

    return (
        <div className="break-inside-avoid mb-5">
            <div className={cn(
                "relative bg-card border border-border/40 rounded-xl p-6 transition-all duration-300",
                "hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-900/5",
                "group"
            )}>
                {/* Quote accent line */}
                <div className={cn(
                    "absolute top-0 w-12 h-[2px] bg-amber-500/40 group-hover:bg-amber-500/70 group-hover:w-20 transition-all duration-500 rounded-full",
                    isRtl ? "right-6" : "left-6"
                )} />

                {/* Quote content */}
                <blockquote className="pt-4 pb-4">
                    <p className="text-base font-serif leading-relaxed text-foreground/90">
                        {content}
                    </p>
                </blockquote>

                {/* Attribution */}
                <div className="flex items-end justify-between border-t border-border/30 pt-4">
                    <div className="min-w-0 flex-1">
                        <Link
                            to={`/${lang}/philosophers/${quote.philosopherId}`}
                            className="font-semibold text-sm text-foreground hover:text-amber-500 transition-colors"
                        >
                            {quote.philosopher?.name?.[lang]}
                        </Link>
                        {quote.work && (
                            <p className="text-xs text-muted-foreground/70 mt-0.5 italic truncate">
                                {quote.work.title?.[lang]}
                            </p>
                        )}
                    </div>

                    <button
                        onClick={() => onCopy(content, quote._id)}
                        className={cn(
                            "shrink-0 p-2 rounded-lg transition-all duration-200",
                            isCopied
                                ? "bg-green-500/10 text-green-600"
                                : "text-muted-foreground/40 hover:text-foreground hover:bg-accent"
                        )}
                        title={t.quote_copy}
                    >
                        {isCopied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                </div>

                {/* Tags */}
                {quote.tags && quote.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                        {quote.tags.map(tag => (
                            <span key={tag} className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
});

export default function QuotesPage() {
    const location = useLocation();
    const lang = location.pathname.split('/')[1] || 'en';
    const t = texts[lang];
    const isRtl = lang === 'he';

    const [allQuotes, setAllQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState(null);
    const [selectedTag, setSelectedTag] = useState(null);

    // Fetch all quotes once. Filter client-side — no need to re-fetch for tags.
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await api.getQuotes(lang);
                setAllQuotes(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [lang]);

    // Derive available tags from full dataset
    const availableTags = useMemo(() => {
        const tagCounts = new Map();
        for (const q of allQuotes) {
            for (const tag of (q.tags || [])) {
                tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
            }
        }
        // Sort by frequency (descending)
        return [...tagCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([tag]) => tag);
    }, [allQuotes]);

    // Client-side filter
    const filtered = useMemo(() => {
        if (!selectedTag) return allQuotes;
        return allQuotes.filter(q => q.tags && q.tags.includes(selectedTag));
    }, [allQuotes, selectedTag]);

    const handleCopy = useCallback((text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    }, []);

    return (
        <div className={cn("container mx-auto px-4 py-12 min-h-screen", isRtl ? "rtl" : "ltr")} dir={isRtl ? "rtl" : "ltr"}>
            {/* Header */}
            <header className="mb-12 text-center space-y-4">
                <div className="flex items-center justify-center gap-3 mb-2">
                    <Flame className="w-7 h-7 text-amber-500/70" />
                </div>
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground">
                    {isRtl ? "האורקל" : "The Oracle"}
                </h1>
                <p className="text-muted-foreground text-lg max-w-lg mx-auto">
                    {t.quotes_subtitle}
                </p>
            </header>

            {/* Tag filter bar */}
            {!loading && availableTags.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center mb-12">
                    <button
                        onClick={() => setSelectedTag(null)}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border",
                            !selectedTag
                                ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                                : "bg-transparent text-muted-foreground border-border/50 hover:border-amber-500/30 hover:text-foreground"
                        )}
                    >
                        {t.quotes_filter_all}
                    </button>
                    {availableTags.map(tag => (
                        <button
                            key={tag}
                            onClick={() => setSelectedTag(tag)}
                            className={cn(
                                "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border",
                                selectedTag === tag
                                    ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                                    : "bg-transparent text-muted-foreground border-border/50 hover:border-amber-500/30 hover:text-foreground"
                            )}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            )}

            {/* Content */}
            {loading ? (
                <div className="py-20 flex justify-center">
                    <Loader />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                    {isRtl ? "אין ציטוטים להצגה." : "No quotes to display."}
                </div>
            ) : (
                <div className="columns-1 md:columns-2 lg:columns-3 gap-5">
                    {filtered.map((quote) => (
                        <QuoteCard
                            key={quote._id}
                            quote={quote}
                            lang={lang}
                            isRtl={isRtl}
                            copiedId={copiedId}
                            onCopy={handleCopy}
                            t={t}
                        />
                    ))}
                </div>
            )}

            {/* Count */}
            {!loading && allQuotes.length > 0 && (
                <div className="mt-16 pt-6 border-t border-border/30 text-center text-xs text-muted-foreground/50">
                    {selectedTag
                        ? `${filtered.length} / ${allQuotes.length}`
                        : allQuotes.length
                    } {isRtl ? 'ציטוטים' : 'quotes'}
                </div>
            )}
        </div>
    );
}
