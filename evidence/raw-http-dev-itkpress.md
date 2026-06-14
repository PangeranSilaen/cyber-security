# Lampiran Bukti: Raw HTTP Request & Response (dev-itkpress.itk.ac.id)

Lampiran ini memenuhi format wajib tubes poin (f) Bukti: raw HTTP request & response.
Nilai cookie sesi `OMPSID` DIREDAKSI demi etika (tidak membocorkan session identifier).
Waktu pengambilan: 2026-06-15 01:19 WITA (di luar jam kerja 07:00-16:00 WITA).

---

## Bukti 1: `GET /home` (multi-finding)

Membuktikan: DITK-002 (cookie tanpa flag), DITK-003 (missing security headers),
DITK-004 (version/server disclosure), serta kontrol positif (HSTS, no-store).

Command:

```powershell
curl.exe -s -v -o NUL --max-time 25 "https://dev-itkpress.itk.ac.id/home"
```

Raw (request ditandai `>`, response ditandai `<`):

```http
> GET /home HTTP/1.1
> Host: dev-itkpress.itk.ac.id
> User-Agent: curl/8.19.0
> Accept: */*
>
< HTTP/1.1 200 OK
< Server: openresty
< Date: Sun, 14 Jun 2026 17:19:01 GMT
< Content-Type: text/html; charset=utf-8
< Transfer-Encoding: chunked
< Connection: keep-alive
< Set-Cookie: OMPSID=<REDACTED>; path=/; domain=dev-itkpress.itk.ac.id
< Cache-Control: no-store
< Vary: Accept-Encoding
< Strict-Transport-Security: max-age=63072000; preload
< X-Served-By: dev-itkpress.itk.ac.id
<
```

Analisis bukti:

- `Set-Cookie: OMPSID=...; path=/; domain=...` -> TIDAK ada atribut `HttpOnly`, `Secure`, `SameSite` (DITK-002).
- TIDAK ada header `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` (DITK-003).
- `Server: openresty` + `X-Served-By` (DITK-004/info disclosure).
- Kontrol positif: `Strict-Transport-Security: max-age=63072000; preload` dan `Cache-Control: no-store` hadir.

---

## Bukti 2: `GET /home/submission/wizard` (DITK-009, File Upload gated)

Membuktikan: mekanisme upload OMP berada di balik autentikasi (redirect ke login).

Command:

```powershell
curl.exe -s -I --max-time 20 "https://dev-itkpress.itk.ac.id/home/submission/wizard"
```

Raw response (ringkas):

```http
HTTP/1.1 302 Found
Location: https://dev-itkpress.itk.ac.id/home/login?source=%2Fhome%2Fsubmission%2Fwizard
```

Analisis bukti: jalur unggah berkas tidak terjangkau anonim; redirect 302 ke `/home/login`.

---

## Bukti 3: Deteksi Injection non-destruktif (DITK-008, ter-sanitasi)

Membuktikan: parameter pencarian publik memperlakukan input sebagai literal; tidak ada error DB.

Command (marker, tanpa UNION/time-based/dump):

```powershell
# baseline
curl.exe -s -o NUL -w "%{http_code} %{size_download}" -G --data-urlencode "query=book" `
  "https://dev-itkpress.itk.ac.id/home/search/search"
# marker single-quote
curl.exe -s -o NUL -w "%{http_code} %{size_download}" -G --data-urlencode "query=book'" `
  "https://dev-itkpress.itk.ac.id/home/search/search"
```

Ringkasan hasil:

| Input | HTTP | Ukuran body | Error DB |
| --- | --- | --- | --- |
| `book` (baseline) | 200 | 16775 B | - |
| `book'` | 200 | 16786 B | tidak ada |
| `book"` | 200 | 16786 B | tidak ada |
| `book')` | 200 | 16788 B | tidak ada |
| `book'--` | 200 | 6263 B (no-results normal) | tidak ada |

Analisis bukti: tidak ada string error database (`SQL syntax`, `mysqli`, `PDOException`, dll) yang bocor; respons stabil. Input tampak ter-sanitasi/parameterized. Tidak diklaim sebagai kerentanan.

---

Catatan: untuk laporan akhir, lampiran ini dapat dilengkapi screenshot browser/DevTools sesuai format tubes. Seluruh bukti diambil non-destruktif; nilai sensitif (session id) diredaksi.
