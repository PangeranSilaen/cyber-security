# Findings

## Finding Template

**ID:** F-000

**Judul:**

**Status:** Potensi / Indikasi / False Positive / Informational

**Severity Sementara:** Low / Medium / High

**Confidence:** Low / Medium / High

**Bukti Non-Destruktif:**

- Command:
- Ringkasan hasil:
- Waktu:

**Analisis:**

**Dampak Potensial:**

**Batasan Validasi:**

**Rekomendasi Mitigasi:**

---

## F-001: Potensi Missing Security Headers Pada Root Page

**ID:** F-001

**Judul:** Beberapa HTTP security header umum belum terlihat pada baseline root page

**Status:** Potensi misconfiguration

**Severity Sementara:** Low

**Confidence:** Medium untuk root page, Low untuk generalisasi seluruh situs

**Bukti Non-Destruktif:**

- Command: `curl.exe -I https://perpustakaan.itk.ac.id/`
- Ringkasan hasil: Response `200 OK` menampilkan `Strict-Transport-Security`, tetapi belum terlihat `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, dan `Permissions-Policy` pada response header root page.
- Waktu: 2026-05-24 22:46 +08:00

**Analisis:**

HSTS aktif adalah konfigurasi positif. Namun beberapa security header umum belum tampak pada baseline root page. Header seperti CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, dan Permissions-Policy dapat membantu mengurangi risiko clickjacking, MIME sniffing, data leakage melalui referrer, dan pembatasan fitur browser.

Validasi endpoint publik menunjukkan `index.php?rest_route=/` memiliki `X-Content-Type-Options: nosniff`, sehingga finding ini tidak boleh digeneralisasi ke seluruh situs. Finding sementara dibatasi pada root page dan hasil Nikto partial.

**Dampak Potensial:**

Jika aplikasi juga tidak memiliki mitigasi setara di layer lain, ketiadaan header tertentu dapat memperbesar dampak serangan client-side seperti clickjacking atau content injection.

**Batasan Validasi:**

Belum dilakukan eksploitasi browser-side. Analisis hanya berdasarkan response header publik pada root page.

**Rekomendasi Mitigasi:**

Tambahkan security header yang sesuai di web server atau aplikasi, terutama `Content-Security-Policy`, `X-Frame-Options` atau CSP `frame-ancestors`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, dan `Permissions-Policy` sesuai kebutuhan aplikasi.

**Validasi Tambahan:**

Nikto partial scan juga melaporkan missing `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, dan `Content-Security-Policy`. Karena Nikto berhenti pada error limit, hasil ini digunakan sebagai penguat indikasi, bukan satu-satunya dasar finding.

Endpoint `index.php?rest_route=/` mengembalikan `X-Content-Type-Options: nosniff`, sehingga validasi lanjutan perlu memetakan header per endpoint.

---

## F-002: Informational Technology Disclosure

**ID:** F-002

**Judul:** Server dan indikasi teknologi aplikasi terlihat dari header publik

**Status:** Informational

**Severity Sementara:** Low

**Confidence:** Medium

**Bukti Non-Destruktif:**

- Command: `curl.exe -I https://perpustakaan.itk.ac.id/`
- Ringkasan hasil: Header menampilkan `Server: openresty`, `X-LiteSpeed-Tag`, `X-Served-By: perpustakaan.itk.ac.id`, dan `Link` ke WordPress REST API.
- Waktu: 2026-05-24 22:46 +08:00

**Analisis:**

Disclosure teknologi bukan kerentanan langsung, tetapi membantu proses fingerprinting. Indikasi WordPress dari REST API link dan server `openresty` perlu digunakan untuk analisis defensif berikutnya, misalnya memastikan versi/plugin tidak terekspos berlebihan dan konfigurasi REST API tidak membuka data sensitif.

**Dampak Potensial:**

Informasi teknologi dapat membantu attacker menyusun reconnaissance lebih terarah jika dikombinasikan dengan celah lain.

**Batasan Validasi:**

Belum dilakukan crawling agresif, enumerasi plugin, atau akses endpoint sensitif. Kesimpulan masih sebatas indikator dari header publik.

**Rekomendasi Mitigasi:**

Minimalkan banner/header yang tidak diperlukan dan pastikan konfigurasi WordPress REST API, plugin, dan cache tidak mengekspos informasi sensitif.

---

## F-003: Potensi Risiko Compression Side-Channel Dari Content-Encoding Deflate

**ID:** F-003

**Judul:** Nikto mengindikasikan penggunaan `Content-Encoding: deflate` yang berpotensi terkait BREACH

**Status:** Potensi (prasyarat kompresi terkonfirmasi, dampak kondisional)

**Severity Sementara:** Low

**Confidence:** Medium (prasyarat kompresi terkonfirmasi via testssl.sh; dampak nyata belum divalidasi karena butuh pengujian aktif)

**OWASP/CWE:** OWASP A02:2021 Cryptographic Failures; CWE-310 Cryptographic Issues

**Bukti Non-Destruktif:**

- Command: `docker run --rm ghcr.io/sullo/nikto -h https://perpustakaan.itk.ac.id/ -Tuning 123b -nointeractive`
- Ringkasan hasil awal: Nikto melaporkan `The Content-Encoding header is set to "deflate" which may mean that the server is vulnerable to the BREACH attack`.
- Validasi 2026-06-07: `docker run --rm drwetter/testssl.sh -U https://perpustakaan.itk.ac.id/` mengonfirmasi `BREACH (CVE-2013-3587) potentially NOT ok, "gzip" HTTP compression detected. - only supplied "/" tested. Can be ignored for static pages or if no secrets in the page`.
- Waktu: 2026-05-24 23:15 +08:00; validasi 2026-06-07 21:25 +08:00

**Analisis:**

BREACH membutuhkan kondisi tertentu, seperti response HTTPS yang terkompresi, adanya secret dalam response body, dan kemampuan attacker mengamati ukuran response serta memengaruhi input. Karena validasi kondisi tersebut dapat masuk ke area pengujian aktif, temuan ini hanya dicatat sebagai indikasi awal dari scanner.

**Dampak Potensial:**

Jika seluruh prasyarat BREACH terpenuhi, compression side-channel dapat membantu attacker menebak nilai rahasia pada response HTTPS. Pada tahap ini belum ada bukti bahwa response target memuat secret yang dapat dieksploitasi.

**Batasan Validasi:**

Tidak dilakukan eksploitasi side-channel atau payload aktif. Prasyarat kompresi (gzip/deflate aktif) sudah terkonfirmasi oleh dua tool independen (Nikto dan testssl.sh), tetapi prasyarat lain (adanya secret dalam response yang terkompresi dan kemampuan attacker memengaruhi input serta mengamati ukuran response) tidak diuji karena masuk area pengujian aktif. Karena itu finding tetap berstatus potensi, bukan kerentanan terkonfirmasi yang dapat dieksploitasi.

**Rekomendasi Mitigasi:**

Evaluasi kebutuhan HTTP compression untuk halaman yang memuat token/secret. Jika ada response sensitif, pertimbangkan mitigasi seperti menonaktifkan compression pada response sensitif, random padding, CSRF token handling yang aman, dan memastikan secret tidak terefleksi bersama input user.

---

## F-004: Informational Wildcard Certificate

**ID:** F-004

**Judul:** Sertifikat TLS menggunakan wildcard `*.itk.ac.id`

**Status:** Informational

**Severity Sementara:** Low

**Confidence:** High

**Bukti Non-Destruktif:**

- Command: `openssl s_client -connect perpustakaan.itk.ac.id:443 -servername perpustakaan.itk.ac.id`
- Ringkasan hasil: Sertifikat subject `CN = *.itk.ac.id`, SAN `*.itk.ac.id, itk.ac.id`, issuer Sectigo.
- Waktu: 2026-05-24 23:13 +08:00

**Analisis:**

Wildcard certificate umum digunakan untuk banyak subdomain dan bukan kerentanan langsung. Risiko operasionalnya adalah jika private key bocor, dampaknya dapat mencakup banyak subdomain yang memakai wildcard tersebut.

**Dampak Potensial:**

Dampak hanya relevan jika terjadi kompromi private key atau tata kelola sertifikat yang lemah.

**Batasan Validasi:**

Tidak ada indikasi private key bocor. Analisis hanya berdasarkan metadata sertifikat publik.

**Rekomendasi Mitigasi:**

Pastikan private key wildcard certificate dilindungi ketat, rotasi dilakukan sesuai kebijakan, dan pertimbangkan sertifikat spesifik per layanan penting jika diperlukan.

---

## F-005: Informational Backend Disclosure Pada Error Page 404

**ID:** F-005

**Judul:** Body 404 endpoint publik menampilkan `Apache/2.4.67 (Debian)`

**Status:** Informational

**Severity Sementara:** Low

**Confidence:** Medium

**Bukti Non-Destruktif:**

- Command: `curl.exe -L https://perpustakaan.itk.ac.id/robots.txt`; `curl.exe -L https://perpustakaan.itk.ac.id/sitemap.xml`
- Ringkasan hasil: Body 404 berisi footer `Apache/2.4.67 (Debian) Server at perpustakaan.itk.ac.id Port 443`, sementara response header tetap `Server: openresty`.
- Waktu: 2026-05-24 23:21 +08:00

**Analisis:**

Perbedaan antara header `openresty` dan footer error page `Apache/2.4.67 (Debian)` mengindikasikan kemungkinan reverse proxy/front server di depan backend Apache, atau error page backend yang diteruskan oleh front server. Ini bukan kerentanan langsung, tetapi menambah informasi fingerprinting.

**Dampak Potensial:**

Informasi versi backend dapat membantu attacker memetakan stack teknologi jika dikombinasikan dengan celah lain.

**Batasan Validasi:**

Belum dilakukan eksploitasi atau enumerasi agresif. Evidence hanya berasal dari endpoint publik standar yang mengembalikan 404.

**Rekomendasi Mitigasi:**

Gunakan custom error page yang tidak menampilkan nama dan versi server backend. Sinkronkan header/error page agar tidak membocorkan detail stack internal yang tidak perlu.

---

## F-006: Outdated WordPress Core dan Theme/Plugin Version Disclosure

**ID:** F-006

**Judul:** WordPress core versi lama (5.9.13) dan versi theme/plugin terekspos pada HTML publik

**Status:** Potensi kerentanan (outdated software)

**Severity Sementara:** Medium

**Confidence:** High untuk version disclosure; Medium untuk klaim kerentanan spesifik (perlu cross-check CVE)

**OWASP/CWE:** OWASP A06:2021 Vulnerable and Outdated Components; CWE-1104 Use of Unmaintained Third Party Components; CWE-200 Information Exposure

**Bukti Non-Destruktif:**

- Command: `curl.exe -s -L https://perpustakaan.itk.ac.id/` lalu filter `generator|wp-content|ver=`
- Ringkasan hasil: Meta tag `<meta name="generator" content="WordPress 5.9.13" />`. Theme Divi terdeteksi dari path `wp-content/themes/Divi/`. Plugin terdeteksi: `wp-pagenavi` versi `2.70` (`pagenavi-css.css?ver=2.70`) dan `chaty` (`chaty/js/cht-front-script.min.js?ver=1639541082`). Aset core memakai `jquery.min.js?ver=3.6.0` dan `jquery-migrate.min.js?ver=3.3.2`.
- Validasi tambahan: `curl.exe -s -o NUL -w "%{http_code}" https://perpustakaan.itk.ac.id/readme.html` mengembalikan `200` (7437 byte), artinya `readme.html` WordPress masih dapat diakses publik.
- Waktu: 2026-06-07 21:18 +08:00

**Analisis:**

WordPress 5.9.x adalah branch lama (rilis awal 2022). Versi `5.9.13` adalah rilis security maintenance pada branch 5.9, tetapi branch ini sudah jauh di belakang versi current. Menjalankan core/theme/plugin lama meningkatkan kemungkinan terdampak kerentanan publik yang sudah ada patch-nya. Version disclosure melalui meta generator, query string `?ver=`, dan `readme.html` mempermudah attacker memetakan versi persis untuk mencari exploit yang cocok.

Plugin `chaty` dan `wp-pagenavi` serta theme `Divi` perlu dicek apakah versinya termasuk yang memiliki CVE diketahui. Pengecekan ini dilakukan secara pasif (lookup database CVE/WPScan), bukan dengan menjalankan exploit ke target.

**Dampak Potensial:**

Jika versi core/theme/plugin yang terekspos memiliki kerentanan publik yang belum dipatch, attacker dapat menargetkan celah spesifik. Pada tahap UAS ini tidak dilakukan eksploitasi, sehingga dampak dinyatakan sebagai potensi.

**Batasan Validasi:**

Tidak dilakukan exploit, login, atau pemindaian plugin intrusive (mis. WPScan enumeration agresif). Versi diambil hanya dari HTML publik dan `readme.html`. Korelasi ke CVE spesifik perlu dilanjutkan sebagai analisis pasif.

**Rekomendasi Mitigasi:**

Update WordPress core ke versi terbaru yang didukung, update theme Divi dan seluruh plugin, hapus/blok akses `readme.html`, dan minimalkan version disclosure (hapus meta generator, kelola query string versi). Terapkan proses patch management rutin.

**Korelasi CVE (Lookup Pasif, 2026-06-07):**

- WordPress `5.9.13` adalah rilis security TERBARU pada branch 5.9 (dirilis 2026-03-12). Jadi situs ini sudah menerima security backport untuk branch 5.9, BUKAN versi yang belum dipatch. Isu sebenarnya: branch 5.9 adalah major version lama (rilis Januari 2022) sementara hanya major version terbaru yang didukung aktif (per endoflife.date). Security fix ke branch lama bersifat best-effort tanpa jaminan/timeframe. Rekomendasi tetap upgrade ke major version current.
- `wp-pagenavi 2.70`: CVE-2022-1757 yang muncul saat pencarian adalah untuk plugin BERBEDA bernama "pagebar" (kebetulan versinya juga 2.70), bukan wp-pagenavi. Jadi CVE itu TIDAK diatribusikan ke target. Pola Full Path Disclosure wp-pagenavi (akses langsung `wp-pagenavi.php`/`scb/Hooks.php`) sudah dicek non-destruktif: `wp-pagenavi.php` = HTTP 500 tanpa kebocoran path, `scb/Hooks.php` = HTTP 200 tanpa pesan error/path. Indikator FPD TIDAK ditemukan (kemungkinan ditangani oleh WAF/konfigurasi). Dicatat sebagai false positive yang sudah divalidasi.
- Theme `Divi` dan plugin `chaty`: versi persis tidak seluruhnya terekspos; korelasi CVE spesifik tidak dapat dipastikan tanpa enumerasi versi lebih lanjut (mis. WPScan dengan API token). Tidak dilakukan eksploitasi.

Kesimpulan korelasi: yang terkonfirmasi adalah version disclosure dan penggunaan major branch lama. Tidak ada CVE spesifik yang terbukti dapat dieksploitasi pada target dalam batas pengujian non-destruktif ini.

---

## F-007: XML-RPC Endpoint Aktif

**ID:** F-007

**Judul:** `xmlrpc.php` aktif dan menerima permintaan POST

**Status:** Potensi misconfiguration / attack surface

**Severity Sementara:** Medium

**Confidence:** High untuk keberadaan endpoint; dampak tidak diuji aktif

**OWASP/CWE:** OWASP A05:2021 Security Misconfiguration; CWE-16 Configuration

**Bukti Non-Destruktif:**

- Command: `curl.exe -s -i https://perpustakaan.itk.ac.id/xmlrpc.php`
- Ringkasan hasil: Response `405 Method Not Allowed` dengan header `Allow: POST` dan body `XML-RPC server accepts POST requests only.`. Ini menunjukkan endpoint XML-RPC aktif.
- Waktu: 2026-06-07 21:19 +08:00

**Analisis:**

`xmlrpc.php` yang aktif adalah attack surface umum pada WordPress. Method seperti `system.multicall` dapat disalahgunakan untuk amplifikasi brute force kredensial, dan method `pingback.ping` dapat disalahgunakan untuk pingback DDoS/SSRF. Pada UAS ini hanya dikonfirmasi keberadaan endpoint melalui response standar; tidak dilakukan pemanggilan method, brute force, atau pingback abuse karena termasuk aktivitas yang dilarang.

**Dampak Potensial:**

Jika tidak dibatasi, endpoint ini dapat dimanfaatkan untuk brute force amplification atau pingback abuse. Dampak nyata bergantung pada konfigurasi dan kontrol lain (mis. rate limiting, WAF).

**Batasan Validasi:**

Hanya GET/HEAD standar yang dikirim. Tidak ada pemanggilan XML-RPC method, tidak ada brute force, tidak ada pingback test.

**Rekomendasi Mitigasi:**

Nonaktifkan `xmlrpc.php` jika tidak digunakan, atau batasi akses (mis. blokir di web server, plugin pembatas, atau nonaktifkan method `pingback`). Terapkan rate limiting dan monitoring pada endpoint autentikasi.

---

## F-008: TLS CBC-Mode Ciphers (Potensi LUCKY13)

**ID:** F-008

**Judul:** Server menawarkan cipher CBC lama yang dilaporkan potensi LUCKY13

**Status:** Potensi (hardening opportunity)

**Severity Sementara:** Low

**Confidence:** Medium (cipher CBC terkonfirmasi ditawarkan; LUCKY13 dalam praktik sulit dieksploitasi dan ditandai experimental oleh tool)

**OWASP/CWE:** OWASP A02:2021 Cryptographic Failures; CWE-327 Use of a Broken or Risky Cryptographic Algorithm

**Bukti Non-Destruktif:**

- Command: `docker run --rm drwetter/testssl.sh -U https://perpustakaan.itk.ac.id/`
- Ringkasan hasil: `LUCKY13 (CVE-2013-0169), experimental: potentially VULNERABLE, uses obsolete cipher block chaining ciphers with TLS, see server prefs.`
- Penguat: `& nmap --script ssl-enum-ciphers` menampilkan banyak cipher `*_CBC_*` (mis. `TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384`, `TLS_RSA_WITH_AES_128_CBC_SHA`) di TLSv1.2, walau seluruh cipher tetap dinilai grade `A` oleh nmap.
- Waktu: 2026-06-07 21:25 +08:00

**Analisis:**

Server mendukung TLSv1.2 dan TLSv1.3 dengan cipher modern grade A, namun masih menawarkan sejumlah cipher CBC pada TLSv1.2. CBC-mode cipher menjadi dasar laporan potensi LUCKY13. Dalam praktik, LUCKY13 adalah timing side-channel yang sulit dieksploitasi dan banyak stack TLS modern sudah memitigasi. Karena itu ini diposisikan sebagai peluang hardening, bukan kerentanan kritis.

**Dampak Potensial:**

Risiko nyata rendah pada kondisi umum. Menyisakan cipher lama memperlebar permukaan kriptografi dan mengurangi skor hardening.

**Batasan Validasi:**

Tidak dilakukan eksploitasi timing/padding. Penilaian berasal dari enumerasi cipher non-destruktif (testssl.sh dan nmap ssl-enum-ciphers).

**Rekomendasi Mitigasi:**

Prioritaskan cipher AEAD (GCM/ChaCha20) dan pertimbangkan menonaktifkan cipher CBC lama pada TLSv1.2 jika kompatibilitas klien memungkinkan. Pertahankan TLSv1.3.

---

## F-009: Web Application Firewall / Security Layer Aktif

**ID:** F-009

**Judul:** Target berada di belakang WAF/security layer (defensive control)

**Status:** Informational (positif untuk defense; relevan untuk metodologi)

**Severity Sementara:** Informational

**Confidence:** Medium-High

**OWASP/CWE:** Bukan kerentanan; defensive control (relevan ke OWASP A05/A06 sebagai mitigasi).

**Bukti Non-Destruktif:**

- Command: `docker run --rm secsi/wafw00f https://perpustakaan.itk.ac.id/`
- Ringkasan hasil: `The site ... seems to be behind a WAF or some sort of security solution. Reason: The server returns a different response code when an attack string is used. Normal response code is "200", while the response code to cross-site scripting attack is "403".`
- Penguat: Nmap menunjukkan 97/100 top ports `filtered`; Nikto berulang kali berhenti pada error limit (SSL/connection errors) yang konsisten dengan pemblokiran pola permintaan oleh security layer.
- Waktu: 2026-06-07 21:26 +08:00

**Analisis:**

Indikasi WAF/security layer (kemungkinan terkait stack openresty/LiteSpeed) menjelaskan beberapa observasi lain: banyak port terfilter dan kegagalan Nikto menyelesaikan scan. Ini adalah kontrol defensif positif. Untuk metodologi, ini juga menjelaskan keterbatasan tool scanner otomatis pada target.

**Dampak Potensial:**

Tidak ada dampak negatif langsung. WAF mengurangi efektivitas serangan otomatis dan scanning intrusive.

**Batasan Validasi:**

Deteksi berbasis perbedaan response code pada pola request standar wafw00f. Vendor/produk WAF persis tidak dipastikan. Tidak dilakukan upaya bypass WAF (di luar scope dan berpotensi melanggar aturan).

**Rekomendasi Mitigasi:**

Pertahankan WAF. Pastikan ruleset diperbarui dan logging/monitoring aktif. WAF adalah mitigasi tambahan, bukan pengganti patching (lihat F-006).

---

## F-010: Shared Hosting / Virtual Host dan Attack Surface Subdomain (OSINT Pasif)

**ID:** F-010

**Judul:** Beberapa subdomain ITK berbagi IP dengan target; attack surface organisasi lebih luas

**Status:** Informational (konteks OSINT)

**Severity Sementara:** Informational

**Confidence:** High untuk pemetaan DNS/IP; daftar subdomain tidak lengkap

**OWASP/CWE:** Konteks reconnaissance; terkait CWE-200 Information Exposure pada level organisasi.

**Bukti Non-Destruktif:**

- Command: `Invoke-RestMethod "https://api.certspotter.com/v1/issuances?domain=itk.ac.id&include_subdomains=true&expand=dns_names"` lalu `Resolve-DnsName` per subdomain.
- Ringkasan hasil: Subdomain dari Certificate Transparency (certspotter) antara lain `e-library`, `api-ipr`, `ipr`, `isl`, `mmt`, `thingsboard`, `inspace`. Resolusi DNS menunjukkan `perpustakaan.itk.ac.id`, `api-ipr.itk.ac.id`, `ipr.itk.ac.id`, `www.itk.ac.id`, dan `itk.ac.id` sama-sama mengarah ke `103.154.74.161` (indikasi shared hosting/virtual host). Subdomain lain berada di IP berbeda (`e-library` 103.216.188.11, `mmt` 3.13.192.206/AWS, `thingsboard` 103.175.228.105, `inspace` 109.106.252.119, `isl` 202.10.43.178).
- crt.sh tidak dapat diakses (HTTP 502 berulang); certspotter free tier membatasi jumlah hasil, sehingga daftar tidak lengkap.
- Waktu: 2026-06-07 21:10 +08:00

**Analisis:**

Beberapa layanan ITK berbagi IP `103.154.74.161` dengan target, mengindikasikan shared hosting/reverse proxy. Secara organisasi, attack surface lebih luas dari satu host. Catatan scope: sesuai instruksi UAS, hanya `perpustakaan.itk.ac.id` yang menjadi target aktivitas aktif. Subdomain lain dicatat sebagai konteks OSINT pasif dan TIDAK dilakukan scanning aktif terhadapnya.

**Dampak Potensial:**

Shared hosting berarti masalah pada satu virtual host dapat berdampak ke host lain di IP yang sama jika isolasi lemah. Ini hanya konteks; tidak ada bukti masalah isolasi yang diuji.

**Batasan Validasi:**

Enumerasi subdomain hanya dari Certificate Transparency pasif dan resolusi DNS publik. Tidak ada brute force DNS, tidak ada scanning ke subdomain di luar target resmi.

**Rekomendasi Mitigasi:**

Pada level organisasi, pastikan isolasi antar virtual host, inventarisasi subdomain, dan hapus/segmentasi layanan yang tidak terpakai. Untuk tim perpustakaan, koordinasikan hardening dengan pengelola infrastruktur ITK.

---

## F-011: Directory Listing (Apache Autoindex) Aktif

**ID:** F-011

**Judul:** Listing direktori aktif pada beberapa path `wp-content`, membuka struktur file dan nama file source

**Status:** Terkonfirmasi (misconfiguration)

**Severity Sementara:** Medium

**Confidence:** High (listing terverifikasi live via GET tunggal dan terindeks Google)

**OWASP/CWE:** OWASP A05:2021 Security Misconfiguration; CWE-548 Exposure of Information Through Directory Listing; CWE-200 Information Exposure

**Bukti Non-Destruktif:**

- Ditemukan via Google dorking pasif: `site:perpustakaan.itk.ac.id intitle:"index of"` (mengembalikan halaman `Index of /wp-content/plugins/wp-stats-manager/...`).
- Verifikasi non-destruktif (GET tunggal per path), seluruhnya HTTP 200 dengan penanda `Index of`:
  - `/wp-content/uploads/` -> listing berisi folder tahun `2020/`..`2026/` dan folder plugin (`Divi/`, `elementor/`, `maxmegamenu/`, `redux/`, `ultimatemember/`, `wp-statistics/`, `wpforms/`).
  - `/wp-content/plugins/wp-stats-manager/includes/` -> listing menampilkan nama file PHP source: `wsm_admin_interface.php`, `wsm_cron.php`, `wsm_db.php`, `wsm_functions.php`, `wsm_init.php`, `wsm_modal.php`, `wsm_requests.php`, `wsm_shortcodeTable.php`, `wsm_statistics.php`.
  - `/wp-content/plugins/wp-stats-manager/` dan `/images/` juga terindeks dengan listing.
- Waktu: 2026-06-14.

**Analisis:**

Web server (Apache autoindex) menampilkan daftar isi direktori ketika tidak ada index file. Ini membocorkan struktur direktori, daftar plugin yang terpasang, dan nama file source PHP. Informasi ini mempermudah penyerang melakukan fingerprinting dan memetakan komponen rentan tanpa perlu menebak. Walau file PHP source tidak dieksekusi sebagai teks (di-handle PHP), terungkapnya nama file dan struktur adalah information disclosure yang nyata.

**Dampak Potensial:**

Mempercepat enumerasi komponen, mengungkap plugin/versi, dan memperluas permukaan serangan terarah (lihat F-012 dan F-013 yang ditemukan justru karena listing ini).

**Batasan Validasi:**

Hanya GET standar untuk membaca halaman listing. Tidak ada file yang diunduh untuk dieksekusi, tidak ada upaya menulis/menghapus file.

**Rekomendasi Mitigasi:**

Nonaktifkan directory listing (`Options -Indexes` di Apache atau `autoindex off` di Nginx), dan/atau tambahkan `index.php`/`index.html` kosong pada direktori. Khusus WordPress, blok akses langsung ke direktori `wp-content/uploads` dan `wp-content/plugins` untuk listing.

---

## F-012: Eksposur File Profil Anggota (Ultimate Member) + Folder Browsable

**ID:** F-012

**Judul:** Folder upload Ultimate Member dapat di-browse dan file profil anggota dapat dienumerasi via ID

**Status:** Terkonfirmasi (sensitive data exposure / broken access control)

**Severity Sementara:** High

**Confidence:** High (listing dan file terverifikasi live; struktur path per-user-ID terkonfirmasi)

**OWASP/CWE:** OWASP A01:2021 Broken Access Control & A05:2021 Security Misconfiguration; CWE-548 Directory Listing; CWE-200 Information Exposure; CWE-639 Authorization Bypass Through User-Controlled Key (akses file by predictable ID)

**Bukti Non-Destruktif:**

- Plugin Ultimate Member (manajemen membership) terpasang; direktori `/wp-content/uploads/ultimatemember/` dapat di-browse (HTTP 200, `Index of`) dan berisi subfolder `1/` dan `temp/`.
- `/wp-content/uploads/ultimatemember/1/` -> HTTP 200, listing aktif, berisi 7 file `.jpg` (karakterisasi tipe file saja; isi/nama file TIDAK diunduh demi melindungi PII).
- Enumerasi keberadaan folder per user ID (cek HTTP status saja, tanpa mengunduh isi): `user_id 1` = HTTP 200 (listing, 7 file), `user_id 2`..`8` = HTTP 404. Pola path per-ID terkonfirmasi dapat ditebak/dienumerasi.
- Ditemukan setelah directory listing (F-011) mengungkap folder `ultimatemember/` di bawah `uploads/`.
- Waktu: 2026-06-14.

**Analisis:**

Ultimate Member menyimpan file yang diunggah anggota (mis. foto profil) di folder per-user-ID yang dapat ditebak, dan directory listing yang aktif membuat file tersebut dapat dijelajahi tanpa autentikasi. Foto profil anggota adalah data pribadi (PII). Kombinasi (a) path per-ID yang predictable dan (b) listing terbuka berarti file anggota dapat dijangkau pihak yang tidak berhak. Saat pengujian hanya `user_id 1` yang memiliki file, namun kelemahan kontrol akses tetap valid dan akan berdampak lebih besar seiring bertambahnya anggota.

**Dampak Potensial:**

Kebocoran file/PII anggota; memungkinkan harvesting foto/dokumen anggota secara otomatis melalui enumerasi ID. Jika folder juga menampung dokumen (KTP/KTM/berkas), dampaknya lebih serius.

**Batasan Validasi:**

Pengujian dibatasi pada pengecekan status HTTP dan tipe file (ekstensi). Tidak ada file gambar/dokumen yang diunduh atau dibuka, sesuai aturan etika UAS (perlindungan PII, non-destruktif). Versi persis plugin Ultimate Member tidak dapat dipastikan (readme di-block, HTTP 404), sehingga korelasi CVE spesifik tidak diklaim.

**Rekomendasi Mitigasi:**

Nonaktifkan directory listing pada `uploads` (lihat F-011); batasi akses langsung ke `wp-content/uploads/ultimatemember/` (mis. `.htaccess deny`, atau serve file via handler yang mengecek otorisasi); pertimbangkan menyimpan file anggota di luar webroot atau dengan nama acak non-enumerable. Tinjau pengaturan privasi Ultimate Member.

---

## F-013: Komponen WordPress Usang dengan Kerentanan Publik (Plugin)

**ID:** F-013

**Judul:** Beberapa plugin terpasang berada pada versi lama dengan kerentanan yang dipublikasikan

**Status:** Terkonfirmasi usang (korelasi CVE pasif; tidak dieksploitasi)

**Severity Sementara:** Medium

**Confidence:** High untuk versi terdeteksi; korelasi CVE bersifat indikatif (banyak butuh autentikasi)

**OWASP/CWE:** OWASP A06:2021 Vulnerable and Outdated Components; CWE-1104 Use of Unmaintained Third Party Components; CWE-937

**Bukti Non-Destruktif:**

- Versi plugin dibaca dari `readme.txt` masing-masing (GET tunggal), `Stable tag`:
  - WPForms (Contact Form by WPForms) = `1.7.4.1` (Tested up to 6.0).
  - Elementor Website Builder = `3.6.5` (Tested up to 5.9).
  - WP Statistics = `14.10`.
  - WP Visitor Statistics (wp-stats-manager) = `6.9.6` (sudah dicatat di F-006/enumerasi).
- Korelasi CVE pasif (lookup database publik Wordfence/WPScan/Patchstack/NVD, tidak menyentuh target):
  - WPForms `1.7.4.1` < `1.7.5.5`: terdampak Admin+ Arbitrary File Access / Directory Traversal (perlu hak admin). Versi terdeteksi berada di bawah versi fix.
  - Elementor `3.6.5`: branch lama; sejumlah CVE diperbaiki pada versi setelahnya (mis. RCE/arbitrary file pada 3.6.x yang diperbaiki di rilis lebih baru; arbitrary file read auth pada versi jauh lebih baru). Mayoritas memerlukan autentikasi (contributor/admin).
  - WP Visitor Statistics `6.9.6`: CVE-2023-0600 (Unauthenticated SQLi) berlaku untuk versi **before 6.9**. Versi terdeteksi `6.9.6` berada **di atas** ambang tersebut, sehingga untuk CVE itu tampak **sudah dipatch**. Tidak diklaim rentan untuk CVE-2023-0600.
- Waktu: 2026-06-14.

**Analisis:**

Situs menjalankan beberapa plugin pada versi yang sudah tertinggal dari rilis terbaru. Untuk WPForms dan Elementor, versi terpasang berada di bawah versi yang memuat perbaikan keamanan, sehingga termasuk komponen usang dengan kerentanan terdokumentasi (umumnya membutuhkan akun terautentikasi untuk dieksploitasi). WP Visitor Statistics `6.9.6` justru tampak sudah melewati ambang CVE SQLi unauth utama, jadi tidak diklaim rentan untuk CVE tersebut. Penilaian ini berbasis korelasi versi-ke-advisory, bukan eksploitasi.

**Dampak Potensial:**

Komponen usang meningkatkan kemungkinan adanya jalur eksploitasi (terutama bila terdapat akun pengguna), dan memperbesar risiko rantai serangan bila dikombinasikan dengan misconfiguration lain (F-011/F-012).

**Batasan Validasi:**

Tidak ada eksploitasi, tidak ada pengiriman payload, tidak ada percobaan SQLi/file traversal aktif. Korelasi CVE bersifat indikatif berdasarkan versi yang terbaca; konfirmasi pasti memerlukan pengujian terotorisasi (mis. WPScan dengan API token) yang berada di luar batas non-destruktif sesi ini.

**Rekomendasi Mitigasi:**

Update seluruh plugin (WPForms, Elementor, WP Statistics, WP Visitor Statistics) ke versi terbaru yang didukung; aktifkan auto-update untuk plugin; hapus plugin yang tidak dipakai; terapkan patch management rutin dan pantau advisory (Wordfence/Patchstack/WPScan).

---

## Kontrol Keamanan Positif (Teridentifikasi)

Bagian ini mendokumentasikan konfigurasi yang sudah baik agar analisis berimbang dan tidak hanya menyoroti kelemahan.

| Kontrol | Bukti | Catatan |
| --- | --- | --- |
| HSTS aktif (preload) | `Strict-Transport-Security: max-age=63072000; preload` | Memaksa HTTPS, mengurangi risiko SSL strip. |
| Redirect HTTP ke HTTPS | HTTP `301` ke HTTPS | Enkripsi diberlakukan untuk root. |
| TLSv1.3 + cipher modern | testssl.sh / openssl: `TLS_AES_256_GCM_SHA384` | Protokol terbaru didukung. |
| Tidak ada TLS protocol lawas | testssl.sh: `no protocol below TLS 1.2 offered` | Tidak ada SSLv3/TLS1.0/1.1. |
| Tahan vuln TLS klasik | testssl.sh: not vulnerable Heartbleed, ROBOT, POODLE, CRIME, FREAK, DROWN, SWEET32, BEAST, no RC4 | TLS stack sehat. |
| HTTP methods minimal | nmap http-methods: `GET HEAD POST OPTIONS` | Tidak ada `PUT/DELETE/TRACE`. |
| WP user enumeration diblok | `/wp-json/wp/v2/users` = 404, `?author=1` = 404 | Mengurangi username harvesting. |
| Banyak port terfilter | nmap: 97/100 top ports filtered | Permukaan layanan dibatasi firewall. |
| WAF/security layer aktif | wafw00f: 403 pada pola serangan | Mitigasi serangan otomatis (F-009). |

---

## Ringkasan Pemetaan OWASP Top 10 (2021) dan CWE

| Finding | Judul Singkat | Severity | OWASP 2021 | CWE |
| --- | --- | --- | --- | --- |
| F-001 | Missing security headers (root/endpoint) | Low | A05 Security Misconfiguration | CWE-693 Protection Mechanism Failure |
| F-002 | Technology/version disclosure (header) | Low (Info) | A05 / A06 | CWE-200 Information Exposure |
| F-003 | BREACH precondition (HTTP compression) | Low | A02 Cryptographic Failures | CWE-310 |
| F-004 | Wildcard certificate | Low (Info) | A02 | CWE-295 (terkait pengelolaan sertifikat) |
| F-005 | Backend disclosure pada 404 (`Apache/2.4.67`) | Low (Info) | A05 / A06 | CWE-200 |
| F-006 | Outdated WordPress 5.9.13 + version disclosure | Medium | A06 Vulnerable & Outdated Components | CWE-1104 / CWE-200 |
| F-007 | XML-RPC endpoint aktif | Medium | A05 Security Misconfiguration | CWE-16 |
| F-008 | TLS CBC ciphers (potensi LUCKY13) | Low | A02 Cryptographic Failures | CWE-327 |
| F-009 | WAF/security layer aktif | Info (positif) | Mitigasi (A05/A06) | - |
| F-010 | Shared hosting / subdomain attack surface | Info | Reconnaissance context | CWE-200 |
| F-011 | Directory listing (autoindex) aktif | Medium | A05 Security Misconfiguration | CWE-548 / CWE-200 |
| F-012 | Eksposur file profil anggota (Ultimate Member) | High | A01 Broken Access Control / A05 | CWE-548 / CWE-639 / CWE-200 |
| F-013 | Plugin usang dengan CVE publik (WPForms/Elementor) | Medium | A06 Vulnerable & Outdated Components | CWE-1104 / CWE-937 |

Catatan: seluruh severity bersifat sementara berdasarkan bukti non-destruktif. Tidak ada finding yang diklaim sebagai kerentanan terkonfirmasi yang dapat dieksploitasi, sesuai batasan UAS.
