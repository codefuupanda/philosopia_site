import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useLanguage } from "../i18n/LanguageContext";
import { Loader } from '../components/ui/Loader';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

export default function BeefDetailPage() {
  const { id } = useParams();
  const { language } = useLanguage();
  const isHebrew = language === "he";

  const [beef, setBeef] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBeef() {
      try {
        const res = await axios.get(`${API_BASE_URL}/beefs/${id}`);
        setBeef(res.data.beef);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchBeef();
  }, [id]);

  if (loading) return <div className="p-20 flex justify-center"><Loader /></div>;
  if (!beef) return <div className="p-20 text-center">Beef Not Found</div>;

  const title = isHebrew ? beef.titleHe : beef.titleEn;
  const description = isHebrew ? beef.descriptionHe : beef.descriptionEn;
  const philA = beef.philosopherA;
  const philB = beef.philosopherB;

  return (
    <div dir={isHebrew ? 'rtl' : 'ltr'} className="container max-w-4xl mx-auto py-12 px-4">

      {/* Header */}
      <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-12 text-primary">
        {title}
      </h1>

      {/* The Fighters */}
      <div className="flex justify-around items-center mb-12">
        {/* A */}
        <div className="text-center">
          <Link to={`/${language}/philosophers/${philA.id}`}>
            <img
              src={philA.imageUrl}
              className="w-32 h-32 md:w-48 md:h-48 rounded-full object-cover border-4 border-red-500 shadow-xl mb-4 hover:scale-105 transition"
            />
          </Link>
          <h2 className="text-2xl font-bold">{isHebrew ? philA.nameHe : philA.nameEn}</h2>
        </div>

        <div className="text-4xl font-black text-muted-foreground/30">VS</div>

        {/* B */}
        <div className="text-center">
          <Link to={`/${language}/philosophers/${philB.id}`}>
            <img
              src={philB.imageUrl}
              className="w-32 h-32 md:w-48 md:h-48 rounded-full object-cover border-4 border-blue-500 shadow-xl mb-4 hover:scale-105 transition"
            />
          </Link>
          <h2 className="text-2xl font-bold">{isHebrew ? philB.nameHe : philB.nameEn}</h2>
        </div>
      </div>

      {/* The Story */}
      <div className="bg-card border border-amber-500 p-8 rounded-2xl shadow-sm leading-relaxed text-lg text-foreground/90">
        <p>{description}</p>
      </div>

      <div className="mt-8 text-center">
        <Link to={`/${language}/beefs`} className="text-primary hover:underline">
          {isHebrew ? "← חזרה לכל היריבויות" : "← Back to all Beefs"}
        </Link>
      </div>
    </div>
  );
}