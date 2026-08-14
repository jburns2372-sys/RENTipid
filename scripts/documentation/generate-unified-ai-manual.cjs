const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const root = path.resolve(__dirname, '..', '..');
const sourcePath = path.join(
  root,
  'final-documentation',
  'unified-ai',
  'RENTipid_UNIFIED_AUTONOMOUS_AI_CUSTOMER_SERVICE_AND_DIGITAL_HUMAN_MODULE.md',
);
const registryPath = path.join(
  root,
  'final-documentation',
  'ai-knowledge',
  'KNOWLEDGE-IMPLEMENTATION-REGISTRY.md',
);
const outputPath = sourcePath.replace(/\.md$/i, '.pdf');
const temporaryPath = outputPath.replace(/\.pdf$/i, '.first-pass.pdf');

const COLORS = {
  navy: '#12304A',
  teal: '#167D8D',
  blue: '#1F5F91',
  ink: '#263746',
  muted: '#637381',
  line: '#D8E2E8',
  panel: '#F2F7F9',
  warning: '#8B5E00',
  white: '#FFFFFF',
};

const PAGE = {
  size: 'A4',
  margins: { top: 60, bottom: 58, left: 56, right: 56 },
};

function cleanText(value) {
  return value
    .replace(/â€”/g, '-')
    .replace(/[–—]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\u00a0/g, ' ')
    .replace(/`([^`]+)`/g, '$1');
}

function parseRegistry() {
  const lines = fs.readFileSync(registryPath, 'utf8').split(/\r?\n/);
  return lines
    .filter((line) => /^\| \d+ \|/.test(line))
    .map((line) => {
      const columns = line.split('|').slice(1, -1).map((item) => cleanText(item.trim().replace(/^`|`$/g, '')));
      return {
        sequence: columns[0],
        sourceKey: columns[1],
        module: columns[2],
        topic: columns[3],
        sourceType: columns[4],
        locator: columns[5],
        authority: columns[6],
        approval: columns[7],
        visibility: columns[8],
        roles: columns[9],
        version: columns[10],
        disposition: columns[11],
        adapter: columns[12],
        reason: columns[13],
      };
    });
}

const source = fs.readFileSync(sourcePath, 'utf8');
const allLines = source.split(/\r?\n/);
const tocMarkerIndex = allLines.indexOf('[[TOC]]');
if (tocMarkerIndex < 0) throw new Error('TOC marker missing');

const contentLines = allLines.slice(tocMarkerIndex + 1);
const tocHeadings = contentLines
  .filter((line) => /^#{1,2} /.test(line))
  .map((line) => ({
    level: line.startsWith('## ') ? 2 : 1,
    title: cleanText(line.replace(/^#{1,2}\s+/, '')),
  }));

const registry = parseRegistry();
if (registry.length !== 146) throw new Error(`Expected 146 registry entries, found ${registry.length}`);

function currentPageNumber(doc) {
  return doc.bufferedPageRange().count;
}

function ensureSpace(doc, height) {
  const bottom = doc.page.height - PAGE.margins.bottom;
  if (doc.y + height > bottom) doc.addPage(PAGE);
}

function drawPageChrome(doc, pageNumber, pageCount) {
  const savedY = doc.y;
  const savedTopMargin = doc.page.margins.top;
  const savedBottomMargin = doc.page.margins.bottom;
  doc.page.margins.top = 0;
  doc.page.margins.bottom = 0;
  doc.save();
  doc.strokeColor(COLORS.line).lineWidth(0.6)
    .moveTo(PAGE.margins.left, 40)
    .lineTo(doc.page.width - PAGE.margins.right, 40)
    .stroke();
  doc.font('Helvetica').fontSize(7.5).fillColor(COLORS.muted)
    .text('RENTipid Unified AI & Knowledge Center', PAGE.margins.left, 27, {
      width: doc.page.width - PAGE.margins.left - PAGE.margins.right,
      align: 'left',
      lineBreak: false,
    });
  doc.strokeColor(COLORS.line)
    .moveTo(PAGE.margins.left, doc.page.height - 40)
    .lineTo(doc.page.width - PAGE.margins.right, doc.page.height - 40)
    .stroke();
  doc.font('Helvetica').fontSize(7.5).fillColor(COLORS.muted)
    .text('RENTIPID-UNIFIED-AI-MANUAL-001 | Baseline 894e77e6', PAGE.margins.left, doc.page.height - 31, {
      width: 360,
      lineBreak: false,
    })
    .text(`Page ${pageNumber} of ${pageCount}`, doc.page.width - PAGE.margins.right - 120, doc.page.height - 31, {
      width: 120,
      align: 'right',
      lineBreak: false,
    });
  doc.restore();
  doc.page.margins.top = savedTopMargin;
  doc.page.margins.bottom = savedBottomMargin;
  doc.y = savedY;
}

function drawTitlePage(doc) {
  doc.addPage(PAGE);
  doc.rect(0, 0, doc.page.width, 150).fill(COLORS.navy);
  doc.rect(0, 150, doc.page.width, 9).fill(COLORS.teal);
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#B8E3E8')
    .text('RENTIPID PLATFORM DOCUMENTATION', 56, 54, { characterSpacing: 1.4 });
  doc.font('Helvetica-Bold').fontSize(27).fillColor(COLORS.navy)
    .text('Unified Autonomous AI', 56, 210, { width: 480 });
  doc.font('Helvetica-Bold').fontSize(23).fillColor(COLORS.blue)
    .text('Customer Service & Digital Human Module', 56, 252, { width: 480 });
  doc.font('Helvetica-Bold').fontSize(17).fillColor(COLORS.teal)
    .text('Complete AI Knowledge Center Manual', 56, 326, { width: 480 });
  doc.moveTo(56, 365).lineTo(360, 365).strokeColor(COLORS.teal).lineWidth(2).stroke();
  doc.font('Helvetica').fontSize(10).fillColor(COLORS.ink)
    .text('Document ID', 56, 400)
    .font('Helvetica-Bold').text('RENTIPID-UNIFIED-AI-MANUAL-001', 180, 400)
    .font('Helvetica').text('Edition', 56, 423)
    .font('Helvetica-Bold').text('1.0', 180, 423)
    .font('Helvetica').text('Repository baseline', 56, 446)
    .font('Helvetica-Bold').fontSize(8.5).text('894e77e6b9b3aab4a2cf9ace64ff4d8c03c273f2', 180, 446)
    .font('Helvetica').fontSize(10).text('Prepared', 56, 469)
    .font('Helvetica-Bold').text('14 August 2026', 180, 469)
    .font('Helvetica').text('Acceptance status', 56, 492)
    .font('Helvetica-Bold').fillColor(COLORS.warning).text('Technical baseline; owner OAT remains separate', 180, 492, { width: 330 });
  doc.roundedRect(56, 555, 483, 105, 6).fill(COLORS.panel);
  doc.font('Helvetica').fontSize(9.3).fillColor(COLORS.ink)
    .text(
      'Repository-backed documentation of the conversational runtime, approved knowledge lifecycle, role visibility, security and deterministic authority boundaries, operational commands, OAT actors, acceptance evidence, and the complete frozen 146-source Knowledge Center index.',
      76,
      578,
      { width: 442, lineGap: 4 },
    );
}

function renderToc(doc, pageMap) {
  const entriesPerPage = 23;
  const pageTotal = Math.max(1, Math.ceil(tocHeadings.length / entriesPerPage));
  for (let pageIndex = 0; pageIndex < pageTotal; pageIndex += 1) {
    doc.addPage(PAGE);
    doc.font('Helvetica-Bold').fontSize(20).fillColor(COLORS.navy)
      .text(pageIndex === 0 ? 'Contents' : 'Contents (continued)', PAGE.margins.left, 65);
    doc.moveDown(0.55);
    const slice = tocHeadings.slice(pageIndex * entriesPerPage, (pageIndex + 1) * entriesPerPage);
    for (const entry of slice) {
      const indent = entry.level === 2 ? 16 : 0;
      const font = entry.level === 1 ? 'Helvetica-Bold' : 'Helvetica';
      const size = entry.level === 1 ? 8.7 : 8.1;
      const page = pageMap?.get(entry.title) ?? '';
      const y = doc.y;
      doc.font(font).fontSize(size).fillColor(entry.level === 1 ? COLORS.navy : COLORS.ink)
        .text(entry.title, PAGE.margins.left + indent, y, { width: 375 - indent, lineBreak: false });
      doc.font('Helvetica').fontSize(8).fillColor(COLORS.muted)
        .text(String(page), doc.page.width - PAGE.margins.right - 35, y, { width: 35, align: 'right', lineBreak: false });
      doc.strokeColor(COLORS.line).lineWidth(0.35)
        .moveTo(PAGE.margins.left + indent, y + 12)
        .lineTo(doc.page.width - PAGE.margins.right, y + 12)
        .stroke();
      doc.y = y + 21;
    }
  }
}

function renderHeading(doc, level, title, headingPages) {
  if (level === 1) {
    if (doc.y > PAGE.margins.top + 12) doc.addPage(PAGE);
    headingPages.set(title, currentPageNumber(doc));
    doc.outline.addItem(title);
    doc.rect(PAGE.margins.left, doc.y, 5, 32).fill(COLORS.teal);
    doc.font('Helvetica-Bold').fontSize(18).fillColor(COLORS.navy)
      .text(title, PAGE.margins.left + 15, doc.y + 2, { width: 455, lineGap: 1 });
    doc.moveDown(0.7);
    doc.strokeColor(COLORS.line).lineWidth(0.8)
      .moveTo(PAGE.margins.left, doc.y)
      .lineTo(doc.page.width - PAGE.margins.right, doc.y)
      .stroke();
    doc.moveDown(0.7);
  } else if (level === 2) {
    ensureSpace(doc, 58);
    headingPages.set(title, currentPageNumber(doc));
    doc.font('Helvetica-Bold').fontSize(12.5).fillColor(COLORS.teal)
      .text(title, { lineGap: 1.5 });
    doc.moveDown(0.35);
  } else {
    ensureSpace(doc, 40);
    doc.font('Helvetica-Bold').fontSize(10.5).fillColor(COLORS.blue).text(title);
    doc.moveDown(0.25);
  }
}

function renderParagraph(doc, text) {
  ensureSpace(doc, 30);
  doc.font('Helvetica').fontSize(9.2).fillColor(COLORS.ink)
    .text(cleanText(text), { align: 'justify', lineGap: 3 });
  doc.moveDown(0.55);
}

function renderListItem(doc, text, indent = 0) {
  ensureSpace(doc, 20);
  const x = PAGE.margins.left + indent;
  doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.teal).text('-', x, doc.y, { width: 12, lineBreak: false });
  doc.font('Helvetica').fontSize(9).fillColor(COLORS.ink)
    .text(cleanText(text), x + 14, doc.y, { width: doc.page.width - PAGE.margins.right - x - 14, lineGap: 2 });
  doc.moveDown(0.18);
}

function renderCodeBlock(doc, lines) {
  const text = cleanText(lines.join('\n'));
  const height = doc.heightOfString(text, { width: 430, lineGap: 1 }) + 20;
  ensureSpace(doc, Math.min(height, 300));
  const y = doc.y;
  doc.roundedRect(PAGE.margins.left, y, 483, height, 4).fill('#EEF3F6');
  doc.font('Courier').fontSize(7.6).fillColor(COLORS.ink)
    .text(text, PAGE.margins.left + 10, y + 10, { width: 463, lineGap: 1 });
  doc.y = y + height + 10;
}

function renderRegistry(doc) {
  for (const entry of registry) {
    const titleText = `A.${entry.sequence}  ${entry.sourceKey}`;
    const fields = [
      `Module / topic: ${entry.module} / ${entry.topic}    Type: ${entry.sourceType}    Version: ${entry.version}`,
      `Disposition: ${entry.disposition}    Visibility: ${entry.visibility}    Roles: ${entry.roles}`,
      `Authority: ${entry.authority}    Approval: ${entry.approval}    Adapter: ${entry.adapter}`,
      `Locator/provider: ${entry.locator}`,
      `Restriction/exclusion: ${entry.reason || '-'}`,
    ];
    doc.font('Helvetica-Bold').fontSize(9.4);
    const titleHeight = doc.heightOfString(titleText, { width: 465 });
    doc.font('Helvetica').fontSize(7.3);
    const fieldHeights = fields.map((field) => doc.heightOfString(field, { width: 465, lineGap: 1 }));
    const blockHeight = 8 + titleHeight + 5 + fieldHeights.reduce((sum, height) => sum + height + 3, 0) + 6;
    ensureSpace(doc, blockHeight + 9);
    const y = doc.y;
    doc.roundedRect(PAGE.margins.left, y, 483, blockHeight, 4)
      .fillAndStroke(entry.disposition === 'SYSTEM_ONLY' ? '#F6F1F1' : COLORS.panel, COLORS.line);
    doc.font('Helvetica-Bold').fontSize(9.4).fillColor(COLORS.navy)
      .text(titleText, PAGE.margins.left + 9, y + 8, { width: 465 });
    let fieldY = y + 8 + titleHeight + 5;
    doc.font('Helvetica').fontSize(7.3).fillColor(COLORS.ink);
    fields.forEach((field, index) => {
      doc.text(field, PAGE.margins.left + 9, fieldY, { width: 465, lineGap: 1 });
      fieldY += fieldHeights[index] + 3;
    });
    doc.y = y + blockHeight + 9;
  }
}

function renderBody(doc, headingPages) {
  let paragraph = [];
  let codeLines = [];
  let inCode = false;

  const flushParagraph = () => {
    if (paragraph.length) renderParagraph(doc, paragraph.join(' '));
    paragraph = [];
  };

  for (const rawLine of contentLines) {
    const line = rawLine.trimEnd();
    if (line === '[[REGISTRY_APPENDIX]]') {
      flushParagraph();
      renderRegistry(doc);
      continue;
    }
    if (line.startsWith('```')) {
      flushParagraph();
      if (inCode) {
        renderCodeBlock(doc, codeLines);
        codeLines = [];
      }
      inCode = !inCode;
      continue;
    }
    if (inCode) {
      codeLines.push(rawLine);
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      renderHeading(doc, heading[1].length, cleanText(heading[2]), headingPages);
      continue;
    }
    const bullet = line.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      flushParagraph();
      renderListItem(doc, bullet[1]);
      continue;
    }
    const numbered = line.match(/^(\d+)\.\s+(.+)$/);
    if (numbered) {
      flushParagraph();
      ensureSpace(doc, 20);
      const y = doc.y;
      doc.font('Helvetica-Bold').fontSize(8.8).fillColor(COLORS.teal)
        .text(`${numbered[1]}.`, PAGE.margins.left, y, { width: 22, lineBreak: false });
      doc.font('Helvetica').fontSize(9).fillColor(COLORS.ink)
        .text(cleanText(numbered[2]), PAGE.margins.left + 24, y, { width: 459, lineGap: 2 });
      doc.moveDown(0.18);
      continue;
    }
    paragraph.push(line.trim());
  }
  flushParagraph();
}

function renderPass(target, knownPages) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ ...PAGE, autoFirstPage: false, bufferPages: true, pdfVersion: '1.7' });
    const output = fs.createWriteStream(target);
    const headingPages = new Map();
    output.on('finish', () => {
      resolve(headingPages);
    });
    output.on('error', reject);
    doc.pipe(output);
    doc.info.Title = 'RENTipid Unified Autonomous AI Customer Service & Digital Human Module';
    doc.info.Subject = 'Complete technical and operational manual including the AI Knowledge Center';
    doc.info.Author = 'RENTipid Engineering / Codex';
    doc.info.Keywords = 'RENTipid, Unified AI, Digital Human, Knowledge Center, Knowledge Engine, OAT, RBAC';
    doc.info.CreationDate = new Date('2026-08-14T00:00:00Z');
    drawTitlePage(doc);
    renderToc(doc, knownPages);
    renderBody(doc, headingPages);
    const range = doc.bufferedPageRange();
    for (let pageIndex = 0; pageIndex < range.count; pageIndex += 1) {
      doc.switchToPage(pageIndex);
      drawPageChrome(doc, pageIndex + 1, range.count);
    }
    doc.end();
  });
}

(async () => {
  const firstPassPages = await renderPass(temporaryPath, null);
  await renderPass(outputPath, firstPassPages);
  fs.unlinkSync(temporaryPath);
  const stats = fs.statSync(outputPath);
  console.log(JSON.stringify({
    source: path.relative(root, sourcePath),
    pdf: path.relative(root, outputPath),
    registryEntries: registry.length,
    tocEntries: tocHeadings.length,
    bytes: stats.size,
  }, null, 2));
})().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
