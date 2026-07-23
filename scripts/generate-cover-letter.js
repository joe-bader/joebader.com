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
  date: "July 22, 2026",
  subject:
    "Re: Sr. Manager, Conversational Platforms — Software Development & Engineering (R440854)",
  salutation: "Dear Hiring Team,",
  paragraphs: [
    "Comcast is where I did some of the best work of my career. Across two engagements totaling nearly four years, I was a lead engineer on the redesign and re-architecture of Xfinity My Account — work that earned a Creativity International Gold Award — and later a lead on digital sales and account-management initiatives including Buy Online, Pick Up In-Store. I know how Comcast ships software at scale, and I'd welcome the chance to bring that experience back — this time to conversational platforms.",
    "Two threads of my recent work converge on this role.",
    "First, engineering management. As Senior Manager at Riskonnect, I led and mentored five cross-functional teams supporting a core B2B SaaS platform. I implemented DORA-based delivery metrics that improved lead time for changes by 4x and on-time delivery from 30% to 95%, served as senior architecture reviewer for high-impact initiatives, and scaled AI-assisted development practices that raised pull request throughput by 40%.",
    "Second, conversational AI — built from first principles. As founder of Tuner Logic, I designed and shipped a production conversational assistant: an LLM co-tuner with function calling grounded in live telemetry, server-side provider proxying across Anthropic and OpenAI, usage-metered billing, and nightly automated model evaluations. I understand conversation design, tool orchestration, evaluation, and cost control because I built each layer myself.",
    "To be direct about the posting's stack: my conversational AI work has been on Anthropic and OpenAI APIs and Cloudflare rather than Dialogflow and GCP, and my recent depth is TypeScript over Python. What I offer instead is experience one level below the frameworks — the patterns Dialogflow abstracts are ones I've implemented by hand — and a career of moving productively across stacks (.NET, Ruby, PHP, JavaScript). I ramp fast, and I'm honest about where I'm ramping.",
    "I'd love to talk about what your teams are building."
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

async function main() {
  await fs.mkdir(outputDir, { recursive: true });

  const html = renderLetterHtml(letter);
  const pdfPath = path.join(outputDir, "joe-bader-cover-letter-comcast.pdf");

  await writePdf(html, pdfPath);

  console.log("Cover letter export complete.");
  console.log(`PDF: ${pdfPath}`);
}

main().catch((error) => {
  const message = String(error?.message || error);
  console.error("Cover letter export failed.");
  console.error(message);

  if (message.includes("Executable doesn't exist")) {
    console.error("Run: npm run setup:resume-tool");
  }

  process.exit(1);
});
