import colors from "colors";
import { readFileSync } from "fs";
import { createRequire } from "module";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// Fail-loud guard: cross-references every philosopher id used in the seed data
// against data/philosophers.json. Runs as step 0 of masterSeed.js — a mismatch
// aborts the whole seed instead of being silently skipped with a console.warn.

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const apiRoot = join(__dirname, "..");

// Philosophers referenced in seed data but intentionally absent from
// philosophers.json. Their quote/library entries keep skipping (warn only)
// until they're either added to philosophers.json or their entries removed.
// Documented in CLAUDE.md → "Known Data Issue".
// (Emptied 2026-07: Aquinas, Husserl, Machiavelli, and Confucius were added to philosophers.json.)
const KNOWN_MISSING = new Set([]);

const philosophers = require(join(apiRoot, "data/philosophers.json"));
const validIds = new Set(philosophers.map((p) => p.id));

const problems = [];
const known = [];

const check = (source, ids) => {
    for (const id of new Set(ids)) {
        if (validIds.has(id)) continue;
        (KNOWN_MISSING.has(id) ? known : problems).push({ source, id });
    }
};

// data/quotes.js and data/beefs.js are pure data modules — import directly.
const { default: quotes } = await import(join(apiRoot, "data/quotes.js"));
check("data/quotes.js", quotes.map((q) => q.philosopherId));

const { default: beefs } = await import(join(apiRoot, "data/beefs.js"));
check("data/beefs.js", beefs.flatMap((b) => [b.philosopherA, b.philosopherB]));

// seed_library.js executes its seeding on import, so scrape its ids from source
// instead of importing it.
const librarySrc = readFileSync(join(apiRoot, "seeders/seed_library.js"), "utf8");
check(
    "seeders/seed_library.js",
    [...librarySrc.matchAll(/philosopherId:\s*["']([^"']+)["']/g)].map((m) => m[1])
);

for (const { source, id } of known) {
    console.warn(`⚠️  ${source}: '${id}' is a known-missing philosopher (skipped at seed time)`.yellow);
}

if (problems.length) {
    console.error("\n❌ SEED DATA VALIDATION FAILED — unknown philosopher ids:".red.bold);
    for (const { source, id } of problems) {
        console.error(`   ${source}: '${id}' does not exist in data/philosophers.json`.red);
    }
    console.error(
        "\nFix the id (see data/philosophers.json for canonical ids), or if the philosopher".red +
        "\nis intentionally absent, add the id to KNOWN_MISSING in scripts/validateSeedData.js.".red
    );
    process.exit(1);
}

console.log(`✅ Seed data validation passed (${validIds.size} canonical ids, ${known.length} known-missing refs)`.green);
