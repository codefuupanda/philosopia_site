import React from 'react';
import { useLanguage } from "../i18n/LanguageContext";
import { Card, CardContent } from "../components/ui/Card";

export default function AboutPage() {
  const { language } = useLanguage();
  const isHebrew = language === "he";

  // Tech stack data
  const techStack = [
    { name: "React", icon: "⚛️", desc: "Frontend & UI" },
    { name: "Node.js & Express", icon: "🟢", desc: "Backend API" },
    { name: "MongoDB", icon: "🍃", desc: "Database" },
    { name: "Wikidata & Wikipedia", icon: "🌐", desc: "Data Enrichment" },
    { name: "Tailwind CSS", icon: "🎨", desc: "Styling" },
  ];

  return (
    <div dir={isHebrew ? 'rtl' : 'ltr'} className="container max-w-4xl mx-auto py-12 px-4">

      {/* Header Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-extrabold mb-4 text-primary">
          {isHebrew ? "אודות Philosopia" : "About Philosopia"}
        </h1>
        <div className="w-24 h-1 bg-primary mx-auto rounded-full"></div>
      </div>

      {/* Main Content Card */}
      <Card className="bg-card border border-amber-500 shadow-xl mb-12">
        <CardContent className="p-8 md:p-10 space-y-6 text-lg leading-relaxed text-foreground">
          <p>
            {isHebrew
              ? "Philosopia הוא פרויקט שנועד לאגד את כל תקופות הפילוסופיה, הוגיה, האסכולות, והקונספטים המרכזיים – במקום אחד, בצורה ברורה ונגישה."
              : "Philosopia is a project designed to gather all philosophical periods, thinkers, schools, and core concepts into one clear and accessible place."}
          </p>

          <p>
            {isHebrew
              ? "המטרה היא ליצור מקור לימודי נוח, אינטראקטיבי ומסודר, שיאפשר לכל אדם – מתחיל או מתקדם – להבין את המפה הגדולה של ההיסטוריה הפילוסופית."
              : "The goal is to create an organized, interactive learning source that helps anyone—from beginner to advanced—understand the larger landscape of philosophical history."}
          </p>

          <p>
            {isHebrew
              ? "האתר מוקם בהדרגה, וממשיך להתעדכן עם פילוסופים, תקופות, קונספטים וייצוגים חזותיים נוספים. המידע נשען על מחקר עצמאי ושימוש במאגרי מידע פתוחים כמו ויקיפדיה וויקינתונים."
              : "The site is being built gradually and continues to expand with additional philosophers, periods, concepts, and visual representations. The data is based on independent research and open databases like Wikipedia and Wikidata."}
          </p>
        </CardContent>
      </Card>

      {/* Tech Stack Section */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold mb-6 text-center text-foreground">
          {isHebrew ? "טכנולוגיות הפיתוח" : "Tech Stack"}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {techStack.map((tech) => (
            <div key={tech.name} className="bg-card border border-amber-500 rounded-xl p-4 text-center hover:bg-muted hover:border-primary/50 transition-all duration-300">
              <div className="text-3xl mb-2">{tech.icon}</div>
              <div className="font-bold text-sm text-foreground">{tech.name}</div>
              <div className="text-xs text-muted-foreground">{tech.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Quote */}
      <div className="text-center border-t border-border pt-8">
        <p className="text-xl text-muted-foreground italic font-serif">
          {isHebrew
            ? "״תודה שביקרתם – תמיד יש עוד לחשוב.״"
            : "“Thank you for visiting — there is always more to think about.”"}
        </p>
      </div>

    </div>
  );
}