import React from 'react';
import { Network } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { RelationshipGraph } from '../components/RelationshipGraph';

export default function GraphPage() {
    const { language } = useLanguage();
    const isHebrew = language === 'he';

    return (
        <div dir={isHebrew ? 'rtl' : 'ltr'} className="container max-w-6xl mx-auto py-12 px-4">
            <div className="border-b border-border pb-6 mb-8">
                <h1 className="text-4xl md:text-5xl font-serif font-extrabold mb-2 text-primary flex items-center gap-4">
                    <Network className="w-10 h-10" />
                    {isHebrew ? 'מפת הקשרים' : 'The Influence Graph'}
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl">
                    {isHebrew
                        ? 'רשת ההשפעות בין הוגי ההיסטוריה — מי לימד את מי, ומי המשיך את דרכו של מי, על פי נתוני Wikidata.'
                        : 'The network of influence across the history of thought — who taught whom, and who carried whose ideas forward, according to Wikidata.'}
                </p>
            </div>

            <RelationshipGraph />
        </div>
    );
}
