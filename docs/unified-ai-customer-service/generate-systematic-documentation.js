const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const baseDir = __dirname;
const sourcePath = path.join(baseDir, 'SYSTEMATIC_DOCUMENTATION.md');
const htmlPath = path.join(baseDir, 'SYSTEMATIC_DOCUMENTATION.html');
const pdfPath = path.join(baseDir, 'RENTipid-Unified-Autonomous-AI-Customer-Service-and-Digital-Human.pdf');

const escapeHtml = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const slugCounts = new Map();
function slugify(value) {
  const base = value
    .toLowerCase()
    .replace(/`/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'section';
  const count = slugCounts.get(base) || 0;
  slugCounts.set(base, count + 1);
  return count === 0 ? base : `${base}-${count + 1}`;
}

function inlineMarkdown(value) {
  const chunks = value.split(/(`[^`]+`)/g);
  return chunks.map((chunk) => {
    if (chunk.startsWith('`') && chunk.endsWith('`')) {
      return `<code>${escapeHtml(chunk.slice(1, -1))}</code>`;
    }

    return escapeHtml(chunk)
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  }).join('');
}

function parseMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const headings = [];
  const output = [];
  let paragraph = [];
  let listType = null;
  let inCode = false;
  let codeLanguage = '';
  let codeLines = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      output.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`);
      paragraph = [];
    }
  };

  const closeList = () => {
    if (listType) {
      output.push(`</${listType}>`);
      listType = null;
    }
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (line.startsWith('```')) {
      flushParagraph();
      closeList();
      if (!inCode) {
        inCode = true;
        codeLanguage = line.slice(3).trim();
        codeLines = [];
      } else {
        output.push(`<pre data-language="${escapeHtml(codeLanguage)}"><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
        inCode = false;
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    if (line.trim() === '<!-- pagebreak -->') {
      flushParagraph();
      closeList();
      output.push('<div class="page-break"></div>');
      continue;
    }

    const headingMatch = /^(#{1,4})\s+(.+)$/.exec(line);
    if (headingMatch) {
      flushParagraph();
      closeList();
      const level = headingMatch[1].length;
      const title = headingMatch[2].trim();
      const id = slugify(title);
      headings.push({ level, title: title.replace(/`/g, ''), id });
      const chapterClass = level === 1 ? ' class="chapter"' : '';
      output.push(`<h${level}${chapterClass} id="${id}">${inlineMarkdown(title)}</h${level}>`);
      continue;
    }

    if (/^\s*---+\s*$/.test(line)) {
      flushParagraph();
      closeList();
      output.push('<hr>');
      continue;
    }

    if (line.includes('|') && index + 1 < lines.length && /^\s*\|?\s*:?-+/.test(lines[index + 1])) {
      flushParagraph();
      closeList();
      const tableLines = [line];
      index += 2;
      while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
        tableLines.push(lines[index]);
        index += 1;
      }
      index -= 1;

      const splitRow = (row) => row.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim());
      const rows = tableLines.map(splitRow);
      output.push('<table><thead><tr>');
      rows[0].forEach((cell) => output.push(`<th>${inlineMarkdown(cell)}</th>`));
      output.push('</tr></thead><tbody>');
      rows.slice(1).forEach((row) => {
        output.push('<tr>');
        row.forEach((cell) => output.push(`<td>${inlineMarkdown(cell)}</td>`));
        output.push('</tr>');
      });
      output.push('</tbody></table>');
      continue;
    }

    const unordered = /^\s*[-*]\s+(.+)$/.exec(line);
    const ordered = /^\s*\d+\.\s+(.+)$/.exec(line);
    if (unordered || ordered) {
      flushParagraph();
      const nextType = unordered ? 'ul' : 'ol';
      if (listType !== nextType) {
        closeList();
        listType = nextType;
        output.push(`<${listType}>`);
      }
      output.push(`<li>${inlineMarkdown((unordered || ordered)[1])}</li>`);
      continue;
    }

    if (line.startsWith('> ')) {
      flushParagraph();
      closeList();
      output.push(`<blockquote>${inlineMarkdown(line.slice(2))}</blockquote>`);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      closeList();
      continue;
    }

    paragraph.push(line.trim());
  }

  flushParagraph();
  closeList();
  return { body: output.join('\n'), headings };
}

function buildToc(headings) {
  return headings
    .filter(({ level }) => level <= 2)
    .map(({ level, title, id }) => `<li class="toc-level-${level}"><a href="#${id}">${inlineMarkdown(title)}</a></li>`)
    .join('\n');
}

function buildHtml(markdown) {
  const parsed = parseMarkdown(markdown);
  const generatedAt = '13 August 2026';
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>RENTipid Unified Autonomous AI Customer Service & Digital Human</title>
  <style>
    :root { --ink:#172033; --muted:#586174; --blue:#155eef; --navy:#0b1f3a; --cyan:#0e7490; --line:#d8deea; --pale:#f4f7fb; --warn:#fff7e6; --risk:#fff1f1; --good:#ecfdf3; }
    * { box-sizing:border-box; }
    html { font-size:10.5pt; }
    body { margin:0; color:var(--ink); font-family:"Segoe UI", Arial, sans-serif; line-height:1.48; background:white; }
    .cover { min-height:250mm; padding:33mm 21mm 24mm; color:white; background:linear-gradient(145deg,#07152a 0%,#0b2f5c 58%,#0e7490 100%); display:flex; flex-direction:column; justify-content:space-between; page-break-after:always; }
    .brand { text-transform:uppercase; letter-spacing:.25em; font-size:10pt; color:#9ddff0; font-weight:700; }
    .cover h1 { font-size:31pt; line-height:1.08; margin:19mm 0 7mm; max-width:165mm; color:white; letter-spacing:-.025em; }
    .cover .subtitle { font-size:15pt; line-height:1.4; max-width:150mm; color:#dcecff; }
    .cover .badge { display:inline-block; border:1px solid rgba(255,255,255,.4); border-radius:999px; padding:2.5mm 5mm; font-size:9pt; letter-spacing:.08em; text-transform:uppercase; }
    .cover-grid { display:grid; grid-template-columns:1fr 1fr; gap:7mm; border-top:1px solid rgba(255,255,255,.25); padding-top:8mm; color:#dcecff; font-size:9pt; }
    .cover-grid strong { color:white; display:block; margin-bottom:1mm; }
    .toc { page-break-after:always; }
    .toc h1 { page-break-before:auto; }
    .toc ol { list-style:none; padding:0; columns:2; column-gap:12mm; }
    .toc li { break-inside:avoid; border-bottom:1px dotted #c5cede; padding:1.3mm 0; }
    .toc-level-1 { font-weight:700; margin-top:2.5mm; }
    .toc-level-2 { padding-left:5mm !important; color:var(--muted); font-size:9pt; }
    .toc a { color:inherit; text-decoration:none; }
    main { padding:0; }
    h1.chapter { page-break-before:always; font-size:23pt; line-height:1.15; color:var(--navy); margin:0 0 8mm; padding-bottom:3mm; border-bottom:2px solid var(--blue); }
    h2 { font-size:15pt; color:#123b66; margin:9mm 0 3mm; page-break-after:avoid; }
    h3 { font-size:11.5pt; color:#14536f; margin:6mm 0 2mm; page-break-after:avoid; }
    h4 { font-size:10.5pt; margin:4mm 0 1.5mm; page-break-after:avoid; }
    p { margin:0 0 3mm; orphans:3; widows:3; }
    ul, ol { margin:1mm 0 4mm 5mm; padding-left:5mm; }
    li { margin:1.2mm 0; }
    a { color:var(--blue); text-decoration:none; }
    code { font-family:Consolas,"Courier New",monospace; font-size:.88em; color:#9d174d; background:#f8edf3; padding:.15em .35em; border-radius:3px; overflow-wrap:anywhere; }
    pre { background:#101827; color:#edf3ff; padding:4mm; border-radius:5px; white-space:pre-wrap; overflow-wrap:anywhere; font-size:8.5pt; page-break-inside:avoid; }
    pre code { color:inherit; background:none; padding:0; }
    blockquote { margin:4mm 0; padding:3mm 4mm; border-left:4px solid var(--blue); background:#edf4ff; color:#193b68; page-break-inside:avoid; }
    table { width:100%; border-collapse:collapse; margin:3mm 0 6mm; font-size:8.4pt; table-layout:auto; }
    thead { display:table-header-group; }
    th { background:var(--navy); color:white; text-align:left; font-weight:650; }
    th, td { border:1px solid var(--line); padding:2mm 2.3mm; vertical-align:top; overflow-wrap:anywhere; }
    tbody tr:nth-child(even) { background:var(--pale); }
    tr { page-break-inside:avoid; }
    hr { border:0; border-top:1px solid var(--line); margin:7mm 0; }
    img { display:block; max-width:100%; max-height:205mm; margin:5mm auto 7mm; object-fit:contain; page-break-inside:avoid; }
    .page-break { page-break-before:always; }
    .document-body { padding:0; }
    .status-key { display:grid; grid-template-columns:repeat(2,1fr); gap:3mm; margin:4mm 0 7mm; }
    .status-key div { border:1px solid var(--line); border-radius:6px; padding:3mm; background:var(--pale); }
    .small { font-size:8.5pt; color:var(--muted); }
    @media print {
      a { color:inherit; }
      .cover { print-color-adjust:exact; -webkit-print-color-adjust:exact; }
      table, th, blockquote { print-color-adjust:exact; -webkit-print-color-adjust:exact; }
    }
  </style>
</head>
<body>
  <section class="cover">
    <div>
      <div class="brand">RENTipid · System Documentation</div>
      <h1>Unified Autonomous AI Customer Service &amp; Digital Human</h1>
      <div class="subtitle">Complete functional, technical, data, security, operational, testing, governance, user, and developer documentation</div>
      <div style="margin-top:12mm"><span class="badge">As-built repository edition · v1 baseline + current-state audit</span></div>
    </div>
    <div class="cover-grid">
      <div><strong>Prepared</strong>${generatedAt}</div>
      <div><strong>Repository snapshot</strong>HEAD 88565b721d0a</div>
      <div><strong>Historical closure</strong>v1 closure record, 12–13 August 2026</div>
      <div><strong>Classification</strong>Internal engineering &amp; operations reference</div>
    </div>
  </section>
  <section class="toc">
    <h1>Contents</h1>
    <ol>${buildToc(parsed.headings)}</ol>
  </section>
  <main class="document-body">${parsed.body}</main>
</body>
</html>`;
}

async function main() {
  const markdown = fs.readFileSync(sourcePath, 'utf8');
  const html = buildHtml(markdown);
  fs.writeFileSync(htmlPath, html, 'utf8');

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.goto(`file:///${htmlPath.replaceAll('\\', '/')}`, { waitUntil: 'networkidle' });
    await page.emulateMedia({ media: 'print' });
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      margin: { top: '18mm', right: '15mm', bottom: '18mm', left: '15mm' },
      headerTemplate: '<div style="font-size:7px;color:#738096;width:100%;padding:0 15mm;text-align:right">RENTipid · Unified AI Customer Service &amp; Digital Human</div>',
      footerTemplate: '<div style="font-size:7px;color:#738096;width:100%;padding:0 15mm;display:flex;justify-content:space-between"><span>Systematic documentation · 13 August 2026</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>',
      preferCSSPageSize: false,
      tagged: true,
      outline: true,
    });
  } finally {
    await browser.close();
  }

  const stats = fs.statSync(pdfPath);
  console.log(JSON.stringify({ htmlPath, pdfPath, bytes: stats.size }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
