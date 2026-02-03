import React from 'react';

export const Logo = ({ className = "h-10 w-auto", color = "currentColor" }) => {
    return (
        <svg
            viewBox="0 0 80 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-label="Philosopia Logo"
        >
            {/* The Pillar (Vertical Stem) */}
            <rect x="15" y="10" width="15" height="80" fill={color} />

            {/* The Mind (Detached Block) */}
            <path d="M35 10 H50 C70 10 70 55 50 55 H35 V10 Z" fill={color} />
        </svg>
    );
};
