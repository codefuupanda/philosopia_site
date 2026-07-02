import axios from 'axios';

const WIKIDATA_ENDPOINT = 'https://query.wikidata.org/sparql';

/**
 * Helper to get Text & Image from Wikipedia API (Better than Wikidata for visuals/bio)
 */
async function getWikipediaData(title) {
    if (!title) return { description: null, imageUrl: null };

    try {
        // We fetch from English Wikipedia for consistency, or you could make this dynamic
        const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
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
        console.error(`Wikipedia API Error for ${title}:`, error.message);
        return { bioHtml: null, imageUrl: null };
    }
}

/**
 * Main Enricher Function
 */
async function getWikidataRelationships(qid, wikiTitle) {
    if (!qid) return {};

    // 1. Fetch Visuals & Text from Wikipedia API
    const wikiData = await getWikipediaData(wikiTitle);

    // 2. Fetch Relations from Wikidata SPARQL
    const sparqlQuery = `
        SELECT ?prop ?item ?itemLabel ?itemLabelHe WHERE {
            VALUES ?prop { wdt:P737 wdt:P802 wdt:P27 wdt:P1343 wdt:P140 }
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
            'http://www.wikidata.org/prop/direct/P1343': 'foundationalTexts',
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
        imageUrl: wikiData.imageUrl, // Wikipedia image is usually better
        bioHtml: wikiData.bioHtml    // Wikipedia intro text
    };
}

export { getWikidataRelationships };
