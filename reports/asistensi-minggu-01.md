# Laporan Asistensi Minggu 1
## UAS Keamanan Siber - Identifikasi Kerentanan Website Perpustakaan ITK

## 1. Identitas Singkat

- Mata kuliah: Keamanan Siber
- Bentuk tugas: Project kelompok identifikasi kerentanan website
- Jumlah anggota kelompok: 3 orang
- Target resmi: `https://perpustakaan.itk.ac.id/`
- Lingkungan kerja utama: Windows dengan PowerShell 7
- Pendekatan: reconnaissance, enumeration, dan vulnerability identification non-destruktif

## 2. Batasan Etika

Pengujian dilakukan hanya untuk kebutuhan akademik dan mengikuti instruksi UAS. Aktivitas yang dilakukan pada minggu ini masih berada pada tahap observasi dan identifikasi awal.

Yang dilakukan:

- DNS lookup
- HTTP header checking
- Port scanning konservatif
- Service/version detection ringan pada port terbuka
- TLS/certificate checking
- Vulnerability scanning non-destruktif dengan Nikto tuning konservatif
- Passive intelligence check menggunakan Shodan CLI

Yang tidak dilakukan:

- Eksploitasi aktif
- Brute force login
- SQL injection eksploit aktif
- DoS/DDoS
- Upload file
- Pengambilan, perubahan, atau penghapusan data
- Payload/RCE/privilege escalation

Penjelasan sederhana: kami hanya melihat informasi publik dan konfigurasi yang bisa diamati secara aman. Kami tidak mencoba masuk ke sistem, tidak mencoba merusak layanan, dan tidak menjalankan payload berbahaya.

## 3. Tools Yang Digunakan

| Tool | Fungsi | Status |
| --- | --- | --- |
| PowerShell 7 | Terminal utama di Windows | Digunakan |
| `Resolve-DnsName` | DNS lookup | Digunakan |
| `nslookup` | DNS lookup pembanding | Digunakan |
| `curl.exe` | Cek HTTP/HTTPS header dan endpoint publik | Digunakan |
| Nmap 7.80 | Port scanning dan service detection | Terinstall dan digunakan |
| OpenSSL | Cek TLS handshake dan sertifikat | Digunakan |
| Docker | Menjalankan Nikto | Digunakan |
| Nikto v2.5.0 | Vulnerability scanning non-destruktif | Digunakan parsial |
| Shodan CLI | Passive intelligence | Sudah init, tetapi query terkena batas credit |

## 4. Langkah Pengujian Dan Hasil

### 4.1 DNS Lookup

Command Windows:

```powershell
Resolve-DnsName perpustakaan.itk.ac.id
Resolve-DnsName perpustakaan.itk.ac.id -Type A
Resolve-DnsName perpustakaan.itk.ac.id -Type AAAA
Resolve-DnsName perpustakaan.itk.ac.id -Type MX
Resolve-DnsName perpustakaan.itk.ac.id -Type NS
nslookup perpustakaan.itk.ac.id
```

Hasil ringkas:

- Domain `perpustakaan.itk.ac.id` memiliki A record `103.154.74.161`.
- Tidak ditemukan AAAA/MX/NS khusus untuk subdomain pada hasil awal.
- Authority DNS mengarah ke domain induk `itk.ac.id`.

Penjelasan sederhana: DNS lookup digunakan untuk mengetahui alamat IP dari domain target. Dari sini diketahui bahwa website mengarah ke IP `103.154.74.161`.

### 4.2 HTTP Dan HTTPS Header Baseline

Command Windows:

```powershell
curl.exe -I http://perpustakaan.itk.ac.id/
curl.exe -I https://perpustakaan.itk.ac.id/
curl.exe -L -I https://perpustakaan.itk.ac.id/
```

Hasil ringkas:

- HTTP mengembalikan `301 Moved Permanently` ke HTTPS.
- HTTPS mengembalikan `200 OK`.
- Header `Server` menunjukkan `openresty`.
- Header `Strict-Transport-Security` aktif dengan nilai `max-age=63072000; preload`.
- Terdapat beberapa `Link` header yang mengarah ke WordPress REST API.

Penjelasan sederhana: redirect dari HTTP ke HTTPS adalah hal baik karena pengguna diarahkan ke koneksi terenkripsi. HSTS juga positif karena browser diarahkan untuk selalu memakai HTTPS. Namun header juga menunjukkan beberapa informasi teknologi seperti `openresty` dan indikasi WordPress.

### 4.3 Port Scanning Konservatif Dengan Nmap

Command Windows:

```powershell
& "C:\Program Files (x86)\Nmap\nmap.exe" -Pn -T2 --top-ports 100 perpustakaan.itk.ac.id
```

Hasil ringkas:

- Host aktif: `103.154.74.161`
- Port terbuka:
  - `80/tcp` - HTTP
  - `443/tcp` - HTTPS
- Port tertutup:
  - `113/tcp` - ident
- 97 port lain filtered

Penjelasan sederhana: port 80 dan 443 wajar terbuka karena website memang memakai HTTP/HTTPS. Banyak port lain filtered berarti ada filtering firewall atau network policy, yang biasanya merupakan hal baik.

### 4.4 Service Detection Ringan

Command Windows:

```powershell
& "C:\Program Files (x86)\Nmap\nmap.exe" -Pn -T2 -sV --version-light -p 80,443 perpustakaan.itk.ac.id
```

Hasil ringkas:

- `80/tcp` terdeteksi sebagai `OpenResty web app server`.
- `443/tcp` terdeteksi sebagai `OpenResty web app server`.

Penjelasan sederhana: service detection digunakan untuk mengetahui layanan apa yang berjalan di port terbuka. Hasilnya menunjukkan bahwa website kemungkinan berada di belakang OpenResty, yaitu web server/reverse proxy berbasis Nginx.

### 4.5 TLS Dan Sertifikat

Command Windows:

```powershell
curl.exe -vI https://perpustakaan.itk.ac.id/
openssl s_client -connect perpustakaan.itk.ac.id:443 -servername perpustakaan.itk.ac.id
```

Hasil ringkas:

- TLS menggunakan `TLSv1.3`.
- Cipher yang terlihat: `TLS_AES_256_GCM_SHA384`.
- Sertifikat menggunakan wildcard `*.itk.ac.id`.
- Sertifikat diterbitkan untuk `Institut Teknologi Kalimantan`.
- Issuer: Sectigo.
- Masa berlaku terlihat dari 2026-01-19 sampai 2027-02-19.
- OpenSSL lokal menampilkan warning `unable to get local issuer certificate`.

Penjelasan sederhana: TLSv1.3 dan cipher modern adalah hal positif. Wildcard certificate bukan kerentanan langsung, tetapi perlu dijaga baik-baik karena satu sertifikat dapat berlaku untuk banyak subdomain. Warning OpenSSL belum langsung dianggap masalah server karena bisa dipengaruhi trust store lokal di komputer penguji.

### 4.6 Nikto Non-Destructive Scan

Command Windows:

```powershell
docker run --rm ghcr.io/sullo/nikto -h https://perpustakaan.itk.ac.id/ -Tuning 123b -nointeractive
```

Hasil ringkas:

- Nikto berjalan parsial dengan 329 request.
- Scan berhenti sekitar 10% karena mencapai error limit SSL.
- Nikto mendeteksi beberapa header yang disarankan belum terlihat:
  - `Content-Security-Policy`
  - `Referrer-Policy`
  - `Permissions-Policy`
  - `X-Content-Type-Options`
- Nikto melaporkan `Content-Encoding: deflate` sebagai indikasi awal potensi risiko BREACH.
- Nikto mencatat wildcard certificate `*.itk.ac.id`.

Penjelasan sederhana: Nikto digunakan untuk mencari indikasi konfigurasi web server yang kurang aman. Karena scan berhenti parsial, hasil Nikto tidak boleh dianggap final 100%. Namun hasilnya tetap berguna sebagai bukti awal untuk diperiksa lebih lanjut.

### 4.7 Shodan CLI

Command Windows:

```powershell
shodan host 103.154.74.161
shodan search hostname:perpustakaan.itk.ac.id
shodan info
```

Hasil ringkas:

- Shodan CLI sudah berhasil diinisialisasi.
- `shodan host` dan `shodan search` mengembalikan `403 Forbidden`.
- `shodan info` menunjukkan:
  - Query credits: 0
  - Scan credits: 0

Penjelasan sederhana: Shodan seharusnya bisa dipakai untuk melihat data pasif dari internet tanpa melakukan scan langsung dari komputer kita. Namun akun/API key yang dipakai tidak memiliki credit, sehingga data Shodan belum bisa digunakan sebagai evidence pada minggu ini.

### 4.8 Endpoint Publik Ringan

Command Windows:

```powershell
curl.exe -L https://perpustakaan.itk.ac.id/robots.txt
curl.exe -L https://perpustakaan.itk.ac.id/sitemap.xml
curl.exe -L -I https://perpustakaan.itk.ac.id/wp-json/
curl.exe -L -I "https://perpustakaan.itk.ac.id/index.php?rest_route=/"
```

Hasil ringkas:

- `/robots.txt` mengembalikan `404 Not Found`.
- `/sitemap.xml` mengembalikan `404 Not Found`.
- `/wp-json/` mengembalikan `404 Not Found`.
- `index.php?rest_route=/` aktif dan mengembalikan `200 OK` dengan JSON WordPress REST API.
- Endpoint REST API memiliki `X-Content-Type-Options: nosniff`.
- Body 404 menampilkan footer `Apache/2.4.67 (Debian)`, sedangkan header utama menunjukkan `openresty`.

Penjelasan sederhana: REST API WordPress aktif lewat format `index.php?rest_route=/`. Selain itu, halaman error 404 menampilkan informasi backend Apache. Ini bukan celah langsung, tapi bisa menjadi informasi tambahan bagi penyerang untuk memahami stack server.

## 5. Temuan Sementara

### F-001: Potensi Missing Security Headers Pada Root Page

Status: Potensi misconfiguration

Severity sementara: Low

Confidence: Medium untuk root page, Low untuk generalisasi seluruh situs

Bukti:

- `curl.exe -I https://perpustakaan.itk.ac.id/`
- Nikto partial scan

Penjelasan sederhana: beberapa security header belum terlihat pada halaman utama. Header seperti CSP, Referrer-Policy, Permissions-Policy, dan X-Content-Type-Options dapat membantu browser mengurangi risiko serangan tertentu. Namun endpoint REST API sudah memiliki `X-Content-Type-Options`, jadi temuan ini harus ditulis per endpoint, bukan digeneralisasi ke seluruh website.

### F-002: Informational Technology Disclosure

Status: Informational

Severity sementara: Low

Confidence: Medium

Bukti:

- Header `Server: openresty`
- Header WordPress REST API links
- Header `X-LiteSpeed-Tag`
- Header `X-Served-By`

Penjelasan sederhana: website menampilkan beberapa informasi teknologi yang digunakan. Ini bukan kerentanan langsung, tetapi bisa membantu proses fingerprinting.

### F-003: Potensi Compression Side-Channel Dari Deflate

Status: Potensi / perlu validasi lanjutan

Severity sementara: Low

Confidence: Low

Bukti:

- Nikto melaporkan `Content-Encoding: deflate` sebagai indikasi potensi BREACH.

Penjelasan sederhana: BREACH adalah risiko yang berhubungan dengan kompresi HTTPS dan data rahasia dalam response. Namun risikonya hanya valid jika syarat tertentu terpenuhi. Karena belum dilakukan validasi aktif, temuan ini hanya dicatat sebagai indikasi awal.

### F-004: Wildcard Certificate

Status: Informational

Severity sementara: Low

Confidence: High

Bukti:

- Sertifikat TLS menggunakan `*.itk.ac.id`.

Penjelasan sederhana: wildcard certificate normal digunakan untuk banyak subdomain. Ini bukan masalah langsung, tetapi private key harus dijaga dengan baik karena dampaknya bisa luas jika bocor.

### F-005: Backend Disclosure Pada Error Page 404

Status: Informational

Severity sementara: Low

Confidence: Medium

Bukti:

- Body 404 menampilkan `Apache/2.4.67 (Debian)`.
- Header utama tetap menunjukkan `openresty`.

Penjelasan sederhana: ini menunjukkan kemungkinan OpenResty berada di depan backend Apache. Informasi versi backend sebaiknya tidak ditampilkan pada error page karena membantu fingerprinting.

## 6. Kendala Minggu Ini

- Nmap awalnya belum terinstall, lalu diinstall via `winget`.
- Shodan CLI awalnya belum dikenali PowerShell karena path Python Scripts belum masuk PATH.
- Shodan sudah init, tetapi akun/API key tidak memiliki query credits sehingga `host` dan `search` gagal `403 Forbidden`.
- Nikto Docker image `sullo/nikto` di Docker Hub tidak tersedia, sehingga digunakan `ghcr.io/sullo/nikto`.
- Nikto scan berhenti parsial karena error limit SSL.
- Beberapa hasil perlu divalidasi lagi karena berasal dari scan parsial atau endpoint tertentu saja.

## 7. Kesimpulan Minggu Ini

Pada minggu pertama, kelompok sudah berhasil melakukan setup tools, reconnaissance dasar, port scanning konservatif, service detection ringan, TLS/header analysis, serta vulnerability identification awal yang non-destruktif.

Secara umum, layanan utama yang terlihat hanya HTTP dan HTTPS. HTTP redirect ke HTTPS dan HSTS aktif, yang merupakan konfigurasi positif. Namun terdapat beberapa potensi hardening yang bisa dianalisis lebih lanjut, terutama security headers, disclosure teknologi, dan error page yang menampilkan informasi backend.

Temuan minggu ini masih bersifat awal dan perlu validasi lanjutan. Tidak ada eksploitasi aktif yang dilakukan.

## 8. Rencana Minggu Berikutnya

- Validasi security headers pada beberapa endpoint publik terbatas.
- Cek konfigurasi WordPress REST API secara pasif/non-destruktif.
- Jika memungkinkan, gunakan Shodan web UI atau API key dengan query credits untuk passive evidence.
- Jalankan ulang Nikto dari WSL/Kali atau dengan konfigurasi yang lebih stabil jika diperlukan.
- Rapikan severity dan confidence tiap finding.
- Mulai menyusun bagian metodologi dan hasil pada laporan final.

## 9. Instruksi Reproduce Di Linux/Kali

DNS dan HTTP baseline:

```bash
dig perpustakaan.itk.ac.id A
dig perpustakaan.itk.ac.id AAAA
dig perpustakaan.itk.ac.id MX
dig perpustakaan.itk.ac.id NS
curl -I http://perpustakaan.itk.ac.id/
curl -I https://perpustakaan.itk.ac.id/
curl -L -I https://perpustakaan.itk.ac.id/
```

Nmap konservatif:

```bash
nmap -Pn -T2 --top-ports 100 perpustakaan.itk.ac.id
nmap -Pn -T2 -sV --version-light -p 80,443 perpustakaan.itk.ac.id
```

TLS check:

```bash
openssl s_client -connect perpustakaan.itk.ac.id:443 -servername perpustakaan.itk.ac.id
```

Nikto konservatif:

```bash
nikto -h https://perpustakaan.itk.ac.id/ -Tuning 123b -nointeractive
```

Endpoint publik ringan:

```bash
curl -L https://perpustakaan.itk.ac.id/robots.txt
curl -L https://perpustakaan.itk.ac.id/sitemap.xml
curl -L -I https://perpustakaan.itk.ac.id/wp-json/
curl -L -I "https://perpustakaan.itk.ac.id/index.php?rest_route=/"
```

Catatan: semua command di atas tetap harus dijalankan dengan rate wajar dan hanya untuk target resmi.
