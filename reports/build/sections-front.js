// Front sections: Cover + Executive Summary + Scope & Methodology + Tools + Fingerprint + ringkasan temuan
module.exports = function (H) {
  const {
    Paragraph, HeadingLevel, AlignmentType, PageBreak, TableOfContents,
    t, p, h1, h2, bullet, num, table, spacer, sevColor,
  } = H;

  const anggota = [
    ["1.", "Muhammad Fikri Haikal Ariadma", "10231063"],
    ["2.", "Pangeran Borneo Silaen", "10231073"],
    ["3.", "Marshanda Aura Zefanya Susilo", "10221007"],
  ];

  const center = (runs, opts = {}) =>
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120, ...(opts.spacing || {}) }, children: Array.isArray(runs) ? runs : [t(runs, opts.run || {})] });

  // ---------- COVER ----------
  const cover = [
    center([t("LAPORAN UJI PENETRASI WEB", { bold: true, size: 28, color: "1F3864" })], { spacing: { before: 600, after: 60 } }),
    center([t("(Web Penetration Testing Report)", { italics: true, size: 24, color: "2E5496" })], { spacing: { after: 400 } }),
    center([t("Target: dev-itkpress.itk.ac.id", { bold: true, size: 26 })], { spacing: { after: 60 } }),
    center([t("ITK Press \u2013 Open Monograph Press", { size: 22, color: "595959" })], { spacing: { after: 500 } }),
    center([t("Mata Kuliah: Keamanan Siber", { size: 22 })], { spacing: { after: 40 } }),
    center([t("Metodologi: Black Box Penetration Testing", { size: 22 })], { spacing: { after: 500 } }),
    center([t("Disusun oleh:", { bold: true, size: 22 })], { spacing: { after: 120 } }),
  ];
  anggota.forEach(([no, nama, nim]) =>
    cover.push(center([t(nama + "  ", { size: 22 }), t("(" + nim + ")", { size: 22, color: "595959" })], { spacing: { after: 40 } })));
  cover.push(
    center([t("", {})], { spacing: { after: 500 } }),
    center([t("Program Studi Sistem Informasi", { bold: true, size: 22 })], { spacing: { after: 40 } }),
    center([t("Institut Teknologi Kalimantan", { bold: true, size: 22 })], { spacing: { after: 40 } }),
    center([t("2026", { size: 22 })], { spacing: { after: 40 } }),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // ---------- BODY (after cover) ----------
  const body = [];

  // Daftar Isi
  body.push(h1("Daftar Isi"));
  body.push(new TableOfContents("Daftar Isi", { hyperlink: true, headingStyleRange: "1-2" }));
  body.push(new Paragraph({ children: [new PageBreak()] }));

  // 1. Executive Summary
  body.push(h1("1. Ringkasan Eksekutif (Executive Summary)"));
  body.push(p("Laporan ini memuat hasil simulasi uji penetrasi web dengan metodologi black box terhadap target dev-itkpress.itk.ac.id, sebuah platform penerbitan akademik berbasis Open Monograph Press (OMP) dari PKP (Public Knowledge Project). Pengujian difokuskan pada empat topik: Information Gathering, Sensitive Data Exposure, Injection Attack, dan Unrestricted File Upload, serta dilakukan secara non-destruktif (tanpa eksploitasi, tanpa DoS, tanpa perubahan data)."));
  body.push(p([
    t("Tingkat risiko keseluruhan dinilai ", {}),
    t("MENENGAH (Medium)", { bold: true, color: "C55A11" }),
    t(". Temuan paling signifikan adalah penggunaan komponen aplikasi yang usang (OMP 3.3.0.12) dengan CVE publik (severity High). Lapisan transport sudah baik (HSTS preload aktif, redirect HTTP ke HTTPS), namun terdapat sejumlah misconfiguration dan information disclosure berkategori Low sampai Medium.", {}),
  ]));
  body.push(p([
    t("Dua topik wajib \u2013 ", {}),
    t("Injection Attack", { bold: true }),
    t(" dan ", {}),
    t("Unrestricted File Upload", { bold: true }),
    t(" \u2013 telah diuji secara non-destruktif dengan hasil negatif: parameter pencarian publik tampak ter-sanitasi (tidak ada error/anomali SQL), dan mekanisme unggah berkas OMP berada di balik autentikasi sehingga tidak terjangkau anonim. Seluruh severity bersifat indikatif berdasarkan bukti non-destruktif; tidak ada kerentanan yang dibuktikan dapat dieksploitasi.", {}),
  ]));

  // Ringkasan severity (tabel hitung)
  body.push(H.h2 ? H.h2("Distribusi Severity Temuan") : h2("Distribusi Severity Temuan"));
  body.push(table([3000, 3000, 3026], [
    ["Severity", "Jumlah", "ID Temuan"],
    ["High", "1", "DITK-001"],
    ["Medium", "1", "DITK-002"],
    ["Low", "4", "DITK-003, 004, 006, 007"],
    ["Informational", "3", "DITK-005, 008, 009"],
  ]));
  body.push(spacer());

  // 2. Scope & Methodology
  body.push(h1("2. Scope dan Metodologi"));
  body.push(h2("2.1 URL Target"));
  body.push(bullet([t("Target aktif: ", { bold: true }), t("https://dev-itkpress.itk.ac.id/home")]));
  body.push(bullet([t("Host produksi sibling ", {}), t("itkpress.itk.ac.id", { font: "Consolas", size: 20 }), t(" (ditemukan via robots.txt) TIDAK di-scan aktif; hanya dicatat sebagai OSINT pasif.")]));
  body.push(h2("2.2 Pendekatan Pengujian"));
  body.push(p("Metodologi black box: pengujian dilakukan dari sudut pandang pihak luar tanpa pengetahuan internal sistem dan tanpa kredensial. Karena target merupakan environment dev yang rapuh, pengujian dibuat ekstra konservatif: recon pasif, permintaan GET/HEAD tunggal dengan jeda, port scan timing lambat, tanpa scanner agresif, dan liveness dicek sebelum tiap fase."));
  body.push(h2("2.3 Batasan Etika"));
  body.push(bullet("Non-destruktif total: tidak ada exploit, payload merusak, brute force, DoS/DDoS, pembuatan akun, atau upaya login."));
  body.push(bullet("Injection diuji hanya dengan marker deteksi (tanpa UNION/time-based/dump). File upload hanya diidentifikasi kontrolnya tanpa mengunggah file."));
  body.push(bullet("Perlindungan data sensitif: nilai cookie sesi dan isi file konfigurasi tidak ditampilkan/disimpan."));
  body.push(bullet("Aktivitas aktif dihentikan dan dilaporkan bila target terindikasi down."));

  body.push(h2("2.4 Tools dan Teknik"));
  body.push(table([3400, 5626], [
    ["Tools / Teknik", "Kegunaan"],
    ["PowerShell 7 + curl.exe", "HTTP request, header audit, deteksi injection non-destruktif"],
    ["Resolve-DnsName", "DNS reconnaissance pasif"],
    ["Nmap 7.80 (-T2 --top-ports 100)", "Port scanning konservatif"],
    ["Browser DevTools", "Inspeksi cookie, page source, fingerprint versi"],
    ["Firecrawl search (dorking)", "Pencarian indeks publik (site:) pasif"],
    ["Database CVE publik", "Korelasi versi-ke-advisory (CISA / PKP / Exploit-DB)"],
  ]));
  body.push(spacer());

  body.push(h2("2.5 Hasil Fingerprint Target"));
  body.push(table([3400, 5626], [
    ["Atribut", "Nilai"],
    ["Aplikasi", "Open Monograph Press (OMP) 3.3.0.12 (PKP)"],
    ["Judul situs", "ITK Press"],
    ["Web server", "openresty"],
    ["IP / Host", "103.154.74.161 (shared dengan perpustakaan.itk.ac.id)"],
    ["Nameserver", "Cloudflare"],
    ["Press path", "/home"],
    ["Port terbuka", "80/tcp, 443/tcp (113 closed, 97 filtered)"],
  ]));
  body.push(new Paragraph({ children: [new PageBreak()] }));

  // 3. Ringkasan Temuan (tabel) -- pengantar bagian Findings
  body.push(h1("3. Ringkasan Temuan"));
  body.push(p("Tabel berikut merangkum seluruh temuan. Rincian per temuan (deskripsi, dampak, rekomendasi, langkah reproduksi, dan bukti) disajikan pada Bagian 4."));
  return { cover, body };
};
