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
- DITK-005: Shared host dengan layanan ITK lain + sibling produksi `itkpress.itk.ac.id` (Info).
- DITK-006: Registrasi akun terbuka, pengganda risiko CVE yang butuh auth (Low).
- DITK-007: Directory listing `/cache/` + file metadata versi (Low).
- DITK-008: Injection (search) - DIUJI non-destruktif, tidak terdeteksi/input ter-sanitasi (Info/negatif). Fokus wajib tubes.
- DITK-009: Unrestricted file upload - gated di balik login, tidak terjangkau anonim (Info/negatif). Fokus wajib tubes.
- Validasi: `/config.inc.php` HTTP 200 tapi 2 byte (dieksekusi PHP) = false positive kebocoran kredensial.
- Enumerasi endpoint: press path = `/home`; `/home/login`, `/home/user/register`, `/home/catalog`, `/home/search` semua 200.
- Port scan -T2: 80/443 open, 97 filtered (identik perpustakaan, shared host).
- Detail lengkap di `evidence/findings-dev-itkpress.md`; laporan di `reports/final-report-dev-itkpress.md`.

## Kendala

- Target `dev` rapuh; aktivitas dibatasi seminimal mungkin agar tidak menyebabkan down.
- Versi OMP minor patch (3.3.0.12) tidak selalu memetakan 1:1 ke setiap CVE; korelasi bersifat indikatif.
- Dorking publik nihil karena dev box belum/ tidak terindeks.

## Batasan Etika

- Recon pasif + GET/HEAD tunggal saja; tidak ada port scan agresif, tidak ada Nikto, tidak ada brute force.
- Tidak ada eksploitasi CVE, tidak ada payload merusak. Injection diuji hanya dengan marker deteksi non-destruktif (`'`/`"`) tanpa UNION/time-based/dump; file upload hanya diidentifikasi kontrolnya tanpa membuat akun/login/upload.
- Korelasi CVE hanya lookup database publik, tidak menyentuh server target.
- Jika target down, pengujian dihentikan dan dilaporkan ke dosen. Liveness dicek sebelum & sesudah fase aktif; target tetap HTTP 200.

## Rencana Lanjutan

- Fokus wajib tubes (Information Gathering, Sensitive Data Exposure, Injection, File Upload) sudah ditangani semuanya dengan hasil terdokumentasi (DITK-001..DITK-009).
- Finalisasi laporan akhir target baru: lengkapi bukti screenshot/raw HTTP untuk lampiran (format wajib tubes butuh bukti visual).
- Review konsistensi severity & pemetaan OWASP/CWE sebelum submit.
- Jika ada waktu & target stabil: verifikasi ulang ringan satu temuan utama (DITK-001 versi) untuk memperkuat bukti.
