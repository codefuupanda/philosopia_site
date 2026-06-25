import mongoose from "mongoose";
import dotenv from "dotenv";
import colors from "colors";
import Philosopher from "../models/Philosopher.js";
import Work from "../models/Work.js";
import Quote from "../models/Quote.js";

dotenv.config();

const libraryData = [
    {
        philosopherId: "plato",
        work: {
            id: "republic",
            title: { en: "The Republic", he: "הפוליטיאה (המדינה)" },
            publicationYear: "c. 375 BC",
            wikiLink: "https://en.wikipedia.org/wiki/Republic_(Plato)"
        },
        quote: {
            content: {
                en: "Wise men speak because they have something to say; fools because they have to say something.",
                he: "החכמים מדברים כי יש להם משהו לומר; הטיפשים, כי הם חייבים לומר משהו."
            },
            tags: ["Wisdom", "Speech"]
        }
    },
    {
        philosopherId: "aristotle",
        work: {
            id: "nicomachean_ethics",
            title: { en: "Nicomachean Ethics", he: "האתיקה הניקומכית" },
            publicationYear: "c. 340 BC",
            wikiLink: "https://en.wikipedia.org/wiki/Nicomachean_Ethics"
        },
        quote: {
            content: {
                en: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
                he: "אנו מה שאנו עושים שוב ושוב. מצוינות, איפוא, אינה פעולה, אלא הרגל."
            },
            tags: ["Excellence", "Habits"]
        }
    },
    {
        philosopherId: "descartes",
        work: {
            id: "meditations",
            title: { en: "Meditations on First Philosophy", he: "הגיונות על הפילוסופיה הראשונית" },
            publicationYear: "1641",
            wikiLink: "https://en.wikipedia.org/wiki/Meditations_on_First_Philosophy"
        },
        quote: {
            content: { en: "I think, therefore I am.", he: "אני חושב, משמע אני קיים." },
            tags: ["Existence", "Knowledge"]
        }
    },
    // Nietzsche
    {
        philosopherId: "nietzsche",
        work: {
            id: "thus_spoke_zarathustra",
            title: { en: "Thus Spoke Zarathustra", he: "כה אמר זרתוסטרא" },
            publicationYear: "1883",
            wikiLink: "https://en.wikipedia.org/wiki/Thus_Spoke_Zarathustra"
        },
        quote: {
            content: { en: "God is dead. God remains dead. And we have killed him.", he: "אלוהים מת. אלוהים נשאר מת. ואנחנו הרגנו אותו." },
            tags: ["Existentialism", "Religion"]
        }
    },
    {
        philosopherId: "nietzsche",
        work: {
            id: "beyond_good_and_evil",
            title: { en: "Beyond Good and Evil", he: "מעבר לטוב ולרוע" },
            publicationYear: "1886",
            wikiLink: "https://en.wikipedia.org/wiki/Beyond_Good_and_Evil"
        },
        quote: {
            content: { en: "He who fights with monsters should look to it that he himself does not become a monster.", he: "מי שנלחם במפלצות צריך להיזהר שבעצמו לא יהפוך למפלצת." },
            tags: ["Morality", "Psychology"]
        }
    },
    // Kant
    {
        philosopherId: "kant",
        work: {
            id: "critique_pure_reason",
            title: { en: "Critique of Pure Reason", he: "ביקורת התבונה הטהורה" },
            publicationYear: "1781",
            wikiLink: "https://en.wikipedia.org/wiki/Critique_of_Pure_Reason"
        },
        quote: {
            content: { en: "Two things fill the mind with ever new and increasing admiration and awe... the starry heavens above me and the moral law within me.", he: "שני דברים ממלאים את הלב בהערצה ויראת כבוד... השמיים המכוכבים מעלי והחוק המוסרי שבתוכי." },
            tags: ["Awe", "Morality"]
        }
    },
    {
        philosopherId: "kant",
        work: {
            id: "groundwork_metaphysics",
            title: { en: "Groundwork of the Metaphysic of Morals", he: "הנחת יסוד למטפיזיקה של המידות" },
            publicationYear: "1785",
            wikiLink: "https://en.wikipedia.org/wiki/Groundwork_of_the_Metaphysic_of_Morals"
        },
        quote: {
            content: { en: "Act only according to that maxim whereby you can at the same time will that it should become a universal law.", he: "פעל רק לפי אותו הכלל המעשי שתוכל לרצות, באותה עת, שיהיה לחוק כללי." },
            tags: ["Ethics", "Duty"]
        }
    },
    // Confucius
    {
        philosopherId: "confucius",
        work: {
            id: "analects",
            title: { en: "The Analects", he: "המאמרות" },
            publicationYear: "475 BCE",
            wikiLink: "https://en.wikipedia.org/wiki/Analects"
        },
        quote: {
            content: { en: "It does not matter how slowly you go as long as you do not stop.", he: "לא משנה כמה לאט אתה הולך, כל עוד אינך עוצר." },
            tags: ["Perseverance", "Growth"]
        }
    },
    {
        philosopherId: "confucius",
        work: {
            id: "analects", // Same work
            title: { en: "The Analects", he: "המאמרות" },
            publicationYear: "475 BCE",
            wikiLink: "https://en.wikipedia.org/wiki/Analects"
        },
        quote: {
            content: { en: "Real knowledge is to know the extent of one's ignorance.", he: "ידע אמיתי הוא לדעת את היקף בורותך." },
            tags: ["Wisdom", "Knowledge"]
        }
    },
    // Spinoza
    {
        philosopherId: "spinoza",
        work: {
            id: "ethics_spinoza",
            title: { en: "Ethics", he: "אתיקה" },
            publicationYear: "1677",
            wikiLink: "https://en.wikipedia.org/wiki/Ethics_(Spinoza_book)"
        },
        quote: {
            content: { en: "I have striven not to laugh at human actions, not to weep at them, nor to hate them, but to understand them.", he: "השתדלתי לא לצחוק על מעשי בני האדם, לא לבכות עליהם, ולא לשנוא אותם, אלא להבינם." },
            tags: ["Understanding", "Humanity"]
        }
    },
    {
        philosopherId: "spinoza",
        work: {
            id: "theologico_political",
            title: { en: "Theologico-Political Treatise", he: "מאמר תיאולוגי-מדיני" },
            publicationYear: "1670",
            wikiLink: "https://en.wikipedia.org/wiki/Theologico-Political_Treatise"
        },
        quote: {
            content: { en: "Fear cannot be without hope nor hope without fear.", he: "פחד אינו יכול להיות ללא תקווה, ותקווה ללא פחד." },
            tags: ["Emotion", "Psychology"]
        }
    },
    // Simone de Beauvoir
    {
        philosopherId: "de_beauvoir",
        work: {
            id: "second_sex",
            title: { en: "The Second Sex", he: "המין השני" },
            publicationYear: "1949",
            wikiLink: "https://en.wikipedia.org/wiki/The_Second_Sex"
        },
        quote: {
            content: { en: "One is not born, but rather becomes, a woman.", he: "אישה אינה נולדת אישה, אלא נעשית אישה." },
            tags: ["Feminism", "Society"]
        }
    },
    {
        philosopherId: "de_beauvoir",
        work: {
            id: "ethics_of_ambiguity",
            title: { en: "The Ethics of Ambiguity", he: "האתיקה של העמימות" },
            publicationYear: "1947",
            wikiLink: "https://en.wikipedia.org/wiki/The_Ethics_of_Ambiguity"
        },
        quote: {
            content: { en: "To will oneself moral and to will oneself free is one and the same decision.", he: "לרצות להיות מוסרי ולרצות להיות חופשי זו אותה החלטה עצמה." },
            tags: ["Freedom", "Ethics"]
        }
    }
];

const seedLibrary = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("🔌 Connected to MongoDB".cyan.bold);

        // Clear existing
        console.log("🧹 Clearing Works and Quotes...".yellow);
        await Work.deleteMany({});
        await Quote.deleteMany({});

        // Fetch all philosophers for mapping
        const allPhilosophers = await Philosopher.find();

        for (const item of libraryData) {
            const philosopher = allPhilosophers.find(p => p.id === item.philosopherId);

            if (!philosopher) {
                console.warn(`WARNING: Philosopher '${item.philosopherId}' not found. Skipping.`.red);
                continue;
            }

            // Create Work
            console.log(`Creating Work: ${item.work.title.en}...`);
            const work = await Work.create({
                id: item.work.id,
                title: item.work.title,
                philosopherId: item.philosopherId,
                philosopher: philosopher._id,
                publicationYear: item.work.publicationYear,
                wikiLink: item.work.wikiLink,

                // Deprecated fields support
                titleEn: item.work.title.en,
                titleHe: item.work.title.he
            });

            // Create Quote
            console.log(`Creating Quote by ${item.philosopherId}...`);
            await Quote.create({
                content: item.quote.content,
                philosopherId: item.philosopherId,
                philosopher: philosopher._id,
                workId: work.id,
                work: work._id,
                tags: item.quote.tags,

                // Deprecated fields support
                contentEn: item.quote.content.en,
                contentHe: item.quote.content.he
            });
        }

        console.log("✅ Library Seeded".green.bold);
        process.exit(0);
    } catch (err) {
        console.error("❌ Error seeding library:".red, err);
        process.exit(1);
    }
};

seedLibrary();
