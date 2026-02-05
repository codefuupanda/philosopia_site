import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../i18n/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Loader } from '../components/ui/Loader';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

// --- Helper: Wikidata List ---
const WikidataList = ({ label, items, lang }) => {
  if (!items || items.length === 0) return null;
  const isHebrew = lang === 'he';

  return (
    <div className="mb-4 border-b border-border/40 pb-3 last:border-0">
      <span className="font-bold text-primary block text-xs uppercase tracking-wider mb-2 opacity-80">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">
        {items.map((item, idx) => (
          <span
            key={idx}
            className="text-sm text-foreground/80 bg-muted/50 px-2 py-1 rounded border border-border/50"
            title={item.qid}
          >
            {isHebrew ? (item.labelHe || item.labelEn) : item.labelEn}
          </span>
        ))}
      </div>
    </div>
  );
};

export default function PhilosopherPage() {
  const { id } = useParams();
  const { language } = useLanguage();
  const isHebrew = language === 'he';

  const [philosopher, setPhilosopher] = useState(null);
  const [linkedConcepts, setLinkedConcepts] = useState([]); // ✅ New State
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/philosophers/${id}`);
        setPhilosopher(res.data.philosopher);
        setLinkedConcepts(res.data.linkedConcepts || []); // ✅ Save Concepts
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="p-20 flex justify-center"><Loader /></div>;
  if (!philosopher) return <div className="p-20 text-center text-destructive text-xl">Philosopher Not Found</div>;

  const name = isHebrew ? philosopher.nameHe : philosopher.nameEn;
  const years = isHebrew ? philosopher.yearsHe : philosopher.yearsEn;
  const oneLiner = isHebrew ? philosopher.summaryHe : philosopher.summaryEn;
  const fullBio = philosopher.bioHtml;
  const imageUrl = philosopher.imageUrl;
  const wikiLink = `https://en.wikipedia.org/wiki/${philosopher.wikiTitle}`;
  const bioHeader = isHebrew ? `על ${name}` : `About ${name}`;

  return (
    <div dir={isHebrew ? 'rtl' : 'ltr'} className="container max-w-6xl mx-auto py-12 px-4">

      {/* --- HERO SECTION --- */}
      <div className="flex flex-col md:flex-row gap-8 mb-12 border-b border-border pb-8">

        <div className="w-full md:w-72 shrink-0">
          <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-xl border-4 border-border/20 bg-muted flex items-center justify-center">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={name}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                onError={(e) => e.target.style.display = 'none'}
              />
            ) : (
              <span className="text-4xl opacity-20">🏛️</span>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-end">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-2 text-primary tracking-tight">
            {name}
          </h1>
          <p className="text-xl font-mono text-muted-foreground mb-4 opacity-80">
            {years}
          </p>

          <div className="text-2xl font-light italic text-foreground/90 mb-6 leading-normal border-l-4 border-primary/40 pl-4 py-1">
            "{oneLiner}"
          </div>

          <div className="flex gap-3">
            <a
              href={wikiLink}
              target="_blank" rel="noreferrer"
              className="px-5 py-2.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
            >
              <span>Wikipedia (En)</span> ↗
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

        {/* --- SIDEBAR --- */}
        <div className="md:col-span-1 space-y-6">
          <Card className="bg-card/40 backdrop-blur-sm border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-lg font-semibold text-foreground">
                {isHebrew ? 'פרופיל וקשרים' : 'Profile & Relations'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">

              {/* ✅ 1. Clickable School Link */}
              {philosopher.schoolId && (
                <div className="mb-4 border-b border-border/40 pb-3">
                  <span className="font-bold text-primary block text-xs uppercase tracking-wider mb-2">
                    {isHebrew ? 'אסכולה' : 'School'}
                  </span>
                  <Link
                    to={`/${language}/schools/${philosopher.schoolId}`}
                    className="inline-block bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1 rounded-md text-sm transition-colors font-medium"
                  >
                    {philosopher.schoolId.replace(/_/g, ' ')}
                  </Link>
                </div>
              )}

              {/* ✅ 2. Linked Concepts (Reverse Lookup) */}
              {linkedConcepts.length > 0 && (
                <div className="mb-4 border-b border-border/40 pb-3">
                  <span className="font-bold text-primary block text-xs uppercase tracking-wider mb-2">
                    {isHebrew ? 'מושגים קשורים' : 'Related Concepts'}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {linkedConcepts.map(c => (
                      <Link
                        key={c.id}
                        to={`/${language}/concepts/${c.id}`}
                        className="text-sm text-primary bg-muted border border-border hover:bg-muted/80 hover:border-primary px-2 py-1 rounded transition-colors"
                      >
                        {isHebrew ? c.nameHe : c.nameEn}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <WikidataList label={isHebrew ? 'מורים והשפעות' : 'Teachers & Influences'} items={philosopher.influencedBy} lang={language} />
              <WikidataList label={isHebrew ? 'תלמידים וממשיכים' : 'Students & Followers'} items={philosopher.students} lang={language} />
              <WikidataList label={isHebrew ? 'אזרחות' : 'Citizenship'} items={philosopher.countryOfCitizenship} lang={language} />
              <WikidataList label={isHebrew ? 'חיבורים מרכזיים' : 'Major Texts'} items={philosopher.foundationalTexts} lang={language} />
            </CardContent>
          </Card>
        </div>

        {/* --- MAIN CONTENT --- */}
        <div className="md:col-span-2 space-y-10">

          <section>
            <h2 className="text-3xl font-bold mb-6 border-b pb-2 border-border text-primary/90">
              {bioHeader}
            </h2>

            {fullBio ? (
              <div
                className="prose prose-lg dark:prose-invert max-w-none text-foreground/90 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: fullBio }}
              />
            ) : (
              <p className="text-muted-foreground italic">
                {isHebrew ? "מידע נוסף אינו זמין כרגע." : "Additional information is not available at the moment."}
              </p>
            )}
          </section>

          {/* More Data Placeholder */}
          <section className="bg-card/50 border border-border rounded-xl p-8 text-center">
            <h3 className="text-xl font-bold text-muted-foreground mb-2">
              {isHebrew ? "מידע נוסף בקרוב..." : "More Data Soon..."}
            </h3>
            <p className="text-muted-foreground/80 text-sm">
              {isHebrew
                ? "אנו עובדים על הוספת ניתוחי עומק, ציטוטים נוספים והקשרים היסטוריים."
                : "We are working on adding in-depth analysis, more quotes, and historical contexts."}
            </p>
          </section>

          {/* Quotes Section */}
          {(isHebrew ? philosopher.quotesHe : philosopher.quotesEn)?.length > 0 && (
            <section>
              <h3 className="text-2xl font-bold mb-5 text-muted-foreground/80">
                {isHebrew ? 'ציטוטים נבחרים' : 'Selected Quotes'}
              </h3>
              <div className="space-y-4">
                {(isHebrew ? philosopher.quotesHe : philosopher.quotesEn).map((quote, i) => (
                  <blockquote key={i} className="border-l-4 border-primary pl-4 py-2 italic text-lg text-foreground bg-card/30 rounded-r-lg">
                    "{quote}"
                  </blockquote>
                ))}
              </div>
            </section>
          )}

          {/* Key Ideas Section (Manual Data) */}
          {(philosopher.keyIdeasEn?.length > 0 || philosopher.keyIdeasHe?.length > 0) && (
            <section>
              <h3 className="text-2xl font-bold mb-5 text-muted-foreground/80">
                {isHebrew ? 'רעיונות מפתח (תקציר)' : 'Key Concepts (Summary)'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(isHebrew ? philosopher.keyIdeasHe : philosopher.keyIdeasEn)?.map((idea, i) => (
                  <div key={i} className="bg-secondary/20 p-4 rounded-xl border border-border/50 hover:border-primary/50 transition-colors">
                    <p className="font-medium text-lg text-foreground">💡 {idea}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </div>
  );
}