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

**Status:** Potensi / perlu validasi lanjutan

**Severity Sementara:** Low

**Confidence:** Low

**Bukti Non-Destruktif:**

- Command: `docker run --rm ghcr.io/sullo/nikto -h https://perpustakaan.itk.ac.id/ -Tuning 123b -nointeractive`
- Ringkasan hasil: Nikto melaporkan `The Content-Encoding header is set to "deflate" which may mean that the server is vulnerable to the BREACH attack`.
- Waktu: 2026-05-24 23:15 +08:00

**Analisis:**

BREACH membutuhkan kondisi tertentu, seperti response HTTPS yang terkompresi, adanya secret dalam response body, dan kemampuan attacker mengamati ukuran response serta memengaruhi input. Karena validasi kondisi tersebut dapat masuk ke area pengujian aktif, temuan ini hanya dicatat sebagai indikasi awal dari scanner.

**Dampak Potensial:**

Jika seluruh prasyarat BREACH terpenuhi, compression side-channel dapat membantu attacker menebak nilai rahasia pada response HTTPS. Pada tahap ini belum ada bukti bahwa response target memuat secret yang dapat dieksploitasi.

**Batasan Validasi:**

Tidak dilakukan eksploitasi side-channel atau payload aktif. Nikto scan juga berhenti parsial setelah error limit, sehingga confidence rendah.

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
