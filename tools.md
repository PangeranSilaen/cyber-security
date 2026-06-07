# Tools UAS Keamanan Siber

Target resmi: `https://perpustakaan.itk.ac.id/`

Catatan etika: semua tool di bawah dipakai untuk reconnaissance, footprinting, enumeration, dan vulnerability identification non-destruktif. Hindari exploit aktif, brute force, DoS/DDoS, perubahan data, upload file, atau payload berbahaya.

## Tool Bawaan Windows / PowerShell 7

| Tool | Kegunaan | Contoh Aman |
| --- | --- | --- |
| `curl` | Cek HTTP header, redirect, status code, TLS dasar | `curl -I https://perpustakaan.itk.ac.id/` |
| `Invoke-WebRequest` | Ambil response web, header, link dasar | `Invoke-WebRequest -Uri "https://perpustakaan.itk.ac.id/" -Method Head` |
| `Invoke-RestMethod` | Request HTTP/API sederhana jika relevan | `Invoke-RestMethod -Uri "https://perpustakaan.itk.ac.id/"` |
| `nslookup` | DNS lookup dasar | `nslookup perpustakaan.itk.ac.id` |
| `Resolve-DnsName` | DNS enumeration lebih rapi di PowerShell | `Resolve-DnsName perpustakaan.itk.ac.id -Type A` |
| `Test-NetConnection` | Cek koneksi TCP port tertentu | `Test-NetConnection perpustakaan.itk.ac.id -Port 443` |
| `ping` | Cek reachability ICMP dasar | `ping perpustakaan.itk.ac.id` |
| `tracert` | Melihat jalur jaringan | `tracert perpustakaan.itk.ac.id` |

## Tool Windows Tambahan Prioritas

| Tool | Status | Kegunaan | Catatan |
| --- | --- | --- | --- |
| Nmap for Windows | Direkomendasikan | Port scanning, service/version detection, NSE safe scripts | Gunakan rate konservatif dan hindari scan agresif yang tidak perlu. |
| Shodan CLI | Direkomendasikan jika API key tersedia | OSINT exposure publik dari database Shodan | Pasif terhadap target karena data dari Shodan. |
| OpenSSL | Opsional | Cek sertifikat dan TLS handshake | Biasanya tersedia via Git Bash, WSL, atau install Windows. |
| Git Bash utilities | Opsional | `whois`, `dig`, `openssl`, command Unix ringan | Berguna tanpa pindah penuh ke Linux. |
| Browser DevTools | Direkomendasikan | Cek security headers, cookies, mixed content, teknologi frontend | Aman karena observasi manual. |

## Status Tool Lokal

Update 2026-05-24:

| Tool | Status Lokal | Catatan |
| --- | --- | --- |
| PowerShell | Tersedia | Versi 7.6.1. |
| curl | Tersedia | `C:\Windows\System32\curl.exe`. |
| Nmap | Terinstall | `C:\Program Files (x86)\Nmap\nmap.exe`; gunakan full path jika `nmap` belum masuk PATH sampai terminal direstart. |
| Docker | Tersedia dan engine aktif | Bisa dipakai untuk Nikto nanti jika disetujui. |
| WSL | Tersedia | Alternatif untuk tool Linux/Kali. |
| OpenSSL | Tersedia | Terdeteksi dari Laragon/Git paths. |
| Shodan CLI | Terinstall | Path: `C:\Users\hi\AppData\Roaming\Python\Python313\Scripts\shodan.exe`; API key tidak disimpan di file project. |
| pipx | Tidak tersedia | Tidak diperlukan karena Shodan CLI dipasang via `pip --user`. |

## Nikto

Nikto berguna untuk web server misconfiguration dan known risky files. Jalankan secara konservatif karena tetap melakukan banyak request ke server.

Opsi Windows yang paling praktis:

1. Docker, jika Docker Engine aktif.
2. WSL Ubuntu/Kali.
3. Perl di Windows, jika sudah nyaman setup dependency.

Contoh Docker yang nanti bisa dipakai setelah Docker aktif:

```powershell
docker run --rm sullo/nikto -h https://perpustakaan.itk.ac.id/ -Tuning x
```

Catatan: opsi `-Tuning x` umumnya menghindari test yang terlalu berisiko, tetapi tetap perlu dicek lagi sebelum dipakai dalam laporan final.

## Tool OSINT / Web Publik

| Tool | Kegunaan | Catatan |
| --- | --- | --- |
| Google Dorking | Cari halaman terindeks, file publik, error page, directory listing terindeks | Jangan mencoba akses area privat atau bypass. |
| Shodan Web/CLI | Melihat port/service/cert yang pernah terindeks | Lebih pasif daripada scan langsung. |
| WHOIS/RDAP | Informasi domain/registrar/IP owner | Tergantung domain dan ketersediaan data. |
| crt.sh | Cari certificate transparency records/subdomain | Pasif. |

## Tool Linux/Kali Untuk Reproduce Laporan

Ini bukan prioritas eksekusi utama, tapi nanti dicantumkan sebagai instruksi reproduce karena mata kuliah menyarankan Kali Linux.

| Tool | Padanan Windows | Kegunaan |
| --- | --- | --- |
| `nmap` | Nmap for Windows | Port scan dan service enumeration. |
| `nikto` | Nikto via Docker/WSL | Web vulnerability scanning non-destruktif. |
| `dig` | `Resolve-DnsName`, Git Bash `dig` | DNS query. |
| `whois` | Git Bash/WSL `whois` | WHOIS lookup. |
| `curl` | Windows `curl` | HTTP header dan request dasar. |
| `openssl` | Git Bash/Windows OpenSSL | TLS/certificate inspection. |
| `whatweb` | Tidak bawaan Windows | Identifikasi teknologi web secara pasif/ringan. |
| `sslscan` / `testssl.sh` | OpenSSL manual, Docker/WSL | Audit TLS non-destruktif. |

## Rencana Pemakaian Bertahap

Minggu awal:

- DNS lookup dan OSINT publik.
- HTTP header dan security header review.
- Shodan lookup jika API key tersedia.
- Cek port terbatas dengan `Test-NetConnection` dan/atau Nmap konservatif.

Minggu lanjutan:

- Nmap service/version detection untuk port relevan.
- Nikto scan konservatif jika disetujui dan tool siap.
- TLS/certificate review.
- Analisis potensi misconfiguration berdasarkan bukti non-destruktif.

Minggu laporan:

- Rapikan hasil dalam Markdown.
- Sertakan command Windows yang benar-benar dipakai.
- Sertakan command reproduce Linux/Kali.
- Pisahkan temuan valid, indikasi awal, false positive, kendala, dan batasan etika.
