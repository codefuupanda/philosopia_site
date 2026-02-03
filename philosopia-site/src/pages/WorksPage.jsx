import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { texts } from '../i18n/texts';
import { WorkCard } from '../components/WorkCard';
import { cn } from '../lib/utils';

export default function WorksPage() {
    const location = useLocation();
    const lang = location.pathname.split('/')[1] || 'en';
    const t = texts[lang];
    const isRtl = lang === 'he';

    const [works, setWorks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await api.getWorks(lang);
                setWorks(data);
            } catch (err) {
                console.error("Failed to load works", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [lang]);

    return (
        <div className={cn("container mx-auto px-4 py-12 min-h-screen", isRtl ? "rtl" : "ltr")} dir={isRtl ? "rtl" : "ltr"}>
            <header className="mb-12 space-y-4">
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground">
                    {t.works_title}
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl">
                    {t.works_subtitle}
                </p>
            </header>

            {loading ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground animate-pulse">
                    {t.loading}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {works.map((work) => (
                        <WorkCard key={work._id} work={work} lang={lang} />
                    ))}
                </div>
            )}
        </div>
    );
}
