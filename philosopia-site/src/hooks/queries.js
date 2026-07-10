/**
 * React Query hooks — the single data-fetching layer for the app.
 *
 * Every server read goes through useQuery with a stable query key, so requests
 * are deduped, cached (staleTime set globally in src/index.jsx), and retried.
 * Admin mutations invalidate the keys they affect, replacing the old
 * "wait 5 minutes for the localStorage TTL" behavior.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

// ─── Philosophers ────────────────────────────────────────────────────────────

export const usePhilosophersList = (params = {}) =>
    useQuery({ queryKey: ['philosophers', params], queryFn: () => api.getPhilosophers(params) });

export const usePhilosopher = (id) =>
    useQuery({ queryKey: ['philosopher', id], queryFn: () => api.getPhilosopher(id), enabled: !!id });

// Whole-catalog nodes/links for the relation graph viz (66 nodes, ~200 links)
export const useGraphNetwork = () =>
    useQuery({ queryKey: ['graph-network'], queryFn: api.getGraphNetwork, staleTime: 10 * 60 * 1000 });

// ─── Periods ─────────────────────────────────────────────────────────────────

export const usePeriods = () =>
    useQuery({ queryKey: ['periods'], queryFn: api.getPeriods });

export const usePeriod = (id) =>
    useQuery({ queryKey: ['period', id], queryFn: () => api.getPeriod(id), enabled: !!id });

// ─── Schools ─────────────────────────────────────────────────────────────────

export const useSchools = () =>
    useQuery({ queryKey: ['schools'], queryFn: api.getSchools });

export const useSchool = (id) =>
    useQuery({ queryKey: ['school', id], queryFn: () => api.getSchool(id), enabled: !!id });

// ─── Concepts ────────────────────────────────────────────────────────────────

export const useConcepts = () =>
    useQuery({ queryKey: ['concepts'], queryFn: api.getConcepts });

export const useConcept = (id) =>
    useQuery({ queryKey: ['concept', id], queryFn: () => api.getConcept(id), enabled: !!id });

// ─── Beefs ───────────────────────────────────────────────────────────────────

export const useBeefs = () =>
    useQuery({ queryKey: ['beefs'], queryFn: api.getBeefs });

export const useBeef = (id) =>
    useQuery({ queryKey: ['beef', id], queryFn: () => api.getBeef(id), enabled: !!id });

// ─── Works / Quotes / Artworks ───────────────────────────────────────────────

export const useWorks = (lang) =>
    useQuery({ queryKey: ['works', lang], queryFn: () => api.getWorks(lang) });

export const useQuotes = (lang) =>
    useQuery({ queryKey: ['quotes', lang], queryFn: () => api.getQuotes(lang) });

// `enhance` lets the caller enrich the raw artworks (e.g. Wikimedia Commons
// image lookups) inside the cached queryFn, so the expensive external calls
// run once per staleTime window instead of on every mount.
export const useArtworks = (enhance) =>
    useQuery({
        queryKey: ['artworks', enhance ? 'enhanced' : 'raw'],
        queryFn: async () => {
            const data = await api.getArtworks();
            return enhance ? enhance(data) : data;
        },
        staleTime: 10 * 60 * 1000, // external image lookups are heavier — cache longer
    });

// ─── Global search index ─────────────────────────────────────────────────────

// Lightweight docs for the ⌘K palette, normalized to one shape across entity
// types. Fetched lazily (pass `enabled: open`) — the whole catalog is <100 KB,
// so client-side indexing beats a search backend at this size.
export const useSearchIndex = (enabled = true) =>
    useQuery({
        queryKey: ['search-index'],
        enabled,
        staleTime: 10 * 60 * 1000,
        queryFn: async () => {
            const [philosophers, schools, concepts, beefs] = await Promise.all([
                api.getPhilosophers({ page: 1, limit: 500 }),
                api.getSchools(),
                api.getConcepts(),
                api.getBeefs(),
            ]);
            const docs = [];
            for (const p of philosophers.philosophers || []) {
                docs.push({
                    type: 'philosopher', id: p.id,
                    nameEn: p.nameEn, nameHe: p.nameHe,
                    subEn: p.summaryEn, subHe: p.summaryHe,
                    metaEn: p.yearsEn, metaHe: p.yearsHe,
                    // enwiki title doubles as an alias ("Averroes" finds ibn_rushd, etc.)
                    alias: (p.wikiTitle || '').replace(/_/g, ' '),
                });
            }
            for (const s of schools.schools || []) {
                docs.push({
                    type: 'school', id: s.id,
                    nameEn: s.nameEn, nameHe: s.nameHe,
                    subEn: s.descriptionEn, subHe: s.descriptionHe,
                    alias: '',
                });
            }
            for (const c of concepts.concepts || []) {
                docs.push({
                    type: 'concept', id: c.id,
                    nameEn: c.nameEn, nameHe: c.nameHe,
                    subEn: c.summaryEn, subHe: c.summaryHe,
                    alias: '',
                });
            }
            for (const b of beefs.beefs || []) {
                docs.push({
                    type: 'beef', id: b.id,
                    nameEn: b.titleEn, nameHe: b.titleHe,
                    subEn: b.descriptionEn, subHe: b.descriptionHe,
                    alias: '',
                });
            }
            return docs;
        },
    });

// ─── Admin: dashboard stats ──────────────────────────────────────────────────

export const useAdminStats = (days) =>
    useQuery({
        queryKey: ['admin-stats', days],
        queryFn: async () => {
            const [philosophers, schools, concepts, beefs, analytics] = await Promise.all([
                api.getPhilosophers({ limit: 999 }),
                api.getSchools(),
                api.getConcepts(),
                api.getBeefs(),
                api.getAnalyticsStats(days).catch(() => null), // analytics is optional
            ]);
            return {
                contentStats: {
                    philosophers: philosophers.philosophers?.length || 0,
                    schools: schools.schools?.length || 0,
                    concepts: concepts.concepts?.length || 0,
                    beefs: beefs.beefs?.length || 0,
                },
                analytics,
            };
        },
    });

// ─── Admin: beef mutations (JWT + cache invalidation) ────────────────────────

export const useCreateBeef = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    return useMutation({
        mutationFn: (payload) => api.createBeef(payload, user?.token),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['beefs'] }),
    });
};

export const useDeleteBeef = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    return useMutation({
        mutationFn: (id) => api.deleteBeef(id, user?.token),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['beefs'] }),
    });
};
