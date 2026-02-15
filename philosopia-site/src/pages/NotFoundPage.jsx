// src/pages/NotFoundPage.jsx
import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import notFoundImg from "../assets/images/404/404.jpg";

export default function NotFoundPage() {
  const { language } = useLanguage();
  const isHebrew = language === "he";
  const basePath = isHebrew ? "/he" : "/en";

  return (
    <main className="flex flex-col items-center justify-center py-20 text-center space-y-6">
      <img
        src={notFoundImg}
        alt="404 - Page not found"
        className="max-w-sm w-full rounded-xl shadow-lg"
      />

      {/* <h1 className="text-6xl font-bold text-foreground">404</h1> */}

      <p className="text-muted-foreground text-lg">
        {isHebrew ? "העמוד שחיפשת לא קיים." : "The page you were looking for does not exist."}
      </p>

      <Link
        to={basePath}
        className="inline-block mt-4 px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow hover:bg-primary/90 transition"
      >
        {isHebrew ? "חזרה לדף הבית" : "Back to homepage"}
      </Link>
    </main>
  );
}
