# Database Schema Documentation

This document outlines the MongoDB schema design for the Philosopia API. The schema is designed to support a bilingual (English/Hebrew) application with rich relational data and integration with external sources like Wikidata.

## Core Design Principles

1.  **Multilingual Support**: Core text fields use a nested structure (`{ en: String, he: String }`) to support English and Hebrew. Deprecated flat fields (`nameEn`, `nameHe`) are retained for backward compatibility in some models but the nested structure is preferred.
2.  **Relational Data**: Models are linked using Mongoose `ObjectId` references (e.g., `school: ObjectId(School)`), but stable string IDs (e.g., `schoolId: "stoicism"`) are also stored for easier data seeding, matching, and URL routing.
3.  **Enrichment**: The schema distinguishes between manually curated content and data enriched from external sources (Wikidata/Wikipedia).

## Models

### 1. Philosopher

Represents a philosopher. This is the central entity of the application.

**Key Fields:**
-   `id` (String, Unique): Stable identifier (e.g., `"plato"`).
-   `name` (Object): `{ en: String, he: String }`.
-   `school` (ObjectId -> School): Reference to the philosopher's school.
-   `period` (ObjectId -> Period): Reference to the historical period.
-   `summary`, `description`, `keyIdeas` (Object): Multilingual content fields (`keyIdeas` is `{ en: [String], he: [String] }`).
-   `quotes` (Object): `{ en: [String], he: [String] }` - Manual quotes stored directly on the philosopher.
-   `wikiQid` (String): Wikidata Item ID (e.g., `"Q859"`).
-   `wikiTitle` (String): Title for Wikipedia lookups.
-   `wikiData` (Object): Stores enriched data from Wikipedia:
    -   `bioEn`, `bioHe`: Fetched biographies.
    -   `imageUrl`: Wiki image.
    -   `extendedEn/He`: Full intros and infobox data.
-   `imageUrl` (String): Main image URL (Legacy/Fallback).
-   `enrichedImageUrl` (String): Image URL fetched from external sources.
-   `manualImageUrl` (String): Manually overridden image URL.

**Relations (Enriched from Wikidata):**
-   `influencedBy`, `students`, `countryOfCitizenship`, `foundationalTexts`, `religion`: Arrays of objects containing `qid`, `labelEn`, `labelHe`.

### 2. School

Represents a philosophical school or movement (e.g., Stoicism, Existentialism).

**Key Fields:**
-   `id` (String, Unique): Stable identifier (e.g., `"stoicism"`).
-   `name`, `description` (Object): Multilingual content.
-   `period` (ObjectId -> Period): The period this school belongs to.
-   `wikidataId` (String): Wikidata ID.
-   `locationEn`, `locationHe`: Geographic origin (Legacy flat fields).
-   `famousQuoteEn`, `famousQuoteHe`: Representative quote (Legacy flat fields).

### 3. Period

Represents a historical era (e.g., Ancient, Medieval, Modern).

**Key Fields:**
-   `id` (String, Unique): Stable identifier (e.g., `"ancient_greece"`).
-   `name`, `description` (Object): Multilingual content.
-   `startYear`, `endYear` (Number): Date range for timeline visualization.
-   `wikidataId` (String): Wikidata ID.

### 4. Concept

Represents a key philosophical concept (e.g., "Categorical Imperative", "Cogito Ergo Sum").

**Key Fields:**
-   `id` (String, Unique): Stable identifier.
-   `name`, `summary`, `description` (Object): Multilingual content.
-   `relatedPhilosopherIds` (Array of Strings): Stable IDs of associated philosophers.
-   `relatedPhilosophers` (Array of ObjectId -> Philosopher): Mongoose references.
-   `domainEn`, `domainHe`: Field of philosophy (e.g., Ethics, Metaphysics).

### 5. Beef

Represents a philosophical dispute or debate between two thinkers.

**Key Fields:**
-   `id` (String, Unique): Stable identifier (e.g., `"plato_vs_aristotle"`).
-   `title`, `description` (Object): Multilingual content.
-   `philosopherAId`, `philosopherBId` (String): Stable IDs.
-   `philosopherA` (ObjectId -> Philosopher): The first party.
-   `philosopherB` (ObjectId -> Philosopher): The second party.

### 6. Work

Represents a specific philosophical book or text.

**Key Fields:**
-   `id` (String, Unique): Slug/Identifier.
-   `title` (Object): `{ en: String, he: String }`.
-   `philosopherId` (String): Stable ID of the author.
-   `philosopher` (ObjectId -> Philosopher): Reference to the author.
-   `publicationYear` (String): Year of publication.
-   `wikiLink` (String): Link to Wikipedia/Source.

### 7. Quote

Represents a specific quote entity, separate from the `quotes` array on the Philosopher model (allows for tagging and source linking).

**Key Fields:**
-   `content` (Object): `{ en: String, he: String }`.
-   `philosopherId` (String): Stable ID of the author.
-   `philosopher` (ObjectId -> Philosopher): Reference.
-   `workId` (String): Stable ID of the source work (Optional).
-   `work` (ObjectId -> Work): Reference (Optional).
-   `tags` (Array of Strings): Key themes or tags.

### 8. Artwork

Represents an art piece related to a philosopher or period.

**Key Fields:**
-   `id` (String, Unique): Optional sparse ID.
-   `title`, `artist`, `year`, `location`, `description` (String): Metadata.
-   `filename` (String): Wikimedia Commons filename.
-   `relatedPhilosopherIds` (Array of Strings): IDs of related philosophers.
-   `relatedPhilosophers` (Array of ObjectId -> Philosopher): References.
-   `status` (Enum): `'pd'`, `'pd-us-only'`, `'copyrighted'`.

### 9. User

Represents an administrative user for the CMS/Backend.

**Key Fields:**
-   `username` (String, Unique).
-   `password` (String): Bcrypt hashed.
-   `role` (Enum): `'admin'`, `'editor'`, `'viewer'` (Default: `admin`).

## Data Seeding & Enrichment

-   **Seeders**: Located in `seeders/` folder.
    -   `seeder.js`: Main entry point. Seeds Periods, Schools, Philosophers, Beefs, and Concepts.
    -   `quoteSeeder.js`: Seeds Works and Quotes (Library).
    -   `artworkSeeder.js`: Seeds Artworks.
-   **Enrichment**:
    -   `enrichAllPhilosophers.js`: Fetches additional data (images, bios, relations) from Wikidata using `wikijs`.
    -   `universalEnricher.js`: General purpose enrichment script.
