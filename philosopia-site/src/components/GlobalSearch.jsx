import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import Fuse from 'fuse.js';
import { Search, Brain, Library, Lightbulb, Swords } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useSearchIndex } from '../hooks/queries';

const TYPE_META = {
    philosopher: { icon: Brain, route: 'philosophers', labelEn: 'Philosophers', labelHe: 'פילוסופים' },
    school: { icon: Library, route: 'schools', labelEn: 'Schools', labelHe: 'אסכולות' },
    concept: { icon: Lightbulb, route: 'concepts', labelEn: 'Concepts', labelHe: 'מושגים' },
    beef: { icon: Swords, route: 'beefs', labelEn: 'Beefs', labelHe: 'ריבים' },
};
const GROUP_ORDER = ['philosopher', 'school', 'concept', 'beef'];
const MAX_PER_GROUP = 8;

/**
 * Global search — a ⌘K / Ctrl+K command palette over the whole catalog
 * (philosophers, schools, concepts, beefs), fuzzy-matched with Fuse.js across
 * both languages. Renders its own navbar trigger button + the dialog.
 */
export function GlobalSearch() {
    const { language } = useLanguage();
    const isHebrew = language === 'he';
    const navigate = useNavigate();

    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');

    // The index only fetches once the palette is first opened, then stays cached.
    const { data: docs, isLoading } = useSearchIndex(open);

    // ⌘K (mac) / Ctrl+K toggles; preventDefault stops the browser's own ⌘K.
    useEffect(() => {
        const onKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setOpen((prev) => !prev);
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, []);

    const fuse = useMemo(() => {
        if (!docs) return null;
        return new Fuse(docs, {
            keys: [
                { name: 'nameEn', weight: 3 },
                { name: 'nameHe', weight: 3 },
                { name: 'alias', weight: 2 },
                { name: 'subEn', weight: 1 },
                { name: 'subHe', weight: 1 },
            ],
            threshold: 0.35,
            ignoreLocation: true,
        });
    }, [docs]);

    // Fuse does the ranking; bucket the ranked hits by type for grouped display.
    const groups = useMemo(() => {
        if (!fuse || !query.trim()) return [];
        const hits = fuse.search(query.trim()).map((r) => r.item);
        const byType = new Map();
        for (const doc of hits) {
            if (!byType.has(doc.type)) byType.set(doc.type, []);
            const bucket = byType.get(doc.type);
            if (bucket.length < MAX_PER_GROUP) bucket.push(doc);
        }
        return GROUP_ORDER.filter((t) => byType.has(t)).map((t) => ({ type: t, items: byType.get(t) }));
    }, [fuse, query]);

    const onPick = useCallback((doc) => {
        setOpen(false);
        setQuery('');
        navigate(`/${language}/${TYPE_META[doc.type].route}/${doc.id}`);
    }, [language, navigate]);

    return (
        <>
            {/* Navbar trigger */}
            <button
                onClick={() => setOpen(true)}
                aria-label={isHebrew ? 'חיפוש' : 'Search'}
                data-testid="global-search-trigger"
                className="flex items-center gap-2 text-muted-foreground hover:text-amber-500 transition-colors"
            >
                <Search className="w-4 h-4" />
                <kbd className="hidden md:inline-block text-[10px] font-mono border border-border rounded px-1.5 py-0.5 bg-muted/50">
                    ⌘K
                </kbd>
            </button>

            <Command.Dialog
                open={open}
                onOpenChange={(next) => { setOpen(next); if (!next) setQuery(''); }}
                label={isHebrew ? 'חיפוש גלובלי' : 'Global search'}
                shouldFilter={false}
                overlayClassName="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
                contentClassName="fixed z-[101] top-[15%] left-1/2 -translate-x-1/2 w-[calc(100vw-2rem)] max-w-xl"
            >
                <div
                    dir={isHebrew ? 'rtl' : 'ltr'}
                    className="bg-card text-card-foreground border border-border rounded-xl shadow-2xl overflow-hidden"
                >
                    <div className="flex items-center gap-3 px-4 border-b border-border">
                        <Search className="w-4 h-4 shrink-0 text-muted-foreground" />
                        <Command.Input
                            value={query}
                            onValueChange={setQuery}
                            placeholder={isHebrew ? 'חיפוש פילוסופים, אסכולות, מושגים, ריבים…' : 'Search philosophers, schools, concepts, beefs…'}
                            className="w-full py-3.5 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
                        />
                    </div>

                    <Command.List
                        className="max-h-[min(24rem,60vh)] overflow-y-auto p-2
                                   [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5
                                   [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold
                                   [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest
                                   [&_[cmdk-group-heading]]:text-muted-foreground"
                    >
                        {open && isLoading && (
                            <div className="py-8 text-center text-sm text-muted-foreground">
                                {isHebrew ? 'טוען את האינדקס…' : 'Loading index…'}
                            </div>
                        )}

                        {!isLoading && !query.trim() && (
                            <div className="py-8 text-center text-sm text-muted-foreground">
                                {isHebrew ? 'התחילו להקליד כדי לחפש בכל האנציקלופדיה' : 'Start typing to search the whole encyclopedia'}
                            </div>
                        )}

                        {!isLoading && query.trim() && groups.length === 0 && (
                            <Command.Empty className="block py-8 text-center text-sm text-muted-foreground">
                                {isHebrew ? 'לא נמצאו תוצאות.' : 'No results found.'}
                            </Command.Empty>
                        )}

                        {groups.map(({ type, items }) => {
                            const meta = TYPE_META[type];
                            const Icon = meta.icon;
                            return (
                                <Command.Group key={type} heading={isHebrew ? meta.labelHe : meta.labelEn}>
                                    {items.map((doc) => (
                                        <Command.Item
                                            key={`${type}-${doc.id}`}
                                            value={`${type}-${doc.id}`}
                                            onSelect={() => onPick(doc)}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer
                                                       text-card-foreground/90
                                                       data-[selected=true]:bg-amber-500/10 data-[selected=true]:text-amber-600
                                                       dark:data-[selected=true]:text-amber-400"
                                        >
                                            <Icon className="w-4 h-4 shrink-0 opacity-60" />
                                            <span className="font-medium truncate">
                                                {isHebrew ? (doc.nameHe || doc.nameEn) : doc.nameEn}
                                            </span>
                                            {(isHebrew ? doc.metaHe : doc.metaEn) && (
                                                <span className="text-xs font-mono text-muted-foreground shrink-0">
                                                    {isHebrew ? doc.metaHe : doc.metaEn}
                                                </span>
                                            )}
                                            <span className="ms-auto text-[10px] uppercase tracking-wider text-muted-foreground/70 shrink-0">
                                                {isHebrew ? meta.labelHe : meta.labelEn}
                                            </span>
                                        </Command.Item>
                                    ))}
                                </Command.Group>
                            );
                        })}
                    </Command.List>
                </div>
            </Command.Dialog>
        </>
    );
}
