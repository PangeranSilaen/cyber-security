# Progress Mingguan UAS Keamanan Siber

## Minggu

Minggu 4 - Analisis lanjutan, validasi temuan, perluasan recon, dan finalisasi laporan.

## Target Progres

- Memperluas reconnaissance: subdomain enumeration pasif via Certificate Transparency.
- Memvalidasi temuan TLS secara non-destruktif (validasi/tolak indikasi BREACH dari Nikto).
- Menambah identifikasi kerentanan: tech fingerprint, WordPress exposure, HTTP methods, WAF detection.
- Memetakan temuan ke OWASP Top 10 dan CWE.
- Mendokumentasikan kontrol keamanan positif agar analisis berimbang.

## Tools Yang Digunakan

- certspotter API (Certificate Transparency) + `Resolve-DnsName`
- `curl.exe` (fingerprint, WP exposure, HTTP methods)
- Nmap 7.80 NSE safe scripts (`ssl-enum-ciphers`, `ssl-cert`, `http-methods`, `http-headers`)
- testssl.sh v3.2.3 via Docker (`drwetter/testssl.sh`)
- wafw00f v2.4.2 via Docker (`secsi/wafw00f`)
- Nikto v2.5.0 via Docker (`ghcr.io/sullo/nikto`)

## Langkah Yang Dilakukan

- Subdomain enumeration via certspotter (crt.sh down, `502` berulang) lalu resolusi DNS tiap subdomain.
- Tech fingerprint dari HTML root: identifikasi WordPress 5.9.13, theme Divi, plugin wp-pagenavi 2.70 dan chaty.
- Cek endpoint WordPress umum: `xmlrpc.php`, `readme.html`, `wp-login.php`, `wp-json/wp/v2/users`, `?author=1`.
- Cek HTTP methods via `OPTIONS` dan nmap `http-methods`.
- TLS vulnerability assessment dengan testssl.sh.
- WAF detection dengan wafw00f.
- Percobaan menyelesaikan Nikto dengan limit dinaikkan.

## Hasil Ringkas

- Subdomain `itk.ac.id` (parsial): `e-library`, `api-ipr`, `ipr`, `isl`, `mmt`, `thingsboard`, `inspace`. `perpustakaan`, `api-ipr`, `ipr`, `www`, `itk.ac.id` berbagi IP `103.154.74.161` (shared host).
- WordPress 5.9.13 (branch lama), Divi, wp-pagenavi 2.70, chaty; `readme.html` dapat diakses (`200`).
- `xmlrpc.php` aktif (`405 Allow: POST`); `wp-login.php` `200`.
- User enumeration diblok: `/wp-json/wp/v2/users` dan `?author=1` keduanya `404`.
- HTTP methods aman: hanya `GET HEAD POST OPTIONS`.
- TLS: semua cipher grade A, TLSv1.3 didukung, tidak ada protokol lawas. testssl.sh: not vulnerable untuk Heartbleed/ROBOT/POODLE/CRIME/FREAK/DROWN/SWEET32/BEAST/RC4. BREACH precondition (gzip) terkonfirmasi (kondisional). LUCKY13 potentially vulnerable (CBC ciphers, experimental).
- WAF/security layer terdeteksi (response `200` -> `403` pada pola serangan). Konsisten dengan 97/100 port filtered dan kegagalan Nikto.

## Temuan Sementara

- Finding baru: F-006 (outdated WordPress + version disclosure, Medium), F-007 (xmlrpc aktif, Medium), F-008 (CBC ciphers / potensi LUCKY13, Low), F-009 (WAF aktif, Info positif), F-010 (shared host / subdomain attack surface, Info).
- F-003 (BREACH) di-upgrade confidence ke Medium karena prasyarat kompresi terkonfirmasi dua tool, tetapi tetap status potensi (dampak tidak diuji aktif).
- Kontrol positif didokumentasikan terpisah: HSTS, redirect HTTPS, TLS modern, user enumeration diblok, HTTP methods minimal, WAF.

## Kendala

- crt.sh tidak dapat diakses (`502` berulang); diatasi dengan certspotter, namun free tier membatasi hasil sehingga daftar subdomain tidak lengkap.
- Nikto tetap gagal menyelesaikan scan (~10%) karena WAF memblok pola request; ini didokumentasikan sebagai temuan (F-009), bukan dipaksakan.
- Korelasi versi plugin/theme ke CVE spesifik belum dituntaskan (perlu lookup pasif WPScan/CVE).

## Batasan Etika

- Seluruh aktivitas non-destruktif: GET/HEAD/OPTIONS standar, TLS handshake, lookup CT log pasif, NSE kategori safe.
- Tidak ada exploit, payload, brute force, pingback abuse, XML-RPC method call, atau upaya bypass WAF.
- Scanning aktif dibatasi hanya ke target resmi `perpustakaan.itk.ac.id`; subdomain lain hanya OSINT pasif.

## Rencana Lanjutan

- Lookup pasif CVE untuk WordPress 5.9.13, Divi, wp-pagenavi 2.70, chaty (sumber: WPScan/CVE database) tanpa menjalankan exploit.
- Finalisasi laporan akhir, instruksi reproduce Windows dan Linux/Kali.
- Susun rekomendasi mitigasi prioritas untuk pengelola.
