import axios from 'axios';

const WIKIDATA_ENDPOINT = 'https://query.wikidata.org/sparql';

/**
 * Helper to get Text & Image from Wikipedia API (Better than Wikidata for visuals/bio)
 */
async function getWikipediaData(title, lang = 'en', attempt = 1) {
    if (!title) return { bioHtml: null, imageUrl: null };

    try {
        const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'PhilosopiaProject/1.0 (learning_project)' }
        });

        const data = response.data;

        return {
            // The full intro paragraph
            bioHtml: data.extract_html || data.extract,
            // The main page image
            imageUrl: data.thumbnail ? data.thumbnail.source : (data.originalimage ? data.originalimage.source : null)
        };
    } catch (error) {
        // 404 = no such article; anything else (429 throttling, network) is worth retrying
        if (error.response?.status !== 404 && attempt < 4) {
            await new Promise(resolve => setTimeout(resolve, 5000 * attempt));
            return getWikipediaData(title, lang, attempt + 1);
        }
        console.error(`Wikipedia API Error (${lang}) for ${title}:`, error.message);
        return { bioHtml: null, imageUrl: null };
    }
}

/**
 * Resolve the Hebrew Wikipedia article title for a Wikidata item (hewiki sitelink).
 * Returns null when the item has no Hebrew Wikipedia article.
 * The api.php endpoints rate-limit aggressively, so throttled (non-JSON) responses
 * are retried with backoff instead of being silently treated as "no article".
 */
async function getHebrewWikiTitle(qid, attempt = 1) {
    if (!qid) return null;

    try {
        const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qid}&props=sitelinks&sitefilter=hewiki&format=json`;
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'PhilosopiaProject/1.0 (learning_project)' }
        });

        const entities = response.data?.entities;
        if (!entities) throw new Error('unexpected response body (throttled?)');
        // Look up by value, not key: a merged/redirected QID comes back under its target id
        const entity = Object.values(entities)[0];
        return entity?.sitelinks?.hewiki?.title || null;
    } catch (error) {
        if (attempt < 4) {
            await new Promise(resolve => setTimeout(resolve, 5000 * attempt));
            return getHebrewWikiTitle(qid, attempt + 1);
        }
        console.error(`Wikidata sitelinks Error for ${qid}:`, error.message);
        return null;
    }
}

/**
 * Main Enricher Function
 */
async function getWikidataRelationships(qid, wikiTitle) {
    if (!qid) return {};

    // 1. Fetch Visuals & Text from Wikipedia API
    const wikiData = await getWikipediaData(wikiTitle);

    // 1b. Hebrew bio: resolve the hewiki article via Wikidata sitelinks, then fetch its summary
    const heTitle = await getHebrewWikiTitle(qid);
    const heWikiData = heTitle ? await getWikipediaData(heTitle, 'he') : { bioHtml: null };

    // 2. Fetch Relations from Wikidata SPARQL
    const sparqlQuery = `
        SELECT ?prop ?item ?itemLabel ?itemLabelHe WHERE {
            VALUES ?prop { wdt:P737 wdt:P802 wdt:P27 wdt:P800 wdt:P140 }
            wd:${qid} ?prop ?item .
            SERVICE wikibase:label { bd:serviceParam wikibase:language "en". ?item rdfs:label ?itemLabel. }
            OPTIONAL { ?item rdfs:label ?itemLabelHe . FILTER(LANG(?itemLabelHe) = "he") }
        }
    `;

    const headers = {
        'Accept': 'application/json',
        'User-Agent': 'PhilosopiaProject/1.0 (learning_project)'
    };

    let structuredRelations = {
        influencedBy: [],
        students: [],
        countryOfCitizenship: [],
        foundationalTexts: [],
        religion: []
    };

    try {
        const response = await axios.get(WIKIDATA_ENDPOINT, {
            params: { query: sparqlQuery },
            headers: headers
        });

        const results = response.data.results.bindings;

        const propertyMap = {
            'http://www.wikidata.org/prop/direct/P737': 'influencedBy',
            'http://www.wikidata.org/prop/direct/P802': 'students',
            'http://www.wikidata.org/prop/direct/P27': 'countryOfCitizenship',
            'http://www.wikidata.org/prop/direct/P800': 'foundationalTexts', // notable work (P1343 "described by source" was wrong — it listed encyclopedias describing the person)
            'http://www.wikidata.org/prop/direct/P140': 'religion',
        };

        results.forEach(binding => {
            if (binding.prop) {
                const propUri = binding.prop.value;
                const fieldName = propertyMap[propUri];

                if (fieldName && binding.item) {
                    const itemQid = binding.item.value.split('/').pop();
                    const itemData = {
                        qid: itemQid,
                        labelEn: binding.itemLabel?.value,
                        labelHe: binding.itemLabelHe?.value || binding.itemLabel?.value,
                    };

                    const exists = structuredRelations[fieldName].some(i => i.qid === itemQid);
                    if (!exists) {
                        structuredRelations[fieldName].push(itemData);
                    }
                }
            }
        });

    } catch (error) {
        console.error(`Wikidata SPARQL Error for ${qid}:`, error.message);
    }

    // Merge both sources
    return {
        ...structuredRelations,
        imageUrl: wikiData.imageUrl,     // Wikipedia image is usually better
        bioHtml: wikiData.bioHtml,       // Wikipedia intro text (EN)
        bioHtmlHe: heWikiData.bioHtml    // Hebrew Wikipedia intro text (null if no hewiki article)
    };
}

export { getWikidataRelationships };
