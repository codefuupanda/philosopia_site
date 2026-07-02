import { execSync } from 'child_process';
import colors from 'colors';

// List of scripts in the exact execution order
const scripts = [
    { name: '1. Basic Philosophers (Skeleton)', path: 'seeders/seeder.js' },
    { name: '2. Library (Works & Quotes)', path: 'seeders/seed_library.js' },
    { name: '3. Additional Quotes', path: 'seeders/quoteSeeder.js' },
    { name: '4. Artworks', path: 'seeders/artworkSeeder.js' },
    // Enrichment runs LAST: it reads each philosopher item and writes it back whole,
    // so all other philosopher mutations (quotes) must land first.
    { name: '5. Web Enrichment (Images & Bios)', path: 'seeders/enrichAllPhilosophers.js' } // Fetches from the internet (slow)
];

console.log('🏛️  STARTING PHILOSOPIA MASTER SEED 🏛️'.bgWhite.black.bold);

try {
    for (const script of scripts) {
        console.log(`\n▶️  Running: ${script.name}...`.yellow.bold);

        // Execute the script synchronously (the next one won't start until the current one finishes)
        // stdio: 'inherit' allows the logs from the internal scripts to appear on the main screen
        execSync(`node ${script.path}`, { stdio: 'inherit' });

        console.log(`✅ Finished: ${script.name}`.green);
    }

    console.log('\n🎉🎉🎉 MASTER SEED COMPLETE! THE DB IS READY. 🎉🎉🎉'.rainbow.bold);

} catch (error) {
    console.error('\n❌ CRITICAL ERROR IN MASTER SEED:'.red.bold);
    console.error('The process stopped because one of the scripts failed.');
    // We don't print the full error here because it was already printed by the child process
    process.exit(1);
}
