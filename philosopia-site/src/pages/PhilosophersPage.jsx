import React, { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { api } from "../lib/api";
import { texts } from "../i18n/texts";
import { Brain, ChevronLeft, ChevronRight } from 'lucide-react';
import { Loader } from '../components/ui/Loader';

const PAGE_SIZE = 12;

export default function PhilosophersPage() {
  const { language: lang } = useLanguage();
  const isHebrew = lang === "he";
  const t = texts[lang];
  const [searchParams, setSearchParams] = useSearchParams();

  const [philosophers, setPhilosophers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);

  const page = Math.max(1, parseInt(searchParams.get("page")) || 1);

  useEffect(() => {
    const loadPhilosophers = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getPhilosophers({ page, limit: PAGE_SIZE });
        setPhilosophers(data.philosophers || []);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        console.error("Error loading philosophers:", err);
        setError(isHebrew ? "שגיאה בטעינת רשימת הפילוסופים." : "Error loading philosophers list.");
      } finally {
        setLoading(false);
      }
    };
    loadPhilosophers();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page, isHebrew]);

  const goToPage = useCallback((p) => {
    setSearchParams({ page: p });
  }, [setSearchParams]);

  // Build page numbers with ellipsis
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

      {/* Page Header */}
      <div className="mb-12 border-b border-border pb-6 text-center md:text-start">
        <h1 className="text-4xl md:text-5xl font-serif font-extrabold mb-4 text-primary flex items-center gap-4 justify-center md:justify-start">
          <Brain className="w-10 h-10" />
          {isHebrew ? "פילוסופים" : "Philosophers"}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          {isHebrew
            ? "רשימת ההוגים הגדולים שעיצבו את ההיסטוריה של המחשבה."
            : "A list of the great thinkers who shaped the history of thought."}
        </p>
      </div>

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

      {/* Pagination */}
      {totalPages > 1 && (
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
