# Windows PowerShell 7 Reproduce Steps

## 1. Environment Check

```powershell
$PSVersionTable
where.exe curl
where.exe nmap
where.exe docker
where.exe wsl
where.exe openssl
where.exe shodan
```

## 2. Reconnaissance Dasar

```powershell
Resolve-DnsName perpustakaan.itk.ac.id
Resolve-DnsName perpustakaan.itk.ac.id -Type A
Resolve-DnsName perpustakaan.itk.ac.id -Type AAAA
Resolve-DnsName perpustakaan.itk.ac.id -Type MX
Resolve-DnsName perpustakaan.itk.ac.id -Type NS
nslookup perpustakaan.itk.ac.id
curl.exe -I http://perpustakaan.itk.ac.id/
curl.exe -I https://perpustakaan.itk.ac.id/
curl.exe -L -I https://perpustakaan.itk.ac.id/
```

## 3. Port Dan Service Enumeration

```powershell
& "C:\Program Files (x86)\Nmap\nmap.exe" -Pn -T2 --top-ports 100 perpustakaan.itk.ac.id
```

Opsional setelah disetujui untuk port terbuka saja:

```powershell
& "C:\Program Files (x86)\Nmap\nmap.exe" -Pn -T2 -sV --version-light -p 80,443 perpustakaan.itk.ac.id
```

## 4. HTTP/TLS/Header Analysis

```powershell
curl.exe -vI https://perpustakaan.itk.ac.id/
openssl s_client -connect perpustakaan.itk.ac.id:443 -servername perpustakaan.itk.ac.id
```

## 5. Vulnerability Identification Non-Destructive

Nikto via Docker dengan tuning konservatif:

```powershell
docker run --rm ghcr.io/sullo/nikto -h https://perpustakaan.itk.ac.id/ -Tuning 123b -nointeractive
```

Catatan: pada eksekusi Windows awal, scan berhenti parsial setelah error limit SSL. Hasil harus ditandai partial dan tidak dijadikan klaim final tanpa validasi tambahan.

Shodan CLI sudah terinstall. Untuk setup API key secara secret-safe, jalankan sendiri di terminal lokal atau set environment variable dulu, lalu jalankan `shodan init` dari environment.

Jika `shodan` belum dikenali pada PowerShell yang sedang terbuka, buka PowerShell baru. Alternatif untuk current session:

```powershell
$env:Path = "$env:APPDATA\Python\Python313\Scripts;$env:Path"
shodan version
```

```powershell
$env:SHODAN_API_KEY = "<isi_api_key_di_terminal_lokal>"
shodan init $env:SHODAN_API_KEY
```

Setelah init, query pasif yang bisa digunakan:

```powershell
shodan host 103.154.74.161
shodan search hostname:perpustakaan.itk.ac.id
shodan info
```

Catatan hasil saat ini: `shodan host` dan `shodan search` mengembalikan `403 Forbidden`; `shodan info` menunjukkan 0 query credits dan 0 scan credits.

Endpoint publik ringan:

```powershell
curl.exe -L https://perpustakaan.itk.ac.id/robots.txt
curl.exe -L https://perpustakaan.itk.ac.id/sitemap.xml
curl.exe -L -I https://perpustakaan.itk.ac.id/wp-json/
curl.exe -L -I "https://perpustakaan.itk.ac.id/index.php?rest_route=/"
```

## 6. Catatan Etika

- Jangan menyimpan API key di file project, laporan, screenshot, atau command log.
- Shodan dipakai sebagai passive third-party intelligence, bukan scanning aktif dari mesin lokal.

## 7. Recon Lanjutan (Minggu 4)

### 7.1 Subdomain Enumeration Pasif (Certificate Transparency)

```powershell
# crt.sh (sering 502; coba dulu)
Invoke-RestMethod -Uri "https://crt.sh/?q=%25.itk.ac.id&output=json" |
  ForEach-Object { $_.name_value -split "`n" } | Sort-Object -Unique

# Alternatif: certspotter (dipakai saat crt.sh down)
$r = Invoke-RestMethod -Uri "https://api.certspotter.com/v1/issuances?domain=itk.ac.id&include_subdomains=true&expand=dns_names"
$r.dns_names | Sort-Object -Unique

# Resolusi tiap subdomain
"perpustakaan","e-library","api-ipr","ipr","isl","mmt","thingsboard","inspace" | ForEach-Object {
  Resolve-DnsName "$_.itk.ac.id" -Type A -ErrorAction SilentlyContinue
}
```

Catatan scope: hanya `perpustakaan.itk.ac.id` yang menjadi target aktif. Subdomain lain hanya konteks OSINT pasif, tidak di-scan aktif.

### 7.2 Tech Fingerprint (WordPress / Theme / Plugin)

```powershell
curl.exe -s -L https://perpustakaan.itk.ac.id/ |
  Select-String -Pattern 'generator|wp-content|ver=|themes/|plugins/'
```

Hasil: `WordPress 5.9.13`, theme `Divi`, plugin `wp-pagenavi 2.70` dan `chaty`.

### 7.3 WordPress Exposure + HTTP Methods (non-destruktif)

```powershell
curl.exe -s -i -X OPTIONS https://perpustakaan.itk.ac.id/
curl.exe -s -i https://perpustakaan.itk.ac.id/xmlrpc.php
curl.exe -s -o NUL -w "%{http_code}`n" https://perpustakaan.itk.ac.id/readme.html
curl.exe -s -o NUL -w "%{http_code}`n" https://perpustakaan.itk.ac.id/wp-login.php
curl.exe -s -i https://perpustakaan.itk.ac.id/wp-json/wp/v2/users
curl.exe -s -i "https://perpustakaan.itk.ac.id/?author=1"
```

Hasil: `xmlrpc.php` = `405 Allow: POST` (aktif); `readme.html` & `wp-login.php` = `200`; user enumeration (`wp-json/wp/v2/users`, `?author=1`) = `404` (diblok).

### 7.4 Nmap NSE Safe Scripts

```powershell
& "C:\Program Files (x86)\Nmap\nmap.exe" -Pn -T2 -p 443 `
  --script "ssl-enum-ciphers,ssl-cert,http-methods,http-headers,http-title,http-server-header" `
  perpustakaan.itk.ac.id
```

Hasil: HTTP methods `GET HEAD POST OPTIONS`; semua cipher grade `A`; cert RSA 2048 SHA256.

### 7.5 TLS Vulnerability Assessment (testssl.sh via Docker)

```powershell
docker run --rm drwetter/testssl.sh --color 0 -U https://perpustakaan.itk.ac.id/
```

Hasil: not vulnerable untuk Heartbleed/ROBOT/POODLE/CRIME/FREAK/DROWN/SWEET32/BEAST/RC4. BREACH precondition (gzip) terdeteksi (kondisional). LUCKY13 potentially vulnerable (CBC ciphers, experimental).

### 7.6 WAF Detection (wafw00f via Docker)

```powershell
docker run --rm secsi/wafw00f https://perpustakaan.itk.ac.id/
```

Hasil: terindikasi di belakang WAF/security layer (response `200` -> `403` saat pola serangan dikirim).

### 7.7 Nikto Full Attempt

```powershell
docker run --rm ghcr.io/sullo/nikto -h https://perpustakaan.itk.ac.id/ -ssl -maxtime 240s -timeout 10 -Tuning 123bde -nointeractive
```

Catatan: Nikto tetap berhenti ~10% karena WAF memblok pola request (bukan masalah tuning). Tidak dipaksakan lebih jauh agar tidak masuk area agresif/bypass WAF.
