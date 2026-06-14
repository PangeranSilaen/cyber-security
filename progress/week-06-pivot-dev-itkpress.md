# Progress Mingguan UAS Keamanan Siber

## Minggu

Minggu 6 - Pivot ke target baru `dev-itkpress.itk.ac.id` (arahan dosen) + recon pasif awal.

## Konteks Perubahan Target

- Dosen (grup NetSec-DAR, 2026-05-20) mengganti target pengujian ke `https://dev-itkpress.itk.ac.id/home`.
- Instruksi: "Target baru pengujian ke sini aja ya, jika down segera info spya sy laporkan".
- Ini environment `dev` yang rapuh; pendekatan dibuat EKSTRA konservatif (recon pasif, GET tunggal, rate sangat rendah, tanpa scan agresif/Nikto di awal).
- Temuan target lama (`perpustakaan.itk.ac.id`, F-001..F-013) diarsipkan sebagai referensi metodologi.

## Tools Yang Digunakan

- `Resolve-DnsName` (DNS recon pasif).
- `curl.exe` (liveness, header audit, fingerprint - GET/HEAD tunggal).
- Lookup pasif database CVE (CISA bulletin, PKP advisory, Exploit-DB).
- Firecrawl search (dorking pasif `site:`).

## Langkah Yang Dilakukan

- DNS recon: resolusi A/AAAA/CNAME/NS untuk dev-itkpress + perbandingan IP dengan target lama.
- Liveness check ringan (1x HEAD) + cek redirect HTTP->HTTPS.
- Fingerprint aplikasi dari 1 GET homepage (meta generator + asset version).
- Audit cookie flags + security headers.
- Korelasi CVE pasif untuk versi OMP terdeteksi.
- Dorking pasif `site:dev-itkpress.itk.ac.id`.

## Hasil Ringkas

- Target HIDUP: HTTP 200 pada `/home`, `Server: openresty`, IP `103.154.74.161` (SAMA dengan perpustakaan = shared host).
- Aplikasi: **Open Monograph Press (OMP) 3.3.0.12** by PKP (platform penerbitan, BUKAN WordPress). Versi terekspos jelas via meta generator + asset `?v=3.3.0.12`.
- Cookie sesi `OMPSID` tanpa flag `HttpOnly`/`Secure`/`SameSite`.
- Missing security headers: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy (HSTS ada).
- OMP 3.3.0.12 di bawah banyak ambang patch keamanan PKP (before 3.3.0.16 ACE/privesc, below 3.3.0.18 critical, before 3.3.0.21 CVE-2024-56525).
- Dorking `site:` kosong (dev box kemungkinan noindex - wajar).

## Temuan Sementara

- DITK-001: OMP 3.3.0.12 usang + CVE publik (High).
- DITK-002: Session cookie tanpa flag keamanan (Medium).
- DITK-003: Missing security headers (Low).
- DITK-004: Version disclosure (Low/Info).
- DITK-005: Shared host dengan layanan ITK lain (Info).
- Detail lengkap di `evidence/findings-dev-itkpress.md`.

## Kendala

- Target `dev` rapuh; aktivitas dibatasi seminimal mungkin agar tidak menyebabkan down.
- Versi OMP minor patch (3.3.0.12) tidak selalu memetakan 1:1 ke setiap CVE; korelasi bersifat indikatif.
- Dorking publik nihil karena dev box belum/ tidak terindeks.

## Batasan Etika

- Recon pasif + GET/HEAD tunggal saja; tidak ada port scan agresif, tidak ada Nikto, tidak ada brute force.
- Tidak ada eksploitasi CVE, tidak ada payload, tidak ada percobaan XSS/SQLi/CSRF aktif.
- Korelasi CVE hanya lookup database publik, tidak menyentuh server target.
- Jika target down, pengujian dihentikan dan dilaporkan ke dosen.

## Rencana Lanjutan

- (Hati-hati) enumerasi endpoint OMP standar yang aman secara non-destruktif (mis. `/index.php`, halaman katalog publik) dengan rate sangat rendah.
- Lanjutkan korelasi CVE spesifik OMP 3.3.0.12 dari advisory PKP resmi.
- Bila disetujui & target stabil: port scan konservatif terbatas (top ports, timing lambat) seperti pada target lama.
- Susun laporan target baru mengikuti struktur laporan target lama.
