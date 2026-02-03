import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Quote,
  ArrowRight,
  Library,
  Scale,
  Sparkles,
  Lightbulb,
  Palette
} from 'lucide-react';
import { useLanguage } from "../i18n/LanguageContext";
import { texts } from "../i18n/texts";
import { Logo } from "../components/ui/Logo";
import { cn } from "../lib/utils";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

function HomePage() {
  const { language } = useLanguage();
  const t = texts[language];
  const isHebrew = language === "he";
  const basePath = isHebrew ? "/he" : "/en";

  const [randomPhilosopher, setRandomPhilosopher] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch a random philosopher for the Spotlight
  useEffect(() => {
    const fetchRandomPhilosopher = async () => {
      try {
        let allPhilosophers = [];
        try {
          const res = await axios.get(`${API_BASE_URL}/philosophers`);
          allPhilosophers = res.data.philosophers || [];
        } catch (e) {
          console.warn("Backend not reachable, using mock data.");
          // Fallback mock data if backend fails
          allPhilosophers = [
            {
              id: "nietzsche",
              nameEn: "Friedrich Nietzsche",
              nameHe: "פרידריך ניטשה",
              imageUrl: "https://upload.wikimedia.org/wikipedia/commons/1/1b/Nietzsche187a.jpg",
            },
            {
              id: "plato",
              nameEn: "Plato",
              nameHe: "אפלטון",
              imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/88/Plato_Silanion_Musei_Capitolini_MC1377.jpg"
            },
            {
              id: "aristotle",
              nameEn: "Aristotle",
              nameHe: "אריסטו",
              imageUrl: "https://upload.wikimedia.org/wikipedia/commons/a/ae/Aristotle_Altemps_Inv8575.jpg"
            }
          ];
        }

        if (allPhilosophers.length > 0) {
          const random = allPhilosophers[Math.floor(Math.random() * allPhilosophers.length)];
          setRandomPhilosopher({
            id: random.id,
            name: isHebrew ? random.nameHe : random.nameEn,
            image: random.imageUrl,
          });
        }
      } catch (err) {
        console.error("Error fetching philosopher:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRandomPhilosopher();
  }, [isHebrew]);

  return (
    <div className="space-y-16 pb-20">

      {/* 1. HERO SECTION */}
      <section className="relative min-h-[70vh] flex flex-col items-center justify-center overflow-hidden rounded-3xl bg-background border border-amber-500/30 p-8 md:p-16 text-center shadow-2xl shadow-amber-900/10">
        {/* Abstract Background Visual */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-background to-background"></div>
        <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] [background-size:16px_16px]"></div>

        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center space-y-8">
          <div className="mb-4 animate-fade-in-down">
            <Logo className="h-20 w-auto text-amber-500" />
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-foreground tracking-tight leading-tight drop-shadow-sm">
            {t.hero_headline}
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground font-light max-w-2xl mx-auto leading-relaxed font-sans">
            {t.hero_subtext}
          </p>

          <div className="pt-8">
            <Link
              to={`${basePath}/periods`}
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-foreground text-background rounded-full font-bold text-lg border border-amber-500 hover:bg-amber-500 hover:text-white transition-all duration-300 shadow-lg hover:shadow-amber-500/25 ring-offset-2 ring-transparent hover:ring-2 hover:ring-amber-500"
            >
              <span>{t.hero_cta_primary}</span>
              {isHebrew ? (
                <ArrowRight className="w-5 h-5 rotate-180 transition-transform group-hover:-translate-x-1" />
              ) : (
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              )}
            </Link>
          </div>
        </div>
      </section>

      {/* 2. BENTO GRID */}
      <section className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 max-w-7xl mx-auto px-4 h-auto md:h-[600px]">

        {/* SLOT 1: Philosopher Spotlight (2x2) */}
        <div className="md:col-span-2 md:row-span-2 relative group overflow-hidden rounded-3xl bg-card border border-border shadow-sm hover:shadow-xl transition-all duration-500">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center bg-muted/20 animate-pulse">
              <Sparkles className="w-10 h-10 text-muted-foreground opacity-20" />
            </div>
          ) : (
            <Link to={`${basePath}/philosophers/${randomPhilosopher?.id}`} className="block w-full h-full relative">
              <img
                src={randomPhilosopher?.image}
                alt={randomPhilosopher?.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span>{isHebrew ? "פילוסוף נבחר" : "Philosopher Spotlight"}</span>
                </div>
                <h2 className="text-4xl font-serif font-bold mb-2">{randomPhilosopher?.name}</h2>
                <p className="text-white/80 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                  {isHebrew ? "לחץ כדי לגלות עוד" : "Click to discover more"}
                </p>
              </div>
            </Link>
          )}
        </div>

        {/* SLOT 2: Schools (2x1) */}
        <Link to={`${basePath}/schools`} className="md:col-span-2 md:row-span-1 group relative overflow-hidden rounded-3xl bg-card border border-border p-8 hover:border-amber-500/50 transition-all duration-500 flex flex-col justify-between">
          <div className={`absolute top-0 ${isHebrew ? 'left-0' : 'right-0'} p-6 opacity-5 group-hover:opacity-10 transition-opacity`}>
            <Library className="w-40 h-40" />
          </div>

          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 flex items-center justify-center mb-4">
            <Library className="w-6 h-6" />
          </div>

          <div className="relative z-10">
            <h3 className="text-2xl font-serif font-bold text-foreground mb-1">{t.navSchools}</h3>
            <p className="text-muted-foreground text-sm line-clamp-2">{t.bento_schools_desc}</p>
          </div>
        </Link>

        {/* SLOT 3: Concepts (1x1) */}
        <Link to={`${basePath}/concepts`} className="md:col-span-1 md:row-span-1 group relative overflow-hidden rounded-3xl bg-card border border-border p-6 hover:border-amber-500/50 transition-all duration-300 flex flex-col justify-end min-h-[200px]">
          <div className="absolute top-4 right-4 text-muted-foreground/20 group-hover:text-amber-500/20 transition-colors">
            <Lightbulb className="w-16 h-16" />
          </div>
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3 group-hover:bg-amber-500 group-hover:text-white transition-colors">
            <Lightbulb className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-foreground">{t.navConcepts}</h3>
        </Link>

        {/* SLOT 4: Art & Philosophy (1x1) */}
        <Link to={`${basePath}/art-and-philo`} className="md:col-span-1 md:row-span-1 group relative overflow-hidden rounded-3xl bg-card border border-border p-6 hover:border-amber-500/50 transition-all duration-300 flex flex-col justify-end min-h-[200px]">
          <div className="absolute top-4 right-4 text-muted-foreground/20 group-hover:text-amber-500/20 transition-colors">
            <Palette className="w-16 h-16" />
          </div>
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3 group-hover:bg-amber-500 group-hover:text-white transition-colors">
            <Palette className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-foreground">{t.navArtAndPhilo}</h3>
        </Link>

      </section>

      {/* 3. FEATURED BEEF (Refined) */}
      <section className="max-w-5xl mx-auto px-4 mt-12">
        <div className="relative rounded-3xl bg-muted/30 border border-border p-1 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')]">
          <div className="rounded-[20px] bg-background/50 backdrop-blur-sm p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-start">
            <div>
              <div className="inline-flex items-center gap-2 text-amber-600 font-bold uppercase tracking-wider text-xs mb-2">
                <Scale className="w-4 h-4" />
                {t.featured_beef_label}
              </div>
              <h2 className="text-3xl font-serif font-bold text-foreground mb-2">
                {isHebrew ? "רציונליזם נגד אמפיריציזם" : "Rationalism vs. Empiricism"}
              </h2>
              <p className="text-muted-foreground max-w-lg">
                {isHebrew
                  ? "האם הידע מגיע מהתבונה או מהחושים? הוויכוח הגדול של העת החדשה."
                  : "Does knowledge come from reason or the senses? The great debate of the modern era."}
              </p>
            </div>

            <Link
              to={`${basePath}/beefs/rationalism-empiricism`}
              className="shrink-0 px-8 py-3 rounded-full bg-foreground text-background font-bold hover:scale-105 transition-transform"
            >
              {isHebrew ? "קרא על הריב" : "Read the Beef"}
            </Link>
          </div>
        </div>
      </section>

      {/* 4. THE STOA (Quotes Gateway) */}
      <section className="py-20 text-center px-4 bg-gradient-to-b from-transparent to-muted/20">
        <div className="max-w-2xl mx-auto space-y-8">
          <Quote className="w-12 h-12 text-amber-500/50 mx-auto" />
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground">
            {isHebrew ? "איזו חוכמה אתם מחפשים?" : "What wisdom do you seek?"}
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {["Ethics", "Meaning", "Politics"].map((topic) => (
              <Link
                key={topic}
                to={`${basePath}/quotes?tag=${topic.toLowerCase()}`}
                className={cn(
                  "px-6 py-2 rounded-full border border-border hover:border-amber-500 hover:text-amber-500 transition-colors text-sm font-medium uppercase tracking-widest"
                )}
              >
                {topic}
              </Link>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}

export default HomePage;