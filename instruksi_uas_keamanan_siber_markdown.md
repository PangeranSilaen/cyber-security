# INSTRUKSI UJIAN AKHIR SEMESTER (UAS)

## Mata Kuliah Keamanan Siber

---

### Informasi Mata Kuliah

| Keterangan       | Detail                                                             |
| ---------------- | ------------------------------------------------------------------ |
| Mata Kuliah      | Keamanan Siber                                                     |
| Jenis Ujian      | Ujian Akhir Semester (UAS)                                         |
| Bentuk Ujian     | Project Kelompok                                                   |
| Topik            | Identifikasi Kerentanan Website                                    |
| Target Pengujian | [https://perpustakaan.itk.ac.id/](https://perpustakaan.itk.ac.id/) |

---

# Tujuan UAS

UAS ini bertujuan untuk menguji kemampuan mahasiswa dalam:

1. Memahami konsep reconnaissance, scanning, footprinting, dan vulnerability assessment.
2. Menggunakan tools keamanan siber yang telah dipelajari selama perkuliahan.
3. Mengidentifikasi potensi kerentanan pada suatu sistem berbasis web secara etis dan bertanggung jawab.
4. Menganalisis hasil scanning dan menyusun temuan keamanan.
5. Memahami batasan etika serta legalitas dalam kegiatan keamanan siber.

---

# Ruang Lingkup UAS

Mahasiswa diminta melakukan proses identifikasi kerentanan terhadap website berikut:

> [**https://perpustakaan.itk.ac.id/**](https://perpustakaan.itk.ac.id/)

Pengujian hanya diperbolehkan dalam bentuk:

- Reconnaissance
- Footprinting
- Information Gathering
- Port Scanning
- Service Enumeration
- Vulnerability Scanning non-destruktif
- Identifikasi potensi celah keamanan

UAS ini **bukan** kegiatan eksploitasi aktif ataupun penetration testing destruktif.

---

# Tools yang Diperbolehkan

Mahasiswa hanya diperbolehkan menggunakan tools dan metode yang telah dipelajari selama perkuliahan.

Contoh tools yang diperbolehkan:

## Reconnaissance & Footprinting

- Google Dorking
- WHOIS
- Shodan

## Scanning & Enumeration

- Nmap
- Nikto
- Banner Grabbing
- DNS Enumeration
- SMB/LDAP/SNMP Enumeration (jika relevan dan aman)

## Vulnerability Identification

- Nmap Vulnerability Scripts
- Vulnerability scanning non-destruktif lainnya yang bersifat pasif atau aman

---

# Aturan dan Ketentuan

1. Seluruh aktivitas hanya diperbolehkan untuk kepentingan akademik.
2. Mahasiswa wajib menjaga etika dan profesionalisme selama proses pengujian.
3. Dilarang melakukan tindakan yang menyebabkan gangguan layanan, kerusakan sistem, kehilangan data, atau perubahan konfigurasi target.
4. Dilarang melakukan eksploitasi aktif terhadap kerentanan yang ditemukan.
5. Dilarang melakukan:
   - DDoS / DoS
   - Brute force login
   - Defacement
   - Upload backdoor/malware
   - Remote Code Execution (RCE)
   - SQL Injection eksploit aktif
   - Pencurian data
   - Pengubahan data
   - Penghapusan data
   - Aktivitas lain yang bersifat destruktif
6. Pengujian hanya sebatas identifikasi dan validasi awal kerentanan tanpa menyebabkan dampak terhadap sistem.
7. Setiap kelompok bertanggung jawab penuh terhadap aktivitas yang dilakukan seluruh anggota.
8. Apabila ditemukan aktivitas yang merusak atau melanggar aturan, maka:

> Kelompok yang bersangkutan akan langsung mendapatkan nilai E.

---

# Batasan Pengujian

Mahasiswa diperbolehkan:

- Mengidentifikasi host aktif
- Melakukan scanning port
- Mengidentifikasi service dan versi layanan
- Mengumpulkan informasi publik
- Melakukan vulnerability scanning non-destruktif
- Mengidentifikasi potensi misconfiguration
- Mengidentifikasi potensi celah keamanan berdasarkan hasil scanning

Mahasiswa tidak diperbolehkan:

- Mengeksploitasi celah hingga mendapatkan akses sistem
- Menjalankan payload
- Menanam backdoor
- Melakukan privilege escalation
- Mengambil, mengubah, atau menghapus data
- Mengganggu availability layanan

---

# Asistensi dan Monitoring Progress

Sebelum pelaksanaan UAS, akan dilakukan proses asistensi selama 3 minggu.

Setiap kelompok wajib melaporkan:

1. Progress reconnaissance dan scanning.
2. Tools yang digunakan.
3. Temuan sementara.
4. Analisis potensi kerentanan.
5. Kendala yang dihadapi selama pengujian.

Asistensi dilakukan untuk memastikan:

- Aktivitas tetap berada dalam batas yang diperbolehkan.
- Tidak terjadi tindakan destruktif.
- Progress pengerjaan berjalan dengan baik.

---

# Rubrik Penilaian

| Aspek Penilaian                     | Bobot |
| ----------------------------------- | ----- |
| Ketepatan penggunaan tools          | 20%   |
| Kemampuan reconnaissance & scanning | 20%   |
| Kualitas identifikasi kerentanan    | 25%   |
| Analisis dan pemahaman keamanan     | 20%   |
| Kepatuhan terhadap etika dan aturan | 15%   |

---

# Disclaimer dan Etika

Seluruh kegiatan dalam UAS ini wajib mengikuti prinsip ethical hacking dan responsible disclosure.

Mahasiswa hanya diperbolehkan melakukan aktivitas yang bersifat observasi, identifikasi, dan analisis keamanan tanpa menyebabkan kerusakan terhadap sistem target.

Mahasiswa sudah diberikan izin untuk melakukan percobaan yang disebutkan diatas sehingga tidak perlu mengkhawatirkan perizinan (tetapi harus mematuhi instruksi pengerjaan dan tidak melakukan hal yang dilarang).

Segala bentuk aktivitas di luar ketentuan yang telah ditetapkan menjadi tanggung jawab masing-masing kelompok.

---

# Penutup

Diharapkan mahasiswa dapat memanfaatkan kegiatan UAS ini untuk memahami proses identifikasi kerentanan secara profesional, etis, dan bertanggung jawab sesuai materi yang telah dipelajari pada mata kuliah Keamanan Siber.

