import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../i18n/LanguageContext';
import { Link } from 'react-router-dom';

// UI Components
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { Separator } from "../components/ui/separator";
import { ScrollArea } from "../components/ui/scroll-area";

// Icons
import { Scroll, Quote, BookOpen, ArrowRight, Loader2, Menu, ChevronRight, ChevronLeft } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

export default function PeriodsPage() {
  const { language } = useLanguage();
  const isHebrew = language === 'he';

  // State
  const [eras, setEras] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeEraIndex, setActiveEraIndex] = useState(0);
  const [activePhilosopherId, setActivePhilosopherId] = useState(null); // For sidebar highlighting
  const [selectedPhilosopher, setSelectedPhilosopher] = useState(null); // For modal details
  const [activeFilter] = useState("All");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar toggle

  // Fetch Data
  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/periods`);
        const allPeriods = res.data.periods || [];

        // Filter and Sort Logic
        const allowedPeriods = [
          "pre_socratic",
          "classical_greek",
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

        const filteredEras = allPeriods
          .filter(p => allowedPeriods.includes(p.id))
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

            return { ...p, nameEn, nameHe, dates };
          });

        // Sort by startYear just in case
        filteredEras.sort((a, b) => a.startYear - b.startYear);

        setEras(filteredEras);
      } catch (err) {
        console.error("Failed to fetch timeline:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTimeline();
  }, []);

  // Scroll Spy Logic (IntersectionObserver)
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -50% 0px', // Trigger when element is near the top-center
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

    // Observe Eras
    eras.forEach(era => {
      const el = document.getElementById(`era-${era.id}`);
      if (el) observer.observe(el);

      // Observe Philosophers
      if (era.philosophers) {
        era.philosophers.forEach(phil => {
          const pEl = document.getElementById(`phil-${phil.id}`);
          if (pEl) observer.observe(pEl);
        });
      }
    });

    return () => observer.disconnect();
  }, [eras]); // Re-run when eras are loaded

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-primary">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  // Empty State
  if (eras.length === 0) {
    return <div className="min-h-screen bg-background text-muted-foreground flex items-center justify-center">No data found.</div>;
  }

  const activeEra = eras[activeEraIndex];

  return (
    <div dir={isHebrew ? 'rtl' : 'ltr'} className="min-h-screen bg-background text-foreground font-sans flex flex-col md:flex-row">

      {/* MOBILE HEADER (Visible only on small screens) */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-amber-500 bg-background sticky top-0 z-50">
        <span className="font-bold text-primary">
          {activeEra ? (isHebrew ? activeEra.nameHe : activeEra.nameEn) : ''}
        </span>
        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          <Menu className="w-6 h-6 text-muted-foreground" />
        </Button>
      </div>

      {/* 1. SIDEBAR NAVIGATION ("The Spine") */}
      <aside className={`
          fixed inset-y-0 z-40 flex bg-background/95 backdrop-blur border-e border-amber-500/30 transform transition-transform duration-300 ease-in-out
          md:sticky md:top-0 md:h-screen md:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : (isHebrew ? 'translate-x-full' : '-translate-x-full')}
          ${isHebrew ? 'right-0 md:right-auto' : 'left-0 md:left-auto'}
      `}>

        {/* A. VERTICAL TAB RAIL (Far Left) */}
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
                {/* Vertical Text Label */}
                <span className="writing-vertical-lr text-[10px] font-mono tracking-widest uppercase text-foreground/80 whitespace-nowrap py-2" style={{ writingMode: 'vertical-rl' }}>
                  {isHebrew ? era.nameHe : era.nameEn.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* B. ACTIVE ERA PANEL (Tree Structure) */}
        <div className="w-64 flex flex-col h-full bg-card/50">
          <div className="p-6 border-b border-amber-500/20">
            <h2 className="text-xl font-serif font-bold text-foreground">
              {activeEra ? (isHebrew ? activeEra.nameHe : activeEra.nameEn) : "Philosopia"}
            </h2>
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              {activeEra?.dates}
            </p>
          </div>

          <ScrollArea className="flex-1 py-6 px-4" dir={isHebrew ? 'rtl' : 'ltr'}>
            {activeEra && (
              <div className="relative">
                {/* Tree Trunk */}
                <div className="absolute top-2 bottom-2 w-px bg-amber-500/30 ltr:left-[11px] rtl:right-[11px]" />

                <div className="space-y-1">
                  {/* Parent Node (Era Title as Root) */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500 flex items-center justify-center shrink-0 z-10">
                      <div className="w-2 h-2 bg-amber-500 rounded-full" />
                    </div>
                    <span className="font-bold text-sm text-foreground">
                      {isHebrew ? "פילוסופים" : "Philosophers"}
                    </span>
                  </div>

                  {/* Children Nodes */}
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
                            ? 'bg-amber-500 text-white shadow-md'
                            : 'hover:bg-amber-500/10 text-muted-foreground hover:text-foreground'}
                         `}
                      >
                        {/* Horizontal Branch */}
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

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 bg-background relative">
        {eras.map((era, index) => {
          // Filter philosophers for this specific era
          const eraPhilosophers = (era.philosophers || []).filter(phil => {
            if (activeFilter === "All") return true;
            return phil.tags && phil.tags.includes(activeFilter);
          });

          return (
            <section key={era.id} id={`era-${era.id}`} className="relative border-b border-amber-500/20 last:border-0 pb-20">

              {/* ERA HERO SECTION (Sticky per Era) */}
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

              {/* PHILOSOPHER LIST ("Zig-Zag Stream") */}
              <div className="w-full max-w-[95%] 2xl:max-w-[1800px] mx-auto px-4 md:px-8 py-12 relative">

                {/* Central Vertical Line (Desktop Only) - Per Section */}
                <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-amber-500/20 hidden md:block" />

                <div className="flex flex-col md:block">
                  {eraPhilosophers.map((phil, pIndex) => {
                    const isEven = pIndex % 2 === 0;
                    const isActive = activePhilosopherId === phil.id;

                    return (
                      <div
                        key={phil.id}
                        id={`phil-${phil.id}`} // Scroll Anchor
                        className={`
                          relative flex flex-col mb-12 md:mb-24 last:mb-0
                          md:w-[calc(50%-0.5rem)]
                          ${isEven ? 'md:me-auto' : 'md:ms-auto'}
                        `}
                      >
                        {/* Connector Line & Node (Desktop Only) */}
                        <div className={`
                          hidden md:flex items-center absolute top-8
                          ${isEven ? '-right-[calc(3rem+1px)] flex-row' : '-left-[calc(3rem+1px)] flex-row-reverse'}
                          w-[3rem]
                        `}>
                          {/* Horizontal Line */}
                          <div className="flex-1 h-px bg-amber-500" />

                          {/* Connector Node (Chevron) */}
                          <div className={`
                            w-8 h-8 rounded-full border border-amber-500 bg-background z-10 flex items-center justify-center
                            ${isActive ? 'bg-amber-500 text-white shadow-[0_0_10px_#d97706]' : 'text-amber-500'}
                          `}>
                            {isEven ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                          </div>
                        </div>

                        {/* Card - Museum Plaque Style */}
                        <Card
                          className={`
                            relative overflow-hidden
                            bg-orange-50 dark:bg-slate-900
                            border border-amber-500
                            transition-all duration-500 ease-out
                            group cursor-pointer
                            ${isActive
                              ? 'shadow-[0_0_15px_rgba(245,158,11,0.5)] ring-1 ring-amber-500'
                              : 'hover:shadow-[0_0_15px_rgba(245,158,11,0.5)]'}
                          `}
                          onClick={() => setSelectedPhilosopher(phil)}
                        >
                          {/* Inner Inset Shadow/Border Effect */}
                          <div className="absolute inset-0 pointer-events-none border-[3px] border-black/5 dark:border-white/5 rounded-lg" />

                          <div className="flex flex-col md:flex-row h-full relative z-10">
                            {/* Image Container */}
                            <div className="h-64 md:h-auto w-full md:w-56 shrink-0 overflow-hidden relative border-b md:border-b-0 md:border-e border-amber-500/20">
                              <div className="absolute inset-0 bg-amber-900/10 mix-blend-multiply z-10 pointer-events-none transition-opacity duration-500 group-hover:opacity-0" />
                              {phil.imageUrl ? (
                                <img
                                  src={phil.imageUrl}
                                  alt={phil.nameEn}
                                  className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                                />
                              ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground font-serif text-4xl opacity-20">
                                  {phil.nameEn.substring(0, 1)}
                                </div>
                              )}
                            </div>

                            {/* Content Container */}
                            <div className="flex-1 flex flex-col p-5">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h3 className="text-2xl font-serif font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                                    {isHebrew ? phil.nameHe : phil.nameEn}
                                  </h3>
                                  <div className="flex gap-2 mt-2">
                                    <Badge variant="secondary" className="bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 px-2 py-1 rounded-full text-xs font-mono tracking-wider">
                                      {phil.dates}
                                    </Badge>
                                    {phil.schoolId && (
                                      <Badge variant="outline" className="bg-slate-200 text-slate-800 border-none dark:bg-slate-800 dark:text-slate-200 px-2 py-1 rounded-full text-xs font-mono">
                                        {phil.schoolId.replace(/_/g, ' ')}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <Scroll className="w-5 h-5 text-amber-500/50 group-hover:text-amber-600 transition-colors" />
                              </div>

                              <p className="text-slate-700 dark:text-slate-300 text-sm line-clamp-6 leading-relaxed mb-4 flex-1 font-serif">
                                {isHebrew
                                  ? (phil.bigIdeaHe || phil.summaryHe || phil.bigIdeaEn || phil.summaryEn)
                                  : (phil.bigIdeaEn || phil.summaryEn || "No description available.")}
                              </p>

                              <div className="flex items-center justify-between pt-4 border-t border-amber-500/20">
                                <div className="flex gap-2">
                                  {phil.tags && phil.tags.slice(0, 2).map(tag => (
                                    <span key={tag} className="text-[10px] text-muted-foreground/70 uppercase tracking-widest">
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
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
        <DialogContent className="bg-background dark:bg-card border border-amber-500 text-foreground max-w-3xl overflow-y-auto max-h-[90vh]">
          {selectedPhilosopher && (
            <>
              <DialogHeader>
                <DialogTitle className="text-3xl font-serif text-primary flex items-center gap-3">
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
                      <Link to={`/${language}/philosophers/${selectedPhilosopher.id}`}>
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