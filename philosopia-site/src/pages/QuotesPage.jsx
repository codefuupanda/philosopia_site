import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { texts } from '../i18n/texts';
import { cn } from '../lib/utils';
import { Copy } from 'lucide-react';
import { Loader } from '../components/ui/Loader';

export default function QuotesPage() {
    const location = useLocation();
    const lang = location.pathname.split('/')[1] || 'en';
    const t = texts[lang];
    const isRtl = lang === 'he';

    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState(null);

    // Dynamic Tags Logic
    const [availableTags, setAvailableTags] = useState([]);
    const [selectedTag, setSelectedTag] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Note: For a real app with pagination, we'd fetch tags separately.
                // For now, we fetch all/filtered quotes.

                // If we want to maintain the list of ALL tags even when filtered, 
                // we might need a separate call or strategy. 
                // For this implementation, we'll fetch based on filter, 
                // BUT we need to know all tags initially. 
                // A simple approach: fetch all quotes first to derive tags, OR let the API handle it.
                // Given the prompt asks to "map over it to get all tags" from the loaded quotes:

                const filters = selectedTag ? { tag: selectedTag } : {};
                const data = await api.getQuotes(lang, filters);
                setQuotes(data);

                // If no filter is active, we can derive the full list of tags from 'data'
                // If a filter IS active, 'data' only has that tag. 
                // To keep the filter bar populated, we should ideally fetch tags once or 
                // derive them from a separate "all items" list.
                // However, per instructions: "When 'quotes' data is loaded... store these in a state variable".
                // We'll calculate tags only if we don't have them yet or if we want to show only *relevant* tags.
                // Better UX: Calculate tags from the *initial* full fetch (when selectedTag is null).

                if (!selectedTag && data.length > 0) {
                    const allTags = data.flatMap(q => q.tags || []);
                    const uniqueTags = [...new Set(allTags)];
                    setAvailableTags(uniqueTags);
                }

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [lang, selectedTag]);

    const handleCopy = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className={cn("container mx-auto px-4 py-12", isRtl ? "rtl" : "ltr")} dir={isRtl ? "rtl" : "ltr"}>
            <header className="mb-10 text-center space-y-3">
                <h1 className="text-4xl font-serif font-bold">{t.quotes_title}</h1>
                <p className="text-muted-foreground">{t.quotes_subtitle}</p>
            </header>

            {/* Filter Bar */}
            <div className="flex flex-wrap gap-2 justify-center mb-12">
                <button
                    onClick={() => setSelectedTag(null)}
                    className={cn(
                        "px-4 py-1.5 rounded-full text-sm transition-colors border",
                        !selectedTag
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-transparent hover:bg-accent border-border"
                    )}
                >
                    {t.quotes_filter_all}
                </button>
                {availableTags.map(tag => (
                    <button
                        key={tag}
                        onClick={() => setSelectedTag(tag)}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-sm transition-colors border",
                            selectedTag === tag
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-transparent hover:bg-accent border-border"
                        )}
                    >
                        {tag}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="py-20 flex justify-center"><Loader /></div>
            ) : (
                /* Masonry-ish Layout using Columns */
                <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                    {quotes.map((quote) => (
                        <div
                            key={quote._id}
                            className="break-inside-avoid bg-card border border-border p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow relative group"
                        >
                            <div className="mb-4">
                                <span className="text-4xl text-primary/20 font-serif leading-none">“</span>
                                <p className="text-lg font-serif font-medium leading-relaxed relative z-10 -mt-4 px-2">
                                    {quote.content[lang] || quote.content.en}
                                </p>
                            </div>

                            <div className="flex items-end justify-between border-t border-border/50 pt-4 mt-4">
                                <div>
                                    <Link
                                        to={`/${lang}/philosopher/${quote.philosopherId}`}
                                        className="font-bold text-sm hover:underline decoration-primary"
                                    >
                                        {quote.philosopher?.name?.[lang]}
                                    </Link>
                                    {quote.work && (
                                        <p className="text-xs text-muted-foreground mt-0.5 italic">
                                            {quote.work.title?.[lang]}
                                        </p>
                                    )}
                                </div>

                                <button
                                    onClick={() => handleCopy(quote.content[lang], quote._id)}
                                    className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                                    title={t.quote_copy}
                                >
                                    {copiedId === quote._id ? (
                                        <span className="text-xs font-bold text-green-600">{t.quote_copied}</span>
                                    ) : (
                                        <Copy size={16} />
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
