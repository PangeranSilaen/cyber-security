# Laporan UAS Keamanan Siber

## Identifikasi Kerentanan Website ITK Press (dev-itkpress.itk.ac.id)

## 1. Ringkasan Eksekutif

Project UAS ini melakukan identifikasi kerentanan non-destruktif terhadap target resmi `https://dev-itkpress.itk.ac.id/home` (arahan dosen, 2026-05-20), dengan pendekatan Windows-first (PowerShell 7). Karena target adalah environment `dev` yang rapuh (dosen meminta dilaporkan bila down), pengujian dibuat ekstra konservatif: recon pasif, GET/HEAD tunggal dengan jeda, port scan timing lambat, tanpa scanner agresif/Nikto dan tanpa eksploitasi.

Target adalah platform penerbitan **Open Monograph Press (OMP) 3.3.0.12** dari PKP (Public Knowledge Project), berjalan di `openresty`, IP `103.154.74.161` (shared host dengan `perpustakaan.itk.ac.id` dan layanan ITK lain). Lapisan transport baik (HSTS preload, redirect HTTP->HTTPS), namun terdapat beberapa temuan: komponen aplikasi usang dengan CVE publik (High), cookie sesi tanpa flag keamanan (Medium), serta sejumlah misconfiguration dan information disclosure (Low/Info).

Seluruh severity bersifat sementara berdasarkan bukti non-destruktif. Tidak ada kerentanan yang dibuktikan dapat dieksploitasi; verifikasi dibatasi pada status HTTP, header, dan fingerprint versi. Dua topik wajib instruksi tubes - **Injection Attack** dan **Unrestricted File Upload** - telah diuji secara non-destruktif: input pencarian publik tampak ter-sanitasi (tidak ada error/anomali SQL), dan mekanisme upload OMP berada di balik autentikasi (tidak terjangkau anonim). Daftar lengkap finding (DITK-001..DITK-009) dan pemetaan OWASP/CWE ada di `evidence/findings-dev-itkpress.md`.

## 2. Scope Dan Batasan Etika

- Target aktif: hanya `dev-itkpress.itk.ac.id`. Host produksi sibling `itkpress.itk.ac.id` (ditemukan via `robots.txt`) TIDAK di-scan aktif, hanya dicatat sebagai OSINT.
- Non-destruktif total: tidak ada exploit, payload, brute force, percobaan XSS/SQLi/CSRF aktif, pembuatan akun, atau upaya login.
- Env dev rapuh: liveness dicek sebelum tiap fase; aktivitas dihentikan dan dilaporkan bila target down.
- Perlindungan secret: isi `config.inc.php` tidak ditampilkan/disimpan.

## 3. Metodologi

1. DNS recon pasif (`Resolve-DnsName`) dan perbandingan IP dengan target lama.
2. Liveness + header audit (`curl -I`, dump header).
3. Fingerprint aplikasi/versi dari HTML homepage (meta generator + asset version).
4. Enumerasi endpoint OMP standar (GET tunggal + jeda).
5. Cek kebocoran file khas environment dev (status code saja).
6. Port scan konservatif (Nmap `-T2 --top-ports 100`).
7. Korelasi CVE pasif (lookup database publik CISA/PKP/Exploit-DB).
8. Dorking pasif (`site:`) via search engine.

## 4. Tools Yang Digunakan

- `Resolve-DnsName`, `curl.exe` (PowerShell 7, Windows).
- Nmap 7.80 (`C:\Program Files (x86)\Nmap\nmap.exe`).
- Firecrawl search (dorking pasif).
- Deteksi injection non-destruktif manual via `curl.exe` (perbandingan baseline vs marker, tanpa UNION/time-based/dump).
- Lookup database CVE publik (CISA Security Bulletin, advisory PKP/OJS, Exploit-DB).

## 5. Hasil Fingerprint

| Atribut | Nilai |
| --- | --- |
| Aplikasi | Open Monograph Press (OMP) 3.3.0.12 |
| Web server | openresty |
| IP / Host | 103.154.74.161 (shared dengan perpustakaan.itk.ac.id) |
| Nameserver | Cloudflare |
| Press path | `/home` (nama press = "home") |
| Port terbuka | 80/tcp, 443/tcp (97 filtered, 113 closed) |
| Sibling produksi | `itkpress.itk.ac.id` (dari robots.txt, OSINT) |

## 6. Daftar Temuan

| ID | Judul | Severity | Confidence |
| --- | --- | --- | --- |
| DITK-001 | OMP 3.3.0.12 usang + CVE publik (< 3.3.0.16/18/21) | High | High (versi) |
| DITK-002 | Session cookie `OMPSID` tanpa HttpOnly/Secure/SameSite | Medium | High |
| DITK-003 | Missing security headers (CSP, X-Frame-Options, dll) | Low | High |
| DITK-004 | Version disclosure (OMP 3.3.0.12) | Low (Info) | High |
| DITK-005 | Shared host + sibling produksi (OSINT) | Info | High |
| DITK-006 | Registrasi akun terbuka (pengganda risiko CVE auth) | Low | High |
| DITK-007 | Directory listing `/cache/` + file metadata versi | Low | High |
| DITK-008 | Injection (search) - diuji non-destruktif, tidak terdeteksi | Info (negatif) | High |
| DITK-009 | Unrestricted file upload - gated di balik login, tidak terjangkau | Info (negatif) | High |

Catatan topik wajib tubes: DITK-008 (Injection) dan DITK-009 (File Upload) adalah dua fokus kerentanan yang diminta instruksi. Keduanya DIUJI secara non-destruktif dengan hasil negatif (input pencarian ter-sanitasi; upload berada di balik autentikasi). Diuji, dibuktikan dengan bukti, tanpa overclaim.

Catatan validasi: `/config.inc.php` HTTP 200 namun hanya 2 byte (dieksekusi PHP) - BUKAN kebocoran kredensial, dicatat sebagai false positive. Detail di `evidence/findings-dev-itkpress.md`.

## 7. Analisis Risiko

Risiko keseluruhan menengah, didominasi oleh kombinasi **komponen usang (DITK-001)** dan **attack surface yang lebih terbuka untuk env dev**:

- Prioritas tertinggi: update OMP dari 3.3.0.12 (tertinggal minimal hingga 3.3.0.21). Beberapa CVE pada rentang ini berkategori serius (privilege escalation / arbitrary code), umumnya butuh akun terautentikasi.
- Pengganda risiko: registrasi terbuka (DITK-006) menurunkan ambang "authenticated" yang dibutuhkan sebagian CVE; cookie sesi tanpa flag (DITK-002) memperbesar dampak bila ada XSS.
- Hardening: missing security headers (DITK-003), directory listing `/cache/` (DITK-007), dan version disclosure (DITK-004) mempermudah fingerprinting dan memperkuat serangan terarah.

Tidak ada kerentanan yang dibuktikan dapat dieksploitasi karena pengujian dibatasi pada identifikasi non-destruktif.

## 8. Rekomendasi Mitigasi

1. **Update OMP (DITK-001):** naikkan ke rilis stabil terbaru (minimal melewati 3.3.0.21; idealnya 3.4.x/3.5.x bila kompatibel). Terapkan patch management dan pantau advisory PKP.
2. **Cookie sesi (DITK-002):** setel `HttpOnly; Secure; SameSite=Lax` pada `OMPSID`.
3. **Security headers (DITK-003):** tambahkan CSP, `X-Frame-Options`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`.
4. **Registrasi (DITK-006):** batasi self-registration pada env dev; pertimbangkan menutup akses dev dari publik (IP allowlist/VPN).
5. **Directory listing (DITK-007):** matikan autoindex; batasi akses `/cache/`, `/dbscripts/`, `/docs/`.
6. **Version disclosure (DITK-004):** minimalkan meta generator dan version string aset.
7. **Pertahankan kontrol positif:** HSTS, redirect HTTPS, `Cache-Control: no-store`.

## 9. Kendala Dan Batasan

- Target `dev` rapuh; aktivitas dibatasi seminimal mungkin (GET tunggal + jeda) agar tidak menyebabkan down.
- Korelasi CVE bersifat indikatif (versi-ke-advisory); konfirmasi pasti memerlukan pengujian terotorisasi (di luar batas non-destruktif).
- Dorking publik nihil (dev box belum/tidak terindeks).
- Scanning dibatasi pada target resmi; host produksi sibling tidak di-scan aktif.
- Injection diuji hanya pada parameter GET publik (`query`); parameter di balik autentikasi tidak diuji (butuh login = di luar batas izin). File upload hanya diidentifikasi kontrolnya dari halaman publik; tidak membuat akun dan tidak mengunggah file uji demi kepatuhan etika non-destruktif.

## 10. Reproduksi

Lihat `reports/windows-reproduce.md` dan `reports/linux-kali-reproduce.md` untuk langkah reproduksi (metodologi sama; ganti host ke `dev-itkpress.itk.ac.id` dan path OMP di bawah `/home`).
