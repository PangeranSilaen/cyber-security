// Findings sections: tabel ringkasan + detail tiap temuan dengan format wajib tubes (a-f)
module.exports = function (H, findings) {
  const {
    Paragraph, PageBreak, t, p, h1, h2, h3, bullet, num, table, codeBlock,
    screenshot, noteBox, spacer, sevColor, lv,
  } = H;

  const out = [];

  // --- Tabel ringkasan seluruh temuan (bagian 3) ---
  const sumRows = [["ID", "Nama Kerentanan", "Severity", "OWASP 2021"]];
  const owaspShort = {
    "DITK-001": "A06", "DITK-002": "A05", "DITK-003": "A05", "DITK-004": "A05/A06",
    "DITK-005": "Recon", "DITK-006": "A05", "DITK-007": "A05", "DITK-008": "A03 (diuji)", "DITK-009": "A04/A05 (diuji)",
  };
  const shortName = {
    "DITK-001": "Komponen usang (OMP 3.3.0.12) + CVE publik",
    "DITK-002": "Cookie sesi tanpa HttpOnly/Secure/SameSite",
    "DITK-003": "Missing HTTP security headers",
    "DITK-004": "Technology / version disclosure",
    "DITK-005": "Shared host (OSINT)",
    "DITK-006": "Registrasi akun terbuka (pengganda risiko)",
    "DITK-007": "Directory listing /cache/",
    "DITK-008": "Injection - diuji, tidak terdeteksi",
    "DITK-009": "File upload - gated di balik login",
  };
  findings.forEach((f) =>
    sumRows.push([
      f.id, shortName[f.id] || f.nama,
      [t(f.severity, { bold: true, color: sevColor(f.severity) })],
      owaspShort[f.id] || "-",
    ]));
  out.push(table([1100, 4626, 1700, 1600], sumRows));
  out.push(spacer());
  out.push(noteBox("Catatan", "DITK-008 (Injection) dan DITK-009 (File Upload) adalah dua topik wajib instruksi tugas besar. Keduanya diuji secara non-destruktif dengan hasil negatif/kontrol positif."));
  out.push(new Paragraph({ children: [new PageBreak()] }));

  // --- Detail temuan (bagian 4) ---
  out.push(h1("4. Rincian Temuan (Findings)"));

  findings.forEach((f, idx) => {
    out.push(h2(f.id + ": " + f.nama));

    // badge severity
    out.push(new Paragraph({ spacing: { after: 120 }, children: [
      t("Severity: ", { bold: true }),
      t(f.severity, { bold: true, color: sevColor(f.severity) }),
      t("    |    " + (f.cvss || ""), { size: 18, color: "595959" }),
    ]}));

    // a) Nama Kerentanan
    out.push(h3("a) Nama Kerentanan"));
    out.push(p(f.nama));

    // b) Deskripsi Singkat
    out.push(h3("b) Deskripsi Singkat"));
    out.push(p(f.deskripsi));
    out.push(p([t("Klasifikasi: ", { bold: true }), t(f.owasp, { size: 20 })]));

    // c) Dampak
    out.push(h3("c) Dampak"));
    out.push(p(f.dampak));

    // CVE (khusus yang punya)
    if (f.cve && f.cve.length) {
      out.push(p([t("Referensi CVE / Advisory (korelasi pasif, tidak dieksploitasi):", { bold: true })]));
      f.cve.forEach((c) => out.push(bullet(c)));
    }

    // d) Rekomendasi Mitigasi
    out.push(h3("d) Rekomendasi Mitigasi"));
    f.mitigasi.forEach((m) => out.push(bullet(m)));

    // e) Langkah Reproduksi
    out.push(h3("e) Langkah Reproduksi"));
    f.repro.forEach((r) => out.push(num(r, "steps")));
    out.push(p([t("Payload / Input: ", { bold: true }), t(f.payload, { font: "Consolas", size: 19 })]));

    // f) Bukti
    out.push(h3("f) Bukti (Raw HTTP Request & Response)"));
    if (f.rawHttp) codeBlock(f.rawHttp.lines, f.rawHttp.caption).forEach((el) => out.push(el));
    if (f.shots && f.shots.length) {
      f.shots.forEach((s) => {
        out.push(spacer());
        out.push(screenshot(s.title, s.steps));
      });
    }
    if (f.catatan) {
      out.push(spacer());
      out.push(noteBox("Catatan Keterbatasan", f.catatan));
    }

    if (idx < findings.length - 1) out.push(new Paragraph({ children: [new PageBreak()] }));
  });

  out.push(new Paragraph({ children: [new PageBreak()] }));
  return out;
};
