import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const inputHtmlPath = path.join(projectRoot, "index.html");

const LIMITS = {
  headline: 220,
  about: 2600,
  experienceTitle: 100,
  experienceDescription: 2000
};

function bar(char = "─", width = 66) {
  return char.repeat(width);
}

function section(title) {
  console.log(`\n${bar()}`);
  console.log(`  ${title}`);
  console.log(bar());
}

function charCount(text, limit) {
  const len = text.length;
  const over = len > limit;
  return `${len}/${limit} chars${over ? "  ⚠  OVER LIMIT" : ""}`;
}

async function extractData() {
  const browser = await chromium.launch();

  try {
    const page = await browser.newPage({
      viewport: { width: 1600, height: 2200 }
    });

    await page.addInitScript(() => {
      localStorage.setItem("theme", "light");
    });

    await page.goto(pathToFileURL(inputHtmlPath).toString(), {
      waitUntil: "domcontentloaded"
    });

    await page.waitForSelector(".hero-name");

    return await page.evaluate(() => {
      const pickText = (selector) => {
        const node = document.querySelector(selector);
        return node ? node.textContent.trim() : "";
      };

      const experiences = Array.from(document.querySelectorAll(".experience-card")).map((card) => {
        const title =
          card.querySelector(".experience-title")?.textContent.trim() ||
          card.querySelector(".experience-toggle-title")?.textContent.trim() ||
          "";
        const companyRaw = card.querySelector(".experience-company")?.textContent.trim() || "";
        const dates =
          card.querySelector(".experience-dates")?.textContent.trim() ||
          card.querySelector(".experience-toggle-dates")?.textContent.trim() ||
          "";
        const bullets = Array.from(card.querySelectorAll(".experience-bullets li"))
          .map((li) => li.textContent.trim())
          .filter(Boolean);

        // Split "Company | Location" into parts
        const [company, location] = companyRaw.split("|").map((s) => s.trim());

        return { title, company: company || "", location: location || "", dates, bullets };
      });

      const technical = Array.from(document.querySelectorAll(".technical-category")).map((row) => ({
        label: row.querySelector(".technical-label")?.textContent.trim() || "",
        values: row.querySelector(".technical-values")?.textContent.trim() || ""
      }));

      const taglineEl = document.querySelector(".hero-tagline");
      let tagline = "";
      if (taglineEl) {
        const clone = taglineEl.cloneNode(true);
        clone.querySelectorAll("br").forEach((br) => br.replaceWith(" | "));
        tagline = clone.textContent.trim().replace(/\s*\|\s*/g, " | ");
      }

      return {
        tagline,
        summary: pickText(".summary-text"),
        experiences,
        technical
      };
    });
  } finally {
    await browser.close();
  }
}

function formatDescription(bullets) {
  return bullets.map((b) => `• ${b}`).join("\n");
}

function getSkills() {
  // Curated for LinkedIn recruiter searches targeting senior engineering manager,
  // director, and lead engineer roles. Max 5 on LinkedIn free tier.
  return [
    "Engineering Management",
    "Software Architecture",
    "React.js",
    "Agile Methodologies",
    "Artificial Intelligence"
  ];
}

// 5 skills per experience entry, matched by partial title/company string.
// Optimized for LinkedIn recruiter searches for each role type.
const EXPERIENCE_SKILLS = [
  {
    match: "Riskonnect",
    skills: [
      "Engineering Management",
      "Agile Methodologies",
      "Software Architecture",
      "Artificial Intelligence",
      "Team Leadership"
    ]
  },
  {
    match: "TEKsystems",
    skills: [
      "React.js",
      "JavaScript",
      "AngularJS",
      "Software Architecture",
      "Agile Methodologies"
    ]
  },
  {
    match: "5 Foot Gorilla",
    skills: [
      "Software Architecture",
      "Engineering Management",
      "Full-Stack Development",
      "Agile Methodologies",
      "Node.js"
    ]
  },
  {
    match: "FIS Global",
    skills: [
      "React.js",
      "AngularJS",
      "Software Architecture",
      "Engineering Management",
      "Agile Methodologies"
    ]
  },
  {
    match: "Cnverg",
    skills: [
      "Product Management",
      "Engineering Management",
      "Agile Methodologies",
      "Software Architecture",
      "Team Leadership"
    ]
  },
  {
    match: "EY Design Studio",
    skills: [
      "Software Architecture",
      "AngularJS",
      "JavaScript",
      "Front-End Development",
      "Agile Methodologies"
    ]
  },
  {
    match: "Earlier Career",
    skills: [
      "JavaScript",
      "Front-End Development",
      "HTML",
      "CSS",
      "Web Development"
    ]
  }
];

function getExperienceSkills(exp) {
  const haystack = `${exp.title} ${exp.company}`;
  const entry = EXPERIENCE_SKILLS.find((e) => haystack.includes(e.match));
  return entry ? entry.skills : [];
}

async function main() {
  const data = await extractData();

  console.log(`\n${bar("═")}`);
  console.log("  LINKEDIN PROFILE CONTENT — READY TO COPY");
  console.log(`${bar("═")}`);
  console.log("  Copy each field below into the corresponding LinkedIn section.");

  // ── Headline ──────────────────────────────────────────────────────────────
  section("HEADLINE");
  console.log(`\n[ ${charCount(data.tagline, LIMITS.headline)} ]\n`);
  console.log(data.tagline);

  // ── About ─────────────────────────────────────────────────────────────────
  section("ABOUT");
  console.log(`\n[ ${charCount(data.summary, LIMITS.about)} ]\n`);
  console.log(data.summary);

  // ── Experience ────────────────────────────────────────────────────────────
  section("EXPERIENCE");

  for (const exp of data.experiences) {
    const description = formatDescription(exp.bullets);
    const titleLen = exp.title.length;
    const titleOver = titleLen > LIMITS.experienceTitle;
    const descLen = description.length;
    const descOver = descLen > LIMITS.experienceDescription;

    console.log(`\n  Title     ${exp.title}`);
    console.log(`            [ ${titleLen}/${LIMITS.experienceTitle} chars${titleOver ? "  ⚠  OVER LIMIT" : ""} ]`);
    if (exp.company) console.log(`  Company   ${exp.company}`);
    if (exp.location) console.log(`  Location  ${exp.location}`);
    if (exp.dates) console.log(`  Dates     ${exp.dates}`);
    console.log(`\n  Description [ ${descLen}/${LIMITS.experienceDescription} chars${descOver ? "  ⚠  OVER LIMIT" : ""} ]`);
    console.log(`${bar("·")}`);
    console.log(description);
    console.log(bar("·"));

    const expSkills = getExperienceSkills(exp);
    if (expSkills.length > 0) {
      console.log(`\n  Skills (max 5)`);
      expSkills.forEach((skill, i) => console.log(`    ${i + 1}. ${skill}`));
    }
  }

  // ── Skills ────────────────────────────────────────────────────────────────
  section("SKILLS  (LinkedIn free tier — max 5)");

  const skills = getSkills();
  console.log();
  skills.forEach((skill, i) => console.log(`  ${i + 1}. ${skill}`));

  console.log(`\n${bar("═")}\n`);
}

main().catch((error) => {
  console.error("Failed:", error.message);
  process.exit(1);
});
