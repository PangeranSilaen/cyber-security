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
