// Main entrypoint: rakit laporan .docx UAS Keamanan Siber
const path = require("path");
const fs = require("fs");
const H = require("./helpers");
const {
  Document, Packer, Paragraph, HeadingLevel, AlignmentType, LevelFormat,
  Header, Footer, PageNumber, t,
} = H;

const findings = [
  ...require("./findings1"),
  ...require("./findings2"),
  ...require("./findings3"),
];

const front = require("./sections-front")(H);
const findingSecs = require("./sections-findings")(H, findings);
const back = require("./sections-back")(H, findings);

const doc = new Document({
  creator: "Kelompok UAS Keamanan Siber",
  title: "Web Penetration Testing Report - dev-itkpress.itk.ac.id",
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 30, bold: true, font: "Arial", color: "1F3864" },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: "2E5496" },
        paragraph: { spacing: { before: 220, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 23, bold: true, font: "Arial", color: "2E5496" },
        paragraph: { spacing: { before: 160, after: 80 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 560, hanging: 280 } } } }] },
      { reference: "steps", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 560, hanging: 280 } } } }] },
      { reference: "shotsteps", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 560, hanging: 280 } } } }] },
    ],
  },
  sections: [
    // Cover (no header/footer)
    { properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      children: front.cover },
    // Body
    { properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [t("Web Penetration Testing Report \u2013 dev-itkpress.itk.ac.id", { size: 16, color: "808080" })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [t("Halaman ", { size: 16, color: "808080" }), new (require(path.join(process.env.APPDATA,"npm","node_modules","docx")).TextRun)({ children: [PageNumber.CURRENT], size: 16, color: "808080" })] })] }) },
      children: [...front.body, ...findingSecs, ...back],
    },
  ],
});

const outPath = path.join(__dirname, "..", "Laporan-UAS-Keamanan-Siber-dev-itkpress.docx");
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(outPath, buf);
  console.log("WROTE " + outPath + " (" + buf.length + " bytes)");
}).catch((e) => { console.error("ERR", e); process.exit(1); });
