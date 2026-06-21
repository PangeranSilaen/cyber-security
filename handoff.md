# CONTEXT

Saya sedang mengerjakan UAS Keamanan Siber.

Target yang boleh diuji secara aktif:

https://dev-itkpress.itk.ac.id

Platform:
Open Monograph Press (OMP) 3.3.0.12 (PKP)

Baca file findings.md terlebih dahulu.
File tersebut berisi seluruh hasil investigasi yang sudah dilakukan.

JANGAN mengulang pengujian yang sudah selesai kecuali untuk verifikasi.

---

# HASIL YANG SUDAH DIDAPAT

1. HTML Injection terbukti pada:
   - Submission Title
   - Submission Subtitle
   - File Metadata Description

2. Payload seperti berikut dapat tersimpan:

   <b>TEAM4</b>

   <img src=x onerror=alert(1)>

3. Stored XSS belum terbukti.

4. Upload file berhasil untuk:

   shell.phtml
   test.php
   test.html
   test.svg
   test.txt

5. File upload dapat di-download kembali melalui workflow.

6. Belum ditemukan URL yang mengeksekusi file upload.

7. Endpoint berikut selalu menghasilkan HTTP 500:

   GET /home/api/v1/_submissions

8. Error 500 terjadi:
   - pada akun lama
   - pada akun baru hasil registrasi

9. Error sudah ada sebelum percobaan HTML Injection dilakukan.

10. Response body dari endpoint 500 kosong.

---

# YANG MASIH INGIN DIEKSPLOR

## A. Stored XSS Hunting

Cari seluruh sink render yang mungkin belum ditemukan:

- submission title
- subtitle
- metadata
- discussion
- review
- notification
- email template
- catalog
- publication page
- workflow history
- audit trail

Tujuan:
temukan apakah payload HTML dapat dieksekusi.

---

## B. Upload-to-XSS

Fokus ke:

- SVG XSS
- HTML upload
- Content-Type confusion
- MIME sniffing

Cek apakah:

test.svg

dapat dirender inline oleh browser.

Cari URL langsung file jika memungkinkan.

---

## C. Upload-to-RCE

Investigasi:

- lokasi penyimpanan file
- path traversal
- public upload directory
- download endpoint
- direct file access

Tujuan:

menentukan apakah file upload hanya disimpan atau bisa dieksekusi.

---

## D. Source Analysis

Karena target menggunakan OMP 3.3.0.12:

Cari:
- CVE terkait OMP/OJS 3.3.x
- advisory PKP
- bug upload
- XSS
- SSRF
- LFI
- RCE
- auth bypass

Kemudian cocokkan dengan perilaku target.

---

## E. HTTP 500 Investigation

Endpoint:

/home/api/v1/_submissions

Fokus mencari:

- parameter yang menyebabkan crash
- status[]
- assignedTo
- count
- offset
- searchPhrase

Lakukan differential testing.

Tujuan:
menentukan apakah error tersebut dapat dimanfaatkan atau hanya bug aplikasi.

---

# BATASAN

Jangan melakukan tindakan destruktif.

Jangan melakukan DoS.

Jangan melakukan brute force.

Jangan menghapus data.

Jangan mengubah data milik pengguna lain.

Semua pengujian harus bersifat verifikasi keamanan yang aman.

---

# OUTPUT YANG DIINGINKAN

Untuk setiap temuan:

1. Nama temuan
2. Severity
3. Bukti
4. Langkah reproduksi
5. Dampak
6. Rekomendasi
7. Status:
   - confirmed
   - likely
   - inconclusive
   - false positive

Jika menemukan jalur investigasi baru, dokumentasikan secara rinci beserta alasan teknisnya.

--FILE INI DIBUAT OLEH CHATGPT BROWSER DENGAN TUJUAN HANDOFF KE AGENTIC TOOLS YANG LEBIH MUMPUNI--
