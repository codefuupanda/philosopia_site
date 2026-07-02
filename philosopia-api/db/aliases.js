/**
 * Flat bilingual aliases — the DynamoDB port of the old Mongoose virtuals
 * (models/_shared.js → addBilingualVirtuals).
 *
 * Canonical stored shape is nested { en, he }. The frontend still reads the
 * legacy flat keys (nameEn, nameHe, summaryEn, ...), so every item leaving the
 * API gets decorated with derived flat aliases. Never store the flat keys.
 */

const BILINGUAL_FIELDS = {
  philosopher: ['name', 'years', 'summary', 'manualSummary', 'keyIdeas', 'quotes'],
  school: ['name', 'description', 'years', 'location', 'famousQuote'],
  period: ['name', 'description'],
  concept: ['name', 'summary', 'description', 'originDate', 'domain'],
  beef: ['title', 'description'],
  work: ['title'],
  quote: ['content'],
  artwork: [], // monolingual (English-only data for now)
};

export function withFlatAliases(entityType, item) {
  if (!item) return item;
  const out = { ...item };
  for (const f of BILINGUAL_FIELDS[entityType] || []) {
    if (out[f] && typeof out[f] === 'object') {
      if (out[f].en !== undefined) out[`${f}En`] = out[f].en;
      if (out[f].he !== undefined) out[`${f}He`] = out[f].he;
    }
  }
  return out;
}

export function withFlatAliasesList(entityType, items) {
  return (items || []).map((i) => withFlatAliases(entityType, i));
}
