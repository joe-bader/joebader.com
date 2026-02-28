import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import fs from "node:fs/promises";
import { chromium } from "playwright";
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  LevelFormat,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TabStopType,
  TextRun,
  WidthType
} from "docx";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const inputHtmlPath = path.join(projectRoot, "index.html");
const distOutputDir = path.join(projectRoot, "dist", "resume");
const webOutputDir = path.join(projectRoot, "resume");

function sanitizeFileSegment(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderResumeHtml(data) {
  const focusItems = data.focusItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("");

  const experiences = data.experiences
    .map((exp) => {
      const bullets = exp.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
      const company = exp.company ? `<p class="company">${escapeHtml(exp.company)}</p>` : "";
      const dates = exp.dates ? `<span class="dates">${escapeHtml(exp.dates)}</span>` : "";

      return `
        <article class="experience-item">
          <header class="experience-header">
            <h3 class="role">${escapeHtml(exp.title)}</h3>
            ${dates}
          </header>
          ${company}
          <ul class="bullet-list">${bullets}</ul>
        </article>
      `;
    })
    .join("");

  const technical = data.technical
    .map(
      (row) => `
      <p class="technical-row"><strong>${escapeHtml(row.label)}:</strong> ${escapeHtml(row.values)}</p>
    `
    )
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>${escapeHtml(data.name)} - Resume</title>
    <style>
      :root {
        --text: #121820;
        --muted: #4b5a6a;
        --accent: #12456e;
        --line: #d7dee6;
      }

      @page {
        size: Letter;
        margin: 0.75in;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        color: var(--text);
        font-family: "Calibri", "Segoe UI", Arial, sans-serif;
        font-size: 11pt;
        line-height: 1.15;
      }

      h1, h2, h3, p, ul {
        margin: 0;
      }

      .resume {
        width: 100%;
      }

      .name {
        font-size: 22pt;
        line-height: 1.05;
        margin-bottom: 0.05in;
      }

      .tagline {
        margin-bottom: 0.04in;
      }

      .links {
        color: var(--accent);
        padding-bottom: 0.06in;
        margin-bottom: 0.12in;
        border-bottom: 2px solid var(--line);
      }

      .section {
        margin-bottom: 0.12in;
      }

      .section-title {
        font-size: 10.5pt;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--accent);
        margin-bottom: 0.06in;
      }

      .summary {
        margin-bottom: 0.1in;
      }

      .bullet-list {
        margin-top: 0.02in;
        padding-left: 0.25in;
      }

      .bullet-list li {
        margin: 0.02in 0;
      }

      .focus-columns {
        columns: 2;
        column-gap: 0.45in;
      }

      .experience-item {
        margin-bottom: 0.09in;
        break-inside: avoid;
      }

      .experience-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 0.2in;
      }

      .role {
        font-size: 11pt;
        font-weight: 700;
      }

      .company {
        margin-top: 0.01in;
        margin-bottom: 0.01in;
        color: var(--muted);
      }

      .dates {
        color: var(--muted);
        font-style: italic;
        white-space: nowrap;
      }

      .technical-row {
        margin-bottom: 0.02in;
      }
    </style>
  </head>
  <body>
    <main class="resume">
      <header>
        <h1 class="name">${escapeHtml(data.name)}</h1>
        <p class="tagline">${escapeHtml(data.tagline)}</p>
        <p class="links">${escapeHtml(data.website)} | ${escapeHtml(data.linkedin)}</p>
      </header>

      <section class="section">
        <h2 class="section-title">Summary</h2>
        <p class="summary">${escapeHtml(data.summary)}</p>
      </section>

      <section class="section">
        <h2 class="section-title">Focus Areas</h2>
        <ul class="bullet-list focus-columns">${focusItems}</ul>
      </section>

      <section class="section">
        <h2 class="section-title">Experience</h2>
        ${experiences}
      </section>

      <section class="section">
        <h2 class="section-title">Technical</h2>
        ${technical}
      </section>
    </main>
  </body>
</html>`;
}

async function extractDataFromSite() {
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

    const data = await page.evaluate(() => {
      const pickText = (selector) => {
        const node = document.querySelector(selector);
        return node ? node.textContent.trim() : "";
      };

      const pickList = (selector) =>
        Array.from(document.querySelectorAll(selector))
          .map((el) => el.textContent.trim())
          .filter(Boolean);

      const experiences = Array.from(document.querySelectorAll(".experience-card")).map((card) => {
        const title =
          card.querySelector(".experience-title")?.textContent.trim() ||
          card.querySelector(".experience-toggle-title")?.textContent.trim() ||
          "Experience";
        const company = card.querySelector(".experience-company")?.textContent.trim() || "";
        const dates =
          card.querySelector(".experience-dates")?.textContent.trim() ||
          card.querySelector(".experience-toggle-dates")?.textContent.trim() ||
          "";
        const bullets = Array.from(card.querySelectorAll(".experience-bullets li"))
          .map((li) => li.textContent.trim())
          .filter(Boolean);

        return { title, company, dates, bullets };
      });

      const technical = Array.from(document.querySelectorAll(".technical-category")).map((row) => ({
        label: row.querySelector(".technical-label")?.textContent.trim() || "",
        values: row.querySelector(".technical-values")?.textContent.trim() || ""
      }));

      const linkedinHref = document.querySelector(".hero-linkedin")?.getAttribute("href") || "";

      return {
        name: pickText(".hero-name"),
        tagline: pickText(".hero-tagline").replace(/\s*\n\s*/g, " | "),
        summary: pickText(".summary-text"),
        focusItems: pickList(".focus-list li"),
        experiences,
        technical,
        linkedinHref
      };
    });

    const focusItems = [...(data.focusItems || [])].sort((a, b) => {
      const byLength = a.length - b.length;
      if (byLength !== 0) {
        return byLength;
      }

      return a.localeCompare(b);
    });

    return {
      name: data.name || "Resume",
      tagline: data.tagline || "",
      website: "joebader.com",
      linkedin: data.linkedinHref ? data.linkedinHref.replace(/^https?:\/\//, "") : "",
      summary: data.summary || "",
      focusItems,
      experiences: data.experiences || [],
      technical: data.technical || []
    };
  } finally {
    await browser.close();
  }
}

async function writePdf(html, outputPath) {
  const browser = await chromium.launch();

  try {
    const page = await browser.newPage({
      viewport: { width: 1275, height: 1650 }
    });

    await page.setContent(html, { waitUntil: "domcontentloaded" });
    await page.pdf({
      path: outputPath,
      format: "Letter",
      printBackground: true,
      margin: {
        top: "0.75in",
        right: "0.75in",
        bottom: "0.75in",
        left: "0.75in"
      }
    });
  } finally {
    await browser.close();
  }
}

function buildDocxParagraphs(data) {
  const children = [];

  children.push(
    new Paragraph({
      text: data.name,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 90 }
    }),
    new Paragraph({
      text: data.tagline,
      spacing: { after: 60 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${data.website} | ${data.linkedin}`,
          color: "12456E"
        })
      ],
      spacing: { after: 180 },
      border: {
        bottom: {
          color: "D7DEE6",
          size: 6,
          style: BorderStyle.SINGLE
        }
      }
    })
  );

  children.push(
    new Paragraph({
      text: "SUMMARY",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 120, after: 80 }
    }),
    new Paragraph({
      text: data.summary,
      spacing: { after: 180 }
    })
  );

  children.push(
    new Paragraph({
      text: "FOCUS AREAS",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 60, after: 80 }
    })
  );

  const focusRows = [];
  for (let index = 0; index < data.focusItems.length; index += 2) {
    const left = data.focusItems[index];
    const right = data.focusItems[index + 1] || "";

    focusRows.push(
      new TableRow({
        children: [
          new TableCell({
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }
            },
            children: [
              new Paragraph({
                text: left ? `• ${left}` : "",
                spacing: { after: 40 }
              })
            ]
          }),
          new TableCell({
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }
            },
            children: [
              new Paragraph({
                text: right ? `• ${right}` : "",
                spacing: { after: 40 }
              })
            ]
          })
        ]
      })
    );
  }

  children.push(
    new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE
      },
      rows: focusRows
    })
  );

  children.push(
    new Paragraph({
      text: "EXPERIENCE",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 180, after: 80 }
    })
  );

  for (const [index, exp] of data.experiences.entries()) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: exp.title, bold: true }),
          new TextRun({ text: `\t${exp.dates}`, color: "4B5A6A", italics: true })
        ],
        tabStops: [{ type: TabStopType.RIGHT, position: 9300 }],
        spacing: { after: 15 }
      })
    );

    if (exp.company) {
      children.push(
        new Paragraph({
          spacing: { after: 30 },
          children: [new TextRun({ text: exp.company, color: "4B5A6A" })]
        })
      );
    }

    for (const bullet of exp.bullets) {
      children.push(
        new Paragraph({
          text: bullet,
          numbering: {
            reference: "resume-bullets",
            level: 0
          },
          spacing: { after: 15 }
        })
      );
    }

    if (index < data.experiences.length - 1) {
      children.push(new Paragraph({ text: "", spacing: { after: 25 } }));
    }
  }

  children.push(
    new Paragraph({
      text: "TECHNICAL",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 60, after: 80 }
    })
  );

  for (const row of data.technical) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${row.label}: `, bold: true }),
          new TextRun({ text: row.values })
        ],
        spacing: { after: 35 }
      })
    );
  }

  return children;
}

async function writeDocx(data, outputPath) {
  const doc = new Document({
    styles: {
      default: {
        heading1: {
          run: {
            size: 44,
            bold: true
          },
          paragraph: {
            spacing: { after: 80 }
          }
        },
        heading2: {
          run: {
            size: 21,
            bold: true,
            color: "12456E"
          },
          paragraph: {
            spacing: { after: 70 }
          }
        },
        document: {
          run: {
            font: "Calibri",
            size: 22,
            color: "121820"
          },
          paragraph: {
            spacing: {
              line: 264
            }
          }
        }
      }
    },
    numbering: {
      config: [
        {
          reference: "resume-bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "\u2022",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: {
                    left: 360,
                    hanging: 180
                  }
                }
              }
            }
          ]
        }
      ]
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720
            }
          }
        },
        children: buildDocxParagraphs(data)
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  await fs.writeFile(outputPath, buffer);
}

async function main() {
  await fs.mkdir(distOutputDir, { recursive: true });
  await fs.mkdir(webOutputDir, { recursive: true });

  const data = await extractDataFromSite();
  const html = renderResumeHtml(data);
  const safeName = sanitizeFileSegment(data.name || "resume");
  const distPdfPath = path.join(distOutputDir, `${safeName}-resume.pdf`);
  const distDocxPath = path.join(distOutputDir, `${safeName}-resume.docx`);
  const webPdfPath = path.join(webOutputDir, "resume.pdf");
  const webDocxPath = path.join(webOutputDir, "resume.docx");

  await writePdf(html, distPdfPath);
  await writeDocx(data, distDocxPath);
  await fs.copyFile(distPdfPath, webPdfPath);
  await fs.copyFile(distDocxPath, webDocxPath);

  console.log("Resume export complete.");
  console.log(`PDF:  ${distPdfPath}`);
  console.log(`DOCX: ${distDocxPath}`);
  console.log(`WEB PDF:  ${webPdfPath}`);
  console.log(`WEB DOCX: ${webDocxPath}`);
}

main().catch((error) => {
  const message = String(error?.message || error);
  console.error("Resume export failed.");
  console.error(message);

  if (message.includes("Executable doesn't exist")) {
    console.error("Run: npm run setup:resume-tool");
  }

  process.exit(1);
});
