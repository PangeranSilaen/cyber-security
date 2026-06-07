# Progress Mingguan UAS Keamanan Siber

## Minggu

Minggu 3 - Vulnerability identification non-destruktif.

## Target Progres

- Melakukan HTTP/TLS/header analysis lanjutan secara non-destruktif.
- Mengidentifikasi potensi misconfiguration dari header publik dan metadata TLS.

## Tools Yang Digunakan

- `curl.exe -vI`
- `openssl s_client`
- Docker
- Nikto v2.5.0 via `ghcr.io/sullo/nikto`

## Langkah Yang Dilakukan

- Mengambil verbose HTTPS header dengan `curl.exe -vI`.
- Memeriksa TLS handshake dan certificate metadata dengan `openssl s_client`.
- Mencoba Nikto via Docker. Image `sullo/nikto` tidak tersedia dari Docker Hub, lalu menggunakan `ghcr.io/sullo/nikto`.
- Menjalankan Nikto dengan tuning konservatif `-Tuning 123b` dan `-nointeractive`.

## Hasil Ringkas

- HTTPS menggunakan HTTP/1.1 via ALPN pada hasil `curl`.
- Response header tetap menunjukkan `Server: openresty`, HSTS aktif, WordPress REST API links, `X-LiteSpeed-Tag`, dan `X-Served-By`.
- TLS handshake menggunakan `TLSv1.3` dengan cipher `TLS_AES_256_GCM_SHA384` pada hasil OpenSSL.
- Sertifikat wildcard `*.itk.ac.id`, organisasi `Institut Teknologi Kalimantan`, issuer `Sectigo Public Server Authentication CA OV R36`, valid dari 2026-01-19 sampai 2027-02-19.
- OpenSSL lokal melaporkan `unable to get local issuer certificate`; ini bisa terjadi karena CA bundle lokal/OpenSSL path, sehingga perlu diverifikasi silang sebelum dianggap masalah server.
- Nikto v2.5.0 berjalan parsial: 329 requests, sekitar 10% complete, lalu berhenti karena error limit SSL.
- Nikto menguatkan indikasi missing headers: `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, dan `Content-Security-Policy`.
- Endpoint `index.php?rest_route=/` aktif sebagai WordPress REST API index dan mengembalikan `Content-Type: application/json`, `X-Robots-Tag: noindex`, `X-Content-Type-Options: nosniff`, `Allow: GET`, serta CORS-related allow/expose headers.
- Endpoint `/robots.txt`, `/sitemap.xml`, dan `/wp-json/` mengembalikan `404 Not Found` pada pengecekan awal.
- Body 404 untuk `robots.txt` dan `sitemap.xml` menampilkan footer `Apache/2.4.67 (Debian)`, sedangkan header tetap `Server: openresty`; ini menunjukkan kemungkinan reverse proxy/front server di depan backend Apache atau custom error page backend.
- Nikto melaporkan `Content-Encoding: deflate` sebagai potensi terkait BREACH; perlu validasi hati-hati karena ini bergantung pada konteks respons, secret dalam response, dan kondisi attacker.
- Nikto mencatat wildcard certificate `*.itk.ac.id` sebagai informational.
- Shodan CLI sudah diinisialisasi user, tetapi `shodan host` dan `shodan search` mengembalikan `403 Forbidden`. `shodan info` menunjukkan `Query credits available: 0` dan `Scan credits available: 0`, sehingga passive Shodan evidence belum dapat digunakan dari CLI saat ini.

## Temuan Sementara

- TLSv1.3 dan cipher modern terdeteksi, ini positif.
- HSTS aktif, ini positif.
- Missing security headers umum pada root response tetap menjadi potensi misconfiguration.
- Certificate validation warning dari OpenSSL lokal dicatat sebagai perlu validasi silang, bukan finding final.
- Nikto partial scan mendukung finding missing security headers, tetapi hasil scan tidak lengkap karena berhenti pada error limit.
- Potensi BREACH dari compression perlu ditulis sebagai indikasi awal/low confidence sampai ada validasi non-destruktif lanjutan.
- Missing `X-Content-Type-Options` tidak berlaku merata untuk semua endpoint karena WordPress REST API route menampilkan `X-Content-Type-Options: nosniff`. Finding harus menyebut root page/endpoint tertentu.
- Disclosure backend Apache pada body 404 adalah informational dan perlu dikonfirmasi dengan endpoint publik lain sebelum dijadikan finding terpisah.

## Kendala

- Output OpenSSL dari Laragon/Git dapat bergantung pada trust store lokal, sehingga `Verify return code: 20` belum cukup untuk klaim sertifikat bermasalah.
- Nikto berhenti setelah 20 error SSL dan hanya menyelesaikan sekitar 10% scan.
- Shodan CLI tidak bisa mengambil data target karena akun tidak memiliki query credits saat pengecekan.

## Batasan Etika

- Pemeriksaan dilakukan dengan HEAD request dan TLS handshake standar.
- Tidak ada exploit, payload, brute force, atau scanner intrusive.

## Rencana Lanjutan

- Jalankan Nikto via Docker dengan tuning konservatif jika tetap diperlukan.
- Gunakan Shodan sebagai passive evidence setelah CLI diinisialisasi secara secret-safe.
- Validasi ulang header pada beberapa endpoint publik terbatas seperti root, `robots.txt`, dan `sitemap.xml`.
- Pertimbangkan ulang Nikto dengan opsi yang lebih stabil atau dari WSL/Kali jika diperlukan untuk minggu berikutnya.
- Jika butuh Shodan evidence, gunakan Shodan web UI atau akun/API key dengan query credits.
