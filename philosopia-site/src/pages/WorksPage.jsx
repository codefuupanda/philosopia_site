import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { texts } from '../i18n/texts';
import { WorkCard } from '../components/WorkCard';
import { Loader } from '../components/ui/Loader';
import { cn } from '../lib/utils';
import { Search, BookOpen, User } from 'lucide-react';

export default function WorksPage() {
    const location = useLocation();
    const lang = location.pathname.split('/')[1] || 'en';
    const t = texts[lang];
    const isRtl = lang === 'he';

    const [works, setWorks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [groupBy, setGroupBy] = useState('philosopher'); // 'philosopher' | 'none'

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await api.getWorks(lang);
                setWorks(data);
            } catch (err) {
                console.error("Failed to load works", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [lang]);

    // Filter works by search term (matches title or philosopher name)
    const filtered = useMemo(() => {
        if (!search.trim()) return works;
        const q = search.toLowerCase();
        return works.filter(w =>
            (w.title[lang] || w.title.en || '').toLowerCase().includes(q) ||
            (w.philosopher?.name?.[lang] || '').toLowerCase().includes(q)
        );
    }, [works, search, lang]);

    // Group by philosopher
    const grouped = useMemo(() => {
        if (groupBy !== 'philosopher') return null;
        const map = new Map();
        for (const work of filtered) {
            const key = work.philosopher?.name?.[lang] || work.philosopherId || 'Unknown';
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(work);
        }
        // Sort groups by number of works (descending), then alphabetically
        return [...map.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
    }, [filtered, groupBy, lang]);

    return (
        <div className={cn("container mx-auto px-4 py-12 min-h-screen", isRtl ? "rtl" : "ltr")} dir={isRtl ? "rtl" : "ltr"}>
            {/* Header */}
            <header className="mb-10 space-y-4">
                <div className="flex items-center gap-3">
                    <BookOpen className="w-8 h-8 text-amber-500" />
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground">
                        {t.works_title}
                    </h1>
                </div>
                <p className="text-lg text-muted-foreground max-w-2xl">
                    {t.works_subtitle}
                </p>
            </header>

            {/* Toolbar: Search + Group toggle */}
            {!loading && works.length > 0 && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-10">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search
                        className={cn(
                            "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-black dark:text-white",
                            isRtl ? "right-3" : "left-3"
                        )}
                        />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={isRtl ? "חיפוש לפי כותרת או פילוסוף..." : "Search by title or philosopher..."}
                            className={cn(
                            "w-full py-2.5 bg-card border border-border/50 rounded-lg text-sm text-black placeholder:text-muted-foreground/50 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors",
                            isRtl ? "pr-10 pl-4" : "pl-10 pr-4"
                            )}
                        />
                    </div>

                    {/* Group toggle */}
                    <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-lg border border-border/30">
                        <button
                            onClick={() => setGroupBy('philosopher')}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                                groupBy === 'philosopher'
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <User size={13} />
                            {isRtl ? "לפי פילוסוף" : "By Philosopher"}
                        </button>
                        <button
                            onClick={() => setGroupBy('none')}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                                groupBy === 'none'
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <BookOpen size={13} />
                            {isRtl ? "כל הכתבים" : "All Works"}
                        </button>
                    </div>
                </div>
            )}

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                    {search
                        ? (isRtl ? "לא נמצאו תוצאות." : "No results found.")
                        : (isRtl ? "אין כתבים להצגה." : "No works to display.")}
                </div>
            ) : groupBy === 'philosopher' && grouped ? (
                // Grouped view
                <div className="space-y-12">
                    {grouped.map(([philosopherName, philosopherWorks]) => (
                        <section key={philosopherName}>
                            <div className="flex items-center gap-3 mb-5 pb-3 border-b border-amber-500/20">
                                <h2 className="text-xl font-serif font-bold text-foreground">
                                    {philosopherName}
                                </h2>
                                <span className="text-xs text-muted-foreground/60 font-mono">
                                    {philosopherWorks.length} {philosopherWorks.length === 1 ? (isRtl ? 'כתב' : 'work') : (isRtl ? 'כתבים' : 'works')}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {philosopherWorks.map((work) => (
                                    <WorkCard key={work._id} work={work} lang={lang} />
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            ) : (
                // Flat grid view
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((work) => (
                        <WorkCard key={work._id} work={work} lang={lang} />
                    ))}
                </div>
            )}

            {/* Stats footer */}
            {!loading && works.length > 0 && (
                <div className="mt-16 pt-6 border-t border-border/30 text-center text-xs text-muted-foreground/50">
                    {works.length} {isRtl ? 'כתבים בספרייה' : 'works in the library'}
                </div>
            )}
        </div>
    );
}
