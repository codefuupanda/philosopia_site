import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../i18n/LanguageContext';
import { Lightbulb } from 'lucide-react';
import { Loader } from '../components/ui/Loader';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

export default function ConceptsPage() {
  const { language } = useLanguage();
  const isHebrew = language === 'he';

  const [concepts, setConcepts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConcepts = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/concepts`);
        setConcepts(res.data.concepts || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchConcepts();
  }, []);

  if (loading) return <div className="p-20 flex justify-center"><Loader /></div>;

  return (
    <div dir={isHebrew ? 'rtl' : 'ltr'} className="container max-w-6xl mx-auto py-12 px-4">

      <div className="mb-12 border-b border-border pb-6 text-center md:text-start">
        <h1 className="text-4xl md:text-5xl font-serif font-extrabold mb-4 text-primary flex items-center gap-4 justify-center md:justify-start">
          <Lightbulb className="w-10 h-10" />
          {isHebrew ? "מושגים פילוסופיים" : "Philosophical Concepts"}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          {isHebrew
            ? "מילון המונחים הגדול: רעיונות ששינו את העולם וההוגים שמאחוריהם."
            : "The Great Dictionary: Ideas that changed the world and the thinkers behind them."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {concepts.map((concept) => (
          <div key={concept.id} className="group flex flex-col bg-card border border-amber-500 rounded-xl shadow-lg hover:shadow-2xl hover:border-primary/50 hover:-translate-y-1 transition-all duration-300 p-6 h-full">

            {/* Link to Concept Detail Page */}
            <Link to={`/${language}/concepts/${concept.id}`} className="block">
              <h2 className="text-2xl font-serif font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
                {isHebrew ? concept.nameHe : concept.nameEn}
              </h2>
            </Link>

            <p className="text-muted-foreground mb-6 flex-grow leading-relaxed text-sm line-clamp-4">
              {isHebrew ? concept.summaryHe : concept.summaryEn}
            </p>

            {/* Related Philosophers Mini-Faces */}
            {concept.relatedPhilosophers && concept.relatedPhilosophers.length > 0 && (
              <div className="pt-4 border-t border-border">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 block">
                  {isHebrew ? "הוגים קשורים" : "Related Thinkers"}
                </span>
                <div className="flex flex-wrap gap-2">
                  {concept.relatedPhilosophers.slice(0, 5).map(phil => (
                    <Link
                      key={phil.id}
                      to={`/${language}/philosophers/${phil.id}`}
                      title={isHebrew ? phil.nameHe : phil.nameEn}
                      className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-border hover:border-primary hover:scale-110 transition-all duration-300 bg-muted"
                    >
                      {phil.imageUrl ? (
                        <img
                          src={phil.imageUrl}
                          alt={phil.nameEn}
                          className="w-full h-full object-cover transition-all"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                          {phil.nameEn.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}