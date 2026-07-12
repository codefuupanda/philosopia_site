import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ForceGraph2D from 'react-force-graph-2d';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useGraphNetwork, useSchools } from '../hooks/queries';
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

// School hues are assigned by golden-angle rotation over the sorted school ids
// present in the dataset — no hand-curated palette (20+ schools, and new ones
// can appear with new data); deterministic, and consecutive indices land far
// apart on the wheel. Saturation/lightness follow the theme like eraColor.
const GOLDEN_ANGLE = 137.508;

// d3-style custom force pulling each node toward its school's anchor point —
// hand-rolled velocity nudge per tick, so we don't need to import d3-force.
// Pinned nodes (fx/fy) are unaffected: the simulation overrides their position.
const makeClusterForce = (centers, strength = 0.4) => {
    let nodes = [];
    const force = (alpha) => {
        for (const n of nodes) {
            const c = centers.get(n.schoolId);
            if (!c) continue;
            n.vx += (c.x - n.x) * strength * alpha;
            n.vy += (c.y - n.y) * strength * alpha;
        }
    };
    force.initialize = (ns) => { nodes = ns; };
    return force;
};

const ControlPill = ({ active, onClick, title, children }) => (
    <button
        type="button"
        aria-pressed={active}
        title={title}
        onClick={onClick}
        className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
            active
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-card text-muted-foreground border-border hover:text-foreground hover:border-primary/40'
        }`}
    >
        {children}
    </button>
);

export function RelationshipGraph() {
    const { language } = useLanguage();
    const isHebrew = language === 'he';
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const navigate = useNavigate();

    const { data, isLoading, isError } = useGraphNetwork();
    const { data: schoolsData } = useSchools(); // bilingual school names for the legend

    const [hoverNode, setHoverNode] = useState(null);
    const [focusNode, setFocusNode] = useState(null);          // click-to-focus 1-hop spotlight
    const [influenceMode, setInfluenceMode] = useState(false); // scale node size by degree
    const [groupBySchool, setGroupBySchool] = useState(false); // cluster physics toggle
    const [colorMode, setColorMode] = useState('school');      // 'school' | 'era'
    const containerRef = useRef(null);
    const fgRef = useRef(null);
    const tunedForData = useRef(null); // last dataset the forces were tuned for
    const didAutoFit = useRef(false);  // one-time zoom-to-fit per dataset
    const prevGroupRef = useRef(false); // last applied "group by school" state
    const defaultLinkStrength = useRef(null); // d3's default, captured before clustering overrides it
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
            pinned: `hsl(${v('--foreground')} / 0.55)`,
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [theme]);

    // Track container size (the canvas needs explicit pixel dimensions).
    // Keyed on isLoading: on the first render the loading branch returns early,
    // so the container ref only exists after the data arrives.
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const measure = () => {
            // Hidden/collapsed containers measure 0 — ignore rather than unmount
            // the canvas (a remount would discard forces, zoom, and pinned nodes).
            if (!el.clientWidth) return;
            setSize({
                width: el.clientWidth,
                height: Math.max(480, Math.min(el.clientWidth * 0.7, window.innerHeight * 0.7)),
            });
        };
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
        return { graphData, neighbors, degree };
    }, [data]);

    // Schools present in the data → deterministic golden-angle hue per school,
    // plus anchor points on a circle for the "group by school" cluster force.
    const { schoolHues, schoolIds, schoolCenters } = useMemo(() => {
        const ids = [...new Set((graphData?.nodes || []).map((n) => n.schoolId).filter(Boolean))].sort();
        const schoolHues = new Map(ids.map((id, i) => [id, (i * GOLDEN_ANGLE) % 360]));
        const R = 160 + ids.length * 12;
        const schoolCenters = new Map(ids.map((id, i) => {
            const a = (i / ids.length) * 2 * Math.PI;
            return [id, { x: R * Math.cos(a), y: R * Math.sin(a) }];
        }));
        return { schoolHues, schoolIds: ids, schoolCenters };
    }, [graphData]);

    const schoolNames = useMemo(() => {
        const m = new Map();
        for (const s of schoolsData?.schools || []) m.set(s.id, { en: s.nameEn, he: s.nameHe });
        return m;
    }, [schoolsData]);

    const schoolColor = useCallback((schoolId) => {
        const hue = schoolHues.get(schoolId);
        if (hue === undefined) return isDark ? 'hsl(0 0% 55%)' : 'hsl(0 0% 45%)';
        return isDark ? `hsl(${hue} 65% 62%)` : `hsl(${hue} 60% 40%)`;
    }, [schoolHues, isDark]);

    const nodeColor = useCallback(
        (node) => (colorMode === 'school' ? schoolColor(node.schoolId) : eraColor(node.periodId, isDark)),
        [colorMode, schoolColor, isDark]
    );

    // Node radius: uniform by default; "Highlight Influence" scales area with
    // total degree so hubs like Plato/Aristotle visibly dominate. Computed at
    // draw time (not stored on the node) so toggling never rebuilds the layout.
    const nodeRadius = useCallback((node) => {
        const v = influenceMode ? 1 + (degree.get(node.id) || 0) * 1.2 : 3;
        return Math.sqrt(v) * 3;
    }, [influenceMode, degree]);

    // Physics tuning: the d3-force defaults (charge -30, link distance 30) pack
    // 66 nodes into a dense clump. Stronger repulsion + longer links let the
    // network breathe. Keyed on size.width too because the canvas mounts only
    // after the container is measured — on the graphData-change render fgRef is
    // still null; tunedForData keeps resizes from re-reheating the simulation.
    useEffect(() => {
        const fg = fgRef.current;
        if (!fg || !graphData) return;
        // Idempotent on every run: a remounted canvas is a fresh force-graph
        // instance with default forces, so always re-apply. Reheat only on a
        // new dataset — not on resizes or remounts.
        fg.d3Force('charge').strength(-180);
        fg.d3Force('link').distance(60);
        if (tunedForData.current !== graphData) {
            tunedForData.current = graphData;
            didAutoFit.current = false;
            fg.d3ReheatSimulation();
        }
    }, [graphData, size.width]);

    // "Group by School" physics: nudge every node toward its school anchor each
    // tick, forming visual islands. Re-applied idempotently on every run (a
    // remounted canvas is a fresh instance); reheat only when the toggle flips.
    useEffect(() => {
        const fg = fgRef.current;
        if (!fg || !graphData) return;
        // While clustering, links become loose tethers (weak strength) —
        // otherwise the densely cross-linked core resists separating and the
        // school islands never form. Default strength restored on toggle-off.
        const link = fg.d3Force('link');
        if (defaultLinkStrength.current === null) defaultLinkStrength.current = link.strength();
        link.strength(groupBySchool ? 0.06 : defaultLinkStrength.current);
        fg.d3Force('cluster', groupBySchool ? makeClusterForce(schoolCenters, 0.55) : null);
        if (prevGroupRef.current !== groupBySchool) {
            prevGroupRef.current = groupBySchool;
            fg.d3ReheatSimulation();
        }
    }, [groupBySchool, schoolCenters, graphData, size.width]);

    // Focus (click) outranks hover for the spotlight; both share one pipeline,
    // so the dim/highlight logic below needs no focus-specific branches.
    const activeNode = focusNode || hoverNode;

    const isNeighbor = useCallback(
        (nodeId) => activeNode && (nodeId === activeNode.id || neighbors.get(activeNode.id)?.has(nodeId)),
        [activeNode, neighbors]
    );

    const linkIsHighlighted = useCallback(
        (l) => {
            if (!activeNode) return false;
            const s = typeof l.source === 'object' ? l.source.id : l.source;
            const t = typeof l.target === 'object' ? l.target.id : l.target;
            return s === activeNode.id || t === activeNode.id;
        },
        [activeNode]
    );

    const drawNode = useCallback((node, ctx, globalScale) => {
        const dimmed = activeNode && !isNeighbor(node.id);
        const radius = nodeRadius(node);
        const color = nodeColor(node);

        ctx.globalAlpha = dimmed ? 0.12 : 1;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();

        if (activeNode && node.id === activeNode.id) {
            ctx.lineWidth = 1.5 / globalScale;
            ctx.strokeStyle = tokens.linkActive;
            ctx.stroke();
        }

        // Pinned nodes (fx/fy fixed after a drag) get a dashed halo; it also
        // shows mid-drag, previewing that the drop position will stick.
        if (node.fx != null) {
            ctx.lineWidth = 1 / globalScale;
            ctx.strokeStyle = tokens.pinned;
            ctx.setLineDash([2 / globalScale, 1.5 / globalScale]);
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius + 2.5 / globalScale, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Labels: readable once zoomed in, always for the spotlit neighborhood
        const showLabel = globalScale > 1.4 || (activeNode && isNeighbor(node.id));
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
    }, [activeNode, isNeighbor, nodeRadius, nodeColor, isHebrew, tokens]);

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
            {/* Control bar: color mode, influence sizing, school clustering */}
            <div dir={isHebrew ? 'rtl' : 'ltr'} className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-xs text-muted-foreground">{isHebrew ? 'צבע לפי:' : 'Color by:'}</span>
                <ControlPill active={colorMode === 'school'} onClick={() => setColorMode('school')}>
                    {isHebrew ? 'אסכולה' : 'School'}
                </ControlPill>
                <ControlPill active={colorMode === 'era'} onClick={() => setColorMode('era')}>
                    {isHebrew ? 'תקופה' : 'Era'}
                </ControlPill>
                <span className="w-px h-5 bg-border mx-1.5" aria-hidden />
                <ControlPill
                    active={influenceMode}
                    onClick={() => setInfluenceMode((v) => !v)}
                    title={isHebrew ? 'גודל צומת לפי מספר הקשרים' : 'Scale node size by number of connections'}
                >
                    {isHebrew ? 'הדגשת השפעה' : 'Highlight Influence'}
                </ControlPill>
                <ControlPill
                    active={groupBySchool}
                    onClick={() => setGroupBySchool((v) => !v)}
                    title={isHebrew ? 'קיבוץ פיזי של הוגים מאותה אסכולה' : 'Physically cluster same-school philosophers'}
                >
                    {isHebrew ? 'קיבוץ לפי אסכולה' : 'Group by School'}
                </ControlPill>
            </div>

            {/* Legend follows the active color mode */}
            <div dir={isHebrew ? 'rtl' : 'ltr'} className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4">
                {colorMode === 'era'
                    ? legendEras.map((era) => (
                        <span key={era} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: eraColor(era, isDark) }} />
                            {isHebrew ? ERA_LABELS[era].he : ERA_LABELS[era].en}
                        </span>
                    ))
                    : schoolIds.map((id) => (
                        <span key={id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: schoolColor(id) }} />
                            {(isHebrew ? schoolNames.get(id)?.he : schoolNames.get(id)?.en) || id.replace(/_/g, ' ')}
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
                        ref={fgRef}
                        graphData={graphData}
                        width={size.width}
                        height={size.height}
                        backgroundColor="rgba(0,0,0,0)"
                        nodeCanvasObject={drawNode}
                        nodePointerAreaPaint={(node, color, ctx) => {
                            ctx.beginPath();
                            ctx.arc(node.x, node.y, nodeRadius(node) + 2, 0, 2 * Math.PI);
                            ctx.fillStyle = color;
                            ctx.fill();
                        }}
                        linkColor={(l) => {
                            if (!activeNode) return tokens.link;
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
                        onNodeClick={(node, event) => {
                            // Double-click opens the profile; single click toggles
                            // the 1-hop focus spotlight (click again to clear).
                            if (event.detail === 2) {
                                navigate(`/${language}/philosophers/${node.id}`);
                                return;
                            }
                            setFocusNode((prev) => (prev && prev.id === node.id ? null : node));
                        }}
                        onBackgroundClick={() => setFocusNode(null)}
                        onNodeDrag={() => {
                            if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
                        }}
                        onNodeDragEnd={(node) => {
                            // Pin where dropped — the library releases fx/fy on
                            // drop by default, which made nodes snap back.
                            node.fx = node.x;
                            node.fy = node.y;
                            if (containerRef.current) containerRef.current.style.cursor = 'pointer';
                        }}
                        onNodeRightClick={(node, event) => {
                            event.preventDefault();
                            node.fx = undefined;
                            node.fy = undefined;
                            fgRef.current?.d3ReheatSimulation(); // let it drift back
                        }}
                        onEngineStop={() => {
                            // Frame the spread-out layout once per dataset; later
                            // engine stops (unpin reheats) must not yank the view.
                            if (!didAutoFit.current && fgRef.current) {
                                didAutoFit.current = true;
                                fgRef.current.zoomToFit(400, 48);
                            }
                        }}
                        cooldownTicks={200}
                    />
                )}
            </div>

            <p dir={isHebrew ? 'rtl' : 'ltr'} className="mt-3 text-xs text-muted-foreground">
                {isHebrew
                    ? 'ריחוף מציג את קשריו של הוגה; לחיצה ממקדת את הסביבה הקרובה שלו (לחיצה נוספת או לחיצה על הרקע מבטלת); לחיצה כפולה פותחת את הפרופיל. גרירת הוגה מקבעת אותו במקום (טבעת מקווקוות), ולחיצה ימנית משחררת אותו. כיוון החץ: מהמשפיע אל המושפע.'
                    : 'Hover to preview a thinker’s connections; click to focus their neighborhood (click again or click the background to clear); double-click to open the profile. Drag a node to pin it (dashed halo); right-click to release it. Arrows point from influencer to influenced.'}
            </p>
        </div>
    );
}
