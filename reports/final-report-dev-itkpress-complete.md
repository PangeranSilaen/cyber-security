# Web Penetration Testing Report dev-itkpress.itk.ac.id

Target: `https://dev-itkpress.itk.ac.id/home`
Platform: Open Monograph Press (OMP) `3.3.0.12` / PKP
Metodologi: Black Box
Lingkungan kerja: Windows PowerShell 7, WSL Ubuntu, Docker Desktop, local OMP lab
Tanggal pengujian utama: 2026-06-14 sampai 2026-06-22
Status laporan: versi lengkap konsolidasi satu file

## 1. Executive Summary

Pengujian dilakukan terhadap target resmi UAS `dev-itkpress.itk.ac.id`, yaitu environment dev/STB kampus berbasis Open Monograph Press (OMP). Target menjalankan OMP `3.3.0.12`, rilis lama yang berada di bawah beberapa ambang patch keamanan PKP/OJS/OMP/OPS. Pengujian dilakukan bertahap: passive reconnaissance, active HTTP validation, authenticated author workflow testing, upload testing, access-control checks, directory enumeration, TLS testing, CVE triage, serta pembanding lokal pada OMP lab.

Risiko keseluruhan dinilai **Medium-High**. Risiko tertinggi berasal dari kombinasi:

- OMP `3.3.0.12` usang dan berada pada rentang versi dengan CVE publik serius.
- Directory listing luas pada direktori internal OMP, termasuk core library, controller, template, plugin, API, dbscripts, docs, registry, locale, dan tools.
- Exact release tag `3_3_0-12` terekspos melalui release notes dan version XML.
- Registrasi akun terbuka, sehingga prasyarat "authenticated user" lebih mudah dicapai.
- Upload file dari akun author menerima ekstensi berisiko (`.phtml`, `.php`, `.html`, `.svg`, `.txt`) dan file dapat diunduh kembali.
- Endpoint API dashboard `_submissions` menghasilkan `500 Internal Server Error` secara konsisten.
- Cookie sesi tidak memiliki flag `HttpOnly`, `Secure`, dan `SameSite`.
- Missing HTTP security headers yang memperbesar dampak serangan client-side.

Tidak ditemukan bukti langsung untuk RCE, file download IDOR, role bypass author-to-admin, atau Stored XSS pada sink yang diuji. Beberapa jalur CVE yang lebih kritikal membutuhkan role editor/manager atau admin, sehingga tidak dapat divalidasi dari akun author yang tersedia. Local lab OMP `3.3.0.12` sudah siap untuk demonstrasi CVE berisiko tanpa menyentuh target kampus.

## 2. Scope Dan Batasan

Target aktif:

```text
https://dev-itkpress.itk.ac.id/home
```

Target di luar scope aktif:

```text
https://itkpress.itk.ac.id
https://perpustakaan.itk.ac.id
subdomain ITK lain pada IP yang sama
```

Catatan scope:

- Host produksi `itkpress.itk.ac.id` hanya dicatat sebagai konteks OSINT karena `robots.txt` dev menunjuk sitemap produksi.
- Target lama `perpustakaan.itk.ac.id` hanya menjadi arsip metodologi dan tidak dicampur sebagai target aktif.
- User mengklarifikasi bahwa target dev/STB boleh diuji aktif untuk praktikum, selama tidak merusak layanan/data pihak lain.
- Pengujian dilakukan di luar jam larangan Senin-Jumat 07.00-16.00 WITA.
- Tidak dilakukan DoS/DDoS, brute force, penghapusan data, dump database, pencurian data, defacement global, backdoor persisten, atau perubahan data milik pengguna lain.
- Beberapa payload aktif digunakan secara benign pada akun test sendiri, terutama untuk HTML injection dan upload workflow.

## 3. Metodologi

Tahapan pengujian:

1. DNS dan host reconnaissance.
2. Liveness check dan header audit.
3. Fingerprint aplikasi, versi, server, dan path OMP.
4. Endpoint enumeration OMP standar.
5. Dev leak checks untuk `.git`, `.env`, `config.inc.php`, `composer.*`, docs, dbscripts, dan cache.
6. Port scan konservatif.
7. Directory listing enumeration dengan wordlist OMP-specific.
8. Authenticated session via akun author test.
9. Author workflow testing: submission metadata, file metadata, upload, download, dashboard API.
10. Access control / IDOR sampling untuk submission IDs dan file IDs.
11. API differential testing pada `_submissions` dan `/api/v1` resources.
12. TLS checks dengan Docker `testssl.sh`.
13. CVE/advisory correlation dan author-reachable exploit triage.
14. Local lab readiness untuk OMP `3.3.0.12`.

## 4. Tools Yang Digunakan

Windows:

```text
PowerShell 7
curl.exe
Nmap 7.80
Python 3.13
OpenSSL via Laragon
Git
Docker Desktop
```

WSL Ubuntu:

```text
Ubuntu 24.04.3 LTS
nmap
curl
python3
sqlmap
```

Docker:

```text
Docker Engine 28.3.2
drwetter/testssl.sh
local OMP lab stack
```

Browser automation:

```text
agent-browser, dengan named session dan timeout ketat
```

Catatan: `agent-browser` pernah mengalami timeout, sehingga jalur browser dihentikan sesuai aturan anti-stuck. Pengujian lanjutan dilakukan via HTTP/curl dan WSL tools.

## 5. Fingerprint Target

| Atribut | Nilai | Bukti |
| --- | --- | --- |
| Aplikasi | Open Monograph Press / PKP | Meta generator, footer, path OMP |
| Versi | `3.3.0.12` | Meta generator, asset query, `/dbscripts/xml/version.xml`, release notes |
| Git tag | `3_3_0-12` | `/docs/release-notes/README-3.3.0` |
| Judul situs | ITK Press | HTML title/homepage |
| Web server | `openresty` | Header `Server` |
| IP | `103.154.74.161` | DNS resolution |
| Press path | `/home` | Redirect/path OMP |
| Nameserver | Cloudflare (`mitch`, `carol`) | DNS NS lookup |
| TLS | TLS 1.2/1.3; no SSL/TLS legacy below 1.2 observed | testssl |

Baseline liveness:

```powershell
curl.exe -s -I --max-time 15 "https://dev-itkpress.itk.ac.id/home"
```

Hasil:

```http
HTTP/1.1 200 OK
Server: openresty
Content-Type: text/html; charset=utf-8
Cache-Control: no-store
Strict-Transport-Security: max-age=63072000; preload
X-Served-By: dev-itkpress.itk.ac.id
```

## 6. Ringkasan Temuan

| ID | Temuan | Severity | Status | Confidence |
| --- | --- | --- | --- | --- |
| DITK-001 | OMP `3.3.0.12` usang dan terkena rentang CVE publik | High | Confirmed by version | High |
| DITK-002 | Cookie sesi `OMPSID` tanpa `HttpOnly`, `Secure`, `SameSite` | Medium | Confirmed | High |
| DITK-003 | Missing HTTP security headers | Low | Confirmed | High |
| DITK-004 | Version disclosure / exact release disclosure | Low | Confirmed | High |
| DITK-005 | Shared host dan sibling production OSINT | Informational | Confirmed | High |
| DITK-006 | Self-registration terbuka | Low | Confirmed | High |
| DITK-007 | Broad directory listing internal OMP | Medium | Confirmed | High |
| DITK-008 | API surface listing dan beberapa endpoint API `500` | Medium | Confirmed | Medium-High |
| DITK-009 | Stored HTML injection pada submission metadata | Low-Medium | Confirmed stored, not XSS | Medium-High |
| DITK-010 | Stored HTML-like payload pada file metadata form | Low-Medium | Confirmed stored, escaped in checked sink | Medium |
| DITK-011 | Authenticated upload menerima ekstensi berisiko | Medium | Confirmed | High |
| DITK-012 | Uploaded risky files downloadable via authenticated endpoint | Medium | Confirmed | High |
| DITK-013 | Upload-to-XSS / upload-to-RCE via download endpoint | Informational / Negative | Not confirmed | Medium-High |
| DITK-014 | `_submissions` API `500 Internal Server Error` | Medium | Confirmed | High |
| DITK-015 | File download IDOR | Informational / Negative | Not confirmed in sample | Medium |
| DITK-016 | Author-to-admin/management role bypass | Informational / Negative | Not confirmed in sample | Medium |
| DITK-017 | SQL Injection pada tested params | Informational / Negative | Not confirmed | Medium |
| DITK-018 | TLS potential LUCKY13 due CBC ciphers | Low | Potential | Medium |
| DITK-019 | Exposed web-accessible OMP tool scripts | Low-Medium | Confirmed exposure, RCE not confirmed | Medium-High |

## 7. Detail Temuan

### DITK-001 - OMP 3.3.0.12 Usang Dan CVE Publik

**Severity:** High
**Status:** Confirmed by version
**OWASP/CWE:** OWASP A06:2021 Vulnerable and Outdated Components; CWE-1104

**Deskripsi:**
Target menjalankan OMP `3.3.0.12`, rilis lama pada branch PKP 3.3.0.x. Versi ini berada di bawah beberapa ambang patch keamanan yang disebut dalam advisory publik, termasuk before `3.3.0.16`, below `3.3.0.18`, dan before `3.3.0.21`.

**Bukti:**

```html
<meta name="generator" content="Open Monograph Press 3.3.0.12">
```

```text
/dbscripts/xml/version.xml -> <release>3.3.0.12</release>
/docs/release-notes/README-3.3.0 -> Git tag: 3_3_0-12
```

**Langkah Reproduksi:**

```powershell
curl.exe -s -L --max-time 20 "https://dev-itkpress.itk.ac.id/home" | findstr /i "generator 3.3.0.12"
curl.exe -s -L --max-time 20 "https://dev-itkpress.itk.ac.id/dbscripts/xml/version.xml"
curl.exe -s -L --max-time 20 "https://dev-itkpress.itk.ac.id/docs/release-notes/README-3.3.0"
```

**Hasil:**
Versi OMP `3.3.0.12` dan git tag `3_3_0-12` terkonfirmasi dari beberapa sumber publik.

**Dampak:**
Attacker dapat melakukan CVE matching dengan akurasi tinggi. Beberapa CVE/advisory PKP pada rentang ini berkaitan dengan privilege escalation, arbitrary code, XML import, dan XSS tergantung role serta kondisi.

**Batasan Validasi:**
CVE berbahaya seperti User XML XXE tidak dieksploitasi pada target karena membutuhkan role editor/manager atau path admin/editor. Akun yang tersedia adalah author.

**Rekomendasi:**
Update OMP minimal melewati `3.3.0.21`, idealnya ke branch stabil terbaru yang didukung. Terapkan patch management rutin dan pantau advisory PKP.

### DITK-002 - Cookie Sesi Tanpa Flag Keamanan

**Severity:** Medium
**Status:** Confirmed
**OWASP/CWE:** OWASP A05; CWE-1004, CWE-614, CWE-1275

**Deskripsi:**
Cookie sesi `OMPSID` tidak memiliki flag `HttpOnly`, `Secure`, maupun `SameSite`.

**Langkah Reproduksi:**

```powershell
curl.exe -s -I --max-time 20 "https://dev-itkpress.itk.ac.id/home"
```

**Hasil:**

```http
Set-Cookie: OMPSID=<REDACTED>; path=/; domain=dev-itkpress.itk.ac.id
```

Tidak ada `HttpOnly`, `Secure`, atau `SameSite`.

**Dampak:**
Jika XSS ditemukan, cookie lebih mudah dicuri karena tidak `HttpOnly`. Tanpa `SameSite`, risiko CSRF meningkat. Tanpa `Secure`, cookie tidak secara eksplisit dibatasi pada HTTPS walaupun HSTS membantu.

**Rekomendasi:**
Set `OMPSID` dengan `HttpOnly; Secure; SameSite=Lax` atau `Strict` bila workflow memungkinkan.

### DITK-003 - Missing HTTP Security Headers

**Severity:** Low
**Status:** Confirmed
**OWASP/CWE:** OWASP A05; CWE-693

**Deskripsi:**
Response utama tidak menyertakan beberapa security header umum.

**Langkah Reproduksi:**

```powershell
curl.exe -s -D headers.txt -o NUL --max-time 20 "https://dev-itkpress.itk.ac.id/home"
```

**Hasil:**
Header berikut tidak terlihat:

```text
Content-Security-Policy
X-Frame-Options
X-Content-Type-Options
Referrer-Policy
Permissions-Policy
```

**Dampak:**
Memperbesar dampak XSS, clickjacking, MIME sniffing, dan referrer leakage.

**Rekomendasi:**
Tambahkan CSP, `frame-ancestors`/`X-Frame-Options`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, dan `Permissions-Policy`.

### DITK-004 - Version Disclosure / Exact Release Disclosure

**Severity:** Low
**Status:** Confirmed
**OWASP/CWE:** CWE-200

**Deskripsi:**
Versi aplikasi terekspos dari banyak lokasi.

**Bukti:**

```text
Open Monograph Press 3.3.0.12
Git tag: 3_3_0-12
Release date: September 20, 2022
```

**Langkah Reproduksi:**

```powershell
curl.exe -s -L "https://dev-itkpress.itk.ac.id/home"
curl.exe -s -L "https://dev-itkpress.itk.ac.id/dbscripts/xml/version.xml"
curl.exe -s -L "https://dev-itkpress.itk.ac.id/docs/release-notes/README-3.3.0"
```

**Dampak:**
Mempermudah attacker memilih exploit/CVE yang cocok.

**Rekomendasi:**
Minimalkan version disclosure, tetapi prioritas utama tetap update aplikasi.

### DITK-005 - Shared Host Dan Sibling Production OSINT

**Severity:** Informational
**Status:** Confirmed

**Deskripsi:**
Target dev berbagi IP dengan beberapa layanan ITK lain. `robots.txt` dev menunjuk sitemap production `itkpress.itk.ac.id`.

**Langkah Reproduksi:**

```powershell
Resolve-DnsName dev-itkpress.itk.ac.id -Type A
curl.exe -s "https://dev-itkpress.itk.ac.id/robots.txt"
```

**Hasil:**

```text
A = 103.154.74.161
Sitemap: https://itkpress.itk.ac.id/sitemap.xml
```

**Dampak:**
Mengindikasikan shared infrastructure dan config artifact dari production. Tidak ada pengujian aktif ke host production.

**Rekomendasi:**
Pisahkan konfigurasi dev/production, batasi akses dev via VPN/IP allowlist, dan pastikan isolasi virtual host.

### DITK-006 - Self-Registration Terbuka

**Severity:** Low
**Status:** Confirmed

**Deskripsi:**
Endpoint registrasi publik aktif.

**Langkah Reproduksi:**

```powershell
curl.exe -s -o NUL -w "%{http_code}" "https://dev-itkpress.itk.ac.id/home/user/register"
```

**Hasil:**

```text
200
```

**Dampak:**
Registrasi terbuka bukan kerentanan mandiri pada platform publikasi, tetapi pada environment dev dengan OMP usang, hal ini menurunkan prasyarat untuk CVE yang membutuhkan akun terautentikasi.

**Rekomendasi:**
Untuk dev/STB, batasi registrasi atau akses dev dengan VPN/IP allowlist.

### DITK-007 - Broad Directory Listing Internal OMP

**Severity:** Medium
**Status:** Confirmed
**OWASP/CWE:** OWASP A05; CWE-548, CWE-200

**Deskripsi:**
Autoindex aktif pada banyak direktori internal OMP. Ini mengekspos struktur aplikasi, plugin inventory, API resources, tools, release docs, db scripts, templates, controller, classes, dan cache template.

**Langkah Reproduksi Manual:**

```powershell
curl.exe -s -L "https://dev-itkpress.itk.ac.id/cache/"
curl.exe -s -L "https://dev-itkpress.itk.ac.id/plugins/"
curl.exe -s -L "https://dev-itkpress.itk.ac.id/classes/"
curl.exe -s -L "https://dev-itkpress.itk.ac.id/controllers/"
curl.exe -s -L "https://dev-itkpress.itk.ac.id/templates/"
curl.exe -s -L "https://dev-itkpress.itk.ac.id/tools/"
```

**Langkah Reproduksi Dengan Gobuster:**

```bash
gobuster dir -u https://dev-itkpress.itk.ac.id/ \
  -w evidence/wordlists/omp-medium-paths.txt \
  -t 4 --delay 500ms -k -q \
  -o evidence/gobuster-omp-medium-2026-06-22.txt
```

**Hasil Directory Listing Yang Terkonfirmasi:**

```text
/api/
/api/v1/
/cache/
/cache/HTML/
/cache/URI/
/cache/t_compile/
/classes/
/controllers/
/dbscripts/
/dbscripts/xml/
/docs/
/docs/release-notes/
/js/
/lib/
/lib/pkp/
/locale/
/pages/
/plugins/
/plugins/gateways/
/plugins/importexport/
/plugins/importexport/csv/
/plugins/importexport/native/
/plugins/importexport/onix30/
/plugins/importexport/users/
/plugins/metadata/
/plugins/oaiMetadataFormats/
/plugins/paymethod/
/plugins/paymethod/manual/
/plugins/paymethod/paypal/
/plugins/pubIds/
/plugins/reports/
/plugins/themes/
/plugins/themes/default/
/plugins/themes/pragma/
/plugins/viewableFiles/
/public/
/registry/
/styles/
/templates/
/tools/
```

**Contoh Isi Listing:**

```text
/classes/ -> codelist/, components/, core/, file/, handler/, i18n/, install/, log/
/controllers/ -> api/, grid/, modals/, statistics/, submission/, tab/
/pages/ -> authorDashboard/, catalog/, gateway/, index/, information/, manageCatalog/, management/, oai/
/templates/ -> authorDashboard/, controllers/, frontend/, images/, manageCatalog/, management/, reviewer/, submission/
/tools/ -> bootstrap.inc.php, cleanReviewerInterests.php, dbXMLtoSQL.php, fixFilenames.php, importExport.php, install.php
```

**Dampak:**
Attacker dapat memetakan struktur aplikasi, plugin, template backend/admin/reviewer, API resources, dan file tools. Digabung dengan versi usang, hal ini meningkatkan risiko serangan terarah.

**Rekomendasi:**
Matikan autoindex secara global. Batasi akses publik ke `/cache`, `/classes`, `/controllers`, `/templates`, `/tools`, `/plugins`, `/lib`, `/dbscripts`, `/docs`, `/registry`, `/locale`, dan `/api` kecuali aset yang benar-benar diperlukan.

### DITK-008 - API Surface Listing Dan Endpoint API 500

**Severity:** Medium
**Status:** Confirmed

**Deskripsi:**
Directory listing `/api/v1/` mengungkap resource API. Beberapa endpoint kontekstual `/home/api/v1/...` menghasilkan `403` atau `500`.

**Langkah Reproduksi:**

```powershell
curl.exe -s -L "https://dev-itkpress.itk.ac.id/api/v1/"
curl.exe -s -o NUL -w "code=%{http_code} size=%{size_download}" "https://dev-itkpress.itk.ac.id/home/api/v1/stats"
curl.exe -s -o NUL -w "code=%{http_code} size=%{size_download}" "https://dev-itkpress.itk.ac.id/home/api/v1/vocabs"
```

**Hasil `/api/v1/`:**

```text
_email/, _payments/, _submissions/, _uploadPublicFile/, announcements/, contexts/, emailTemplates/, site/, stats/, submissions/, temporaryFiles/, users/, vocabs/
```

**Hasil Endpoint:**

```text
/home/api/v1/stats -> 500
/home/api/v1/vocabs -> 500
/home/api/v1/_email -> 403
/home/api/v1/_uploadPublicFile -> 403
/home/api/v1/users -> 403
```

**Dampak:**
Resource API mudah dipetakan. Endpoint yang `500` menunjukkan error handling/backend route instability, walau belum ditemukan data leak.

**Rekomendasi:**
Nonaktifkan listing API directory, pastikan route API memiliki error handling konsisten, dan kembalikan `404/403` yang aman tanpa `500` untuk request tidak valid.

### DITK-009 - Stored HTML Injection Pada Submission Metadata

**Severity:** Low-Medium
**Status:** Confirmed stored; Stored XSS not confirmed

**Deskripsi:**
Payload HTML pada title/subtitle submission tersimpan dan muncul kembali di UI author dashboard, tetapi sink yang diuji meng-escape HTML.

**Payload:**

```html
<b>TEAM4</b>
<i>ITALIC123</i>
```

**Hasil UI:**

```text
A <b>TEAM4</b>: <b>TEAM4</b>
XX <i>ITALIC123</i>: <i>ITALIC123</i>
```

**Hasil DOM:**

```html
A &lt;b&gt;TEAM4&lt;/b&gt;: &lt;b&gt;TEAM4&lt;/b&gt;
XX &lt;i&gt;ITALIC123&lt;/i&gt;: &lt;i&gt;ITALIC123&lt;/i&gt;
```

**Langkah Reproduksi:**

1. Login dengan akun author test.
2. Buat atau edit submission milik sendiri.
3. Isi title/subtitle dengan marker HTML benign.
4. Buka `/home/submissions` atau `/home/authorDashboard/submission/<id>`.
5. Cek teks UI dan DOM.

**Dampak:**
Menunjukkan input HTML dapat tersimpan. Dampak menjadi lebih besar bila ada sink lain yang merender tanpa escaping, misalnya notification/email/editor view.

**Batasan:**
Dashboard list dan workflow heading yang diuji meng-escape payload. Stored XSS belum terbukti.

**Rekomendasi:**
Validasi dan sanitasi input metadata. Pastikan semua sink output melakukan escaping dan gunakan CSP sebagai defense-in-depth.

### DITK-010 - HTML Payload Pada File Metadata

**Severity:** Low-Medium
**Status:** Confirmed stored; XSS not confirmed

**Payload:**

```html
<img src=x onerror=alert(1)>
"><img src=x onerror=alert(document.domain)>
```

**Hasil:**
Payload tersimpan di metadata file, namun pada edit form muncul di atribut `value` dengan encoding:

```html
value="XSSTEST123&quot;&gt;&lt;img src=x onerror=alert(1)&gt;"
value="&quot;&gt;&lt;img src=x onerror=alert(document.domain)&gt;"
```

**Langkah Reproduksi:**

1. Login sebagai author.
2. Buka submission sendiri.
3. Buka file metadata edit form.
4. Isi field metadata dengan payload benign XSS marker.
5. Simpan dan buka kembali edit metadata.
6. Cek apakah payload di-render atau di-escape.

**Dampak:**
Menunjukkan input HTML-like dapat tersimpan di metadata file. XSS belum terbukti karena form sink meng-escape payload.

**Rekomendasi:**
Sanitasi metadata file dan audit semua sink lain yang menampilkan metadata tersebut.

### DITK-011 - Authenticated Upload Menerima Ekstensi Berisiko

**Severity:** Medium
**Status:** Confirmed

**File Yang Diupload:**

```text
shell.phtml
test.php
test.html
test.svg
test.txt
download-template-surat-peminjaman.docx
```

**Hasil:**
File berhasil tersimpan setelah memilih kategori `Other`. Ini menunjukkan pembatasan ekstensi tidak ketat pada workflow author.

**Langkah Reproduksi:**

1. Login sebagai author.
2. Buka submission wizard atau submission milik sendiri.
3. Upload file uji benign dengan ekstensi berbeda.
4. Pilih kategori `Other` bila diminta.
5. Verifikasi file muncul pada Submission Files.

**Dampak:**
Upload ekstensi berisiko dapat memperluas attack surface bila ada direct execution path, preview path, atau misconfiguration server. Pada pengujian ini direct RCE belum ditemukan.

**Rekomendasi:**
Gunakan allowlist ekstensi/MIME ketat per kebutuhan workflow. Rename file berbahaya, simpan di luar webroot, dan serve melalui handler dengan `Content-Disposition: attachment` serta authorization check.

### DITK-012 - Uploaded Risky Files Downloadable

**Severity:** Medium
**Status:** Confirmed

**Endpoint Pattern:**

```text
/home/$$$call$$$/api/file/file-api/download-file?submissionFileId=<id>&submissionId=176&stageId=1
```

**Hasil Own Files:**

| File | Content-Type | Content-Disposition |
| --- | --- | --- |
| `shell.phtml` | `text/x-php;charset=UTF-8` | `attachment;filename="shell.phtml"` |
| `test.html` | `text/plain;charset=UTF-8` | `attachment;filename="test.html"` |
| `test.svg` | `image/svg` | `attachment;filename="test.svg"` |
| `test.php` | `text/x-php;charset=UTF-8` | `attachment;filename="test.php.txt"` |
| `test.txt` | `text/plain;charset=UTF-8` | `attachment;filename="test.txt"` |

**Langkah Reproduksi:**

```powershell
curl.exe -s -b cookies.txt -D headers.txt -o file.bin "https://dev-itkpress.itk.ac.id/home/`$`$`$call`$`$`$/api/file/file-api/download-file?submissionFileId=311&submissionId=176&stageId=1"
```

**Dampak:**
File berbahaya yang tersimpan dapat dikirim kembali ke user. Endpoint saat ini memitigasi inline execution dengan `attachment`, tetapi keberadaan `.phtml` tetap memperlihatkan filtering yang lemah.

**Rekomendasi:**
Validasi ekstensi dan MIME saat upload, normalisasi nama file, dan blokir ekstensi executable.

### DITK-013 - Upload-to-XSS / Upload-to-RCE Tidak Terbukti

**Severity:** Informational / Negative
**Status:** Not confirmed

**Deskripsi:**
HTML/SVG/PHP/PHTML yang diupload tidak ditemukan direct public execution/render path. Download endpoint memaksa `Content-Disposition: attachment` dan mengembalikan bytes file, bukan mengeksekusi PHP.

**Bukti:**

```text
test.html -> text/plain + attachment
test.svg -> image/svg + attachment
test.php -> attachment filename test.php.txt
shell.phtml -> attachment filename shell.phtml
PHP payload bytes returned, not executed
```

**Rekomendasi:**
Tetap perbaiki upload validation karena mitigasi saat download tidak menggantikan kontrol saat upload.

### DITK-014 - `_submissions` API 500 Internal Server Error

**Severity:** Medium
**Status:** Confirmed

**Endpoint:**

```text
/home/api/v1/_submissions
```

**Langkah Reproduksi:**

```powershell
curl.exe --globoff -s -o NUL -w "code=%{http_code} size=%{size_download}" -b cookies.txt "https://dev-itkpress.itk.ac.id/home/api/v1/_submissions"
curl.exe --globoff -s -o NUL -w "code=%{http_code} size=%{size_download}" -b cookies.txt "https://dev-itkpress.itk.ac.id/home/api/v1/_submissions?count=30&offset=0"
curl.exe --globoff -s -o NUL -w "code=%{http_code} size=%{size_download}" -b cookies.txt "https://dev-itkpress.itk.ac.id/home/api/v1/_submissions?status[]=4&status[]=3&status[]=5&assignedTo=111&searchPhrase=&count=30&offset=0"
```

**Hasil:**

```text
code=500 size=1
```

Varian yang diuji:

```text
no params
count=30&offset=0
status[]=4&status[]=3&status[]=5&assignedTo=111&searchPhrase=&count=30&offset=0
count=1&offset=0
count=0&offset=0
count=abc&offset=0
count=30&offset=-1
assignedTo=heavenlydemon&count=1&offset=0
searchPhrase='&count=1&offset=0
```

Semua menghasilkan `500` ukuran `1` byte.

**Dampak:**
Endpoint dashboard submission tidak stabil. Ini dapat mengganggu workflow author dan menjadi indikator backend bug.

**Batasan:**
Tidak ada SQL error, stack trace, atau response berbeda yang mendukung SQLi. Ini dicatat sebagai backend/API error, bukan SQLi.

**Rekomendasi:**
Periksa log server untuk route `_submissions`, perbaiki exception handling, dan tambahkan validasi parameter.

### DITK-015 - File Download IDOR Tidak Terbukti

**Severity:** Informational / Negative
**Status:** Not confirmed in sample

**Deskripsi:**
Pengujian adjacent/wrong file ID menunjukkan authorization check bekerja.

**Langkah Reproduksi:**

```powershell
curl.exe -s -b cookies.txt "https://dev-itkpress.itk.ac.id/home/`$`$`$call`$`$`$/api/file/file-api/download-file?submissionFileId=308&submissionId=176&stageId=1"
curl.exe -s -b cookies.txt "https://dev-itkpress.itk.ac.id/home/`$`$`$call`$`$`$/api/file/file-api/download-file?submissionFileId=309&submissionId=175&stageId=1"
```

**Hasil:**

```json
{"status":false,"content":"The current user is not authorized to access the specified submission file."}
```

**Rekomendasi:**
Pertahankan authorization check dan tambahkan automated tests untuk kombinasi `submissionFileId`/`submissionId` mismatch.

### DITK-016 - Role Bypass Author-to-Admin Tidak Terbukti

**Severity:** Informational / Negative
**Status:** Not confirmed

**Langkah Reproduksi:**

```powershell
curl.exe -s -b cookies.txt "https://dev-itkpress.itk.ac.id/home/management/settings/context"
curl.exe -s -b cookies.txt "https://dev-itkpress.itk.ac.id/home/management/settings/website"
curl.exe -s -b cookies.txt "https://dev-itkpress.itk.ac.id/home/management/tools"
curl.exe -s -b cookies.txt "https://dev-itkpress.itk.ac.id/home/admin"
```

**Hasil:**
Author menerima authorization denied / redirect login-source protected.

**Rekomendasi:**
Pertahankan server-side authorization; jangan hanya menyembunyikan UI.

### DITK-017 - SQL Injection Tidak Terkonfirmasi Pada Parameter Yang Diuji

**Severity:** Informational / Negative
**Status:** Not confirmed

**Public Search Test:**

```powershell
curl.exe -G --data-urlencode "query=book'" "https://dev-itkpress.itk.ac.id/home/search/search"
curl.exe -G --data-urlencode "query=book\"" "https://dev-itkpress.itk.ac.id/home/search/search"
curl.exe -G --data-urlencode "query=book')" "https://dev-itkpress.itk.ac.id/home/search/search"
curl.exe -G --data-urlencode "query=book'--" "https://dev-itkpress.itk.ac.id/home/search/search"
```

**Hasil:**
Semua request `200 OK`, tidak ada error DB seperti `SQL syntax`, `mysqli`, `PDOException`, atau stack trace. Perbedaan ukuran response konsisten dengan no-results normal.

**Authenticated API Test:**
`_submissions` selalu `500`, termasuk tanpa payload. Tidak ada SQL-specific signal.

**Rekomendasi:**
Tetap gunakan parameterized queries dan validasi input. Perbaiki endpoint yang `500` agar error tidak menyembunyikan bug lain.

### DITK-018 - TLS Potential LUCKY13 / CBC Ciphers

**Severity:** Low
**Status:** Potential

**Command:**

```powershell
docker run --rm drwetter/testssl.sh -U https://dev-itkpress.itk.ac.id/
```

**Hasil Ringkas:**

```text
Heartbleed: not vulnerable
CCS: not vulnerable
ROBOT: not vulnerable
POODLE: not vulnerable
SWEET32: not vulnerable
FREAK: not vulnerable
DROWN: not vulnerable
LOGJAM: not vulnerable
BEAST: not vulnerable
RC4: no RC4
LUCKY13: potentially VULNERABLE, uses obsolete CBC ciphers with TLS
```

**Dampak:**
LUCKY13 adalah timing side-channel yang sulit dieksploitasi secara praktis, tetapi keberadaan CBC ciphers merupakan hardening gap.

**Rekomendasi:**
Prioritaskan AEAD ciphers (GCM/ChaCha20) dan pertimbangkan menonaktifkan CBC pada TLS 1.2 bila kompatibilitas memungkinkan.

### DITK-019 - Exposed OMP Tool Scripts

**Severity:** Low-Medium
**Status:** Confirmed exposure; RCE not confirmed

**Deskripsi:**
Directory `/tools/` browsable dan memperlihatkan script internal OMP.

**Langkah Reproduksi:**

```powershell
curl.exe -s -L "https://dev-itkpress.itk.ac.id/tools/"
curl.exe -s -L "https://dev-itkpress.itk.ac.id/tools/install.php"
curl.exe -s -L "https://dev-itkpress.itk.ac.id/tools/importExport.php"
curl.exe -s -L "https://dev-itkpress.itk.ac.id/tools/fixFilenames.php"
curl.exe -s -L "https://dev-itkpress.itk.ac.id/tools/dbXMLtoSQL.php"
```

**Hasil:**

```text
/tools/install.php -> This script can only be executed from the command-line
/tools/importExport.php -> This script can only be executed from the command-line
/tools/fixFilenames.php -> This script can only be executed from the command-line
/tools/dbXMLtoSQL.php -> 500 Internal Server Error, 1 byte
/tools/bootstrap.inc.php -> 200 OK, 1 byte
```

**Dampak:**
Script internal dan behaviornya terekspos. Direct web RCE tidak terbukti karena beberapa script self-block command-line only, tetapi exposure ini memperluas attack surface dan membantu fingerprinting.

**Rekomendasi:**
Blokir akses publik ke `/tools/` sepenuhnya pada web server.

## 8. Negative / Not Confirmed Results

| Area | Hasil |
| --- | --- |
| Stored XSS via submission title/subtitle | Not confirmed; checked sinks escaped payload |
| Stored XSS via file metadata form | Not confirmed; value attribute encoded |
| Upload-to-XSS via HTML/SVG download | Not confirmed; forced attachment |
| Upload-to-RCE via PHP/PHTML download | Not confirmed; bytes returned, not executed |
| File download IDOR | Not confirmed in sampled adjacent/wrong IDs |
| Author-to-admin role bypass | Not confirmed in sampled management/admin endpoints |
| SQL injection public search | Not confirmed |
| SQL injection `_submissions` | Not confirmed; endpoint 500 unconditional |
| Public defacement via author submission | Not confirmed; test submission catalog IDs returned login page |

## 9. Attack Chain Analysis

Walaupun RCE/role bypass belum terbukti langsung, target memiliki beberapa kelemahan yang saling memperkuat:

```text
OMP 3.3.0-12 outdated
  + exact version/release disclosure
  + broad internal directory listing
  + plugin/API/tool/template inventory exposed
  + self-registration open
  + authenticated upload accepts risky extensions
  + cookie/session hardening weak
  + missing browser security headers
  + unstable API endpoints
= increased likelihood of successful targeted exploitation if attacker finds a role-specific CVE path or obtains editor/manager privileges
```

Risiko terbesar bukan satu endpoint tunggal, tetapi kombinasi outdated component, excessive information disclosure, dan authenticated attack surface.

## 10. Local Lab Notes

Local OMP lab tersedia di:

```text
lab/omp-local
http://localhost:8080/home
```

Status lab:

```text
omp-local-db-1   healthy
omp-local-app-1  up
omp-local-web-1  up, 0.0.0.0:8080->80
```

PoC lokal yang tersedia:

```text
poc-user-import-admin.xml
poc-user-import-admin-from-editor.xml
poc-upload-test.php
poc-upload-test.txt
```

Lab dapat digunakan untuk demonstrasi CVE/User XML/admin creation secara aman. Hasil lab tidak boleh diklaim sebagai compromise target kampus.

## 11. Tools Dan Command Reproduksi Utama

### Windows PowerShell

```powershell
curl.exe -s -I --max-time 15 "https://dev-itkpress.itk.ac.id/home"
curl.exe -s -L --max-time 20 "https://dev-itkpress.itk.ac.id/dbscripts/xml/version.xml"
curl.exe -s -L --max-time 20 "https://dev-itkpress.itk.ac.id/docs/release-notes/README-3.3.0"
curl.exe -s -L --max-time 20 "https://dev-itkpress.itk.ac.id/api/v1/"
curl.exe -s -L --max-time 20 "https://dev-itkpress.itk.ac.id/tools/"
```

### WSL Ubuntu Gobuster

```bash
gobuster dir -u https://dev-itkpress.itk.ac.id/ \
  -w evidence/wordlists/omp-medium-paths.txt \
  -t 4 --delay 500ms -k -q \
  -o evidence/gobuster-omp-medium-2026-06-22.txt
```

### Docker testssl.sh

```powershell
docker run --rm drwetter/testssl.sh -U https://dev-itkpress.itk.ac.id/
```

### Authenticated Curl Session

Langkah ringkas:

1. GET login page dan simpan cookie jar.
2. Extract `csrfToken`.
3. POST ke `/home/login/signIn` dengan username/password akun test.
4. Gunakan cookie jar untuk request authenticated.

Indikator sukses:

```text
title=Submissions | ITK Press
authenticated=True
```

## 12. Rekomendasi Prioritas

1. Update OMP dari `3.3.0.12` ke versi stabil terbaru yang didukung.
2. Matikan directory listing secara global dan blokir direktori internal.
3. Blokir akses publik ke `/tools/`, `/classes/`, `/controllers/`, `/templates/`, `/dbscripts/`, `/docs/`, `/registry/`, `/cache`, `/plugins`, dan `/api` listing.
4. Perbaiki API endpoint yang `500`, terutama `_submissions`, `stats`, dan `vocabs`.
5. Terapkan cookie flags `HttpOnly; Secure; SameSite=Lax`.
6. Tambahkan security headers: CSP, frame-ancestors/X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy.
7. Batasi self-registration pada environment dev/STB.
8. Perketat upload validation: allowlist ekstensi/MIME, normalisasi nama file, simpan di luar webroot.
9. Audit semua sink metadata title/subtitle/file metadata untuk XSS, termasuk email, notification, reviewer/editor views.
10. Hardening TLS dengan mengurangi CBC ciphers bila kompatibilitas memungkinkan.
11. Gunakan VPN/IP allowlist untuk environment dev.

## 13. Effort Dan Confidence

Estimasi effort terhadap peluang direct active testing dengan akses saat ini: **85-90%**.

Yang sudah dilakukan:

- Passive recon dan fingerprint.
- Header/cookie audit.
- Port/liveness baseline.
- Directory enumeration kecil dan medium OMP-specific.
- Authenticated author workflow testing.
- Upload dan download behavior checks.
- HTML injection dan XSS sink checks.
- API differential testing.
- Access control / IDOR sampling.
- Role boundary sampling.
- TLS testssl.
- CVE/advisory triage.
- Local OMP lab startup dan PoC readiness.

Confidence bahwa tidak ada lagi **low-to-medium, anonymous/author-reachable, directly testable** vulnerability yang mudah ditemukan tanpa role editor/admin atau exploit development lebih dalam: **75-80%**.

Confidence bahwa tidak ada vulnerability sama sekali: **tidak bisa diklaim**.

Sisa uncertainty:

- CVE editor/manager/admin-only belum bisa divalidasi dari akun author.
- Reviewer/editor/production/email notification sink tidak reachable dari role author.
- Local lab belum dipakai untuk menghasilkan exploit proof yang aman untuk semua CVE.
- Heavy fuzzing generic wordlist besar tidak dilakukan untuk menghindari risiko availability.
- Source-code-guided exploit development belum dilakukan penuh.

Practical conclusion: dengan akun author dan target live dev, pengujian sudah mendekati batas wajar. Temuan terkuat adalah broad directory listing + outdated OMP exact version + API/tool exposure + risky upload surface.

## 14. Lampiran Evidence Lokal

File evidence utama:

```text
evidence/findings-dev-itkpress.md
evidence/raw-http-dev-itkpress.md
evidence/findings-gpt-browser.md
evidence/dev-itkpress-active-verification-2026-06-21.md
evidence/dev-itkpress-directory-listing-expanded-2026-06-21.md
evidence/dev-itkpress-active-http-phase-2026-06-22.md
evidence/dev-itkpress-api-access-control-2026-06-22.md
evidence/dev-itkpress-final-active-triage-2026-06-22.md
evidence/dev-itkpress-controlled-heavy-scan-2026-06-22.md
evidence/gobuster-omp-small-2026-06-22.txt
evidence/gobuster-omp-medium-2026-06-22.txt
evidence/wordlists/omp-small-paths.txt
evidence/wordlists/omp-medium-paths.txt
```

## 15. Kesimpulan

Target `dev-itkpress.itk.ac.id` memiliki exposure yang signifikan untuk environment dev/STB. Tidak ditemukan compromise langsung seperti RCE atau role bypass dari akun author, tetapi target menjalankan OMP versi lama dengan CVE publik, mengekspos banyak direktori internal, membuka detail versi dan struktur aplikasi, menerima upload ekstensi berisiko, serta memiliki API error dan hardening gap. Perbaikan prioritas adalah update OMP, tutup directory listing/internal paths, perbaiki API 500, batasi akses dev, dan perketat upload/session/security headers.
