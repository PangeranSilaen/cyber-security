# Temuan Keamanan - dev-itkpress.itk.ac.id (Target Aktif)

Target: `https://dev-itkpress.itk.ac.id/home`
Status target: AKTIF (per arahan dosen 2026-05-20). Environment `dev` yang rapuh.
Metode: recon pasif + verifikasi non-destruktif (GET/HEAD tunggal, rate sangat rendah). Tidak ada eksploitasi.

Catatan severity: seluruh severity bersifat sementara berdasarkan bukti non-destruktif. Tidak ada finding yang diklaim sebagai kerentanan terkonfirmasi yang dieksploitasi, sesuai batasan UAS.

---

## Ringkasan Fingerprint

| Atribut | Nilai | Bukti |
| --- | --- | --- |
| Aplikasi | Open Monograph Press (OMP) by PKP | `<meta name="generator" content="Open Monograph Press 3.3.0.12">` |
| Versi | 3.3.0.12 | meta generator + asset `?v=3.3.0.12` (`lib/pkp/...`, `plugins/themes/...`) |
| Judul situs | ITK Press | `<title>ITK Press</title>` |
| Web server | openresty | header `Server: openresty` |
| IP | 103.154.74.161 | `Resolve-DnsName` (SAMA dengan perpustakaan.itk.ac.id -> shared host) |
| Nameserver | Cloudflare (`mitch/carol.ns.cloudflare.com`) | `Resolve-DnsName -Type NS itk.ac.id` |
| Liveness | HTTP 200 OK pada `/home` | `curl -I` 2026-06-14 |

---

## DITK-001: Komponen Usang - Open Monograph Press 3.3.0.12 (CVE Publik)

**ID:** DITK-001

**Judul:** OMP 3.3.0.12 berada di bawah banyak ambang perbaikan keamanan PKP

**Status:** Terkonfirmasi usang (korelasi CVE pasif; tidak dieksploitasi)

**Severity Sementara:** High

**Confidence:** High untuk versi (terekspos eksplisit); korelasi CVE indikatif

**OWASP/CWE:** OWASP A06:2021 Vulnerable and Outdated Components; CWE-1104 Use of Unmaintained Third Party Components

**Bukti Non-Destruktif:**

- Versi terbaca dari `<meta name="generator">` dan seluruh string aset (`?v=3.3.0.12`) pada GET tunggal `/home`.
- Korelasi CVE pasif (lookup database publik CISA/CVE/PKP advisory, tidak menyentuh target):
  - PKP OJS/OMP/OPS **before 3.3.0.16**: memungkinkan eksekusi kode arbitrary dan privilege escalation via crafted script (CISA Security Bulletin 27 Nov 2024).
  - PKP **below 3.3.0.18**: dikategorikan critical vulnerabilities dengan CVE publik (advisory komunitas PKP/OJS).
  - PKP OJS/OMP/OPS **before 3.3.0.21**: CVE-2024-56525 (User-XML fatal vulnerabilities) dan lainnya (CISA Security Bulletin 26 Feb 2025).
  - XSS via Host Header injection pada PKP 3.3 (Exploit-DB 50881) - perlu kondisi tertentu.
- Versi terpasang `3.3.0.12` berada di bawah seluruh ambang di atas.
- Waktu: 2026-06-14.

**Analisis:**

OMP 3.3.0.12 adalah rilis lama pada branch 3.3.0.x dan tertinggal beberapa patch keamanan penting (minimal 4 patch level di bawah 3.3.0.16, dan jauh di bawah 3.3.0.21). Beberapa CVE pada rentang ini berkategori serius (privilege escalation / arbitrary code), umumnya memerlukan kondisi tertentu atau autentikasi. Penilaian berbasis korelasi versi-ke-advisory, bukan eksploitasi.

**Dampak Potensial:**

Komponen usang membuka kemungkinan jalur eksploitasi terdokumentasi. Untuk platform publikasi dengan akun pengguna (author/editor), risiko privilege escalation lebih relevan.

**Batasan Validasi:**

Tidak ada eksploitasi, payload, atau percobaan CVE aktif. Korelasi CVE indikatif; konfirmasi pasti memerlukan pengujian terotorisasi yang di luar batas non-destruktif sesi ini.

**Rekomendasi Mitigasi:**

Update OMP ke rilis stabil terbaru pada branch yang didukung (minimal melewati 3.3.0.21, idealnya 3.4.x/3.5.x bila kompatibel). Terapkan patch management rutin dan pantau advisory PKP.

---

## DITK-002: Session Cookie Tanpa Flag Keamanan (HttpOnly/Secure/SameSite)

**ID:** DITK-002

**Judul:** Cookie sesi `OMPSID` tidak menyetel `HttpOnly`, `Secure`, dan `SameSite`

**Status:** Terkonfirmasi (misconfiguration)

**Severity Sementara:** Medium

**Confidence:** High (header `Set-Cookie` terbaca langsung)

**OWASP/CWE:** OWASP A05:2021 Security Misconfiguration; CWE-1004 Sensitive Cookie Without HttpOnly Flag; CWE-614 Sensitive Cookie Without Secure Attribute; CWE-1275 SameSite Attribute Incorrect

**Bukti Non-Destruktif:**

- Header respons (GET `/home`): `Set-Cookie: OMPSID=...; path=/; domain=dev-itkpress.itk.ac.id`
- Tidak ada atribut `HttpOnly`, `Secure`, maupun `SameSite` pada cookie sesi tersebut.
- Waktu: 2026-06-14.

**Analisis:**

`OMPSID` adalah cookie sesi PKP/OMP. Tanpa `HttpOnly`, cookie dapat diakses skrip sisi klien (memperbesar dampak bila ada XSS). Tanpa `Secure`, cookie berpotensi terkirim pada koneksi non-HTTPS (walau HSTS memitigasi sebagian). Tanpa `SameSite`, memperbesar risiko CSRF.

**Dampak Potensial:**

Session hijacking lebih mudah bila dikombinasikan dengan XSS; potensi CSRF. Belum diuji secara aktif.

**Batasan Validasi:**

Hanya membaca header `Set-Cookie`. Tidak ada percobaan pencurian sesi, XSS, atau CSRF.

**Rekomendasi Mitigasi:**

Setel cookie sesi dengan `HttpOnly; Secure; SameSite=Lax` (atau `Strict` bila alur mengizinkan). Pada PKP, konfigurasikan di `config.inc.php`/web server.

---

## DITK-003: Missing HTTP Security Headers

**ID:** DITK-003

**Judul:** Header keamanan respons utama tidak ada (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)

**Status:** Terkonfirmasi (hardening gap)

**Severity Sementara:** Low

**Confidence:** High

**OWASP/CWE:** OWASP A05:2021 Security Misconfiguration; CWE-693 Protection Mechanism Failure

**Bukti Non-Destruktif:**

- GET `/home`, header yang ada hanya `Strict-Transport-Security: max-age=63072000; preload`.
- MISSING: `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-XSS-Protection`.
- Waktu: 2026-06-14.

**Analisis:**

Tanpa CSP dan X-Frame-Options, risiko clickjacking dan dampak XSS meningkat. Tanpa `X-Content-Type-Options: nosniff`, ada risiko MIME sniffing. HSTS sudah aktif (kontrol positif).

**Dampak Potensial:**

Memperbesar dampak kerentanan sisi klien (XSS, clickjacking). Bukan kerentanan langsung yang dapat dieksploitasi sendiri.

**Batasan Validasi:**

Hanya membaca header respons standar.

**Rekomendasi Mitigasi:**

Tambahkan `Content-Security-Policy`, `X-Frame-Options: SAMEORIGIN` (atau CSP `frame-ancestors`), `X-Content-Type-Options: nosniff`, `Referrer-Policy`, dan `Permissions-Policy` secara konsisten.

---

## DITK-004: Technology / Version Disclosure

**ID:** DITK-004

**Judul:** Versi aplikasi (OMP 3.3.0.12) terekspos publik

**Status:** Terkonfirmasi (information disclosure)

**Severity Sementara:** Low (Info)

**Confidence:** High

**OWASP/CWE:** OWASP A05/A06; CWE-200 Information Exposure

**Bukti Non-Destruktif:**

- `<meta name="generator" content="Open Monograph Press 3.3.0.12">` pada HTML `/home`.
- Versi juga muncul pada query string aset (`?v=3.3.0.12`) dan footer "Platform and Workflow by OMP/PKP".
- Waktu: 2026-06-14.

**Analisis:**

Pengungkapan versi mempermudah penyerang mencocokkan CVE spesifik (lihat DITK-001). Ini memperkuat dampak komponen usang.

**Dampak Potensial:**

Mempercepat fingerprinting dan pemilihan exploit yang cocok.

**Batasan Validasi:**

Hanya membaca HTML/headers publik.

**Rekomendasi Mitigasi:**

Minimalkan version disclosure (hapus/ubah meta generator, kelola query string versi). Catatan: ini hardening tambahan; akar masalah tetap pada update versi (DITK-001).

---

## DITK-005: Shared Host dengan Target Lain (OSINT)

**ID:** DITK-005

**Judul:** `dev-itkpress.itk.ac.id` berbagi IP dengan `perpustakaan.itk.ac.id` dan layanan ITK lain

**Status:** Informational (konteks)

**Severity Sementara:** Informational

**Confidence:** High untuk pemetaan DNS/IP

**OWASP/CWE:** Konteks reconnaissance; CWE-200 level organisasi

**Bukti Non-Destruktif:**

- `Resolve-DnsName dev-itkpress.itk.ac.id -Type A` -> `103.154.74.161`.
- IP ini sama dengan `perpustakaan.itk.ac.id`, `api-ipr`, `ipr`, `www`, `itk.ac.id` (lihat F-010 pada arsip target lama).
- Nameserver via Cloudflare.
- Waktu: 2026-06-14.

**Analisis:**

Beberapa layanan ITK berada pada IP yang sama (shared host/reverse proxy). Secara organisasi, attack surface lebih luas dari satu host. Catatan scope: hanya `dev-itkpress.itk.ac.id` yang menjadi target aktif sekarang.

**Dampak Potensial:**

Masalah isolasi antar virtual host dapat berdampak silang; hanya konteks, tidak diuji.

**Batasan Validasi:**

Hanya resolusi DNS publik. Tidak ada scanning ke host lain.

**Rekomendasi Mitigasi:**

Pastikan isolasi antar virtual host dan inventarisasi layanan pada IP bersama.

---

## Kontrol Keamanan Positif (Target Baru)

| Kontrol | Bukti | Catatan |
| --- | --- | --- |
| HSTS aktif (preload) | `Strict-Transport-Security: max-age=63072000; preload` | Memaksa HTTPS. |
| Redirect HTTP ke HTTPS | HTTP `301` ke HTTPS | Enkripsi diberlakukan. |
| `Cache-Control: no-store` | header respons `/home` | Mengurangi caching konten sesi. |
| Tidak terindeks search engine | dork `site:dev-itkpress.itk.ac.id` = 0 hasil | Mengurangi eksposur publik (wajar untuk dev). |

---

## Ringkasan Pemetaan OWASP / CWE (Target Baru)

| Finding | Judul Singkat | Severity | OWASP 2021 | CWE |
| --- | --- | --- | --- | --- |
| DITK-001 | OMP 3.3.0.12 usang + CVE publik | High | A06 | CWE-1104 |
| DITK-002 | Session cookie tanpa HttpOnly/Secure/SameSite | Medium | A05 | CWE-1004 / CWE-614 / CWE-1275 |
| DITK-003 | Missing security headers | Low | A05 | CWE-693 |
| DITK-004 | Version disclosure (OMP 3.3.0.12) | Low (Info) | A05 / A06 | CWE-200 |
| DITK-005 | Shared host (OSINT) | Info | Reconnaissance | CWE-200 |

Catatan: seluruh severity bersifat sementara berdasarkan bukti non-destruktif.
