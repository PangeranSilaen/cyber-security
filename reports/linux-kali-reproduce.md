# Linux/Kali Reproduce Steps

## 1. Reconnaissance Dasar

```bash
dig perpustakaan.itk.ac.id A
dig perpustakaan.itk.ac.id AAAA
dig perpustakaan.itk.ac.id MX
dig perpustakaan.itk.ac.id NS
curl -I https://perpustakaan.itk.ac.id/
curl -L -I https://perpustakaan.itk.ac.id/
```

## 2. Port Dan Service Enumeration

```bash
nmap -Pn -T2 --top-ports 100 perpustakaan.itk.ac.id
nmap -Pn -T2 -sV --version-light -p 80,443 perpustakaan.itk.ac.id
```

## 3. HTTP/TLS/Header Analysis

```bash
curl -I https://perpustakaan.itk.ac.id/
curl -vI https://perpustakaan.itk.ac.id/
openssl s_client -connect perpustakaan.itk.ac.id:443 -servername perpustakaan.itk.ac.id
```

## 4. Vulnerability Identification Non-Destructive

```bash
nikto -h https://perpustakaan.itk.ac.id/
```

Catatan: command Nmap/Nikto dijalankan hanya jika sudah disetujui dan dengan mode konservatif/non-destruktif.

## 5. Recon Lanjutan (Minggu 4)

### 5.1 Subdomain Enumeration Pasif (Certificate Transparency)

```bash
# crt.sh (sering 502)
curl -s "https://crt.sh/?q=%25.itk.ac.id&output=json" | jq -r '.[].name_value' | sort -u

# Alternatif: certspotter
curl -s "https://api.certspotter.com/v1/issuances?domain=itk.ac.id&include_subdomains=true&expand=dns_names" | jq -r '.[].dns_names[]' | sort -u

# Alternatif tool Kali
subfinder -d itk.ac.id -silent
amass enum -passive -d itk.ac.id

# Resolusi
for s in perpustakaan e-library api-ipr ipr isl mmt thingsboard inspace; do
  echo -n "$s.itk.ac.id -> "; dig +short "$s.itk.ac.id" A | tr '\n' ' '; echo
done
```

Scope: hanya `perpustakaan.itk.ac.id` yang di-scan aktif; subdomain lain hanya OSINT pasif.

### 5.2 Tech Fingerprint

```bash
whatweb -a 3 https://perpustakaan.itk.ac.id/
curl -s -L https://perpustakaan.itk.ac.id/ | grep -Eo 'generator[^>]*|wp-content[^"]*ver=[0-9.]*' | head
```

### 5.3 WordPress Exposure + HTTP Methods

```bash
curl -s -i -X OPTIONS https://perpustakaan.itk.ac.id/
curl -s -i https://perpustakaan.itk.ac.id/xmlrpc.php
curl -s -o /dev/null -w "%{http_code}\n" https://perpustakaan.itk.ac.id/readme.html
curl -s -i https://perpustakaan.itk.ac.id/wp-json/wp/v2/users
curl -s -i "https://perpustakaan.itk.ac.id/?author=1"

# WPScan pasif (tanpa brute force; gunakan API token untuk korelasi CVE)
wpscan --url https://perpustakaan.itk.ac.id/ --enumerate vp,vt --no-update --random-user-agent
```

Catatan: WPScan dijalankan tanpa `--passwords`/brute force. `--enumerate vp,vt` (vulnerable plugins/themes) bersifat identifikasi, bukan eksploitasi.

### 5.4 Nmap NSE Safe Scripts

```bash
nmap -Pn -T2 -p 443 --script "ssl-enum-ciphers,ssl-cert,http-methods,http-headers,http-title,http-server-header" perpustakaan.itk.ac.id
```

### 5.5 TLS Vulnerability Assessment

```bash
testssl.sh -U https://perpustakaan.itk.ac.id/
# atau via docker:
docker run --rm drwetter/testssl.sh -U https://perpustakaan.itk.ac.id/
```

### 5.6 WAF Detection

```bash
wafw00f https://perpustakaan.itk.ac.id/
```

Catatan: di Kali, `testssl.sh`, `wafw00f`, `whatweb`, `wpscan`, `nikto`, `subfinder`, dan `amass` umumnya sudah terpasang atau tersedia via `apt`. Jalankan dengan rate wajar dan hanya pada target resmi.
