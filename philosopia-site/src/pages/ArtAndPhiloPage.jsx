import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Loader } from '../components/ui/Loader';

const ArtAndPhiloPage = () => {
    const [artworks, setArtworks] = useState([]);
    const [loading, setLoading] = useState(true);
    const { language } = useLanguage();
    const isHebrew = language === 'he';

    useEffect(() => {
        const fetchArtworks = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/artworks');
                const data = await response.json();

                // Enhance data with MediaWiki images
                const enhancedData = await Promise.all(data.map(async (work) => {
                    if (work.status === 'copyrighted') return work;

                    try {
                        const wikiData = await fetchWikiImage(work.filename);
                        return { ...work, ...wikiData };
                    } catch (error) {
                        console.error(`Failed to fetch image for ${work.title}`, error);
                        return work;
                    }
                }));

                setArtworks(enhancedData);
            } catch (error) {
                console.error('Error fetching artworks:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchArtworks();
    }, []);

    const fetchWikiImage = async (filename, width = 800) => {
        const endpoint = "https://commons.wikimedia.org/w/api.php";
        const params = new URLSearchParams({
            action: "query",
            prop: "imageinfo",
            iiprop: "url|extmetadata",
            iiurlwidth: width,
            titles: `File:${filename}`,
            format: "json",
            origin: "*"
        });

        const response = await fetch(`${endpoint}?${params.toString()}`);
        if (!response.ok) throw new Error("API Error");

        const data = await response.json();
        const pages = data.query.pages;
        const pageId = Object.keys(pages)[0];

        if (pageId === "-1") return null;

        const imageInfo = pages[pageId].imageinfo[0];
        return {
            imageUrl: imageInfo.thumburl,
            originalUrl: imageInfo.url,
            license: imageInfo.extmetadata.LicenseShortName.value,
        };
    };

    if (loading) return <div className="p-20 flex justify-center"><Loader /></div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold mb-2 text-center text-primary font-serif">
                {isHebrew ? "אמנות ופילוסופיה" : "Art & Philosophy"}
            </h1>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
                {isHebrew
                    ? "אוסף אצור של יצירות מופת הממחישות רעיונות פילוסופיים, מהרנסנס ועד הסוריאליזם."
                    : "A curated collection of masterpieces illustrating philosophical ideas, from the Renaissance to Surrealism."}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {artworks.map((work) => (
                    <div key={work._id} className="bg-card rounded-lg overflow-hidden shadow-xl border border-amber-500 hover:border-primary/50 transition-all duration-300 flex flex-col">
                        <div className="relative aspect-[4/3] bg-muted overflow-hidden group">
                            {work.status === 'copyrighted' ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-muted">
                                    <span className="text-4xl mb-4">🔒</span>
                                    <p className="text-muted-foreground mb-4 font-serif italic">
                                        {isHebrew ? "תמונה מוגנת בזכויות יוצרים" : "Image Copyright Protected"}
                                    </p>
                                    <a
                                        href={work.externalLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 bg-secondary hover:bg-primary/90 text-secondary-foreground hover:text-primary-foreground rounded transition-colors text-sm"
                                    >
                                        {isHebrew ? "צפה במוזיאון" : "View at Museum"}
                                    </a>
                                </div>
                            ) : work.imageUrl ? (
                                <img
                                    src={work.imageUrl}
                                    alt={work.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                                    {isHebrew ? "תמונה לא זמינה" : "Image Unavailable"}
                                </div>
                            )}

                            {work.status === 'pd-us-only' && (
                                <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded border border-primary/50">
                                    US Public Domain
                                </div>
                            )}
                        </div>

                        <div className="p-6 flex-grow flex flex-col">
                            <h3 className="text-xl font-bold text-foreground mb-1 font-serif">{work.title}</h3>
                            <div className="flex justify-between items-baseline mb-4 text-sm text-muted-foreground">
                                <span className="text-primary font-medium">{work.artist}</span>
                                <span>{work.year}</span>
                            </div>

                            <p className="text-muted-foreground text-sm leading-relaxed mb-4 flex-grow">
                                {work.description}
                            </p>

                            <div className="pt-4 border-t border-border text-xs text-muted-foreground flex justify-between items-center">
                                <span>{work.location}</span>
                                {work.license && (
                                    <span title="License">{work.license}</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ArtAndPhiloPage;
