# Temuan Keamanan - dev-itkpress.itk.ac.id (Target Aktif)

Target: `https://dev-itkpress.itk.ac.id/home`
Status target: AKTIF (per arahan dosen 2026-05-20). Environment `dev` yang rapuh.
Metode: recon pasif + verifikasi non-destruktif (GET/HEAD tunggal, rate sangat rendah). Tidak ada eksploitasi.

Catatan severity: seluruh severity bersifat sementara berdasarkan bukti non-destruktif. Tidak ada finding yang diklaim sebagai kerentanan terkonfirmasi yang dieksploitasi, sesuai batasan UAS.

---

## Ringkasan Fingerprint

| Atribut | Nilai | Bukti |
| --- | --- | --- |
| Aplikasi | Open Monograph Press (OMP) by PKP | `<meta name="generator" content="Open Monograph Press 3.3.0.12">` |
| Versi | 3.3.0.12 | meta generator + asset `?v=3.3.0.12` (`lib/pkp/...`, `plugins/themes/...`) |
| Judul situs | ITK Press | `<title>ITK Press</title>` |
| Web server | openresty | header `Server: openresty` |
| IP | 103.154.74.161 | `Resolve-DnsName` (SAMA dengan perpustakaan.itk.ac.id -> shared host) |
| Nameserver | Cloudflare (`mitch/carol.ns.cloudflare.com`) | `Resolve-DnsName -Type NS itk.ac.id` |
| Liveness | HTTP 200 OK pada `/home` | `curl -I` 2026-06-14 |

---

## DITK-001: Komponen Usang - Open Monograph Press 3.3.0.12 (CVE Publik)

**ID:** DITK-001

**Judul:** OMP 3.3.0.12 berada di bawah banyak ambang perbaikan keamanan PKP

**Status:** Terkonfirmasi usang (korelasi CVE pasif; tidak dieksploitasi)

**Severity Sementara:** High

**Confidence:** High untuk versi (terekspos eksplisit); korelasi CVE indikatif

**OWASP/CWE:** OWASP A06:2021 Vulnerable and Outdated Components; CWE-1104 Use of Unmaintained Third Party Components

**Bukti Non-Destruktif:**

- Versi terbaca dari `<meta name="generator">` dan seluruh string aset (`?v=3.3.0.12`) pada GET tunggal `/home`.
- Korelasi CVE pasif (lookup database publik CISA/CVE/PKP advisory, tidak menyentuh target):
  - PKP OJS/OMP/OPS **before 3.3.0.16**: memungkinkan eksekusi kode arbitrary dan privilege escalation via crafted script (CISA Security Bulletin 27 Nov 2024).
  - PKP **below 3.3.0.18**: dikategorikan critical vulnerabilities dengan CVE publik (advisory komunitas PKP/OJS).
  - PKP OJS/OMP/OPS **before 3.3.0.21**: CVE-2024-56525 (User-XML fatal vulnerabilities) dan lainnya (CISA Security Bulletin 26 Feb 2025).
  - XSS via Host Header injection pada PKP 3.3 (Exploit-DB 50881) - perlu kondisi tertentu.
- Versi terpasang `3.3.0.12` berada di bawah seluruh ambang di atas.
- Waktu: 2026-06-14.

**Analisis:**

OMP 3.3.0.12 adalah rilis lama pada branch 3.3.0.x dan tertinggal beberapa patch keamanan penting (minimal 4 patch level di bawah 3.3.0.16, dan jauh di bawah 3.3.0.21). Beberapa CVE pada rentang ini berkategori serius (privilege escalation / arbitrary code), umumnya memerlukan kondisi tertentu atau autentikasi. Penilaian berbasis korelasi versi-ke-advisory, bukan eksploitasi.

**Dampak Potensial:**

Komponen usang membuka kemungkinan jalur eksploitasi terdokumentasi. Untuk platform publikasi dengan akun pengguna (author/editor), risiko privilege escalation lebih relevan.

**Batasan Validasi:**

Tidak ada eksploitasi, payload, atau percobaan CVE aktif. Korelasi CVE indikatif; konfirmasi pasti memerlukan pengujian terotorisasi yang di luar batas non-destruktif sesi ini.

**Rekomendasi Mitigasi:**

Update OMP ke rilis stabil terbaru pada branch yang didukung (minimal melewati 3.3.0.21, idealnya 3.4.x/3.5.x bila kompatibel). Terapkan patch management rutin dan pantau advisory PKP.

---

## DITK-002: Session Cookie Tanpa Flag Keamanan (HttpOnly/Secure/SameSite)

**ID:** DITK-002

**Judul:** Cookie sesi `OMPSID` tidak menyetel `HttpOnly`, `Secure`, dan `SameSite`

**Status:** Terkonfirmasi (misconfiguration)

**Severity Sementara:** Medium

**Confidence:** High (header `Set-Cookie` terbaca langsung)

**OWASP/CWE:** OWASP A05:2021 Security Misconfiguration; CWE-1004 Sensitive Cookie Without HttpOnly Flag; CWE-614 Sensitive Cookie Without Secure Attribute; CWE-1275 SameSite Attribute Incorrect

**Bukti Non-Destruktif:**

- Header respons (GET `/home`): `Set-Cookie: OMPSID=...; path=/; domain=dev-itkpress.itk.ac.id`
- Tidak ada atribut `HttpOnly`, `Secure`, maupun `SameSite` pada cookie sesi tersebut.
- Waktu: 2026-06-14.

**Analisis:**

`OMPSID` adalah cookie sesi PKP/OMP. Tanpa `HttpOnly`, cookie dapat diakses skrip sisi klien (memperbesar dampak bila ada XSS). Tanpa `Secure`, cookie berpotensi terkirim pada koneksi non-HTTPS (walau HSTS memitigasi sebagian). Tanpa `SameSite`, memperbesar risiko CSRF.

**Dampak Potensial:**

Session hijacking lebih mudah bila dikombinasikan dengan XSS; potensi CSRF. Belum diuji secara aktif.

**Batasan Validasi:**

Hanya membaca header `Set-Cookie`. Tidak ada percobaan pencurian sesi, XSS, atau CSRF.

**Rekomendasi Mitigasi:**

Setel cookie sesi dengan `HttpOnly; Secure; SameSite=Lax` (atau `Strict` bila alur mengizinkan). Pada PKP, konfigurasikan di `config.inc.php`/web server.

---

## DITK-003: Missing HTTP Security Headers

**ID:** DITK-003

**Judul:** Header keamanan respons utama tidak ada (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)

**Status:** Terkonfirmasi (hardening gap)

**Severity Sementara:** Low

**Confidence:** High

**OWASP/CWE:** OWASP A05:2021 Security Misconfiguration; CWE-693 Protection Mechanism Failure

**Bukti Non-Destruktif:**

- GET `/home`, header yang ada hanya `Strict-Transport-Security: max-age=63072000; preload`.
- MISSING: `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-XSS-Protection`.
- Waktu: 2026-06-14.

**Analisis:**

Tanpa CSP dan X-Frame-Options, risiko clickjacking dan dampak XSS meningkat. Tanpa `X-Content-Type-Options: nosniff`, ada risiko MIME sniffing. HSTS sudah aktif (kontrol positif).

**Dampak Potensial:**

Memperbesar dampak kerentanan sisi klien (XSS, clickjacking). Bukan kerentanan langsung yang dapat dieksploitasi sendiri.

**Batasan Validasi:**

Hanya membaca header respons standar.

**Rekomendasi Mitigasi:**

Tambahkan `Content-Security-Policy`, `X-Frame-Options: SAMEORIGIN` (atau CSP `frame-ancestors`), `X-Content-Type-Options: nosniff`, `Referrer-Policy`, dan `Permissions-Policy` secara konsisten.

---

## DITK-004: Technology / Version Disclosure

**ID:** DITK-004

**Judul:** Versi aplikasi (OMP 3.3.0.12) terekspos publik

**Status:** Terkonfirmasi (information disclosure)

**Severity Sementara:** Low (Info)

**Confidence:** High

**OWASP/CWE:** OWASP A05/A06; CWE-200 Information Exposure

**Bukti Non-Destruktif:**

- `<meta name="generator" content="Open Monograph Press 3.3.0.12">` pada HTML `/home`.
- Versi juga muncul pada query string aset (`?v=3.3.0.12`) dan footer "Platform and Workflow by OMP/PKP".
- Waktu: 2026-06-14.

**Analisis:**

Pengungkapan versi mempermudah penyerang mencocokkan CVE spesifik (lihat DITK-001). Ini memperkuat dampak komponen usang.

**Dampak Potensial:**

Mempercepat fingerprinting dan pemilihan exploit yang cocok.

**Batasan Validasi:**

Hanya membaca HTML/headers publik.

**Rekomendasi Mitigasi:**

Minimalkan version disclosure (hapus/ubah meta generator, kelola query string versi). Catatan: ini hardening tambahan; akar masalah tetap pada update versi (DITK-001).

---

## DITK-005: Shared Host dengan Target Lain (OSINT)

**ID:** DITK-005

**Judul:** `dev-itkpress.itk.ac.id` berbagi IP dengan `perpustakaan.itk.ac.id` dan layanan ITK lain

**Status:** Informational (konteks)

**Severity Sementara:** Informational

**Confidence:** High untuk pemetaan DNS/IP

**OWASP/CWE:** Konteks reconnaissance; CWE-200 level organisasi

**Bukti Non-Destruktif:**

- `Resolve-DnsName dev-itkpress.itk.ac.id -Type A` -> `103.154.74.161`.
- IP ini sama dengan `perpustakaan.itk.ac.id`, `api-ipr`, `ipr`, `www`, `itk.ac.id` (lihat F-010 pada arsip target lama).
- Nameserver via Cloudflare.
- Waktu: 2026-06-14.

**Analisis:**

Beberapa layanan ITK berada pada IP yang sama (shared host/reverse proxy). Secara organisasi, attack surface lebih luas dari satu host. Catatan scope: hanya `dev-itkpress.itk.ac.id` yang menjadi target aktif sekarang.

**Dampak Potensial:**

Masalah isolasi antar virtual host dapat berdampak silang; hanya konteks, tidak diuji.

**Batasan Validasi:**

Hanya resolusi DNS publik. Tidak ada scanning ke host lain.

**Rekomendasi Mitigasi:**

Pastikan isolasi antar virtual host dan inventarisasi layanan pada IP bersama.

**Catatan Tambahan (robots.txt & sibling produksi):**

- `GET /robots.txt` = HTTP 200, isi: `User-agent: *` / `Allow: /` / `Sitemap: https://itkpress.itk.ac.id/sitemap.xml`.
- `Allow: /` adalah konfigurasi normal (bukan kerentanan), namun `Sitemap` menunjuk ke `itkpress.itk.ac.id` (TANPA prefix `dev-`) - mengindikasikan adanya host **produksi** sibling dan bahwa environment `dev` ini kemungkinan memakai konfigurasi salinan produksi (config artifact). 
- Scope: `itkpress.itk.ac.id` TIDAK di-scan aktif (di luar target resmi). Dicatat sebagai konteks OSINT pasif saja.

---

## DITK-006: Registrasi Akun Terbuka (Self-Registration)

**ID:** DITK-006

**Judul:** Endpoint registrasi pengguna terbuka untuk publik

**Status:** Terkonfirmasi (konteks attack surface)

**Severity Sementara:** Low (menjadi pengganda risiko untuk DITK-001)

**Confidence:** High (endpoint `/home/user/register` = HTTP 200)

**OWASP/CWE:** OWASP A05:2021 Security Misconfiguration (kebijakan akun); konteks A06 (memperbesar dampak CVE yang butuh auth)

**Bukti Non-Destruktif:**

- `GET /home/user/register` = HTTP 200 (form registrasi tersedia).
- `GET /home/login` = HTTP 200.
- Tidak ada percobaan membuat akun, submit form, atau autentikasi.
- Waktu: 2026-06-14.

**Analisis:**

OMP mengizinkan self-registration. Pada platform produksi ini wajar, namun pada env `dev` yang menjalankan versi usang (DITK-001), registrasi terbuka memperbesar dampak: beberapa CVE OMP/PKP 3.3.0.x (privilege escalation, user-XML) memerlukan akun terautentikasi. Dengan registrasi terbuka, prasyarat "authenticated" lebih mudah dipenuhi penyerang.

**Dampak Potensial:**

Menurunkan ambang eksploitasi untuk kerentanan yang membutuhkan akun. Bukan kerentanan mandiri.

**Batasan Validasi:**

Hanya cek ketersediaan endpoint (status HTTP). Tidak ada pendaftaran akun, tidak ada eksploitasi.

**Rekomendasi Mitigasi:**

Pada environment dev, batasi registrasi (disable self-registration atau batasi via allowlist/email domain), dan utamakan update versi (DITK-001). Pertimbangkan menutup akses dev dari publik (IP allowlist/VPN).

---

## DITK-007: Directory Listing Aktif pada `/cache/`

**ID:** DITK-007

**Judul:** Listing direktori aktif pada `/cache/`, mengekspos struktur file internal aplikasi

**Status:** Terkonfirmasi (misconfiguration)

**Severity Sementara:** Low

**Confidence:** High (listing terverifikasi live)

**OWASP/CWE:** OWASP A05:2021 Security Misconfiguration; CWE-548 Exposure of Information Through Directory Listing

**Bukti Non-Destruktif:**

- `GET /cache/` = HTTP 200 dengan penanda `Index of`, menampilkan 50+ entri: file CSS gabungan (`0-stylesheet.css`), cache locale (`fc-locale-*.php`), cache ONIX codelist (`fc-List*_codelistItems-en_US.php`), folder `HTML/` dan `URI/`.
- File `.php` di `/cache/` dieksekusi server (tidak membocorkan source code), namun daftar isi direktori tetap terekspos.
- Penguat: `GET /dbscripts/xml/version.xml` = HTTP 200 (`<release>3.3.0.12</release>`); `GET /docs/release-notes/README-3.3.0` = HTTP 200.
- Waktu: 2026-06-14.

**Analisis:**

Autoindex aktif pada direktori internal aplikasi (`/cache/`) dan beberapa file dokumentasi/skema versi dapat diakses langsung. Ini information disclosure yang mempermudah fingerprinting (mengonfirmasi versi 3.3.0.12 lewat jalur lain) dan memetakan struktur instalasi. Sejalan dengan pola F-011 pada target lama.

**Dampak Potensial:**

Mempermudah enumerasi dan konfirmasi versi/komponen; memperkuat DITK-001 dan DITK-004.

**Batasan Validasi:**

Hanya membaca halaman listing dan file metadata versi. Tidak ada file yang diunduh untuk dieksekusi atau dimodifikasi.

**Rekomendasi Mitigasi:**

Nonaktifkan directory listing (`Options -Indexes` / `autoindex off`), batasi akses langsung ke `/cache/`, `/dbscripts/`, dan `/docs/` dari publik.

---

## DITK-INFO: Validasi config.inc.php (False Positive Kebocoran Kredensial)

**ID:** DITK-INFO (catatan validasi, bukan finding)

**Judul:** `/config.inc.php` HTTP 200 namun TIDAK membocorkan kredensial

**Status:** False positive tervalidasi

**Bukti Non-Destruktif:**

- `GET /config.inc.php` = HTTP 200, namun `Content-Type: text/html` dan `Content-Length: 2` (body hanya `; `).
- PHP mengeksekusi file (bukan menyajikan source). Tidak ada penanda konfigurasi INI (`[database]`, `password=`, `username=`, `salt`, dll) pada body.
- Isi file TIDAK ditampilkan/disimpan demi etika (andai berisi secret).
- Waktu: 2026-06-14.

**Analisis:**

HTTP 200 di sini menyesatkan; karena diproses sebagai PHP, isi konfigurasi tidak bocor. Tidak diklaim sebagai kerentanan. Dicatat agar tidak salah lapor. (Pengecekan `.git/config`, `.env`, `composer.json`, `composer.lock`, `.gitignore` semuanya = HTTP 404; `.htaccess` = 403.)

---

## Pengujian Fokus Tubes: Injection Attack (Hasil: Tidak Terdeteksi / Input Ter-sanitasi)

**ID:** DITK-008 (pengujian fokus, hasil negatif - kontrol positif)

**Judul:** Deteksi Injection Non-Destruktif pada Parameter Pencarian Publik

**Severity:** Informational (tidak ditemukan kerentanan)

**Metodologi:** Black box, deteksi non-destruktif. Hanya membandingkan respons baseline vs marker. TANPA UNION, TANPA time-based (SLEEP), TANPA exfiltrasi/dump data.

**Bukti Non-Destruktif (2026-06-15, ~01:10 WITA, di luar jam kerja):**

- Baseline `GET /home/search/search?query=book` = HTTP 200, body 16775 bytes.
- Marker `query=book'` (single quote) = HTTP 200, ~16786 bytes, **tidak ada error SQL**.
- Marker `query=book"` (double quote) = HTTP 200, ~16786 bytes, **tidak ada error SQL**.
- Marker `query=book')` = HTTP 200, ~16788 bytes, **tidak ada error SQL**.
- Marker `query=book'--` = HTTP 200, 6263 bytes (lebih kecil = halaman "no results" normal, karena literal tidak cocok judul mana pun; BUKAN indikator injection).
- Pola deteksi error DB (`SQL syntax`, `mysqli`, `PDOException`, `Warning:`, `Fatal error`, dll) = **tidak ada satu pun yang muncul**.

**Analisis:**

Endpoint pencarian memperlakukan input sebagai literal string (tampak parameterized/ter-sanitasi). Tidak ada error database yang bocor, tidak ada anomali status/struktur respons yang mengindikasikan SQL injection. Tidak diklaim sebagai kerentanan. Topik Injection dari instruksi tubes telah diuji secara non-destruktif dengan hasil negatif.

**Catatan keterbatasan:** Pengujian dibatasi pada parameter GET publik (`query`). Parameter di balik autentikasi (form submission, dashboard editor OMP) tidak diuji karena memerlukan akun/login (di luar batas non-destruktif & izin).

---

## Pengujian Fokus Tubes: Unrestricted File Upload (Hasil: Gated di Balik Autentikasi)

**ID:** DITK-009 (pengujian fokus, hasil negatif - kontrol positif)

**Judul:** Mekanisme Upload OMP Tidak Terjangkau Tanpa Autentikasi

**Severity:** Informational (tidak ditemukan unrestricted upload yang terjangkau)

**Metodologi:** Black box, identifikasi kontrol dari halaman publik. TIDAK membuat akun, TIDAK login, TIDAK mengunggah file apa pun.

**Bukti Non-Destruktif (2026-06-15, ~01:12 WITA, di luar jam kerja):**

- `GET /home/submission/wizard` (jalur upload manuskrip OMP) = **HTTP 302** redirect ke `/home/login?source=%2Fhome%2Fsubmission%2Fwizard`.
- `GET /home/about/submissions` = HTTP 200, halaman publik menjelaskan proses submission (informasi, bukan form upload aktif).
- Mekanisme upload file (submission wizard OMP) berada **di balik login**; tidak ada endpoint upload yang dapat diakses anonim.

**Analisis:**

Open Monograph Press menempatkan seluruh alur unggah berkas (manuskrip, galley, supplementary files) di dalam workflow submission yang memerlukan autentikasi. Tanpa akun, tidak terdapat unrestricted file upload yang terjangkau publik. Karena registrasi terbuka (lihat DITK-006), permukaan upload secara teoritis dapat dicapai setelah membuat akun — namun pengujian aktif terhadapnya (membuat akun + mengunggah file uji) berada DI LUAR batas non-destruktif/izin tubes dan TIDAK dilakukan. Topik File Upload telah diidentifikasi dan didokumentasikan kontrolnya tanpa eksploitasi.

**Catatan keterbatasan:** Validasi tipe/ekstensi/konten file yang sebenarnya hanya dapat diuji dari dalam sesi terautentikasi, yang tidak dilakukan demi kepatuhan etika.

---

## Kontrol Keamanan Positif (Target Baru)

| Kontrol | Bukti | Catatan |
| --- | --- | --- |
| HSTS aktif (preload) | `Strict-Transport-Security: max-age=63072000; preload` | Memaksa HTTPS. |
| Redirect HTTP ke HTTPS | HTTP `301` ke HTTPS | Enkripsi diberlakukan. |
| `Cache-Control: no-store` | header respons `/home` | Mengurangi caching konten sesi. |
| Tidak terindeks search engine | dork `site:dev-itkpress.itk.ac.id` = 0 hasil | Mengurangi eksposur publik (wajar untuk dev). |

---

## Ringkasan Pemetaan OWASP / CWE (Target Baru)

| Finding | Judul Singkat | Severity | OWASP 2021 | CWE |
| --- | --- | --- | --- | --- |
| DITK-001 | OMP 3.3.0.12 usang + CVE publik | High | A06 | CWE-1104 |
| DITK-002 | Session cookie tanpa HttpOnly/Secure/SameSite | Medium | A05 | CWE-1004 / CWE-614 / CWE-1275 |
| DITK-003 | Missing security headers | Low | A05 | CWE-693 |
| DITK-004 | Version disclosure (OMP 3.3.0.12) | Low (Info) | A05 / A06 | CWE-200 |
| DITK-005 | Shared host (OSINT) | Info | Reconnaissance | CWE-200 |
| DITK-006 | Registrasi akun terbuka (pengganda risiko) | Low | A05 (+ konteks A06) | - |
| DITK-007 | Directory listing `/cache/` | Low | A05 | CWE-548 |
| DITK-008 | Injection (search) - diuji, tidak terdeteksi | Info (negatif) | A03 (diuji) | CWE-89 (tidak terbukti) |
| DITK-009 | File upload - gated di balik login | Info (negatif) | A04/A05 (diuji) | CWE-434 (tidak terjangkau) |

Catatan: seluruh severity bersifat sementara berdasarkan bukti non-destruktif. DITK-008 & DITK-009 adalah pengujian topik wajib tubes (Injection & File Upload) dengan hasil negatif/kontrol positif - diuji non-destruktif, tidak ditemukan kerentanan yang dapat diklaim.
