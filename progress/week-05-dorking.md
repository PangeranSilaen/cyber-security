# Progress Mingguan UAS Keamanan Siber

## Minggu

Minggu 5 - Google dorking pasif, penemuan misconfiguration aplikasi, dan korelasi CVE plugin.

## Target Progres

- Memperluas information gathering dengan Google dorking (OSINT search engine), sesuai scope UAS.
- Menemukan file/direktori sensitif yang terindeks publik.
- Memverifikasi temuan secara non-destruktif (GET tunggal, cek status/tipe file).
- Korelasi versi komponen ke CVE publik secara pasif.

## Tools Yang Digunakan

- Google dorking (operator `site:`, `intitle:"index of"`, `filetype:`) via Firecrawl search.
- `curl.exe` (verifikasi directory listing, enumerasi versi plugin, cek status file).
- Lookup pasif database CVE (Wordfence, WPScan, Patchstack, NVD).

## Langkah Yang Dilakukan

- Dorking baseline `site:perpustakaan.itk.ac.id` (~30 URL postingan WordPress terindeks).
- Dorking file sensitif (`filetype:sql/bak/log/env/conf/txt/old/zip` dan dokumen `pdf/xls/csv/doc`) - tidak ada dump/backup terindeks.
- Dorking `intitle:"index of"` - menemukan directory listing aktif pada `wp-content`.
- Verifikasi listing dengan GET tunggal: `uploads/`, `plugins/wp-stats-manager/includes/`, dll.
- Penelusuran folder upload yang terbuka, termasuk `uploads/ultimatemember/`.
- Enumerasi versi plugin via `readme.txt`.
- Korelasi versi plugin ke CVE publik secara pasif.

## Hasil Ringkas

- Directory listing (Apache autoindex) aktif: `uploads/` membuka folder tahun + plugin; `wp-stats-manager/includes/` membuka nama file PHP source (`wsm_*.php`).
- Plugin baru teridentifikasi (sebelumnya tidak ter-fingerprint): `ultimatemember`, `wpforms`, `elementor`, `wp-statistics`, `wp-stats-manager`, `maxmegamenu`, `redux`.
- Eksposur file profil anggota: `uploads/ultimatemember/1/` browsable, 7 file `.jpg`, folder dapat dienumerasi via user ID (`user_id 1` ada, `2..8` = 404).
- Versi plugin: WPForms `1.7.4.1`, Elementor `3.6.5`, WP Statistics `14.10`, WP Visitor Statistics `6.9.6`.
- Tidak ada file sql/bak/env/dump yang terindeks publik (negatif - hasil baik).

## Temuan Sementara

- F-011: Directory listing aktif (Medium) - misconfiguration, information disclosure.
- F-012: Eksposur file profil anggota Ultimate Member (High) - broken access control, menyentuh PII, folder browsable + enumerable by ID.
- F-013: Plugin usang dengan CVE publik (Medium) - WPForms `1.7.4.1` < 1.7.5.5 (Admin+ Arbitrary File Access), Elementor `3.6.5` branch lama. WP Visitor Statistics `6.9.6` tampak sudah melewati ambang CVE-2023-0600 (tidak diklaim rentan).

## Kendala

- Versi plugin Ultimate Member tidak terbaca (`readme.txt` HTTP 404), sehingga korelasi CVE spesifik untuk plugin tersebut tidak diklaim.
- Beberapa request `curl` sempat HTTP 000 (koneksi drop transien); diatasi dengan jeda antar-request dan `--max-time`.
- Korelasi CVE pasif bersifat indikatif; konfirmasi pasti perlu WPScan API token (terotorisasi, di luar batas non-destruktif).

## Batasan Etika

- Dorking hanya membaca indeks publik mesin pencari; tidak menyentuh server target.
- Verifikasi dibatasi GET tunggal dan pengecekan status HTTP + tipe file (ekstensi).
- Untuk melindungi PII, file gambar/dokumen anggota TIDAK diunduh atau dibuka.
- Tidak ada eksploitasi, payload, file traversal aktif, SQLi, atau brute force.
- Aktivitas tetap dibatasi pada target resmi `perpustakaan.itk.ac.id`.

## Rencana Lanjutan

- (Opsional, terotorisasi) WPScan dengan API token untuk korelasi CVE plugin/theme lebih dalam.
- Koordinasikan temuan F-012 (eksposur PII) sebagai prioritas tertinggi untuk pengelola.
- Finalisasi laporan dengan severity ranking yang diperbarui.
