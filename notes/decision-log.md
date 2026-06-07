# Decision Log

| Waktu | Keputusan | Status | Catatan |
| --- | --- | --- | --- |
| 2026-05-24 | Setup Shodan CLI dengan API key dari user | Approved | API key diperlakukan sebagai secret dan tidak ditulis ke file project. |
| 2026-05-24 22:50 +08:00 | Jalankan Nmap konservatif top 100 | Approved | User memilih `Nmap top 100`; belum menyetujui `-sV` pada tahap ini. |
| 2026-05-24 22:50 +08:00 | Setup Shodan via environment variable | Approved | Jalankan init hanya jika `SHODAN_API_KEY` tersedia di environment; jangan tampilkan key. |
| 2026-05-24 22:50 +08:00 | Nikto via Docker | Deferred | User memilih nanti setelah Nmap. |
