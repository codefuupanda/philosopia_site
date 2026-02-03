import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useLanguage } from "../i18n/LanguageContext";
import { Brain } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

export default function PhilosophersPage() {
  const { language: lang } = useLanguage();
  const isHebrew = lang === "he";

  const [philosophers, setPhilosophers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadPhilosophers() {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(`${API_BASE_URL}/philosophers`);
        setPhilosophers(res.data.philosophers || []);
      } catch (err) {
        console.error("Error loading philosophers:", err);
        setError(isHebrew ? "שגיאה בטעינת רשימת הפילוסופים." : "Error loading philosophers list.");
      } finally {
        setLoading(false);
      }
    }
    loadPhilosophers();
  }, [isHebrew]);

  if (loading) {
    return (
      <div className="p-20 text-center text-muted-foreground animate-pulse">
        {isHebrew ? "טוען פילוסופים..." : "Loading philosophers..."}
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
    </div>
  );
}