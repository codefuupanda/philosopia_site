import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useLanguage } from "../i18n/LanguageContext";
import { Loader } from '../components/ui/Loader';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

export default function ConceptDetailPage() {
  const { id } = useParams();
  const { language } = useLanguage();
  const isHebrew = language === "he";

  const [concept, setConcept] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConcept() {
      try {
        const res = await axios.get(`${API_BASE_URL}/concepts/${id}`);
        setConcept(res.data.concept);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchConcept();
  }, [id]);

  if (loading) return <div className="p-20 flex justify-center"><Loader /></div>;
  if (!concept) return <div className="p-20 text-center">Concept Not Found</div>;

  const name = isHebrew ? concept.nameHe : concept.nameEn;
  const summary = isHebrew ? concept.summaryHe : concept.summaryEn;
  const description = isHebrew ? concept.descriptionHe : concept.descriptionEn;

  return (
    <div dir={isHebrew ? 'rtl' : 'ltr'} className="container max-w-4xl mx-auto py-12 px-4">
      <div className="text-center mb-16">
        <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
          {isHebrew ? "מושג פילוסופי" : "Philosophical Concept"}
        </span>
        <h1 className="text-5xl font-extrabold text-primary mb-6">{name}</h1>
        <div className="text-2xl font-light text-foreground/80 leading-relaxed border-y border-border py-8">
          {summary}
        </div>

        {/* New Info Bar */}
        <div className="flex justify-center gap-8 mt-6 text-sm font-mono uppercase tracking-wider text-muted-foreground">
          {(isHebrew ? concept.originDateHe : concept.originDateEn) && (
            <div className="flex items-center gap-2">
              <span className="text-primary">📅</span>
              {isHebrew ? concept.originDateHe : concept.originDateEn}
            </div>
          )}
          {(isHebrew ? concept.domainHe : concept.domainEn) && (
            <div className="flex items-center gap-2">
              <span className="text-primary">🏷️</span>
              {isHebrew ? concept.domainHe : concept.domainEn}
            </div>
          )}
        </div>
      </div>

      {description && (
        <div className="mb-12 prose prose-lg max-w-none">
          <p>{description}</p>
        </div>
      )}

      {/* Related Philosophers */}
      {concept.relatedPhilosophers && concept.relatedPhilosophers.length > 0 && (
        <div>
          <h2 className="text-3xl font-bold mb-8 text-center">
            {isHebrew ? "הוגים מרכזיים" : "Key Thinkers"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {concept.relatedPhilosophers.map(phil => (
              <Link
                key={phil.id}
                to={`/${language}/philosophers/${phil.id}`}
                className="group flex items-center gap-4 p-4 bg-card border border-amber-500 rounded-xl hover:border-primary hover:shadow-md transition-all"
              >
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-muted group-hover:border-primary">
                  <img
                    src={phil.imageUrl}
                    alt={phil.nameEn}
                    className="w-full h-full object-cover"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                </div>
                <div>
                  <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                    {isHebrew ? phil.nameHe : phil.nameEn}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {isHebrew ? phil.summaryHe : phil.summaryEn}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}