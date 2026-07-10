import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useSchool } from '../hooks/queries';
import { Loader } from '../components/ui/Loader';

export default function SchoolDetailPage() {
  const { id } = useParams();
  const { language } = useLanguage();
  const isHebrew = language === 'he';

  const { data, isLoading: loading, isError } = useSchool(id);
  const school = data?.school;

  if (loading) return <div className="p-20 flex justify-center"><Loader /></div>;
  if (isError || !school) return <div className="p-20 text-center">School Not Found</div>;

  const name = isHebrew ? school.nameHe : school.nameEn;
  const description = isHebrew ? school.descriptionHe : school.descriptionEn;

  return (
    <div dir={isHebrew ? 'rtl' : 'ltr'} className="container max-w-4xl mx-auto py-12 px-4">
      <div className="text-center mb-16">
        <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
          {isHebrew ? "אסכולה פילוסופית" : "Philosophical School"}
        </span>
        <h1 className="text-5xl font-extrabold text-primary mb-6">{name}</h1>
        <div className="text-2xl font-light text-foreground/80 leading-relaxed border-y border-border py-8">
          {description}
        </div>
      </div>

      {/* Philosophers Grid */}
      {school.philosophers && school.philosophers.length > 0 && (
        <div>
          <h2 className="text-3xl font-bold mb-8 text-center">
            {isHebrew ? "הוגים מרכזיים" : "Key Thinkers"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {school.philosophers.map(phil => (
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