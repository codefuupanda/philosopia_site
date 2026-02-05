import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useLanguage } from "../i18n/LanguageContext";
import { Swords } from "lucide-react";
import { Loader } from '../components/ui/Loader';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

export default function BeefsPage() {
  const { language } = useLanguage();
  const isHebrew = language === "he";
  const navigate = useNavigate();

  const [beefs, setBeefs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBeefs() {
      try {
        const res = await axios.get(`${API_BASE_URL}/beefs`);
        setBeefs(res.data.beefs || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchBeefs();
  }, []);

  // Helper to handle navigation to detail page
  const handleCardClick = (beefId) => {
    navigate(`/${language}/beefs/${beefId}`);
  };

  // Helper to stop propagation (so clicking the face doesn't trigger the card click)
  const handleFaceClick = (e, philId) => {
    e.stopPropagation(); // Prevents the card click
    // Navigation happens via the Link component automatically
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader /></div>;

  return (
    <div dir={isHebrew ? 'rtl' : 'ltr'} className="container max-w-4xl mx-auto py-12 px-4">

      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-extrabold mb-4 text-primary flex items-center justify-center gap-4">
          <Swords className="w-10 h-10 md:w-12 md:h-12" />
          {isHebrew ? "יריבויות פילוסופיות" : "Philosophical Beefs"}
        </h1>
        <p className="text-xl text-muted-foreground">
          {isHebrew
            ? "כשהרוחות התלהטו: הוויכוחים הגדולים שעיצבו את ההיסטוריה."
            : "When tempers flared: The great debates that shaped history."}
        </p>
      </div>

      <div className="space-y-8">
        {beefs.map((beef) => {
          // Fallback if population fails
          const philA = beef.philosopherA || { nameEn: 'Unknown', id: '' };
          const philB = beef.philosopherB || { nameEn: 'Unknown', id: '' };

          return (
            <div
              key={beef.id}
              onClick={() => handleCardClick(beef.id)}
              className="group relative bg-card border border-amber-500 rounded-xl shadow-lg hover:shadow-2xl hover:border-primary/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
            >
              {/* Background VS effect */}
              <div className="absolute inset-0 flex items-center justify-center opacity-5 group-hover:opacity-10 pointer-events-none">
                <span className="text-9xl font-black text-muted-foreground">VS</span>
              </div>

              <div className="relative p-6 flex flex-col md:flex-row items-center justify-between gap-6">

                {/* Philosopher A (Left) */}
                <div className="flex flex-col items-center text-center w-1/3 z-10">
                  <Link
                    to={`/${language}/philosophers/${philA.id}`}
                    onClick={(e) => handleFaceClick(e, philA.id)}
                    className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-amber-500 shadow-md hover:scale-110 hover:border-primary transition-transform duration-300"
                  >
                    {philA.imageUrl ? (
                      <img
                        src={philA.imageUrl}
                        alt={philA.nameEn}
                        className="w-full h-full object-cover transition-all duration-500"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground font-bold text-2xl">
                        {philA.nameEn.charAt(0)}
                      </div>
                    )}
                  </Link>
                  <span className="mt-3 font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                    {isHebrew ? philA.nameHe : philA.nameEn}
                  </span>
                </div>

                {/* The Conflict (Middle) */}
                <div className="flex-1 text-center z-10">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
                    {isHebrew ? "הקרב על" : "The Battle of"}
                  </div>
                  <h2 className="text-2xl font-serif font-bold mb-4 text-foreground group-hover:text-primary transition-colors">
                    {isHebrew ? beef.titleHe : beef.titleEn}
                  </h2>
                  <span className="inline-block px-5 py-2 bg-muted rounded-full text-xs font-medium text-muted-foreground group-hover:bg-primary/30 group-hover:text-primary transition-colors">
                    {isHebrew ? "לחץ לפרטים מלאים" : "Click for full details"}
                  </span>
                </div>

                {/* Philosopher B (Right) */}
                <div className="flex flex-col items-center text-center w-1/3 z-10">
                  <Link
                    to={`/${language}/philosophers/${philB.id}`}
                    onClick={(e) => handleFaceClick(e, philB.id)}
                    className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-amber-500 shadow-md hover:scale-110 hover:border-primary transition-transform duration-300"
                  >
                    {philB.imageUrl ? (
                      <img
                        src={philB.imageUrl}
                        alt={philB.nameEn}
                        className="w-full h-full object-cover transition-all duration-500"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground font-bold text-2xl">
                        {philB.nameEn.charAt(0)}
                      </div>
                    )}
                  </Link>
                  <span className="mt-3 font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                    {isHebrew ? philB.nameHe : philB.nameEn}
                  </span>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}