import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../i18n/LanguageContext';
import { Library } from 'lucide-react';
import { Loader } from '../components/ui/Loader';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

export default function SchoolsPage() {
  const { language } = useLanguage();
  const isHebrew = language === 'he';

  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/schools`);
        setSchools(res.data.schools || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchools();
  }, []);

  if (loading) return <div className="p-20 flex justify-center"><Loader /></div>;

  return (
    <div dir={isHebrew ? 'rtl' : 'ltr'} className="container max-w-6xl mx-auto py-12 px-4">

      <div className="mb-12 border-b border-border pb-6 text-center md:text-start">
        <h1 className="text-4xl md:text-5xl font-serif font-extrabold mb-4 text-primary flex items-center gap-4 justify-center md:justify-start">
          <Library className="w-10 h-10" />
          {isHebrew ? "אסכולות פילוסופיות" : "Philosophical Schools"}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          {isHebrew
            ? "המסורות הגדולות של המחשבה: מיוון העתיקה ועד ימינו."
            : "The great traditions of thought: From Ancient Greece to the modern day."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schools.map((school) => (
          <div key={school.id} className="group flex flex-col bg-card border border-amber-500 rounded-xl shadow-lg hover:shadow-2xl hover:border-primary/50 hover:-translate-y-1 transition-all duration-300 p-6 h-full">

            {/* Title Link */}
            <Link to={`/${language}/schools/${school.id}`} className="block">
              <h2 className="text-2xl font-serif font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
                {isHebrew ? school.nameHe : school.nameEn}
              </h2>
            </Link>

            {/* Description (Fallback to English if Hebrew missing) */}
            <p className="text-muted-foreground mb-6 flex-grow leading-relaxed text-sm line-clamp-4">
              {(isHebrew ? school.descriptionHe : school.descriptionEn) || school.nameEn}
            </p>

            {/* Related Philosophers Mini-Faces */}
            {school.philosophers && school.philosophers.length > 0 ? (
              <div className="pt-4 border-t border-border">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 block">
                  {isHebrew ? "נציגים בולטים" : "Key Figures"}
                </span>
                <div className="flex flex-wrap gap-2">
                  {school.philosophers.slice(0, 5).map(phil => (
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
                        // Fallback Initials if image missing
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                          {phil.nameEn.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                    </Link>
                  ))}
                  {school.philosophers.length > 5 && (
                    <div className="w-10 h-10 rounded-full bg-muted border-2 border-border flex items-center justify-center text-xs font-bold text-muted-foreground">
                      +{school.philosophers.length - 5}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="pt-4 mt-auto border-t border-border">
                <span className="text-xs text-muted-foreground italic">
                  {isHebrew ? "אין פילוסופים במאגר" : "No philosophers listed"}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}