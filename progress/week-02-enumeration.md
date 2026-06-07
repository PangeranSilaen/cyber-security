# Progress Mingguan UAS Keamanan Siber

## Minggu

Minggu 2 - Port scanning wajar dan service enumeration.

## Target Progres

- Melakukan port scanning konservatif terhadap target resmi.
- Mengidentifikasi port/service umum yang terbuka tanpa menjalankan exploit atau script intrusive.

## Tools Yang Digunakan

- Nmap 7.80 for Windows

## Langkah Yang Dilakukan

- User menyetujui Nmap top 100 konservatif.
- Menjalankan Nmap dengan opsi `-Pn -T2 --top-ports 100` terhadap `perpustakaan.itk.ac.id`.

## Hasil Ringkas

- Host aktif: `perpustakaan.itk.ac.id (103.154.74.161)`.
- Latency: sekitar `0.018s`.
- Port terbuka: `80/tcp` (`http`) dan `443/tcp` (`https`).
- Port tertutup: `113/tcp` (`ident`).
- Port filtered: 97 dari top 100 ports.
- Durasi scan: sekitar 104.87 detik.
- Service/version detection ringan pada port terbuka menunjukkan `80/tcp` dan `443/tcp` sebagai `OpenResty web app server`.

## Temuan Sementara

- Exposure port `80/tcp` dan `443/tcp` normal untuk layanan website publik.
- Port 80 melakukan redirect ke HTTPS berdasarkan hasil minggu 1, sehingga ini menjadi konfigurasi positif.
- Banyak port filtered menunjukkan filtering firewall/network policy pada port umum lain; ini dicatat sebagai informational.

## Kendala

- Nmap belum masuk PATH pada shell berjalan, sehingga command menggunakan full path `C:\Program Files (x86)\Nmap\nmap.exe`.
- Service version detection ringan sudah dilakukan hanya pada port terbuka `80,443` dengan `--version-light`.

## Batasan Etika

- Scan memakai timing konservatif `-T2`.
- Tidak memakai NSE script, exploit, brute force, fuzzing, atau DoS testing.
- Target dibatasi ke domain resmi `perpustakaan.itk.ac.id`.

## Rencana Lanjutan

- Setelah review Nmap, pertimbangkan Nikto via Docker secara konservatif.
- Lanjut analisis TLS/header lebih lengkap.
