// Generator Laporan UAS Keamanan Siber - Web Penetration Testing Report
// Target: dev-itkpress.itk.ac.id | Format mengikuti instruksi tubes (Cover, Exec Summary,
// Scope & Methodology, Findings a-f, Kesimpulan). Bukti = raw HTTP + placeholder screenshot.
const path = require("path");
const fs = require("fs");
const docx = require(path.join(process.env.APPDATA, "npm", "node_modules", "docx"));
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, LevelFormat, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageNumber, Header, Footer, PageBreak, TableOfContents, VerticalAlign,
} = docx;

const CW = 9026; // content width A4, 1" margins
const ACCENT = "2E5496";
const LIGHT = "DCE6F1";
const CODEBG = "F2F2F2";
const NOTEBG = "FFF2CC";

// ---------- helpers ----------
const t = (text, opts = {}) => new TextRun({ text, ...opts });
const p = (text, opts = {}) =>
  new Paragraph({ children: Array.isArray(text) ? text : [t(text)], spacing: { after: 120, ...(opts.spacing || {}) }, ...opts });

const h1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [t(text)] });
const h2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [t(text)] });
const h3 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [t(text)] });

const bullet = (text) =>
  new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 },
    children: Array.isArray(text) ? text : [t(text)] });
const num = (text, ref = "steps") =>
  new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 60 },
    children: Array.isArray(text) ? text : [t(text)] });

const border = { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

function cell(text, w, { head = false, fill, bold = false, mono = false } = {}) {
  const runs = Array.isArray(text) ? text : [t(String(text), {
    bold: head || bold, color: head ? "FFFFFF" : undefined,
    font: mono ? "Consolas" : undefined, size: mono ? 18 : undefined,
  })];
  return new TableCell({
    borders, width: { size: w, type: WidthType.DXA }, margins: cellMargins,
    shading: { fill: head ? ACCENT : fill, type: ShadingType.CLEAR },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ children: runs })],
  });
}

function table(colWidths, rows, { headerFirst = true } = {}) {
  return new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: colWidths,
    rows: rows.map((cells, ri) =>
      new TableRow({
        tableHeader: headerFirst && ri === 0,
        children: cells.map((c, ci) =>
          cell(c, colWidths[ci], { head: headerFirst && ri === 0, fill: (!headerFirst || ri > 0) && ri % 2 === 0 ? "F4F7FB" : undefined })),
      })),
  });
}

// monospace code block (raw HTTP)
function codeBlock(lines, caption) {
  const out = [];
  if (caption) out.push(new Paragraph({ spacing: { before: 80, after: 40 }, children: [t(caption, { italics: true, size: 18, color: "666666" })] }));
  const body = lines.map((ln) =>
    new Paragraph({ spacing: { after: 0 }, children: [t(ln === "" ? " " : ln, { font: "Consolas", size: 18 })] }));
  out.push(new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: [CW],
    rows: [new TableRow({ children: [new TableCell({
      borders, width: { size: CW, type: WidthType.DXA },
      margins: { top: 120, bottom: 120, left: 160, right: 160 },
      shading: { fill: CODEBG, type: ShadingType.CLEAR }, children: body,
    })] })],
  }));
  return out;
}

// screenshot placeholder box
function screenshot(title, instructions) {
  const inner = [
    new Paragraph({ spacing: { after: 60 }, alignment: AlignmentType.CENTER, children: [t("[ PLACEHOLDER SCREENSHOT ]", { bold: true, color: ACCENT, size: 22 })] }),
    new Paragraph({ spacing: { after: 60 }, children: [t("Judul gambar: ", { bold: true, size: 20 }), t(title, { size: 20 })] }),
  ];
  instructions.forEach((ins) =>
    inner.push(new Paragraph({ numbering: { reference: "shotsteps", level: 0 }, spacing: { after: 40 }, children: [t(ins, { size: 20 })] })));
  return new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: [CW],
    rows: [new TableRow({ children: [new TableCell({
      borders: { top: { style: BorderStyle.DASHED, size: 2, color: ACCENT }, bottom: { style: BorderStyle.DASHED, size: 2, color: ACCENT }, left: { style: BorderStyle.DASHED, size: 2, color: ACCENT }, right: { style: BorderStyle.DASHED, size: 2, color: ACCENT } },
      width: { size: CW, type: WidthType.DXA }, margins: { top: 140, bottom: 140, left: 160, right: 160 },
      shading: { fill: "F7FAFE", type: ShadingType.CLEAR }, children: inner,
    })] })],
  });
}

function noteBox(label, text) {
  return new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: [CW],
    rows: [new TableRow({ children: [new TableCell({
      borders, width: { size: CW, type: WidthType.DXA }, margins: { top: 100, bottom: 100, left: 140, right: 140 },
      shading: { fill: NOTEBG, type: ShadingType.CLEAR },
      children: [new Paragraph({ children: [t(label + ": ", { bold: true }), t(text)] })],
    })] })],
  });
}

const spacer = () => new Paragraph({ spacing: { after: 80 }, children: [t("")] });
const sevColor = (s) => ({ High: "C00000", Medium: "C55A11", Low: "808000", "Low (Info)": "808000", Informational: "595959", Info: "595959" }[s] || "000000");

// label-value line used inside findings (a..f)
const lv = (label, value) => new Paragraph({ spacing: { after: 80 }, children: [t(label + " ", { bold: true }), t(value)] });

module.exports = {
  docx, Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, LevelFormat, HeadingLevel, BorderStyle, WidthType, ShadingType,
  PageNumber, Header, Footer, PageBreak, TableOfContents,
  CW, ACCENT, LIGHT, t, p, h1, h2, h3, bullet, num, table, codeBlock, screenshot,
  noteBox, spacer, sevColor, lv, cell,
};
