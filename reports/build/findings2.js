// Findings data DITK-004..007 (format tubes a-f)
module.exports = [
{
  id: "DITK-004",
  nama: "Technology / Version Disclosure",
  severity: "Low (Info)",
  cvss: "CVSS v3.1: 3.1 (Low) - indikatif",
  owasp: "OWASP A05/A06:2021; CWE-200 Exposure of Sensitive Information",
  deskripsi: "Versi aplikasi (Open Monograph Press 3.3.0.12) terekspos publik melalui meta generator, query string aset, dan footer halaman.",
  dampak: "Low (Info). Pengungkapan versi mempermudah penyerang mencocokkan CVE spesifik (lihat DITK-001), sehingga mempercepat fingerprinting dan pemilihan exploit yang cocok. Memperkuat dampak komponen usang.",
  mitigasi: [
    "Minimalkan version disclosure: hapus/ubah tag meta generator.",
    "Kelola/strip query string versi pada aset publik bila memungkinkan.",
    "Catatan: ini hardening tambahan; akar masalah tetap update versi (DITK-001).",
  ],
  repro: [
    "Buka page source https://dev-itkpress.itk.ac.id/home (Ctrl+U).",
    "Temukan <meta name=\"generator\" content=\"Open Monograph Press 3.3.0.12\">.",
    "Amati query string aset (mis. ...styles.css?v=3.3.0.12) dan footer 'Platform & workflow by OMP / PKP'.",
  ],
  payload: "Tidak ada payload. Pembacaan HTML/headers publik.",
  rawHttp: {
    caption: "Cuplikan HTML homepage (GET /home)",
    lines: [
      "<meta name=\"generator\" content=\"Open Monograph Press 3.3.0.12\">",
      "<title>ITK Press</title>",
      "<link rel=\"stylesheet\" href=\"...stylesheet.css?v=3.3.0.12\">",
    ],
  },
  shots: [],
},
{
  id: "DITK-005",
  nama: "Shared Host dengan Layanan ITK Lain (OSINT)",
  severity: "Informational",
  cvss: "N/A (konteks reconnaissance)",
  owasp: "Konteks reconnaissance; CWE-200 pada level organisasi",
  deskripsi: "dev-itkpress.itk.ac.id me-resolve ke IP 103.154.74.161, yang sama dengan perpustakaan.itk.ac.id dan beberapa layanan ITK lain (shared host / reverse proxy). robots.txt juga menunjuk sitemap ke host produksi sibling itkpress.itk.ac.id.",
  dampak: "Informational. Secara organisasi attack surface lebih luas dari satu host; masalah isolasi antar virtual host dapat berdampak silang. Hanya konteks, tidak diuji. Sitemap menunjuk ke host produksi sibling itkpress.itk.ac.id - mengindikasikan environment dev kemungkinan memakai konfigurasi salinan produksi.",
  mitigasi: [
    "Pastikan isolasi antar virtual host pada IP bersama.",
    "Inventarisasi seluruh layanan yang berbagi IP.",
    "Pertimbangkan menutup akses environment dev dari publik (IP allowlist/VPN).",
  ],
  repro: [
    "Jalankan: Resolve-DnsName dev-itkpress.itk.ac.id -Type A (hasil: 103.154.74.161).",
    "Bandingkan dengan Resolve-DnsName perpustakaan.itk.ac.id -Type A (IP sama).",
    "Jalankan: curl.exe -s https://dev-itkpress.itk.ac.id/robots.txt (amati Sitemap: https://itkpress.itk.ac.id/sitemap.xml).",
    "Catatan scope: itkpress.itk.ac.id TIDAK di-scan aktif; hanya dicatat sebagai OSINT pasif.",
  ],
  payload: "Tidak ada payload. Resolusi DNS publik + pembacaan robots.txt.",
  rawHttp: {
    caption: "Isi robots.txt (GET /robots.txt)",
    lines: ["User-agent: *", "Allow: /", "Sitemap: https://itkpress.itk.ac.id/sitemap.xml"],
  },
  shots: [],
},
{
  id: "DITK-006",
  nama: "Registrasi Akun Terbuka (Self-Registration) - Pengganda Risiko",
  severity: "Low",
  cvss: "CVSS v3.1: 3.5 (Low) - indikatif",
  owasp: "OWASP A05:2021 Security Misconfiguration (kebijakan akun); konteks A06 (memperbesar dampak CVE yang butuh auth)",
  deskripsi: "Endpoint registrasi pengguna /home/user/register terbuka untuk publik (HTTP 200). Pada platform produksi ini wajar, namun pada environment dev yang menjalankan versi usang (DITK-001), registrasi terbuka memperbesar dampak.",
  dampak: "Low (pengganda risiko). Beberapa CVE OMP/PKP 3.3.0.x (privilege escalation, user-XML) memerlukan akun terautentikasi. Dengan registrasi terbuka, prasyarat 'authenticated' lebih mudah dipenuhi penyerang. Bukan kerentanan mandiri.",
  mitigasi: [
    "Pada environment dev, batasi registrasi (disable self-registration atau batasi via allowlist/domain email).",
    "Utamakan update versi (DITK-001).",
    "Pertimbangkan menutup akses dev dari publik (IP allowlist/VPN).",
  ],
  repro: [
    "Jalankan: curl.exe -s -o NUL -w \"%{http_code}\" https://dev-itkpress.itk.ac.id/home/user/register (hasil: 200).",
    "Jalankan: curl.exe -s -o NUL -w \"%{http_code}\" https://dev-itkpress.itk.ac.id/home/login (hasil: 200).",
    "Konfirmasi form registrasi tersedia. TIDAK dilakukan pembuatan akun atau submit form.",
  ],
  payload: "Tidak ada payload. Hanya cek ketersediaan endpoint (status HTTP). Tidak ada pendaftaran akun.",
  rawHttp: {
    caption: "Status endpoint registrasi & login",
    lines: ["GET /home/user/register  -> HTTP 200", "GET /home/login          -> HTTP 200"],
  },
  shots: [{
    title: "Halaman form registrasi publik /home/user/register",
    steps: [
      "Sumber: browser di https://dev-itkpress.itk.ac.id/home/user/register.",
      "Screenshot form registrasi (field nama, email, username) dengan address bar terlihat.",
      "PENTING: JANGAN mengisi/men-submit form (etika non-destruktif).",
    ],
  }],
},
{
  id: "DITK-007",
  nama: "Directory Listing Aktif pada /cache/",
  severity: "Low",
  cvss: "CVSS v3.1: 4.3 (Low) - indikatif",
  owasp: "OWASP A05:2021 Security Misconfiguration; CWE-548 Exposure of Information Through Directory Listing",
  deskripsi: "Listing direktori aktif pada /cache/, mengekspos struktur file internal aplikasi (50+ entri: CSS gabungan, cache locale, cache ONIX codelist, folder HTML/ dan URI/).",
  dampak: "Low. Information disclosure yang mempermudah fingerprinting (mengonfirmasi versi 3.3.0.12 lewat jalur lain) dan memetakan struktur instalasi. Memperkuat DITK-001 dan DITK-004. File .php di /cache/ dieksekusi server (source tidak bocor), namun daftar isi direktori tetap terekspos.",
  mitigasi: [
    "Nonaktifkan directory listing (Options -Indexes pada Apache / autoindex off pada nginx).",
    "Batasi akses langsung ke /cache/, /dbscripts/, dan /docs/ dari publik.",
  ],
  repro: [
    "Jalankan: curl.exe -s https://dev-itkpress.itk.ac.id/cache/ (amati penanda 'Index of /cache/').",
    "Amati daftar entri: 0-stylesheet.css, fc-locale-*.php, fc-List*_codelistItems-en_US.php, folder HTML/ dan URI/.",
    "Penguat: curl.exe -s https://dev-itkpress.itk.ac.id/dbscripts/xml/version.xml (HTTP 200, <release>3.3.0.12</release>).",
    "Tidak ada file yang diunduh untuk dieksekusi atau dimodifikasi.",
  ],
  payload: "Tidak ada payload. Hanya membaca halaman listing dan metadata versi.",
  rawHttp: {
    caption: "Cuplikan listing (GET /cache/)",
    lines: [
      "<title>Index of /cache</title>",
      "<h1>Index of /cache</h1>",
      "  0-stylesheet.css",
      "  fc-locale-en_US.php",
      "  fc-List35_codelistItems-en_US.php",
      "  HTML/   URI/   ...",
    ],
  },
  shots: [{
    title: "Browser menampilkan 'Index of /cache/' (directory listing)",
    steps: [
      "Sumber: browser di https://dev-itkpress.itk.ac.id/cache/.",
      "Screenshot halaman listing dengan judul 'Index of /cache' dan daftar file terlihat, address bar tampak.",
    ],
  }],
},
];
