import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ForceGraph2D from 'react-force-graph-2d';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useGraphNetwork } from '../hooks/queries';
import { Loader } from './ui/Loader';

// Era → hue. Spaced around the wheel so neighboring eras stay distinguishable;
// classical Greek gets the brand gold. Saturation/lightness are set per theme.
// Canonical periodIds from data/periods.js, plus the two deliberately
// non-existent Chinese ids (Confucius/Mencius/Xunzi — see CLAUDE.md).
// The noncanonical spellings ('modern', 'contemporary', 'enlightenment')
// were normalized in the data on 2026-07-10.
const ERA_HUES = {
    pre_socratic: 210,
    classical_period: 40,
    hellenistic_period: 170,
    medieval_period: 280,
    renaissance_period: 320,
    early_modern_period: 20,
    modern_period: 130,
    contemporary_period: 0,
    spring_and_autumn_period: 60,
    warring_states: 60,
};

const ERA_LABELS = {
    pre_socratic: { en: 'Pre-Socratic', he: 'פרה-סוקרטים' },
    classical_period: { en: 'Classical Greek', he: 'יוון הקלאסית' },
    hellenistic_period: { en: 'Hellenistic', he: 'התקופה ההלניסטית' },
    medieval_period: { en: 'Medieval', he: 'ימי הביניים' },
    renaissance_period: { en: 'Renaissance', he: 'הרנסאנס' },
    early_modern_period: { en: 'Early Modern', he: 'העת החדשה המוקדמת' },
    modern_period: { en: 'Modern (19th C.)', he: 'העת החדשה (המאה ה־19)' },
    contemporary_period: { en: '20th Century', he: 'המאה ה־20' },
    spring_and_autumn_period: { en: 'Ancient China', he: 'סין העתיקה' },
    warring_states: { en: 'Ancient China', he: 'סין העתיקה' },
};

const eraColor = (periodId, isDark) => {
    const hue = ERA_HUES[periodId];
    if (hue === undefined) return isDark ? 'hsl(0 0% 55%)' : 'hsl(0 0% 45%)';
    return isDark ? `hsl(${hue} 70% 60%)` : `hsl(${hue} 65% 42%)`;
};

export function RelationshipGraph() {
    const { language } = useLanguage();
    const isHebrew = language === 'he';
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const navigate = useNavigate();

    const { data, isLoading, isError } = useGraphNetwork();

    const [hoverNode, setHoverNode] = useState(null);
    const containerRef = useRef(null);
    const [size, setSize] = useState({ width: 0, height: 0 });

    // Resolve the shadcn CSS variables to concrete canvas colors, re-resolved
    // whenever the theme class flips.
    const tokens = useMemo(() => {
        const css = getComputedStyle(document.documentElement);
        const v = (name) => css.getPropertyValue(name).trim();
        return {
            foreground: `hsl(${v('--foreground')})`,
            foregroundDim: `hsl(${v('--foreground')} / 0.12)`,
            link: `hsl(${v('--muted-foreground')} / 0.35)`,
            linkDim: `hsl(${v('--muted-foreground')} / 0.06)`,
            linkActive: `hsl(${v('--primary')})`,
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [theme]);

    // Track container size (the canvas needs explicit pixel dimensions).
    // Keyed on isLoading: on the first render the loading branch returns early,
    // so the container ref only exists after the data arrives.
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const measure = () => setSize({
            width: el.clientWidth,
            height: Math.max(480, Math.min(el.clientWidth * 0.7, window.innerHeight * 0.7)),
        });
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        return () => observer.disconnect();
    }, [isLoading]);

    // react-force-graph mutates node/link objects (adds x/y, replaces link
    // endpoints with node refs) — give it its own deep-ish copy, and precompute
    // adjacency for hover highlighting.
    const { graphData, neighbors, degree } = useMemo(() => {
        if (!data) return { graphData: null, neighbors: new Map(), degree: new Map() };
        const graphData = {
            nodes: data.nodes.map((n) => ({ ...n })),
            links: data.links.map((l) => ({ ...l })),
        };
        const neighbors = new Map();
        const degree = new Map();
        for (const l of data.links) {
            if (!neighbors.has(l.source)) neighbors.set(l.source, new Set());
            if (!neighbors.has(l.target)) neighbors.set(l.target, new Set());
            neighbors.get(l.source).add(l.target);
            neighbors.get(l.target).add(l.source);
            degree.set(l.source, (degree.get(l.source) || 0) + 1);
            degree.set(l.target, (degree.get(l.target) || 0) + 1);
        }
        for (const n of graphData.nodes) n.val = 1 + (degree.get(n.id) || 0) * 0.4;
        return { graphData, neighbors, degree };
    }, [data]);

    const isNeighbor = useCallback(
        (nodeId) => hoverNode && (nodeId === hoverNode.id || neighbors.get(hoverNode.id)?.has(nodeId)),
        [hoverNode, neighbors]
    );

    const linkIsHighlighted = useCallback(
        (l) => {
            if (!hoverNode) return false;
            const s = typeof l.source === 'object' ? l.source.id : l.source;
            const t = typeof l.target === 'object' ? l.target.id : l.target;
            return s === hoverNode.id || t === hoverNode.id;
        },
        [hoverNode]
    );

    const drawNode = useCallback((node, ctx, globalScale) => {
        const dimmed = hoverNode && !isNeighbor(node.id);
        const radius = Math.sqrt(node.val) * 3;
        const color = eraColor(node.periodId, isDark);

        ctx.globalAlpha = dimmed ? 0.12 : 1;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();

        if (hoverNode && node.id === hoverNode.id) {
            ctx.lineWidth = 1.5 / globalScale;
            ctx.strokeStyle = tokens.linkActive;
            ctx.stroke();
        }

        // Labels: readable once zoomed in, always for the hovered neighborhood
        const showLabel = globalScale > 1.4 || (hoverNode && isNeighbor(node.id));
        if (showLabel) {
            const label = isHebrew ? node.nameHe : node.nameEn;
            const fontSize = Math.max(11 / globalScale, 2.5);
            ctx.font = `500 ${fontSize}px Inter, Heebo, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = dimmed ? tokens.foregroundDim : tokens.foreground;
            ctx.fillText(label, node.x, node.y + radius + 1.5);
        }
        ctx.globalAlpha = 1;
    }, [hoverNode, isNeighbor, isDark, isHebrew, tokens]);

    if (isLoading) return <div className="py-24 flex justify-center"><Loader /></div>;
    if (isError || !graphData) {
        return (
            <div className="py-24 text-center text-destructive">
                {isHebrew ? 'שגיאה בטעינת מפת הקשרים.' : 'Error loading the relationship graph.'}
            </div>
        );
    }

    const erasInData = [...new Set(graphData.nodes.map((n) => n.periodId).filter(Boolean))]
        .filter((era) => ERA_HUES[era] !== undefined)
        .sort((a, b) => Object.keys(ERA_HUES).indexOf(a) - Object.keys(ERA_HUES).indexOf(b));
    const legendEras = erasInData.filter((era, i) =>
        // Spring & Autumn / Warring States share a label + hue — show once
        erasInData.findIndex((e) => ERA_LABELS[e]?.en === ERA_LABELS[era]?.en) === i
    );

    return (
        <div>
            {/* Era legend */}
            <div dir={isHebrew ? 'rtl' : 'ltr'} className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4">
                {legendEras.map((era) => (
                    <span key={era} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: eraColor(era, isDark) }} />
                        {isHebrew ? ERA_LABELS[era].he : ERA_LABELS[era].en}
                    </span>
                ))}
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="inline-block w-5 border-t border-dashed border-muted-foreground shrink-0" />
                    {isHebrew ? 'קשר מוסק' : 'inferred link'}
                </span>
            </div>

            <div ref={containerRef} className="bg-card border border-border rounded-xl overflow-hidden">
                {size.width > 0 && (
                    <ForceGraph2D
                        graphData={graphData}
                        width={size.width}
                        height={size.height}
                        backgroundColor="rgba(0,0,0,0)"
                        nodeCanvasObject={drawNode}
                        nodePointerAreaPaint={(node, color, ctx) => {
                            ctx.beginPath();
                            ctx.arc(node.x, node.y, Math.sqrt(node.val) * 3 + 2, 0, 2 * Math.PI);
                            ctx.fillStyle = color;
                            ctx.fill();
                        }}
                        linkColor={(l) => {
                            if (!hoverNode) return tokens.link;
                            return linkIsHighlighted(l) ? tokens.linkActive : tokens.linkDim;
                        }}
                        linkWidth={(l) => (linkIsHighlighted(l) ? 1.8 : 1)}
                        linkLineDash={(l) => (l.inferred ? [3, 2] : null)}
                        linkDirectionalArrowLength={3.5}
                        linkDirectionalArrowRelPos={0.92}
                        onNodeHover={(node) => {
                            setHoverNode(node || null);
                            if (containerRef.current) containerRef.current.style.cursor = node ? 'pointer' : 'default';
                        }}
                        onNodeClick={(node) => navigate(`/${language}/philosophers/${node.id}`)}
                        cooldownTicks={120}
                    />
                )}
            </div>

            <p dir={isHebrew ? 'rtl' : 'ltr'} className="mt-3 text-xs text-muted-foreground">
                {isHebrew
                    ? 'ריחוף מדגיש את הקשרים של הוגה; לחיצה פותחת את הפרופיל. כיוון החץ: מהמשפיע אל המושפע.'
                    : 'Hover a node to highlight its connections; click to open the profile. Arrows point from influencer to influenced.'}
            </p>
        </div>
    );
}
