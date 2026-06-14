// Back sections: Kontrol Positif + Kesimpulan & Saran + Lampiran (false positive & catatan)
module.exports = function (H, findings) {
  const {
    Paragraph, PageBreak, t, p, h1, h2, h3, bullet, num, table, codeBlock,
    noteBox, spacer,
  } = H;

  const out = [];

  // 5. Kontrol Keamanan Positif
  out.push(h1("5. Kontrol Keamanan Positif"));
  out.push(p("Beberapa kontrol keamanan sudah diterapkan dengan baik pada target dan layak dipertahankan:"));
  out.push(table([3400, 3626, 2000], [
    ["Kontrol", "Bukti", "Catatan"],
    ["HSTS aktif (preload)", "Strict-Transport-Security: max-age=63072000; preload", "Memaksa HTTPS"],
    ["Redirect HTTP ke HTTPS", "HTTP 301 ke HTTPS", "Enkripsi diberlakukan"],
    ["Cache-Control: no-store", "Header respons /home", "Mengurangi caching konten sesi"],
    ["Input pencarian ter-sanitasi", "Marker injection tidak memicu error DB (DITK-008)", "Praktik parameterized query"],
    ["Upload gated autentikasi", "Submission wizard redirect ke login (DITK-009)", "Mencegah upload anonim"],
  ]));
  out.push(spacer());

  // 6. Kesimpulan & Saran
  out.push(h1("6. Kesimpulan dan Saran Umum"));
  out.push(h2("6.1 Ringkasan Hasil"));
  out.push(p("Pengujian black box non-destruktif terhadap dev-itkpress.itk.ac.id menemukan total sembilan butir hasil (DITK-001 sampai DITK-009): satu High, satu Medium, empat Low, dan tiga Informational. Risiko keseluruhan dinilai menengah, didominasi oleh penggunaan komponen aplikasi yang usang (OMP 3.3.0.12) dengan CVE publik. Lapisan transport sudah baik (HSTS, redirect HTTPS)."));
  out.push(p("Dua topik wajib instruksi (Injection Attack dan Unrestricted File Upload) telah diuji secara non-destruktif dengan hasil negatif: parameter pencarian publik tampak ter-sanitasi, dan mekanisme unggah berkas berada di balik autentikasi. Tidak ada kerentanan yang dibuktikan dapat dieksploitasi karena pengujian dibatasi pada identifikasi non-destruktif."));

  out.push(h2("6.2 Rekomendasi Prioritas"));
  out.push(num([t("Prioritas tertinggi \u2013 Update OMP", { bold: true }), t(": naikkan dari 3.3.0.12 ke rilis stabil terbaru (minimal melewati 3.3.0.21). Ini menutup akar masalah DITK-001 dan DITK-004.")], "steps"));
  out.push(num([t("Perketat cookie sesi", { bold: true }), t(": setel HttpOnly, Secure, dan SameSite pada OMPSID (DITK-002).")], "steps"));
  out.push(num([t("Tambahkan security headers", { bold: true }), t(": CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy (DITK-003).")], "steps"));
  out.push(num([t("Kurangi eksposur environment dev", { bold: true }), t(": batasi self-registration (DITK-006), nonaktifkan directory listing (DITK-007), dan pertimbangkan IP allowlist/VPN untuk akses dev.")], "steps"));
  out.push(num([t("Minimalkan version disclosure", { bold: true }), t(": kelola meta generator dan version string aset (DITK-004).")], "steps"));

  out.push(h2("6.3 Saran Perbaikan Jangka Panjang"));
  out.push(bullet("Terapkan patch management rutin dan berlangganan advisory keamanan PKP."));
  out.push(bullet("Pisahkan environment dev dari akses publik dan jangan gunakan salinan konfigurasi produksi pada dev."));
  out.push(bullet("Lakukan security hardening review berkala (header, cookie, directory listing) sebagai bagian dari proses rilis."));
  out.push(bullet("Pertahankan kontrol positif yang sudah ada (HSTS, redirect HTTPS, parameterized query, gating upload)."));
  out.push(new Paragraph({ children: [new PageBreak()] }));

  // 7. Lampiran
  out.push(h1("7. Lampiran"));
  out.push(h2("7.1 Catatan Validasi (False Positive)"));
  out.push(p([t("config.inc.php \u2013 BUKAN kebocoran kredensial. ", { bold: true }), t("Permintaan GET /config.inc.php mengembalikan HTTP 200, namun dengan Content-Type: text/html dan Content-Length hanya 2 byte (body ; ). File dieksekusi sebagai PHP, bukan disajikan sebagai source code, sehingga isi konfigurasi TIDAK bocor. Dicatat sebagai false positive agar tidak salah lapor. Isi file tidak ditampilkan/disimpan demi etika.")]));
  out.push(p([t("Cek file dev lain: ", { bold: true }), t(".git/config, .env, composer.json, composer.lock, .gitignore semuanya HTTP 404; .htaccess HTTP 403.")]));
  out.push(spacer());

  out.push(h2("7.2 Petunjuk Melengkapi Bukti Screenshot"));
  out.push(p("Beberapa temuan dilengkapi placeholder screenshot pada Bagian 4. Untuk finalisasi laporan, ambil screenshot sesuai instruksi pada tiap kotak placeholder (judul gambar dan langkah pengambilan sudah dijelaskan). Pastikan address bar terlihat, dan SENSOR nilai sensitif (cookie value) sebelum dimasukkan ke laporan."));
  out.push(spacer());

  out.push(h2("7.3 Catatan Waktu & Kepatuhan"));
  out.push(bullet("Seluruh aktivitas aktif ke target dilakukan di luar jam kerja (Senin\u2013Jumat 07.00\u201316.00 WITA) sesuai batasan instruksi."));
  out.push(bullet("Liveness target dicek sebelum dan sesudah fase aktif; target tetap merespons HTTP 200 (tidak down)."));
  out.push(bullet("Seluruh severity bersifat indikatif berdasarkan bukti non-destruktif; korelasi CVE tidak dieksploitasi."));

  return out;
};
