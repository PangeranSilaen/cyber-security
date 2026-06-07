# Decision Log

| Waktu | Keputusan | Status | Catatan |
| --- | --- | --- | --- |
| 2026-05-24 | Setup Shodan CLI dengan API key dari user | Approved | API key diperlakukan sebagai secret dan tidak ditulis ke file project. |
| 2026-05-24 22:50 +08:00 | Jalankan Nmap konservatif top 100 | Approved | User memilih `Nmap top 100`; belum menyetujui `-sV` pada tahap ini. |
| 2026-05-24 22:50 +08:00 | Setup Shodan via environment variable | Approved | Jalankan init hanya jika `SHODAN_API_KEY` tersedia di environment; jangan tampilkan key. |
| 2026-05-24 22:50 +08:00 | Nikto via Docker | Deferred | User memilih nanti setelah Nmap. |
| 2026-06-07 21:05 +08:00 | Paket lengkap recon lanjutan (passive OSINT + active non-destruktif) | Approved | User memilih opsi "Paket lengkap" via question tool. Semua aktivitas non-destruktif, dalam scope UAS. |
| 2026-06-07 21:10 +08:00 | Batasi scanning aktif hanya ke `perpustakaan.itk.ac.id` | Decision | Subdomain lain (e-library, mmt, dll) hanya dicatat sebagai OSINT pasif; tidak di-scan aktif karena di luar izin UAS. |
| 2026-06-07 21:28 +08:00 | Hentikan upaya menyelesaikan Nikto | Decision | Nikto gagal selesai karena WAF memblok pola request, bukan masalah tuning. Memaksa lebih jauh = menambah pola serangan ke WAF (mendekati agresif). Kegagalan didokumentasikan sebagai F-009. |
