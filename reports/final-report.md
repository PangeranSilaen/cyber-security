# Laporan UAS Keamanan Siber
## Identifikasi Kerentanan Website Perpustakaan ITK

## 1. Ringkasan Eksekutif

Tahap awal UAS telah dilakukan dengan pendekatan Windows-first menggunakan PowerShell 7. Aktivitas yang sudah dilakukan masih berada pada fase persiapan dan reconnaissance dasar: setup struktur laporan, cek tools lokal, instalasi Nmap dan Shodan CLI, DNS lookup, serta HTTP/HTTPS header baseline.

Temuan awal bersifat indikatif, bukan klaim eksploitabilitas. Target `perpustakaan.itk.ac.id` memiliki A record `103.154.74.161`, HTTP melakukan redirect ke HTTPS, HTTPS mengembalikan `200 OK`, HSTS aktif, dan terdapat indikasi teknologi `openresty` serta WordPress dari header publik.

## 2. Scope Dan Batasan Etika

Target resmi pengujian adalah `https://perpustakaan.itk.ac.id/`. Pengujian dilakukan untuk kepentingan akademik UAS Keamanan Siber dan dibatasi pada reconnaissance, footprinting, information gathering, scanning wajar, service enumeration, banner grabbing, DNS enumeration, vulnerability scanning non-destruktif, dan identifikasi potensi misconfiguration.

Aktivitas yang tidak dilakukan dan tetap dilarang mencakup eksploitasi aktif, payload/RCE, privilege escalation, brute force, DoS/DDoS, defacement, upload file, SQL injection eksploit aktif, pencurian data, perubahan data, dan penghapusan data.

## 3. Metodologi

Metodologi dilakukan bertahap:

1. Persiapan workspace dan evidence log.
2. Cek ketersediaan tools lokal di Windows.
3. Reconnaissance DNS dan HTTP baseline.
4. Analisis awal security header dan technology disclosure.
5. Tahap berikutnya direncanakan berupa port/service enumeration konservatif setelah konfirmasi.

## 4. Lingkungan Pengujian

- OS: Windows
- Shell: PowerShell 7.6.1
- Tools tersedia: `curl`, `Resolve-DnsName`, `nslookup`, Docker, WSL, OpenSSL, Git
- Tools terinstall saat persiapan: Nmap 7.80, Shodan CLI 1.31.0
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

Baseline header menunjukkan HSTS aktif. Beberapa header keamanan umum belum terlihat pada root page response, termasuk `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, dan `Permissions-Policy`. Ini dicatat sebagai potensi misconfiguration dengan confidence sementara medium dan perlu validasi lanjutan pada endpoint lain.

TLS handshake dengan OpenSSL menunjukkan `TLSv1.3` dan cipher `TLS_AES_256_GCM_SHA384`. Sertifikat wildcard `*.itk.ac.id` diterbitkan untuk `Institut Teknologi Kalimantan` oleh Sectigo dan valid dari 2026-01-19 sampai 2027-02-19. OpenSSL lokal melaporkan `unable to get local issuer certificate`, tetapi ini belum dianggap finding final karena bisa dipengaruhi trust store lokal.

## 10. Hasil Vulnerability Identification Non-Destructive

Belum menjalankan Nikto, Nmap NSE, atau scanner lain. Tahap ini menunggu konfirmasi karena walaupun non-destruktif, scanner menghasilkan lebih banyak request ke target.

Nikto via Docker kemudian dijalankan dengan tuning konservatif `123b` setelah Nmap. Image Docker Hub `sullo/nikto` tidak tersedia, sehingga digunakan `ghcr.io/sullo/nikto`. Scan bersifat parsial karena berhenti pada error limit SSL setelah 329 request atau sekitar 10% complete.

Hasil Nikto yang relevan:

- Missing `X-Content-Type-Options`
- Missing `Referrer-Policy`
- Missing `Permissions-Policy`
- Missing `Content-Security-Policy`
- `Content-Encoding: deflate` sebagai indikasi awal potensi compression side-channel
- Wildcard certificate `*.itk.ac.id` sebagai informational

Karena hasil Nikto parsial, temuan scanner dipakai sebagai penguat indikasi dan tetap perlu validasi non-destruktif lanjutan.

Shodan CLI sudah diinisialisasi oleh user, tetapi query `host` dan `search` mengembalikan `403 Forbidden`. `shodan info` menunjukkan akun memiliki 0 query credits dan 0 scan credits, sehingga data Shodan belum dapat dipakai sebagai evidence CLI pada tahap ini.

Pengecekan endpoint publik standar menunjukkan `robots.txt`, `sitemap.xml`, dan `/wp-json/` mengembalikan 404. Endpoint `index.php?rest_route=/` aktif sebagai WordPress REST API index dengan `X-Robots-Tag: noindex`, `X-Content-Type-Options: nosniff`, `Allow: GET`, serta header CORS terkait WordPress. Body 404 untuk `robots.txt` dan `sitemap.xml` menampilkan footer `Apache/2.4.67 (Debian)`, sementara header tetap `openresty`.

## 11. Daftar Temuan

- F-001: Potensi missing security headers pada root page.
- F-002: Informational technology disclosure dari header publik.
- F-003: Potensi risiko compression side-channel dari `Content-Encoding: deflate`.
- F-004: Informational wildcard certificate `*.itk.ac.id`.
- F-005: Informational backend disclosure pada error page 404.

## 12. Analisis Risiko

Risiko awal masih rendah karena evidence saat ini hanya berasal dari header dan DNS publik. Missing security headers dapat meningkatkan risiko client-side tertentu jika tidak ada mitigasi lain, sedangkan technology disclosure membantu fingerprinting tetapi bukan kerentanan langsung.

## 13. Rekomendasi Mitigasi

- Tambahkan security header yang sesuai, terutama CSP, frame protection, `nosniff`, referrer policy, dan permissions policy.
- Minimalkan header/banner yang tidak diperlukan.
- Pastikan konfigurasi WordPress REST API dan plugin tidak mengekspos data sensitif.

## 14. Kendala Dan Batasan

- `nmap` belum dikenali lewat PATH pada shell berjalan; gunakan full path atau restart terminal.
- Shodan CLI terinstall di Python user Scripts path yang belum masuk PATH pada shell awal.
- Shodan API key tidak diinisialisasi lewat command yang terekspos agar secret tidak tertulis di log.
- Belum dilakukan port scanning atau vulnerability scanning karena menunggu konfirmasi tahap berikutnya.

## 15. Rencana Lanjutan

- Jalankan TLS/header analysis lebih lengkap.
- Gunakan Shodan web UI atau API key dengan query credits jika tetap membutuhkan passive intelligence evidence dari Shodan.
- Jalankan Nikto via Docker secara konservatif jika disetujui.

## 16. Lampiran Command

Lihat `evidence/commands-log.md`.
