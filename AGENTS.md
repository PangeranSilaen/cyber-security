# Keamanan Siber UAS Context

## Project Context

- Mata kuliah: Keamanan Siber.
- Bentuk UAS: project kelompok identifikasi kerentanan website.
- Target resmi (AKTIF, per arahan dosen 2026-05-20 di grup NetSec-DAR): `https://dev-itkpress.itk.ac.id/home`.
  - Instruksi dosen: "Target baru pengujian ke sini aja ya, jika down segera info spya sy laporkan".
  - CATATAN PENTING: ini environment `dev` yang rapuh (dosen sadar bisa down). Wajib EKSTRA konservatif: recon pasif dulu, rate sangat rendah, hindari scan agresif/Nikto di awal. Jika target down, JANGAN lanjutkan pengujian dan segera info ke user untuk dilaporkan ke dosen.
- Target lama (ARSIP, sudah dikerjakan F-001..F-013): `https://perpustakaan.itk.ac.id/`. Hasilnya tetap disimpan sebagai referensi metodologi; tidak dihapus.
- Aktivitas ini memiliki izin akademik, tetapi wajib tetap mengikuti batasan instruksi UAS.
- User mengerjakan dari Windows dengan terminal default PowerShell 7, bukan Kali Linux, kecuali nanti benar-benar diperlukan.
- Pengerjaan dilakukan bertahap untuk asistensi mingguan, bukan sekali selesai.
- Setiap minggu perlu progres laporan, progres temuan, kendala, dan rencana lanjutan.

## Scope yang Diperbolehkan

- Reconnaissance.
- Footprinting.
- Information gathering dari sumber publik.
- Port scanning yang wajar dan tidak agresif.
- Service enumeration.
- Banner grabbing.
- DNS enumeration.
- Vulnerability scanning non-destruktif.
- Identifikasi potensi misconfiguration dan celah keamanan berdasarkan bukti awal.

## Larangan Penting

- Jangan melakukan eksploitasi aktif.
- Jangan menjalankan payload, RCE, privilege escalation, brute force, DoS/DDoS, defacement, upload file berbahaya, pencurian data, pengubahan data, atau penghapusan data.
- Jangan melakukan SQL injection eksploit aktif atau aktivitas yang dapat mengganggu availability target.
- Gunakan rate yang konservatif dan opsi scanning aman/non-destruktif.
- Jangan terlalu dangkal dalam analisis: boleh melakukan enumeration dan vulnerability identification yang cukup komprehensif selama tetap non-destruktif, tidak menjalankan exploit, dan tidak mengganggu layanan.

## Preferensi Lingkungan Kerja

- OS utama user: Windows.
- Shell default: PowerShell 7 (`pwsh`).
- Boleh menggunakan tool bawaan Windows/PowerShell seperti `curl`, `Invoke-WebRequest`, `Invoke-RestMethod`, `nslookup`, `Resolve-DnsName`, `Test-NetConnection`, `ping`, `tracert`, `whois` jika tersedia, dan OpenSSL jika terpasang.
- Boleh menggunakan tool tambahan Windows jika tersedia atau bisa diinstall secara aman: Nmap, Nikto via WSL/Docker/Perl, Git Bash utilities, WSL Ubuntu/Kali, Docker, Python scripts pasif, browser devtools, Shodan web, dan Google dorking.
- Shodan CLI boleh digunakan dari Windows jika API key tersedia.
- Nikto lebih praktis dijalankan via Docker jika Docker Engine aktif; WSL/Kali tetap opsi alternatif.
- Jika tool tertentu jauh lebih cocok di Linux/Kali, jelaskan alternatif Windows dulu, lalu berikan instruksi reproduce Linux/Kali untuk laporan.

## Output yang Diinginkan Nanti

- Buat laporan sederhana dalam Markdown.
- Laporan harus berisi langkah yang dilakukan di Windows dan instruksi reproduce di Linux/Kali.
- Fokus laporan: tools yang digunakan, command, hasil ringkas, analisis potensi kerentanan, kendala, dan batasan etika.
- Hindari klaim kerentanan valid tanpa bukti non-destruktif yang cukup.

## Cara Kolaborasi

- Jika perlu keputusan user, gunakan question tool.
- Jangan meminta user menjelaskan ulang konteks UAS jika file ini sudah tersedia.
- Prioritaskan pendekatan aman, legal, dan sesuai instruksi UAS.
