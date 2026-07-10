import React from "react";
import { useParams, Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { texts } from "../i18n/texts";
import { usePeriod, usePhilosophersList } from "../hooks/queries";
import { Loader } from '../components/ui/Loader';

const PhilosopherCard = ({ philosopher, isHebrew }) => (
    <Link
        to={`/${isHebrew ? 'he' : 'en'}/philosophers/${philosopher.id}`}
        className="flex items-center gap-4 p-4 border border-amber-500 rounded-lg shadow-sm bg-card hover:shadow-md hover:border-primary/30 transition duration-200 group"
    >
        {/* Image / Placeholder */}
        <div className="w-16 h-16 shrink-0 rounded-full overflow-hidden bg-muted border border-border">
            {philosopher.imageUrl ? (
                <img
                    src={philosopher.imageUrl}
                    alt={philosopher.nameEn}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground font-bold text-xl">
                    {philosopher.nameEn.charAt(0)}
                </div>
            )}
        </div>

        {/* Text Content */}
        <div>
            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                {isHebrew ? philosopher.nameHe : philosopher.nameEn}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
                {isHebrew ? philosopher.summaryHe : philosopher.summaryEn}
            </p>
        </div>
    </Link>
);

export default function PeriodDetailPage() {
    const { language } = useLanguage();
    const t = texts[language];
    const { periodId } = useParams();
    const isHebrew = language === "he";

    // Two independent queries — React Query runs them in parallel
    const periodQuery = usePeriod(periodId);
    const philosophersQuery = usePhilosophersList({ periodId });

    const period = periodQuery.data?.period;
    const philosophers = philosophersQuery.data?.philosophers ?? [];

    const isLoading = periodQuery.isLoading || philosophersQuery.isLoading;
    const error = (periodQuery.isError || philosophersQuery.isError || (!isLoading && !period))
        ? (t.error_loading_data || "Failed to load period details and philosophers.")
        : null;

    if (isLoading) {
        return <div className="py-20 flex justify-center"><Loader /></div>;
    }

    if (error) {
        return <div className="text-center py-10 text-destructive text-lg">{error}</div>;
    }

    const periodTitle = period ? (isHebrew ? period.nameHe : period.nameEn) : 'Period Details';
    const periodDescription = period ? (isHebrew ? period.descriptionHe : period.descriptionEn) : '';

    return (
        <div className="space-y-8">
            <h1 className="text-4xl font-bold text-primary">
                {periodTitle}
            </h1>

            {/* Period Details */}
            <div className="bg-secondary/50 p-6 rounded-xl border border-amber-500">
                <p className="text-lg text-foreground mb-4">{periodDescription}</p>
                <p className="text-sm text-muted-foreground">
                    {isHebrew ? "שנים: " : "Years: "}
                    {period.startYear} - {period.endYear}
                </p>
            </div>

            <h2 className="text-3xl font-semibold border-b border-border pb-2 text-foreground">
                {isHebrew ? "פילוסופים מרכזיים בתקופה" : "Key Philosophers of the Period"}
                {` (${philosophers.length})`}
            </h2>

            {/* Philosophers List */}
            {philosophers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {philosophers.map(p => (
                        <PhilosopherCard key={p.id} philosopher={p} isHebrew={isHebrew} />
                    ))}
                </div>
            ) : (
                <p className="text-lg text-muted-foreground">
                    {isHebrew
                        ? "לא נמצאו פילוסופים המקושרים לתקופה זו."
                        : "No philosophers found linked to this period."}
                </p>
            )}
        </div>
    );
}