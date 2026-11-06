import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const outputDir = path.join(projectRoot, "dist", "cover-letter");

const letter = {
  name: "Joe Bader",
  contact: "Philadelphia, PA | joseph.bader@gmail.com | joebader.com | linkedin.com/in/josephbader",
  date: "November 6, 2026",
  subject: "Re: Agentic AI Engineer - Senior Manager, EY Challenger",
  salutation: "Dear Hiring Team,",
  paragraphs: [
    "I'm excited to apply for the Agentic AI Engineer - Senior Manager role on the Challenger team. The role is about building agents that carry real work through to a checked result and stay safe when something fails. That is what I have spent the past 16 months building hands-on, after four years leading engineering teams.",
    "I come to this as a manager who still builds. As Senior Manager at Riskonnect, I led and mentored five cross-functional teams, raised on-time delivery from 30% to 95%, improved lead time for changes by 4x, and lifted pull request throughput by 40%. I also helped introduce AI-assisted engineering practices and reported delivery and risk to executives.",
    "As founder of Tuner Logic, I built an AI assistant for engine tuning, where a wrong answer can damage an engine. Safety checks run in regular code, not the model, and nothing is applied until the user accepts it. I also built the platform that develops the product: coding agents write 100% of the commits, more than 3,300 so far, under my direction and review, and no agent can approve its own work.",
    "Earlier, I spent nearly four years as a lead engineer on Comcast platforms serving millions of customers, ran two small consultancies, and led client engagements as technical lead at Intuitive Company, which later became part of EY. That history is a big part of why Challenger appeals to me. Small teams testing ideas with real clients is familiar ground, and it is the work I want to do more of.",
    "Thank you for your time and consideration. I'd welcome the chance to talk about what Challenger is building and how I could help."
  ],
  closing: "Sincerely,",
  signature: "Joe Bader"
};

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderLetterHtml(data) {
  const paragraphs = data.paragraphs
    .map((p) => `<p class="body-paragraph">${escapeHtml(p)}</p>`)
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>${escapeHtml(data.name)} - Cover Letter</title>
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
        line-height: 1.45;
      }

      h1, p {
        margin: 0;
      }

      .name {
        font-size: 22pt;
        line-height: 1.05;
        margin-bottom: 0.04in;
      }

      .contact {
        color: var(--accent);
        padding-bottom: 0.08in;
        margin-bottom: 0.18in;
        border-bottom: 2px solid var(--line);
      }

      .date {
        color: var(--muted);
        margin-bottom: 0.14in;
      }

      .subject {
        font-weight: 700;
        color: var(--accent);
        margin-bottom: 0.18in;
      }

      .salutation {
        margin-bottom: 0.12in;
      }

      .body-paragraph {
        margin-bottom: 0.12in;
      }

      .closing {
        margin-top: 0.18in;
      }

      .signature {
        margin-top: 0.04in;
        font-weight: 700;
      }
    </style>
  </head>
  <body>
    <header>
      <h1 class="name">${escapeHtml(data.name)}</h1>
      <p class="contact">${escapeHtml(data.contact)}</p>
    </header>
    <main>
      <p class="date">${escapeHtml(data.date)}</p>
      <p class="subject">${escapeHtml(data.subject)}</p>
      <p class="salutation">${escapeHtml(data.salutation)}</p>
      ${paragraphs}
      <p class="closing">${escapeHtml(data.closing)}</p>
      <p class="signature">${escapeHtml(data.signature)}</p>
    </main>
  </body>
</html>`;
}

async function writePdf(html, outputPath) {
  const browser = await chromium.launch({ channel: "chrome" });

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

async function main() {
  await fs.mkdir(outputDir, { recursive: true });

  const html = renderLetterHtml(letter);
  const pdfPath = path.join(outputDir, "joe-bader-cover-letter-ey.pdf");

  await writePdf(html, pdfPath);

  console.log("Cover letter export complete.");
  console.log(`PDF: ${pdfPath}`);
}

main().catch((error) => {
  const message = String(error?.message || error);
  console.error("Cover letter export failed.");
  console.error(message);

  if (message.includes("is not found")) {
    console.error("This script uses your installed Google Chrome. Install Chrome and run it again.");
  }

  process.exit(1);
});
