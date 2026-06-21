# Laporan Hasil Pengujian Keamanan
Target: dev-itkpress.itk.ac.id
Platform: Open Monograph Press (OMP) 3.3.0.12
Tanggal: 21 Juni 2026

## Ruang Lingkup

Sesuai instruksi dosen:

- Passive recon diperbolehkan pada itkpress.itk.ac.id
- Pengujian aktif hanya dilakukan pada dev-itkpress.itk.ac.id

---

# Ringkasan Temuan

| ID | Temuan | Status |
|------|------|------|
| F-01 | HTML Injection pada metadata submission | Terbukti |
| F-02 | HTML Injection pada metadata file | Terbukti |
| F-03 | Stored XSS | Belum terbukti |
| F-04 | Arbitrary File Upload | Sebagian terbukti |
| F-05 | Dashboard Submission API menghasilkan HTTP 500 | Terbukti |
| F-06 | Download file berbahaya yang diupload | Terbukti |
| F-07 | Eksekusi file upload di server | Belum terbukti |

---

# F-01 HTML Injection pada Metadata Submission

## Lokasi

Publication → Title

Publication → Subtitle

## Payload

```html
<b>TEAM4</b>
```

```html
<i>ITALIC123</i>
```

## Hasil

Payload tersimpan tanpa disanitasi.

Pada halaman daftar submission muncul:

```html
A <b>TEAM4</b>: <b>TEAM4</b>
```

Tag HTML tidak dihapus.

## Dampak

Menunjukkan input HTML diperbolehkan masuk ke database.

Belum ditemukan bukti eksekusi JavaScript.

## Status

Terbukti.

---

# F-02 HTML Injection pada Metadata File

## Lokasi

Workflow
→ Submission Files
→ Expand file
→ Edit

Field:

- Description

## Payload

```html
<img src=x onerror=alert(1)>
```

dan

```html
"><img src=x onerror=alert(document.domain)>
```

## Hasil

Payload tersimpan apa adanya.

Saat form dibuka kembali payload masih terlihat dalam bentuk mentah.

Contoh:

```html
<img src=x onerror=alert(1)>
```

## Dampak

Input tidak disanitasi.

Belum ditemukan lokasi render yang menyebabkan eksekusi JavaScript.

## Status

Terbukti.

---

# F-03 Stored XSS

## Payload yang diuji

```html
<img src=x onerror=alert(1)>
```

```html
"><img src=x onerror=alert(document.domain)>
```

```html
<script>alert(1)</script>
```

serta beberapa variasi HTML sederhana.

## Hasil

Belum ditemukan lokasi yang merender payload sebagai HTML aktif.

Tidak ada popup JavaScript yang muncul.

## Status

Belum terbukti.

## Catatan

Kemungkinan masih terdapat sink render lain yang belum ditemukan.

Perlu pengujian lanjutan.

---

# F-04 Arbitrary File Upload

## File yang diuji

```text
shell.phtml
test.php
test.html
test.svg
test.txt
```

## Hasil Awal

Sistem menolak upload hingga tipe file dipilih.

Kategori:

```text
Other
```

Setelah dipilih:

Semua file berhasil diupload.

## Dampak

Whitelist ekstensi tidak terlihat diterapkan pada tahap upload.

## Status

Terbukti.

---

# F-05 Dashboard Submission API HTTP 500

## Endpoint

```http
GET /home/api/v1/_submissions
```

Contoh:

```http
/home/api/v1/_submissions?status[]=4&status[]=3&status[]=5&assignedTo=111&searchPhrase=&count=30&offset=0
```

## Hasil

Server mengembalikan:

```http
HTTP 500 Internal Server Error
```

Response body kosong.

Browser menampilkan:

```text
An unexpected error has occurred.
Please reload the page and try again.
```

## Verifikasi

Diuji pada:

- akun lama
- akun baru hasil registrasi

Keduanya menghasilkan error yang sama.

## Kesimpulan

Masalah tidak berkaitan dengan satu submission tertentu.

Kemungkinan bug pada backend endpoint listing submission.

## Status

Terbukti.

---

# F-06 Download File Berbahaya

File yang diupload dapat diunduh kembali.

Contoh:

```text
shell.phtml
test.php
test.svg
```

Server mengirim file sebagai download.

## Dampak

File upload berhasil tersimpan dan dapat diakses kembali melalui sistem.

## Status

Terbukti.

---

# F-07 Remote Code Execution melalui Upload

## Pengujian

Dilakukan upload:

```php
<?php phpinfo(); ?>
```

dalam berbagai ekstensi.

## Hasil

Belum ditemukan URL publik yang mengeksekusi file.

File hanya dapat diunduh.

## Status

Belum terbukti.

---

# Kesimpulan Akhir

Temuan yang berhasil dibuktikan:

1. HTML Injection pada metadata submission.
2. HTML Injection pada metadata file.
3. Upload berbagai jenis file tanpa pembatasan yang jelas.
4. File hasil upload dapat disimpan dan diunduh kembali.
5. Endpoint dashboard submission menghasilkan HTTP 500 untuk berbagai akun.

Temuan yang belum berhasil dibuktikan:

1. Stored XSS.
2. Remote Code Execution melalui file upload.
3. Bypass autentikasi.
4. SQL Injection.
5. Privilege Escalation.

Pengujian lanjutan diperlukan untuk menentukan apakah HTML Injection dapat berkembang menjadi Stored XSS dan apakah file upload dapat mencapai jalur yang dapat dieksekusi server.
