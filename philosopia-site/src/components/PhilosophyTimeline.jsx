import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../i18n/LanguageContext';

// ✅ IMPORTANT: Importing from uppercase 'Card' to match your file structure
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "./ui/Card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Separator } from "./ui/separator";

// Icons (Lucide)
import { Scroll, Quote, BookOpen, ArrowRight, Loader2 } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

export default function PhilosophyTimeline() {
  const { language } = useLanguage();
  const isHebrew = language === 'he';

  // State
  const [eras, setEras] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeEraIndex, setActiveEraIndex] = useState(0);
  const [selectedPhilosopher, setSelectedPhilosopher] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");

  // Fetch Data
  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/periods`);
        setEras(res.data.periods || []);
      } catch (err) {
        console.error("Failed to fetch timeline:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTimeline();
  }, []);

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
  const currentPhilosophers = activeEra?.philosophers || [];

  // Filter Logic
  const filteredPhilosophers = currentPhilosophers.filter(phil => {
    if (activeFilter === "All") return true;
    // Check if tags exist and include the filter
    return phil.tags && phil.tags.includes(activeFilter);
  });

  return (
    <div dir={isHebrew ? 'rtl' : 'ltr'} className="min-h-screen bg-background text-foreground font-sans pb-20">

      {/* 1. TIMELINE SLIDER (Navigation) */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border shadow-xl">
        <div className="container mx-auto px-4 py-4 overflow-x-auto">
          <div className="flex items-center justify-between min-w-max gap-4">
            {eras.map((era, index) => (
              <div key={era.id} className="flex flex-col items-center group cursor-pointer" onClick={() => setActiveEraIndex(index)}>
                <Button
                  variant={activeEraIndex === index ? "default" : "ghost"}
                  className={`rounded-full px-6 transition-all duration-300 ${activeEraIndex === index
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_hsl(var(--primary)/0.5)] scale-105"
                    : "text-muted-foreground hover:text-primary hover:bg-muted"
                    }`}
                >
                  {isHebrew ? era.nameHe : era.nameEn}
                </Button>
                <span className={`text-[10px] mt-1 font-mono tracking-widest ${activeEraIndex === index ? "text-primary" : "text-muted-foreground opacity-0 group-hover:opacity-100"}`}>
                  {era.dates}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. ERA HERO SECTION */}
      <div className="relative py-16 px-6 text-center border-b border-border bg-muted/30">
        <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Badge variant="outline" className="border-primary/50 text-primary uppercase tracking-widest mb-2">
            {activeEra.dates}
          </Badge>
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-foreground tracking-tight">
            {isHebrew ? activeEra.nameHe : activeEra.nameEn}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {isHebrew ? activeEra.descriptionHe : activeEra.descriptionEn}
          </p>

          {/* Filters */}
          <div className="flex justify-center gap-2 pt-6 flex-wrap">
            {["All", "Ethics", "Metaphysics", "Logic", "Politics"].map(tag => (
              <Button
                key={tag}
                variant="outline"
                size="sm"
                onClick={() => setActiveFilter(tag)}
                className={`border-border bg-transparent hover:border-primary/50 ${activeFilter === tag ? "bg-primary/20 border-primary/50 text-primary" : "text-muted-foreground"}`}
              >
                {tag}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. PHILOSOPHER GRID */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPhilosophers.map((phil) => (
            <Card
              key={phil.id}
              className="bg-card border border-amber-500 group hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black cursor-pointer overflow-hidden"
              onClick={() => setSelectedPhilosopher(phil)}
            >
              <div className="h-48 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent z-10" />
                {phil.imageUrl ? (
                  <img
                    src={phil.imageUrl}
                    alt={phil.nameEn}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                    {phil.nameEn.substring(0, 2)}
                  </div>
                )}
              </div>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-serif text-foreground group-hover:text-primary">
                      {isHebrew ? phil.nameHe : phil.nameEn}
                    </CardTitle>
                    <CardDescription className="font-mono text-xs text-primary mt-1">{phil.dates}</CardDescription>
                  </div>
                  <Scroll className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
                  "{isHebrew ? (phil.bigIdeaHe || phil.bigIdeaEn) : phil.bigIdeaEn}"
                </p>
              </CardContent>
              <CardFooter className="pt-0">
                <div className="flex gap-2 flex-wrap">
                  {phil.tags && phil.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="bg-muted text-muted-foreground hover:text-foreground">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredPhilosophers.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p>{isHebrew ? "לא נמצאו פילוסופים." : "No philosophers found."}</p>
            <Button variant="link" onClick={() => setActiveFilter("All")} className="text-primary">
              {isHebrew ? "נקה סינון" : "Clear filters"}
            </Button>
          </div>
        )}
      </div>

      {/* 4. DETAILS MODAL */}
      <Dialog open={!!selectedPhilosopher} onOpenChange={() => setSelectedPhilosopher(null)}>
        <DialogContent className="bg-card border border-amber-500 text-foreground max-w-3xl overflow-y-auto max-h-[90vh]">
          {selectedPhilosopher && (
            <>
              <DialogHeader>
                <DialogTitle className="text-3xl font-serif text-primary flex items-center gap-3">
                  {isHebrew ? selectedPhilosopher.nameHe : selectedPhilosopher.nameEn}
                </DialogTitle>
                <DialogDescription className="text-primary font-mono">
                  {selectedPhilosopher.dates}
                </DialogDescription>
              </DialogHeader>

              <div className="grid md:grid-cols-2 gap-6 py-4">
                <div className="aspect-square rounded-lg overflow-hidden border border-amber-500">
                  {selectedPhilosopher.imageUrl &&
                    <img src={selectedPhilosopher.imageUrl} alt={selectedPhilosopher.nameEn} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all" />
                  }
                </div>
                <div className="space-y-6">
                  <div>
                    <h4 className="flex items-center gap-2 text-foreground font-bold mb-2 uppercase text-xs tracking-widest">
                      <BookOpen className="w-4 h-4 text-primary" /> {isHebrew ? "רעיון מרכזי" : "Big Idea"}
                    </h4>
                    <p className="text-muted-foreground leading-relaxed text-sm">
                      {isHebrew ? (selectedPhilosopher.bigIdeaHe || selectedPhilosopher.bigIdeaEn) : selectedPhilosopher.bigIdeaEn}
                    </p>
                  </div>

                  <Separator className="bg-border" />

                  <div>
                    <h4 className="flex items-center gap-2 text-foreground font-bold mb-2 uppercase text-xs tracking-widest">
                      <Quote className="w-4 h-4 text-primary" /> {isHebrew ? "ציטוט" : "Famous Quote"}
                    </h4>
                    <blockquote className="border-l-2 border-primary pl-4 italic text-foreground text-lg">
                      {/* Note: Ensure 'quote' exists in your DB, otherwise handle fallback */}
                      "{selectedPhilosopher.quote || '...'}"
                    </blockquote>
                  </div>

                  <div className="pt-4">
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
                      <a href={`/${language}/philosophers/${selectedPhilosopher.id}`}>
                        {isHebrew ? "קרא פרופיל מלא" : "Read Full Profile"}
                        <ArrowRight className={`w-4 h-4 ${isHebrew ? "mr-2 rotate-180" : "ml-2"}`} />
                      </a>
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