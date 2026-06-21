# Dev Mirror Adaptation Guide

Dokumen ini menjelaskan mode adaptasi `semirip mungkin` untuk lab lokal.

## Konsep

Lab berjalan dalam mode hybrid:

- Backend tetap OMP lokal `3.3.0.12`
- Homepage dan beberapa halaman informasi dimirror dari `https://dev-itkpress.itk.ac.id`
- Katalog dan detail buku dapat diisi sebagai data nyata lokal hasil seed
- Halaman interaktif/auth tetap ditangani OMP lokal

Dengan model ini, tampilan publik lokal lebih dekat ke target, tapi kamu masih punya backend lokal yang aman untuk latihan.

## Halaman Yang Dimirror

- `/home`
- `/home/index`
- `/home/search`
- `/home/about`
- `/home/about/submissions`
- `/home/about/privacy`
- `/home/announcement/view/12`

## Katalog Lokal Nyata

Untuk mengisi katalog lokal dari halaman pertama target dev:

```powershell
pwsh -File "lab/omp-local/seed-dev-catalog.ps1"
```

Script ini akan:

- parse `lab/omp-local/mirror/home/catalog.html`
- download logo header dan asset cover yang dibutuhkan
- isi data nyata ke DB OMP lokal
- set katalog lokal agar berurutan sesuai seed

Sesudah itu, route berikut akan memakai data lokal nyata:

- `/home/catalog`
- `/home/catalog/book/<id>` untuk item yang sudah diseed

## Sinkronisasi Ulang Mirror

Jalankan:

```powershell
pwsh -File "lab/omp-local/sync-dev-mirror.ps1"
docker compose --env-file "lab/omp-local/.env" -f "lab/omp-local/docker-compose.yml" restart web
```

## Catatan

- Mirror ini hanya untuk kemiripan UI publik.
- Login, register, submissions, profile, dan flow internal tetap memakai backend lokal.
- Jika target dev berubah, jalankan sinkronisasi lagi.
