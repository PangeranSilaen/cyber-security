# Laporan UAS Keamanan Siber
## Identifikasi Kerentanan Website Perpustakaan ITK

## 1. Ringkasan Eksekutif

Project UAS ini melakukan identifikasi kerentanan non-destruktif terhadap `https://perpustakaan.itk.ac.id/` dengan pendekatan Windows-first (PowerShell 7) dan tool tambahan via Docker. Aktivitas mencakup reconnaissance, footprinting, port/service enumeration konservatif, DNS dan subdomain enumeration pasif, TLS/header analysis, vulnerability identification non-destruktif, dan WAF detection.

Secara umum target terkonfigurasi cukup baik: HSTS aktif, redirect HTTP ke HTTPS, TLSv1.3 dengan cipher grade A, user enumeration WordPress diblok, HTTP methods minimal, dan terdapat WAF/security layer aktif. Tidak ditemukan kerentanan kritis yang dapat dikonfirmasi secara non-destruktif. Temuan didominasi kategori Low dan Informational, dengan dua temuan Medium berupa outdated WordPress (5.9.13) beserta version disclosure (F-006) dan XML-RPC endpoint aktif (F-007).

Seluruh severity bersifat sementara berdasarkan bukti non-destruktif. Tidak ada finding yang diklaim sebagai kerentanan terkonfirmasi yang dapat dieksploitasi, sesuai batasan UAS. Daftar lengkap finding (F-001..F-010), kontrol positif, dan pemetaan OWASP/CWE ada di `evidence/findings.md`.

## 2. Scope Dan Batasan Etika

Target resmi pengujian adalah `https://perpustakaan.itk.ac.id/`. Pengujian dilakukan untuk kepentingan akademik UAS Keamanan Siber dan dibatasi pada reconnaissance, footprinting, information gathering, scanning wajar, service enumeration, banner grabbing, DNS enumeration, vulnerability scanning non-destruktif, dan identifikasi potensi misconfiguration.

Aktivitas yang tidak dilakukan dan tetap dilarang mencakup eksploitasi aktif, payload/RCE, privilege escalation, brute force, DoS/DDoS, defacement, upload file, SQL injection eksploit aktif, pencurian data, perubahan data, dan penghapusan data.

## 3. Metodologi

Metodologi dilakukan bertahap dan non-destruktif:

1. Persiapan workspace dan evidence log.
2. Cek ketersediaan tools lokal di Windows.
3. Reconnaissance DNS, HTTP baseline, dan subdomain enumeration pasif (Certificate Transparency).
4. Port/service enumeration konservatif (Nmap, timing `-T2`).
5. HTTP/TLS/header analysis, tech fingerprint, dan WordPress exposure check.
6. Vulnerability identification non-destruktif (Nmap NSE safe scripts, testssl.sh, Nikto, wafw00f).
7. Analisis: pemetaan ke OWASP Top 10 / CWE dan dokumentasi kontrol keamanan positif.

## 4. Lingkungan Pengujian

- OS: Windows
- Shell: PowerShell 7.6.1
- Tools tersedia: `curl`, `Resolve-DnsName`, `nslookup`, Docker, WSL, OpenSSL, Git
- Tools terinstall saat persiapan: Nmap 7.80, Shodan CLI 1.31.0
- Tools via Docker: testssl.sh v3.2.3 (`drwetter/testssl.sh`), Nikto v2.5.0 (`ghcr.io/sullo/nikto`), wafw00f v2.4.2 (`secsi/wafw00f`)
- OSINT pasif: certspotter API (Certificate Transparency)
- Catatan: Shodan CLI terinstall tetapi API key tidak ditulis ke file project atau command log.

## 5. Langkah Pengujian Windows

Detail command Windows dicatat di `reports/windows-reproduce.md` dan `evidence/commands-log.md`.

## 6. Instruksi Reproduce Linux/Kali

Instruksi reproduce Linux/Kali awal dicatat di `reports/linux-kali-reproduce.md`.

## 7. Hasil Reconnaissance

- DNS A record: `103.154.74.161`
- HTTP ke HTTPS: `301 Moved Permanently` menuju `https://perpustakaan.itk.ac.id/`
- HTTPS root page: `200 OK`
- Server header: `openresty`
- HSTS: `Strict-Transport-Security: max-age=63072000; preload`
- Indikasi WordPress: REST API links pada header `Link`

### 7.1 Subdomain Enumeration Pasif (Certificate Transparency)

crt.sh tidak dapat diakses (`502` berulang), sehingga digunakan certspotter API. Subdomain `itk.ac.id` yang ditemukan (parsial, free tier membatasi hasil): `e-library`, `api-ipr`, `ipr`, `isl`, `mmt`, `thingsboard`, `inspace`.

Resolusi DNS menunjukkan beberapa layanan berbagi IP dengan target:

| Subdomain | IP | Catatan |
| --- | --- | --- |
| `perpustakaan.itk.ac.id` | 103.154.74.161 | Target resmi |
| `api-ipr.itk.ac.id` | 103.154.74.161 | Shared IP dengan target |
| `ipr.itk.ac.id` | 103.154.74.161 | Shared IP dengan target |
| `www.itk.ac.id` / `itk.ac.id` | 103.154.74.161 | Shared IP dengan target |
| `e-library.itk.ac.id` | 103.216.188.11 | IP berbeda |
| `mmt.itk.ac.id` | 3.13.192.206 | AWS, IP berbeda |
| `thingsboard.itk.ac.id` | 103.175.228.105 | IP berbeda |
| `inspace.itk.ac.id` | 109.106.252.119 | IP berbeda |
| `isl.itk.ac.id` | 202.10.43.178 | IP berbeda |

Catatan scope: hanya `perpustakaan.itk.ac.id` yang dijadikan target aktif. Subdomain lain hanya dicatat sebagai konteks OSINT pasif (lihat F-010) dan tidak di-scan aktif.

## 8. Hasil Port Dan Service Enumeration

Nmap konservatif top 100 sudah dijalankan setelah konfirmasi user.

Command:

```powershell
& "C:\Program Files (x86)\Nmap\nmap.exe" -Pn -T2 --top-ports 100 perpustakaan.itk.ac.id
```

Hasil ringkas:

- Host aktif: `103.154.74.161`
- `80/tcp open http`
- `443/tcp open https`
- `113/tcp closed ident`
- 97 port lain filtered
- Service/version ringan: `80/tcp` dan `443/tcp` terdeteksi sebagai `OpenResty web app server`

Analisis awal: port `80` dan `443` wajar untuk website publik. Hasil HTTP baseline menunjukkan port 80 melakukan redirect ke HTTPS, sehingga exposure port 80 tidak otomatis menjadi kerentanan. Banyak port filtered menunjukkan adanya filtering pada port umum lain.

## 9. Hasil HTTP/TLS/Header Analysis

Baseline header menunjukkan HSTS aktif. Beberapa header keamanan umum belum terlihat pada root page response, termasuk `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, dan `Permissions-Policy` (F-001). Catatan: endpoint `index.php?rest_route=/` memiliki `X-Content-Type-Options: nosniff`, sehingga finding ditulis per endpoint, bukan digeneralisasi.

TLS handshake menunjukkan `TLSv1.3` dan cipher `TLS_AES_256_GCM_SHA384`. Nmap `ssl-enum-ciphers` menampilkan seluruh cipher TLSv1.2/1.3 grade `A` dengan server preference. Sertifikat wildcard `*.itk.ac.id` (RSA 2048, SHA256) diterbitkan untuk `Institut Teknologi Kalimantan` oleh Sectigo, valid 2026-01-19 sampai 2027-02-19 (F-004).

testssl.sh mengonfirmasi TLS stack sehat: not vulnerable untuk Heartbleed, CCS, Ticketbleed, ROBOT, CRIME, POODLE, TLS_FALLBACK_SCSV ok, SWEET32, FREAK, DROWN, LOGJAM, BEAST, dan tidak ada RC4. Dua catatan: BREACH precondition (kompresi gzip/deflate aktif) terkonfirmasi namun dampak kondisional (F-003), dan LUCKY13 ditandai "potentially vulnerable" karena server masih menawarkan cipher CBC lama pada TLSv1.2 (F-008, experimental).

## 10. Hasil Vulnerability Identification Non-Destructive

### 10.1 Tech Fingerprint dan WordPress Exposure

HTML root mengungkap stack: **WordPress 5.9.13** (`meta generator`), theme **Divi**, plugin **wp-pagenavi 2.70** dan **chaty**, jQuery 3.6.0. WordPress 5.9.x adalah branch lama; ini menjadi dasar F-006 (outdated component + version disclosure, Medium), diperkuat oleh `readme.html` yang masih dapat diakses (`200`).

Pengecekan endpoint WordPress (non-destruktif, GET/HEAD/OPTIONS):

- `xmlrpc.php` = `405 Method Not Allowed`, `Allow: POST` -> endpoint XML-RPC aktif (F-007, Medium). Tidak dilakukan pemanggilan method, brute force, atau pingback.
- `wp-login.php` = `200` (halaman login terekspos, wajar untuk WordPress).
- `/wp-json/wp/v2/users` = `404` dan `?author=1` = `404` -> user enumeration **diblok** (kontrol positif).
- HTTP methods (nmap + OPTIONS): hanya `GET HEAD POST OPTIONS`, tidak ada `PUT/DELETE/TRACE` (kontrol positif).

### 10.2 Nikto dan WAF

wafw00f mendeteksi target berada di belakang WAF/security layer: response normal `200` berubah `403` ketika pola serangan (XSS) dikirim (F-009). Ini menjelaskan dua observasi lain: 97/100 top port `filtered` pada Nmap, dan kegagalan Nikto menyelesaikan scan.

Nikto via Docker (`ghcr.io/sullo/nikto`) dijalankan dua kali; keduanya berhenti pada ~10% karena error limit yang dipicu pemblokiran request oleh WAF, bukan masalah tuning. Item yang sempat dilaporkan Nikto (missing security headers, `Content-Encoding: deflate`, wildcard cert) konsisten dengan temuan curl/nmap/testssl. Upaya menyelesaikan Nikto tidak dipaksakan agar tidak masuk area agresif/bypass WAF.

### 10.3 Shodan

Shodan CLI sudah diinisialisasi user, tetapi query `host`/`search` mengembalikan `403 Forbidden` dan `shodan info` menunjukkan 0 query/scan credits, sehingga evidence Shodan via CLI belum dapat dipakai. Alternatif: Shodan web UI atau API key dengan credits.

## 11. Daftar Temuan

| ID | Judul | Severity | Confidence |
| --- | --- | --- | --- |
| F-001 | Missing security headers pada root/endpoint tertentu | Low | Medium |
| F-002 | Technology/version disclosure dari header publik | Low (Info) | Medium |
| F-003 | Potensi BREACH (kompresi terkonfirmasi, dampak kondisional) | Low | Medium |
| F-004 | Wildcard certificate `*.itk.ac.id` | Low (Info) | High |
| F-005 | Backend disclosure pada error page 404 (`Apache/2.4.67`) | Low (Info) | Medium |
| F-006 | Outdated WordPress 5.9.13 + version disclosure | Medium | High (disclosure) |
| F-007 | XML-RPC endpoint aktif | Medium | High (keberadaan) |
| F-008 | TLS CBC ciphers (potensi LUCKY13) | Low | Medium |
| F-009 | WAF/security layer aktif (kontrol positif) | Info | Medium-High |
| F-010 | Shared hosting / subdomain attack surface (OSINT) | Info | High |

Detail lengkap, bukti, dan rekomendasi tiap finding ada di `evidence/findings.md`, termasuk bagian Kontrol Keamanan Positif dan Ringkasan Pemetaan OWASP Top 10 / CWE.

## 12. Analisis Risiko

Risiko keseluruhan rendah-menengah. Target menunjukkan postur keamanan transport dan akses yang baik (TLS modern, HSTS, WAF, user enumeration diblok, HTTP methods minimal). Area perbaikan utama bersifat patch management dan pengurangan attack surface aplikasi:

- Prioritas tertinggi: update WordPress core/theme/plugin yang outdated (F-006). Komponen lama adalah vektor paling realistis bila ada CVE publik yang cocok.
- Prioritas menengah: batasi/nonaktifkan XML-RPC (F-007) untuk mengurangi vektor brute force amplification dan pingback abuse.
- Prioritas rendah/hardening: lengkapi security headers (F-001), kurangi version/backend disclosure (F-002, F-005, F-006), evaluasi cipher CBC (F-008) dan kompresi pada response sensitif (F-003).

Tidak ada kerentanan yang dibuktikan dapat dieksploitasi, karena pengujian dibatasi pada identifikasi non-destruktif sesuai aturan UAS.

## 13. Rekomendasi Mitigasi

1. **Patch management (F-006):** update WordPress core ke versi didukung, update Divi dan seluruh plugin, blok/hapus akses `readme.html`, minimalkan version disclosure (meta generator, `?ver=`).
2. **XML-RPC (F-007):** nonaktifkan jika tidak dipakai atau batasi method `pingback`; terapkan rate limiting dan monitoring pada endpoint autentikasi.
3. **Security headers (F-001):** tambahkan `Content-Security-Policy`, `X-Frame-Options`/`frame-ancestors`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` secara konsisten lintas endpoint.
4. **Disclosure (F-002, F-005):** custom error page tanpa versi backend; minimalkan banner/header yang tidak perlu.
5. **TLS hardening (F-003, F-008):** evaluasi kebutuhan kompresi pada response yang memuat secret; prioritaskan cipher AEAD dan pertimbangkan menonaktifkan cipher CBC lama bila kompatibilitas klien memungkinkan.
6. **Organisasi (F-010):** inventarisasi dan isolasi virtual host yang berbagi IP; koordinasi hardening dengan pengelola infrastruktur ITK.
7. **Pertahankan kontrol positif:** WAF, HSTS, TLS modern, blocking user enumeration.

## 14. Kendala Dan Batasan

- crt.sh tidak dapat diakses (`502` berulang); diatasi dengan certspotter, namun free tier membatasi hasil sehingga daftar subdomain tidak lengkap.
- Nikto tidak dapat menyelesaikan scan (~10%) karena WAF memblok pola request; didokumentasikan sebagai temuan (F-009), bukan dipaksakan.
- Shodan CLI tidak memiliki query/scan credits, sehingga evidence Shodan via CLI tidak tersedia.
- Korelasi versi plugin/theme ke CVE spesifik belum dituntaskan (perlu lookup pasif WPScan/CVE).
- Seluruh batasan menjaga aktivitas tetap non-destruktif dan dalam scope UAS.

## 15. Rencana Lanjutan

- Lookup pasif CVE untuk WordPress 5.9.13, Divi, wp-pagenavi 2.70, dan chaty (sumber WPScan/CVE database) tanpa menjalankan exploit.
- Jika diperlukan, gunakan Shodan web UI atau API key dengan credits untuk passive intelligence.
- Finalisasi rekomendasi mitigasi prioritas bersama pengelola layanan.

## 16. Lampiran Command

Lihat `evidence/commands-log.md` untuk seluruh command dan ringkasan hasil. Langkah reproduce ada di `reports/windows-reproduce.md` (Windows) dan `reports/linux-kali-reproduce.md` (Linux/Kali).
