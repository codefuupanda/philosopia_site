
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "../lib/utils";
import { useLanguage } from "../i18n/LanguageContext";

export const LanguageSwitcher = ({ className }) => {
    const { language } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();

    const toggleLanguage = () => {
        const newLang = language === "he" ? "en" : "he";
        // Using the same logic as App.jsx to preserve the current path but switch language prefix
        // This allows the App.jsx useEffect to pick up the change and sync the language state
        const currentPath = location.pathname;
        const newPath = currentPath.replace(/^\/(he|en)/, `/${newLang}`);
        navigate(newPath);
    };

    return (
        <button
            onClick={toggleLanguage}
            className={cn(
                "relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-stone-200 shadow-sm transition-all hover:scale-105 hover:shadow-md dark:border-stone-700",
                className
            )}
            aria-label={language === "he" ? "Switch to English" : "החלף לעברית"}
            title={language === "he" ? "Switch to English" : "החלף לעברית"}
        >
            {language === "he" ? (
                // Current is Hebrew, show US Flag to switch to English
                <USFlag className="h-full w-full object-cover" />
            ) : (
                // Current is English, show Israel Flag to switch to Hebrew
                <ILFlag className="h-full w-full object-cover" />
            )}
        </button>
    );
};

// Sub-components for SVGs to keep the main logic clean
function ILFlag({ className }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 640 480"
            className={className}
            preserveAspectRatio="none"
        >
            <path fill="#fff" d="M0 0h640v480H0z" />
            <path fill="#0038b8" d="M0 55h640v80H0zM0 345h640v80H0z" />
            <g fill="none" stroke="#0038b8" strokeWidth="35">
                <path d="M320 132.5L237.8 275h164.4z" />
                <path d="M320 347.5L237.8 205h164.4z" />
            </g>
        </svg>
    );
}

function USFlag({ className }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 640 480"
            className={className}
            preserveAspectRatio="none"
        >
            <path fill="#bd3d44" d="M0 0h640v480H0z" />
            <path
                stroke="#fff"
                strokeWidth="37"
                d="M0 55.3h640M0 129h640M0 202.8h640M0 276.5h640M0 350.2h640M0 424h640"
            />
            <path fill="#192f5d" d="M0 0h284v258H0z" />
            <g fill="#fff">
                <g id="s18">
                    <g id="s9">
                        <g id="s5">
                            <g id="s4">
                                <path
                                    id="s"
                                    d="M24.8 21l3 9.3H18l8 5.7-3 9.3 8-5.8 8 5.8-3-9.3 8-5.7h-9.8z"
                                />
                                <use href="#s" x="49" />
                                <use href="#s" x="98" />
                                <use href="#s" x="147" />
                            </g>
                            <use href="#s" x="196" />
                        </g>
                        <use href="#s5" x="24.5" y="42" />
                    </g>
                    <use href="#s9" y="84" />
                </g>
                <use href="#s18" y="168" />
            </g>
        </svg>
    );
}
