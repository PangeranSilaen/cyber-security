# OMP Local Lab

Lab lokal ini menyiapkan OMP `3.3.0.12` di `http://localhost:8080/home` dengan stack `Docker Compose + MariaDB + Apache + Nginx`.

## Tujuan

- Mendekati target `dev-itkpress` pada level versi aplikasi, pola path, dan alur dasar.
- Menyediakan lingkungan aman untuk latihan, dokumentasi, dan adaptasi presentasi.

## Yang Disamakan

- OMP `3.3.0.12`
- MariaDB backend
- Entry path demo di `/home`
- Alur install/login/register OMP dasar

## Yang Tidak Dipaksakan Sama

- TLS produksi/dev kampus
- Infrastruktur reverse proxy asli
- Data kampus asli

## Prasyarat

- WSL aktif
- Docker Desktop engine hidup
- Port `8080` kosong

## Menjalankan Lab

1. Salin env:

```powershell
Copy-Item "lab/omp-local/.env.example" "lab/omp-local/.env"
```

2. Bangun dan jalankan stack:

```powershell
docker compose --env-file "lab/omp-local/.env" -f "lab/omp-local/docker-compose.yml" up -d --build
```

2a. Sinkronkan halaman publik agar lebih mirip target dev:

```powershell
pwsh -File "lab/omp-local/sync-dev-mirror.ps1"
docker compose --env-file "lab/omp-local/.env" -f "lab/omp-local/docker-compose.yml" restart web
```

2b. Isi katalog lokal nyata dari halaman pertama target dev:

```powershell
pwsh -File "lab/omp-local/seed-dev-catalog.ps1"
```

3. Cek status:

```powershell
docker compose --env-file "lab/omp-local/.env" -f "lab/omp-local/docker-compose.yml" ps
```

4. Buka:

```text
http://localhost:8080/home
```

## Mode Hybrid Saat Ini

- Halaman publik utama disajikan dari mirror target dev yang sudah direwrite ke `localhost`
- Halaman auth dan workflow internal tetap memakai OMP lokal

Route publik yang dimirror:

- `/home`
- `/home/index`
- `/home/search`
- `/home/about`
- `/home/about/submissions`
- `/home/about/privacy`
- `/home/announcement/view/12`

Route yang tetap memakai backend lokal:

- `/home/catalog`
- `/home/catalog/book/<id>` untuk item yang sudah diseed
- `/home/login`
- `/home/user/register`
- `/home/submissions`
- `/home/user/profile`
- route admin dan workflow lain

Jika baru pertama kali start dari state benar-benar kosong dan `http://localhost:8080/home` masih `404`, jalankan bootstrap press:

```powershell
pwsh -File "lab/omp-local/bootstrap-press.ps1"
```

## Kredensial Awal

- Username: `admin`
- Password: `admin123!`

Jika kamu mengubah nilai ini di `.env`, nilai runtime akan mengikuti `.env`.

## Catatan Penting Tentang `/home`

Redirect `localhost:8080/` ke `/home` sudah disiapkan di layer Nginx. Press `home` bisa dibuat lewat UI admin, atau lebih cepat lewat:

```powershell
pwsh -File "lab/omp-local/bootstrap-press.ps1"
```

Default bootstrap:

- Press name: `ITK Press`
- Press acronym: `ITKP`
- Press path: `home`

Kalau mau path lain untuk percobaan:

```powershell
pwsh -File "lab/omp-local/bootstrap-press.ps1" -PressName "Demo Press" -PressAcronym "DEMO" -PressPath "demo"
```

## Reset

Hentikan stack:

```powershell
docker compose --env-file "lab/omp-local/.env" -f "lab/omp-local/docker-compose.yml" down
```

Hapus seluruh state dan mulai bersih:

```powershell
docker compose --env-file "lab/omp-local/.env" -f "lab/omp-local/docker-compose.yml" down -v
```

## Log Saat Ada Masalah

```powershell
docker compose --env-file "lab/omp-local/.env" -f "lab/omp-local/docker-compose.yml" logs --no-color db
docker compose --env-file "lab/omp-local/.env" -f "lab/omp-local/docker-compose.yml" logs --no-color app
docker compose --env-file "lab/omp-local/.env" -f "lab/omp-local/docker-compose.yml" logs --no-color web
```

## Adaptasi Ke Tugas Asli

- Pertahankan bukti fingerprint target nyata di laporan terpisah.
- Gunakan lab ini untuk latihan alur, screenshot, dan pemahaman struktur OMP.
- Jangan campurkan data atau klaim bahwa lab lokal adalah server kampus.
- Untuk mode publik yang lebih mirip target, lihat `lab/omp-local/ADAPTATION.md`.
- Screenshot referensi target dan pembanding lokal disimpan di `evidence/dev-itkpress-ui/`.
