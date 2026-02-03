// F:\philosopia_site\philosopia-site\src\components\Timeline.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card'; 

// -----------------------------------------------------------
// TimelineItem
const TimelineItem = ({ period, isLeft, lang }) => {
    const isHebrew = lang === 'he';
    const periodUrl = `/${lang}/periods/${period.id}`;
    
    const title = isHebrew ? period.title_he : period.title_en;
    const description = isHebrew ? period.description_he : period.description_en;
    const textAlignment = isHebrew ? 'text-right' : 'text-left';

    // קביעת ההזחה (Padding) כדי ליצור מקום בצד אחד
    const paddingClass = isLeft ? 'pe-1/2' : 'ps-1/2';
    
    // קביעת מיקום הכרטיס (דחיפה לצד ימין או שמאל)
    const positionOffsetClass = isHebrew ? 
        (isLeft ? 'md:right-[52%]' : 'md:left-[52%]') : 
        (isLeft ? 'md:left-0' : 'md:right-0');

    return (
        <div className={`group relative mb-12 ${paddingClass}`}>
            
            {/* 📍 הנקודה המרכזית (Dot) */}
            {/* תיקון: שמנו אותה ב-left-1/2 (אמצע מוחלט) כדי שתשב תמיד על הקו המרכזי */}
            <div 
                className={`hidden md:block absolute w-5 h-5 rounded-full bg-background top-6 
                            left-1/2 -translate-x-1/2  
                            
                            /* עיצוב הנקודה */
                            border-4 border-indigo-500 
                            
                            /* אפקט הגדלה ב-Hover */
                            group-hover:scale-125 transition-all duration-300 z-20 shadow-md`}
            />

            {/* (מחקנו מכאן את הקו המחבר - Connector Line - כפי שביקשת) */}

            {/* 📦 הכרטיס עצמו */}
            <div className={`relative w-full md:w-[48%] ${positionOffsetClass}`}>
                <Link to={periodUrl} className="block">
                    <Card 
                        className="relative overflow-hidden border border-border/60 bg-card/95 backdrop-blur-sm
                                   transition-all duration-300 ease-out group
                                   hover:shadow-xl hover:-translate-y-1
                                   hover:border-indigo-400/50"
                    >
                        {/* פס עליון עדין */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />

                        <CardHeader className="pb-3 pt-5">
                            {/* תגית השנים */}
                            <div className={`flex ${isHebrew ? 'justify-start' : 'justify-end'} mb-2`}>
                                <span className="inline-block px-3 py-1 text-xs font-bold tracking-wide rounded-full 
                                                 bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    {period.startYear} – {period.endYear}
                                </span>
                            </div>
                            
                            <CardTitle className={`text-2xl font-bold transition-colors ${textAlignment} group-hover:text-indigo-700`}>
                                {title}
                            </CardTitle>
                        </CardHeader>

                        <CardContent>
                            <CardDescription className={`text-base leading-relaxed text-muted-foreground ${textAlignment}`}>
                                {description}
                            </CardDescription>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    );
};


// -----------------------------------------------------------
// Main Timeline Component
const Timeline = ({ periods }) => {
    const { lang } = useLanguage(); 
    const isHebrew = lang === 'he';
    
    return (
        <div dir={isHebrew ? 'rtl' : 'ltr'} className="container max-w-5xl mx-auto py-12 px-4">
            
            <div className="relative">

                {/* -------------------------------------------------- */}
                {/* 📍 הקו האנכי (Spine) */}
                {/* -------------------------------------------------- */}
                <div className={`
                    absolute top-0 bottom-0 h-full
                    border-indigo-200
                    /* במובייל הקו בצד, בדסקטופ הוא באמצע */
                    border-r-[3px] md:border-r-0 md:border-l-[3px]
                    
                    ${isHebrew ? 'right-0' : 'left-0'} 
                    md:left-1/2 md:-translate-x-1/2
                `}></div>

                {/* -------------------------------------------------- */}
                {/* פריטי הציר */}
                {/* -------------------------------------------------- */}
                {periods.map((period, index) => {
                    const isLeft = index % 2 === 0;
                    
                    return (
                        <TimelineItem 
                            key={period.id} 
                            period={period} 
                            isLeft={isLeft} 
                            lang={lang}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default Timeline;