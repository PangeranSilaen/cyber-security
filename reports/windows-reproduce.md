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
