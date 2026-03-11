import React from "react";

const EN_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const HE_ALPHABET = "אבגדהוזחטיכלמנסעפצקרשת".split("");

// availableLetters: Set of letters that have at least one philosopher, or null while loading
export function AlphaNav({ lang, isHebrew, activeLetter, onSelectLetter, availableLetters, allLabel, ariaLabel, className = "" }) {
  const letters = isHebrew ? HE_ALPHABET : EN_ALPHABET;

  return (
    <nav
      dir={isHebrew ? "rtl" : "ltr"}
      aria-label={ariaLabel}
      className={`flex flex-wrap gap-1.5 ${className}`}
    >
      <button
        onClick={() => onSelectLetter(null)}
        aria-pressed={activeLetter === null}
        className={`
          px-3 h-8 rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500
          ${activeLetter === null
            ? "bg-amber-500 text-black border border-amber-500"
            : "border border-border bg-card text-muted-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-foreground"}
        `}
      >
        {allLabel}
      </button>

      {letters.map((letter) => {
        const isActive = activeLetter === letter;
        const hasResults = availableLetters === null || availableLetters.has(letter);

        return (
          <button
            key={letter}
            onClick={() => hasResults ? onSelectLetter(letter) : undefined}
            disabled={!hasResults}
            aria-pressed={isActive}
            aria-label={isHebrew ? `סנן לפי ${letter}` : `Filter by ${letter}`}
            className={`
              w-8 h-8 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500
              ${isActive
                ? "bg-amber-500 text-black border border-amber-500"
                : hasResults
                  ? "border border-border bg-card text-muted-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-foreground"
                  : "border border-border/40 bg-card text-muted-foreground/25 cursor-not-allowed"}
            `}
          >
            {letter}
          </button>
        );
      })}
    </nav>
  );
}
