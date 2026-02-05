import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
  useLocation
} from "react-router-dom";
import { useEffect } from "react";

// --- Pages ---
import HomePage from "./pages/HomePage";
import PeriodsPage from "./pages/PeriodsPage";
import PeriodDetailPage from "./pages/PeriodDetailPage";
import PhilosopherPage from "./pages/PhilosopherPage";
import PhilosophersPage from "./pages/PhilosophersPage";
import AboutPage from "./pages/AboutPage";
import BeefsPage from "./pages/BeefsPage";
import BeefDetailPage from "./pages/BeefDetailPage";
import NotFoundPage from "./pages/NotFoundPage";
import SchoolsPage from "./pages/SchoolsPage";
import SchoolDetailsPage from './pages/SchoolDetailPage';
import ConceptsPage from "./pages/ConceptsPage";
import ConceptDetailPage from "./pages/ConceptDetailPage";
import ArtAndPhiloPage from "./pages/ArtAndPhiloPage";
import WorksPage from "./pages/WorksPage";
import QuotesPage from "./pages/QuotesPage";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Logo } from "./components/ui/Logo";
import { ThemeToggle } from "./components/ui/ThemeToggle";

// --- Context & Logic ---
import { useLanguage } from "./i18n/LanguageContext";
import { texts } from "./i18n/texts";
import { LanguageSwitcher } from "./components/LanguageSwitcher";

function AppShell() {
  const { language, setLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const t = texts[language] || {};
  const isHebrew = language === "he";
  const navigate = useNavigate();
  const location = useLocation();

  // Sync language with URL path
  useEffect(() => {
    const pathLang = location.pathname.split('/')[1];
    if (pathLang === 'en' && language !== 'en') {
      setLanguage('en');
    } else if (pathLang === 'he' && language !== 'he') {
      setLanguage('he');
    }
  }, [location.pathname, language, setLanguage]);

  const basePath = isHebrew ? "/he" : "/en";

  const isActive = (path) => {
    // Exact match for base path (home)
    if (path === basePath) {
      return location.pathname === basePath;
    }
    // Prefix match for other paths
    return location.pathname.startsWith(path);
  };

  const navLinks = [
    { to: `${basePath}/periods`, label: t.navPeriods },
    { to: `${basePath}/philosophers`, label: t.navPhilosophers },
    { to: `${basePath}/schools`, label: t.navSchools },
    { to: `${basePath}/concepts`, label: t.navConcepts },
    { to: `${basePath}/beefs`, label: t.navBeefs },
    { to: `${basePath}/works`, label: t.navWorks },
    { to: `${basePath}/quotes`, label: t.navQuotes },
    { to: `${basePath}/art-and-philo`, label: t.navArtAndPhilo },
    { to: `${basePath}/about`, label: t.navAbout },
  ];



  return (
    <div
      className={`min-h-screen flex flex-col bg-background text-foreground ${isHebrew ? "rtl" : "ltr"}`}
      dir={isHebrew ? "rtl" : "ltr"}
      lang={isHebrew ? "he" : "en"}
    >
      {/* HEADER - Forced LTR to keep layout consistent */}
      <header className="sticky top-0 z-50 w-full border-b border-amber-500 bg-background/80 backdrop-blur-md px-6 py-4 flex items-center justify-between" dir="ltr">

        <Link to={basePath} className={`flex items-center gap-0 transition-colors ${isActive(basePath) ? "text-amber-500 font-bold" : "text-foreground hover:text-amber-500"}`}>
          <Logo className="h-10 w-auto relative -top-[7px]" />
          <span className="text-xl font-serif font-bold tracking-tight relative top-[1px] -ml-1.5">
            hilosopia
          </span>
        </Link>

        {/* Dynamic Nav Direction */}
        <nav className="hidden md:flex items-center gap-6" dir={isHebrew ? "rtl" : "ltr"}>
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-medium transition-colors ${isActive(link.to)
                ? "text-amber-500 font-bold"
                : "text-muted-foreground hover:text-amber-500"
                }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {/* Auth Links */}
          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/admin" className="text-xs font-bold text-amber-500 hover:text-amber-600 uppercase tracking-wider">
                Admin
              </Link>
              <button onClick={logout} className="text-xs text-muted-foreground hover:text-foreground">
                {isHebrew ? "התנתק" : "Logout"}
              </button>
            </div>
          ) : (
            <Link to="/login" className="text-muted-foreground hover:text-amber-500 transition-colors" title="Admin Login">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lock"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            </Link>
          )}

          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 flex justify-center py-8 px-4">
        <div className="w-full max-w-[1600px]">
          <Routes>
            {/* Hebrew Routes */}
            <Route path="/he" element={<HomePage />} />
            <Route path="/he/periods" element={<PeriodsPage />} />
            <Route path="/he/periods/:periodId" element={<PeriodDetailPage />} />
            <Route path="/he/philosophers" element={<PhilosophersPage />} />
            <Route path="/he/philosophers/:id" element={<PhilosopherPage />} />
            <Route path="/he/about" element={<AboutPage />} />
            <Route path="/he/beefs" element={<BeefsPage />} />
            <Route path="/he/beefs/:id" element={<BeefDetailPage />} />
            <Route path="/he/schools" element={<SchoolsPage />} />
            <Route path="/he/schools/:id" element={<SchoolDetailsPage />} />
            <Route path="/he/concepts" element={<ConceptsPage />} />
            <Route path="/he/concepts/:id" element={<ConceptDetailPage />} />
            <Route path="/he/works" element={<WorksPage />} />
            <Route path="/he/quotes" element={<QuotesPage />} />
            <Route path="/he/art-and-philo" element={<ArtAndPhiloPage />} />

            {/* English Routes */}
            <Route path="/en" element={<HomePage />} />
            <Route path="/en/periods" element={<PeriodsPage />} />
            <Route path="/en/periods/:periodId" element={<PeriodDetailPage />} />
            <Route path="/en/philosophers" element={<PhilosophersPage />} />
            <Route path="/en/philosophers/:id" element={<PhilosopherPage />} />
            <Route path="/en/about" element={<AboutPage />} />
            <Route path="/en/beefs" element={<BeefsPage />} />
            <Route path="/en/beefs/:id" element={<BeefDetailPage />} />
            <Route path="/en/schools" element={<SchoolsPage />} />
            <Route path="/en/schools/:id" element={<SchoolDetailsPage />} />
            <Route path="/en/concepts" element={<ConceptsPage />} />
            <Route path="/en/concepts/:id" element={<ConceptDetailPage />} />
            <Route path="/en/works" element={<WorksPage />} />
            <Route path="/en/quotes" element={<QuotesPage />} />
            <Route path="/en/art-and-philo" element={<ArtAndPhiloPage />} />

            {/* Admin Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<AdminDashboard />} />

            {/* DEFAULT → English */}
            <Route path="/" element={<Navigate to="/en" replace />} />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="p-4 text-sm text-muted-foreground text-center border-t border-amber-500 bg-background">
        {isHebrew
          ? "© Philosophia – אתר ללימוד והיכרות עם ההיסטוריה של הפילוסופיה."
          : "© Philosophia – A site for exploring the history of philosophy."}
      </footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <AppShell />
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;