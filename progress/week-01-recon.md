# Progress Mingguan UAS Keamanan Siber

## Minggu

Minggu 1 - Setup, scope, reconnaissance dasar, DNS, HTTP/TLS baseline.

## Target Progres

- Menetapkan scope dan batasan etika.
- Mengecek ketersediaan tools di Windows PowerShell 7.
- Melakukan DNS lookup dan HTTP header baseline secara aman.

## Tools Yang Digunakan

- PowerShell 7.6.1
- `Resolve-DnsName`
- `nslookup`
- `curl.exe`
- `winget`
- `py -m pip`
- Docker check lokal

## Langkah Yang Dilakukan

- Membuat struktur awal laporan, evidence, progress, notes, dan reports.
- Mengecek tool lokal di Windows.
- Menginstall Nmap for Windows karena belum tersedia.
- Menginstall Shodan CLI karena belum tersedia.
- Mengecek Docker Engine untuk opsi Nikto via Docker nanti.
- Melakukan DNS lookup dasar terhadap `perpustakaan.itk.ac.id`.
- Melakukan HTTP/HTTPS header baseline dengan request `HEAD` ringan.
- Mengecek redirect dari HTTP ke HTTPS.

## Hasil Ringkas

- DNS records: A record `103.154.74.161`; tidak terlihat AAAA/MX/NS khusus untuk subdomain pada hasil awal.
- HTTP status: HTTPS mengembalikan `200 OK`.
- Redirect behavior: HTTP `http://perpustakaan.itk.ac.id/` mengembalikan `301 Moved Permanently` ke HTTPS.
- Header awal yang terlihat: `Server: openresty`, `Strict-Transport-Security: max-age=63072000; preload`, `X-LiteSpeed-Tag`, `X-Served-By`, dan beberapa `Link` WordPress REST API.
- Indikasi teknologi: WordPress terindikasi dari REST API link `?rest_route=/` dan `wp/v2/pages`.

## Temuan Sementara

- HSTS aktif, ini positif untuk HTTPS enforcement.
- Header keamanan seperti `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, dan `Permissions-Policy` belum terlihat pada baseline root page; perlu validasi lanjutan sebelum ditulis sebagai finding final.
- Server/software disclosure terlihat (`openresty`, WordPress REST link, `X-LiteSpeed-Tag`, `X-Served-By`); saat ini dicatat sebagai informational.

## Kendala

- `nmap` sudah terinstall tetapi belum dikenali lewat PATH pada shell berjalan; gunakan full path `C:\Program Files (x86)\Nmap\nmap.exe` atau restart terminal.
- Shodan CLI sudah terinstall tetapi path Python user Scripts belum masuk PATH pada shell awal; gunakan full path `C:\Users\hi\AppData\Roaming\Python\Python313\Scripts\shodan.exe` atau update PATH.
- Shodan API key tidak ditulis ke file project; init CLI belum dilakukan dalam command yang terekspos log.
- Tidak ada kendala akses HTTP/HTTPS pada baseline awal.

## Batasan Etika

- Tidak ada eksploitasi aktif.
- Tidak ada brute force, payload, DoS/DDoS, atau perubahan data.
- Recon dilakukan hanya pada target resmi dan data publik.

## Rencana Lanjutan

- Konfirmasi user sebelum Nmap.
- Lanjut port/service enumeration konservatif.
