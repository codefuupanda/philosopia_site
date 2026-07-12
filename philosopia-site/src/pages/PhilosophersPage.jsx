import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { usePhilosophersList, usePeriods } from "../hooks/queries";
import { texts } from "../i18n/texts";
import { Brain, ChevronLeft, ChevronRight, LayoutGrid, Clock, Network } from 'lucide-react';
import { Loader } from '../components/ui/Loader';
import { AlphaNav } from '../components/AlphaNav';
import { RelationshipGraph } from '../components/RelationshipGraph';

// Timeline view imports
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { Separator } from "../components/ui/separator";
import { ScrollArea } from "../components/ui/scroll-area";
import { Quote, BookOpen, ArrowRight, Menu } from 'lucide-react';

const PAGE_SIZE = 12;

// ─── Grid View ───────────────────────────────────────────────────────────────

const dedup = (list) => {
  const unique = [];
  const seen = new Set();
  for (const p of list) {
    if (!seen.has(p.id || p._id)) {
      seen.add(p.id || p._id);
      unique.push(p);
    }
  }
  return unique;
};

function GridView({ lang, isHebrew, t, searchParams, setSearchParams }) {
  const [activeLetter, setActiveLetter] = useState(null);

  const page = Math.max(1, parseInt(searchParams.get("page")) || 1);

  // Full list — powers the letter-availability index and letter-filtered view.
  // React Query dedupes this against the letter-filtered query below (same key).
  const fullListQuery = usePhilosophersList({ page: 1, limit: 500 });

  // The list actually shown: full list while a letter filter is active,
  // the normal paginated fetch otherwise.
  const listQuery = usePhilosophersList(
    activeLetter ? { page: 1, limit: 500 } : { page, limit: PAGE_SIZE }
  );

  // Which letters have at least one philosopher (null = still loading)
  const availableLetters = useMemo(() => {
    if (fullListQuery.isLoading) return null;
    if (fullListQuery.isError) return new Set(); // fail open — disable all
    const nameKey = isHebrew ? "nameHe" : "nameEn";
    return new Set(
      (fullListQuery.data?.philosophers || [])
        .map((p) => (p[nameKey] || "").charAt(0).toUpperCase())
        .filter(Boolean)
    );
  }, [fullListQuery.isLoading, fullListQuery.isError, fullListQuery.data, isHebrew]);

  const loading = listQuery.isLoading;
  const error = listQuery.isError
    ? (isHebrew ? "שגיאה בטעינת רשימת הפילוסופים." : "Error loading philosophers list.")
    : null;

  const philosophers = useMemo(() => {
    const all = dedup(listQuery.data?.philosophers || []);
    if (!activeLetter) return all;
    return all.filter((p) => {
      const name = isHebrew ? (p.nameHe || "") : (p.nameEn || "");
      return name.charAt(0).toUpperCase() === activeLetter;
    });
  }, [listQuery.data, activeLetter, isHebrew]);

  const totalPages = activeLetter ? 1 : (listQuery.data?.totalPages || 1);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page, activeLetter]);

  const handleLetterSelect = useCallback((letter) => {
    setActiveLetter(letter);
    // Reset to page 1 whenever the letter filter changes
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", 1);
      return next;
    });
  }, [setSearchParams]);

  const goToPage = useCallback((p) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", p);
      return next;
    });
  }, [setSearchParams]);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  if (loading) {
    return (
      <div className="p-20 flex justify-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-center text-xl text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div dir={isHebrew ? 'rtl' : 'ltr'} className="container max-w-6xl mx-auto py-12 px-4">

      {/* Alphabetical Filter Bar */}
      <div className="mb-8 pb-6 border-b border-border">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          {t.alpha_filter_label}
        </p>
        <AlphaNav
          lang={lang}
          isHebrew={isHebrew}
          activeLetter={activeLetter}
          onSelectLetter={handleLetterSelect}
          availableLetters={availableLetters}
          allLabel={t.alpha_all}
          ariaLabel={t.alpha_filter_label}
        />
      </div>

      {/* Empty state when no results for the chosen letter */}
      {philosophers.length === 0 && !loading && (
        <div className="py-20 text-center text-muted-foreground text-sm italic">
          {t.alpha_no_results}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {philosophers.map((phil) => (
          <div key={phil.id} className="group flex flex-col bg-card border border-amber-500 rounded-xl shadow-lg hover:shadow-2xl hover:border-primary/50 hover:-translate-y-1 transition-all duration-300 p-6 h-full">

            <Link to={`/${lang}/philosophers/${phil.id}`} className="block flex-grow">

              {/* Header: Avatar + Name */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 shrink-0 rounded-full overflow-hidden border-2 border-border group-hover:border-primary transition-colors bg-muted">
                  {phil.imageUrl ? (
                    <img
                      src={phil.imageUrl}
                      alt={phil.nameEn}
                      className="w-full h-full object-cover transition-all duration-300"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl font-bold text-muted-foreground">
                      {phil.nameEn.charAt(0)}
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="text-2xl font-serif font-bold text-foreground group-hover:text-primary transition-colors">
                    {isHebrew ? phil.nameHe : phil.nameEn}
                  </h2>
                  <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded inline-block mt-1">
                    {isHebrew ? phil.yearsHe : phil.yearsEn}
                  </span>
                </div>
              </div>

              {/* Summary */}
              <p className="text-muted-foreground mb-6 leading-relaxed text-sm line-clamp-4">
                {isHebrew ? phil.summaryHe : phil.summaryEn}
              </p>
            </Link>

            {/* Footer: School Tag */}
            {phil.schoolId && (
              <div className="pt-4 border-t border-border mt-auto">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
                  {isHebrew ? "אסכולה" : "School"}
                </span>
                <Link
                  to={`/${lang}/schools/${phil.schoolId}`}
                  className="inline-block text-xs font-semibold text-primary/80 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full hover:bg-primary/20 transition-colors"
                >
                  {phil.schoolId.replace(/_/g, ' ')}
                </Link>
              </div>
            )}

          </div>
        ))}
      </div>

      {/* Pagination — hidden while a letter filter is active */}
      {!activeLetter && totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2 mt-12">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg border border-border bg-card hover:bg-primary/10 hover:border-primary/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isHebrew ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {t.prev_page}
          </button>

          {getPageNumbers().map((p, i) =>
            p === "..." ? (
              <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">...</span>
            ) : (
              <button
                key={p}
                onClick={() => goToPage(p)}
                className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                  p === page
                    ? "bg-amber-500 text-black border border-amber-500"
                    : "border border-border bg-card hover:bg-primary/10 hover:border-primary/30"
                }`}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg border border-border bg-card hover:bg-primary/10 hover:border-primary/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {t.next_page}
            {isHebrew ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </nav>
      )}
    </div>
  );
}

// ─── Timeline View ───────────────────────────────────────────────────────────

const ALLOWED_PERIODS = [
  "pre_socratic",
  "classical_period",
  "hellenistic_period",
  "medieval_period",
  "early_modern_period",
  "modern_period",
  "contemporary_period"
];

const formatYear = (y) => {
  if (!y) return "";
  return y < 0 ? `${Math.abs(y)} BCE` : `${y} CE`;
};

// ── Chronological sorting ────────────────────────────────────────────────────
// Birth-year sort key parsed from the English years string. Formats in the
// data: "624–546 BCE" (one era marker after the range, governs both ends),
// "121–180 AD", "1138–1204" (bare CE), "4 BCE – 65 AD" (mixed eras),
// "c. 310–235 BCE", "5th Century BCE". BCE maps to negative years, so
// 470 BCE (-470) correctly sorts before 384 BCE (-384).
const birthYearOf = (phil) => {
  const s = phil.yearsEn || phil.dates || "";
  // "5th Century BCE" → mid-century estimate (e.g. -450)
  const century = s.match(/(\d+)(?:st|nd|rd|th)\s*century\s*(BCE|BC)?/i);
  if (century) {
    const mid = century[1] * 100 - 50;
    return century[2] ? -mid : mid;
  }
  const year = s.match(/\d{1,4}/); // first number in the string = birth year
  if (!year) return Infinity; // unparseable → sort last
  // The first era marker governs the birth year: in "624–546 BCE" the single
  // trailing marker applies to both ends; in "4 BCE – 65 AD" it's the birth's.
  const era = s.match(/BCE|BC|AD|CE/);
  return era && era[0][0] === "B" ? -year[0] : +year[0];
};

const byBirthYear = (a, b) =>
  birthYearOf(a) - birthYearOf(b) ||
  (a.nameEn || "").localeCompare(b.nameEn || "");

function TimelineView({ lang, isHebrew }) {
  const { data: periodsData, isLoading: loading } = usePeriods();

  const [activeEraIndex, setActiveEraIndex] = useState(0);
  const [activePhilosopherId, setActivePhilosopherId] = useState(null);
  const [selectedPhilosopher, setSelectedPhilosopher] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const eras = useMemo(() => {
    const allPeriods = periodsData?.periods || [];

    const filteredEras = allPeriods
      .filter(p => ALLOWED_PERIODS.includes(p.id))
      .map(p => {
        let nameEn = p.nameEn;
        let nameHe = p.nameHe;

        if (p.id === 'contemporary_period') {
          nameEn = "20th Century";
          nameHe = "המאה ה-20";
        }
        if (p.id === 'modern_period') {
          nameEn = "Modern (19th C.)";
          nameHe = "העת החדשה (המאה ה-19)";
        }

        const dates = `${formatYear(p.startYear)} - ${formatYear(p.endYear)}`;

        // Strict chronological order within the period (oldest birth first)
        const philosophers = [...(p.philosophers || [])].sort(byBirthYear);

        return { ...p, nameEn, nameHe, dates, philosophers };
      });

    filteredEras.sort((a, b) => a.startYear - b.startYear);
    return filteredEras;
  }, [periodsData]);

  // Scroll Spy Logic
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -50% 0px',
      threshold: 0
    };

    const handleIntersect = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;

          if (id.startsWith('era-')) {
            const eraId = id.replace('era-', '');
            const index = eras.findIndex(e => e.id === eraId);
            if (index !== -1) {
              setActiveEraIndex(index);
            }
          } else if (id.startsWith('phil-')) {
            const philId = id.replace('phil-', '');
            setActivePhilosopherId(philId);
          }
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    eras.forEach(era => {
      const el = document.getElementById(`era-${era.id}`);
      if (el) observer.observe(el);

      if (era.philosophers) {
        era.philosophers.forEach(phil => {
          const pEl = document.getElementById(`phil-${phil.id}`);
          if (pEl) observer.observe(pEl);
        });
      }
    });

    return () => observer.disconnect();
  }, [eras]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (eras.length === 0) {
    return <div className="min-h-screen bg-background text-muted-foreground flex items-center justify-center">No data found.</div>;
  }

  const activeEra = eras[activeEraIndex];

  return (
    <div dir={isHebrew ? 'rtl' : 'ltr'} className="min-h-screen bg-background text-foreground font-sans flex flex-col md:flex-row">

      {/* MOBILE HEADER */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-amber-500 bg-background sticky top-0 z-50">
        <span className="font-bold text-primary">
          {activeEra ? (isHebrew ? activeEra.nameHe : activeEra.nameEn) : ''}
        </span>
        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          <Menu className="w-6 h-6 text-muted-foreground" />
        </Button>
      </div>

      {/* SIDEBAR NAVIGATION */}
      <aside className={`
          fixed inset-y-0 z-40 flex bg-background/95 backdrop-blur border-e border-amber-500/30 transform transition-transform duration-300 ease-in-out
          md:sticky md:top-0 md:h-screen md:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : (isHebrew ? 'translate-x-full' : '-translate-x-full')}
          ${isHebrew ? 'right-0 md:right-auto' : 'left-0 md:left-auto'}
      `}>

        {/* VERTICAL TAB RAIL */}
        <div className="w-12 md:w-16 bg-muted/30 border-e border-amber-500/20 flex flex-col items-center py-6 gap-8 overflow-y-auto scrollbar-hide">
          {eras.map((era, index) => {
            const isActive = activeEraIndex === index;
            return (
              <button
                key={era.id}
                onClick={() => {
                  document.getElementById(`era-${era.id}`)?.scrollIntoView({ behavior: 'smooth' });
                  setActiveEraIndex(index);
                }}
                className={`
                  relative group flex flex-col items-center gap-2 transition-all duration-300
                  ${isActive ? 'opacity-100 scale-110' : 'opacity-50 hover:opacity-80'}
                `}
                title={isHebrew ? era.nameHe : era.nameEn}
              >
                <div className={`
                  w-3 h-3 rounded-full border border-amber-500 transition-all
                  ${isActive ? 'bg-amber-500 shadow-[0_0_10px_#d97706]' : 'bg-transparent group-hover:bg-amber-500/30'}
                `} />
                <span className="writing-vertical-lr text-[10px] font-mono tracking-widest uppercase text-foreground/80 whitespace-nowrap py-2" style={{ writingMode: 'vertical-rl' }}>
                  {isHebrew ? era.nameHe : era.nameEn.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* ACTIVE ERA PANEL */}
        <div className="w-42 flex flex-col h-full bg-card/50">
          <div className="p-6 border-b border-amber-500/20">
            <h2 className="text-xl font-serif font-bold text-foreground">
              {activeEra ? (isHebrew ? activeEra.nameHe : activeEra.nameEn) : "Philosopia"}
            </h2>
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              {activeEra?.dates}
            </p>
          </div>

          <ScrollArea className="flex-1 py-6 ps-4 pe-2" dir={isHebrew ? 'rtl' : 'ltr'}>
            {activeEra && (
              <div className="relative">
                <div className="absolute top-2 bottom-2 w-px bg-amber-500/30 ltr:left-[11px] rtl:right-[11px]" />

                <div className="space-y-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500 flex items-center justify-center shrink-0 z-10">
                      <div className="w-2 h-2 bg-amber-500 rounded-full" />
                    </div>
                    <span className="font-bold text-sm text-foreground">
                      {isHebrew ? "פילוסופים" : "Philosophers"}
                    </span>
                  </div>

                  {activeEra.philosophers?.map((phil) => {
                    const isSelected = activePhilosopherId === phil.id;
                    return (
                      <button
                        key={phil.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          document.getElementById(`phil-${phil.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          setIsSidebarOpen(false);
                        }}
                        className={`
                           group relative w-full flex items-center gap-3 py-2 px-2 rounded-md transition-all duration-200
                           ltr:ml-3 rtl:mr-3
                           ${isSelected
                            ? 'bg-amber-500 text-black shadow-md'
                            : 'hover:bg-amber-500/10 text-muted-foreground hover:text-foreground'}
                         `}
                      >
                        <div className={`
                           absolute top-1/2 w-3 h-px bg-amber-500/30
                           ltr:-left-3 rtl:-right-3
                         `} />

                        <span className={`text-xs truncate ${isSelected ? 'font-bold' : 'font-medium'}`}>
                          {isHebrew ? phil.nameHe : phil.nameEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </ScrollArea>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 bg-background relative">
        {eras.map((era) => {
          const eraPhilosophers = era.philosophers || []; // pre-sorted chronologically in the eras memo

          return (
            <section key={era.id} id={`era-${era.id}`} className="relative border-b border-amber-500/20 last:border-0 pb-20">

              {/* ERA HERO SECTION */}
              <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-amber-500/50 py-6 px-6 md:px-12 shadow-sm transition-all duration-300">
                <div className="container mx-auto">
                  <div className="flex items-baseline justify-between">
                    <h2 className="font-serif font-bold text-3xl md:text-5xl text-primary">
                      {isHebrew ? era.nameHe : era.nameEn}
                    </h2>
                    <span className="font-mono text-xs md:text-sm text-primary/80 tracking-widest">
                      {era.dates}
                    </span>
                  </div>
                  <p className="text-muted-foreground max-w-3xl leading-relaxed mt-2 text-sm md:text-base line-clamp-2 hover:line-clamp-none transition-all">
                    {isHebrew ? era.descriptionHe : era.descriptionEn}
                  </p>
                </div>
              </div>

              {/* PHILOSOPHER TIMELINE — central axis with alternating cards (desktop), start-rail stack (mobile) */}
              <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-14 relative">

                {/* Axis — mobile: inline-start rail; desktop: center line */}
                <div aria-hidden className="md:hidden absolute top-2 bottom-2 start-4 w-px bg-gradient-to-b from-primary/50 via-border to-primary/50" />
                <div aria-hidden className="hidden md:block absolute top-2 bottom-2 left-1/2 -translate-x-1/2 w-px bg-gradient-to-b from-primary/50 via-border to-primary/50" />

                <div>
                  {eraPhilosophers.map((phil, pIndex) => {
                    const isStart = pIndex % 2 === 0; // card on the inline-start half on desktop
                    const isActive = activePhilosopherId === phil.id;
                    const years = isHebrew ? (phil.yearsHe || phil.yearsEn) : (phil.yearsEn || phil.dates);

                    return (
                      <div
                        key={phil.id}
                        id={`phil-${phil.id}`}
                        className="relative mb-10 md:mb-14 last:mb-0"
                      >
                        {/* Axis node — mobile rail */}
                        <div
                          aria-hidden
                          className={`md:hidden absolute top-6 start-4 -translate-x-1/2 rtl:translate-x-1/2 w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                            isActive
                              ? 'bg-primary border-primary shadow-[0_0_10px_hsl(var(--primary)/0.6)]'
                              : 'bg-background border-primary/60'
                          }`}
                        />

                        {/* Axis node — desktop center line */}
                        <div
                          aria-hidden
                          className={`hidden md:block absolute top-7 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 z-10 transition-all duration-300 ${
                            isActive
                              ? 'bg-primary border-primary scale-125 shadow-[0_0_12px_hsl(var(--primary)/0.6)]'
                              : 'bg-background border-primary/60'
                          }`}
                        />

                        {/* Connector: axis → card (desktop) */}
                        <div
                          aria-hidden
                          className={`hidden md:block absolute top-[35px] h-px w-10 bg-primary/30 ${
                            isStart ? 'end-1/2' : 'start-1/2'
                          }`}
                        />

                        {/* Life years riding the axis, opposite the card (desktop) */}
                        <span
                          className={`hidden md:block absolute top-[27px] font-mono text-xs tracking-wider text-primary whitespace-nowrap ${
                            isStart ? 'start-[calc(50%+1.5rem)]' : 'end-[calc(50%+1.5rem)]'
                          }`}
                        >
                          {years}
                        </span>

                        {/* Card */}
                        <div className={`ms-10 ${isStart ? 'md:ms-0 md:me-auto' : 'md:ms-auto'} md:w-[calc(50%-3.5rem)]`}>
                          <Card
                            onClick={() => setSelectedPhilosopher(phil)}
                            className={`group cursor-pointer overflow-hidden rounded-xl bg-card border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary/50 ${
                              isActive ? 'border-primary/60 shadow-lg ring-1 ring-primary/25' : 'border-border shadow-sm'
                            }`}
                          >
                            <div className="flex items-start gap-4 p-5">
                              {/* Portrait */}
                              <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-border bg-muted">
                                {phil.imageUrl ? (
                                  <img
                                    src={phil.imageUrl}
                                    alt={phil.nameEn}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center font-serif text-2xl text-muted-foreground/50">
                                    {phil.nameEn?.charAt(0)}
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <h3 className="font-serif font-bold text-lg leading-snug text-foreground group-hover:text-primary transition-colors">
                                  {isHebrew ? phil.nameHe : phil.nameEn}
                                </h3>

                                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1.5">
                                  {/* Years badge — mobile only; desktop shows them on the axis */}
                                  <Badge className="md:hidden bg-primary/10 text-primary border border-primary/25 hover:bg-primary/10 rounded-full px-2.5 py-0.5 font-mono text-[11px] tracking-wide">
                                    {years}
                                  </Badge>
                                  {phil.schoolId && (
                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                      {phil.schoolId.replace(/_/g, ' ')}
                                    </span>
                                  )}
                                </div>

                                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mt-3">
                                  {isHebrew
                                    ? (phil.bigIdeaHe || phil.summaryHe || phil.bigIdeaEn || phil.summaryEn)
                                    : (phil.bigIdeaEn || phil.summaryEn)}
                                </p>
                              </div>
                            </div>
                          </Card>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {eraPhilosophers.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground text-sm italic">
                    {isHebrew ? "אין פילוסופים להצגה בתקופה זו." : "No philosophers to display in this era."}
                  </div>
                )}

              </div>
            </section>
          );
        })}
      </main>

      {/* DETAILS MODAL */}
      <Dialog open={!!selectedPhilosopher} onOpenChange={() => setSelectedPhilosopher(null)}>
        <DialogContent dir={isHebrew ? "rtl" : "ltr"} className="border-amber-500 max-w-3xl overflow-y-auto max-h-[90vh]">
          {selectedPhilosopher && (
            <>
              <DialogHeader>
                <DialogTitle className="text-3xl font-serif text-primary flex items-center justify-center gap-3">
                  {isHebrew ? selectedPhilosopher.nameHe : selectedPhilosopher.nameEn}
                </DialogTitle>
                <DialogDescription className="text-primary/80 font-mono">
                  {selectedPhilosopher.dates}
                </DialogDescription>
              </DialogHeader>

              <div className="grid md:grid-cols-2 gap-6 py-4">
                <div className="aspect-square rounded-lg overflow-hidden border border-amber-500 shadow-lg">
                  {selectedPhilosopher.imageUrl &&
                    <img src={selectedPhilosopher.imageUrl} alt={selectedPhilosopher.nameEn} className="w-full h-full object-cover transition-all" />
                  }
                </div>
                <div className="space-y-6">
                  <div>
                    <h4 className="flex items-center gap-2 text-foreground font-bold mb-2 uppercase text-xs tracking-widest">
                      <BookOpen className="w-4 h-4 text-primary" /> {isHebrew ? "רעיון מרכזי" : "Big Idea"}
                    </h4>
                    <p className="text-muted-foreground leading-relaxed text-sm">
                      {isHebrew
                        ? (selectedPhilosopher.bigIdeaHe || selectedPhilosopher.summaryHe || selectedPhilosopher.bigIdeaEn || selectedPhilosopher.summaryEn)
                        : (selectedPhilosopher.bigIdeaEn || selectedPhilosopher.summaryEn || "No description available.")}
                    </p>
                  </div>

                  <Separator className="bg-amber-500/30" />

                  <div>
                    <h4 className="flex items-center gap-2 text-foreground font-bold mb-2 uppercase text-xs tracking-widest">
                      <Quote className="w-4 h-4 text-primary" /> {isHebrew ? "ציטוט" : "Famous Quote"}
                    </h4>
                    <blockquote className="border-s-2 border-primary ps-4 italic text-foreground/80 text-lg font-serif">
                      "{selectedPhilosopher.quote || (isHebrew ? "אין ציטוט זמין." : "No quote available.")}"
                    </blockquote>
                  </div>

                  <div className="pt-4">
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
                      <Link to={`/${lang}/philosophers/${selectedPhilosopher.id}`}>
                        {isHebrew ? "קרא פרופיל מלא" : "Read Full Profile"}
                        <ArrowRight className={`w-4 h-4 ${isHebrew ? "mr-2 rotate-180" : "ml-2"}`} />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Graph View ──────────────────────────────────────────────────────────────

function GraphView({ isHebrew }) {
  return (
    <div dir={isHebrew ? 'rtl' : 'ltr'} className="container max-w-6xl mx-auto py-8 px-4">
      <p className="text-muted-foreground max-w-2xl mb-6">
        {isHebrew
          ? 'רשת ההשפעות בין הוגי ההיסטוריה — מי לימד את מי, ומי המשיך את דרכו של מי, על פי נתוני Wikidata.'
          : 'The network of influence across the history of thought — who taught whom, and who carried whose ideas forward, according to Wikidata.'}
      </p>
      <RelationshipGraph />
    </div>
  );
}

// ─── Main Page (with view switcher) ──────────────────────────────────────────

export default function PhilosophersPage() {
  const { language: lang } = useLanguage();
  const isHebrew = lang === "he";
  const t = texts[lang];
  const [searchParams, setSearchParams] = useSearchParams();

  // Synced to ?view= so each view is bookmarkable/shareable
  const view = searchParams.get("view") || "timeline";
  const setView = (next) => setSearchParams({ view: next });

  const viewTabs = [
    { key: "timeline", label: t.view_timeline, Icon: Clock },
    { key: "grid", label: t.view_grid, Icon: LayoutGrid },
    { key: "graph", label: t.view_graph, Icon: Network },
  ];

  return (
    <div className="w-full">
      {/* Page Header with Toggle */}
      <div dir={isHebrew ? 'rtl' : 'ltr'} className="container max-w-6xl mx-auto pt-8 pb-4 px-4">
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif font-extrabold mb-2 text-primary flex items-center gap-4">
              <Brain className="w-10 h-10" />
              {isHebrew ? "פילוסופים" : "Philosophers"}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              {isHebrew
                ? "רשימת ההוגים הגדולים שעיצבו את ההיסטוריה של המחשבה."
                : "A list of the great thinkers who shaped the history of thought."}
            </p>
          </div>

          {/* View switcher — Timeline | Grid | Graph */}
          <div
            role="tablist"
            aria-label={isHebrew ? "בחירת תצוגה" : "Choose view"}
            className="flex items-center gap-1 p-1 rounded-lg border border-border bg-card shadow-sm shrink-0"
          >
            {viewTabs.map(({ key, label, Icon }) => (
              <button
                key={key}
                role="tab"
                aria-selected={view === key}
                onClick={() => setView(key)}
                className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  view === key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-primary/10"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* View Content */}
      {view === "grid" ? (
        <GridView lang={lang} isHebrew={isHebrew} t={t} searchParams={searchParams} setSearchParams={setSearchParams} />
      ) : view === "graph" ? (
        <GraphView isHebrew={isHebrew} />
      ) : (
        <TimelineView lang={lang} isHebrew={isHebrew} />
      )}
    </div>
  );
}
