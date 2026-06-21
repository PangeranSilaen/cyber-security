# OMP Local Lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a stable local `WSL + Docker Compose` OMP `3.3.0.12` lab that opens at `http://localhost:8080/home` and is suitable for demo rehearsal.

**Architecture:** Use a three-service Docker Compose stack with MariaDB, PHP-FPM, and Nginx. Keep the app pinned to OMP `3.3.0.12`, shape the local entry path through the web layer if needed, and document run/reset steps in-repo.

**Tech Stack:** Docker Compose, MariaDB, PHP-FPM, Nginx, shell scripts, pinned OMP source tarball

---

## File Structure

- Create: `lab/omp-local/docker-compose.yml` - main local stack
- Create: `lab/omp-local/.env.example` - overridable ports, credentials, and project defaults
- Create: `lab/omp-local/app/Dockerfile` - PHP-FPM app image with OMP dependencies
- Create: `lab/omp-local/app/entrypoint.sh` - first-run install and source bootstrap
- Create: `lab/omp-local/app/php.ini` - conservative PHP runtime settings
- Create: `lab/omp-local/web/default.conf` - Nginx vhost and `/home` path handling
- Create: `lab/omp-local/scripts/fetch-omp.sh` - pinned OMP `3.3.0.12` source fetch helper
- Create: `lab/omp-local/README.md` - setup, run, reset, and demo notes
- Modify: `.gitignore` - ignore local lab runtime state if needed

### Task 1: Scaffold The Lab Layout

**Files:**
- Create: `lab/omp-local/docker-compose.yml`
- Create: `lab/omp-local/.env.example`
- Create: `lab/omp-local/README.md`

- [ ] **Step 1: Create the folder structure**

Create these paths:

```text
lab/omp-local/
lab/omp-local/app/
lab/omp-local/web/
lab/omp-local/scripts/
```

- [ ] **Step 2: Write the Compose skeleton**

Create `lab/omp-local/docker-compose.yml` with these service shapes:

```yaml
services:
  db:
    image: mariadb:10.5
  app:
    build:
      context: ./app
  web:
    image: nginx:1.24-alpine
```

- [ ] **Step 3: Add environment defaults**

Create `lab/omp-local/.env.example` with these values:

```env
COMPOSE_PROJECT_NAME=omp-local
OMP_HTTP_PORT=8080
DB_NAME=omp
DB_USER=omp
DB_PASSWORD=omp
DB_ROOT_PASSWORD=rootpass
OMP_VERSION=3_3_0-12
```

- [ ] **Step 4: Add a starter README**

Create `lab/omp-local/README.md` with these sections:

```md
# OMP Local Lab

## Goal
Run OMP 3.3.0.12 locally at http://localhost:8080/home.

## Status
This lab uses Docker Compose with MariaDB, PHP-FPM, and Nginx.
```

- [ ] **Step 5: Verify Compose syntax is valid**

Run: `docker compose --env-file .env.example -f lab/omp-local/docker-compose.yml config`

Expected: merged Compose output with no validation error.

### Task 2: Build The App Image

**Files:**
- Create: `lab/omp-local/app/Dockerfile`
- Create: `lab/omp-local/app/php.ini`
- Create: `lab/omp-local/scripts/fetch-omp.sh`

- [ ] **Step 1: Add the pinned source fetch helper**

Create `lab/omp-local/scripts/fetch-omp.sh`:

```sh
#!/usr/bin/env sh
set -eu

version="${1:-3_3_0-12}"
url="https://github.com/pkp/omp/archive/refs/tags/${version}.tar.gz"
out="/tmp/omp-${version}.tar.gz"

curl -fsSL "$url" -o "$out"
tar -xzf "$out" -C /tmp
```
```

- [ ] **Step 2: Add conservative PHP settings**

Create `lab/omp-local/app/php.ini`:

```ini
memory_limit = 512M
upload_max_filesize = 64M
post_max_size = 64M
max_execution_time = 120
date.timezone = UTC
```

- [ ] **Step 3: Add the app image**

Create `lab/omp-local/app/Dockerfile` with the required packages and PHP extensions:

```dockerfile
FROM php:7.4-fpm

RUN apt-get update \
 && apt-get install -y --no-install-recommends \
    curl unzip libpng-dev libjpeg62-turbo-dev libfreetype6-dev \
    libxml2-dev libxslt1-dev libzip-dev libonig-dev libicu-dev \
    libldap2-dev libpq-dev default-mysql-client \
 && docker-php-ext-configure gd --with-freetype --with-jpeg \
 && docker-php-ext-install -j"$(nproc)" \
    gd mysqli pdo pdo_mysql xml xsl zip intl mbstring opcache \
 && rm -rf /var/lib/apt/lists/*
```

- [ ] **Step 4: Verify the image definition is parseable**

Run: `docker build -f lab/omp-local/app/Dockerfile lab/omp-local/app`

Expected: image build starts successfully, even if later steps still need more files.

### Task 3: Add First-Run Bootstrap

**Files:**
- Create: `lab/omp-local/app/entrypoint.sh`
- Modify: `lab/omp-local/app/Dockerfile`

- [ ] **Step 1: Create the first-run entrypoint**

Create `lab/omp-local/app/entrypoint.sh`:

```sh
#!/usr/bin/env sh
set -eu

APP_ROOT=/var/www/html
APP_DIR="$APP_ROOT/home"

mkdir -p "$APP_ROOT"

if [ ! -f "$APP_DIR/index.php" ]; then
  version="${OMP_VERSION:-3_3_0-12}"
  url="https://github.com/pkp/omp/archive/refs/tags/${version}.tar.gz"
  tmp="/tmp/omp-${version}.tar.gz"

  curl -fsSL "$url" -o "$tmp"
  rm -rf /tmp/omp-src
  mkdir -p /tmp/omp-src
  tar -xzf "$tmp" -C /tmp/omp-src --strip-components=1
  mkdir -p "$APP_DIR"
  cp -a /tmp/omp-src/. "$APP_DIR/"
  mkdir -p "$APP_DIR/public/files" "$APP_DIR/cache" "$APP_DIR/cache/t_cache" "$APP_DIR/cache/t_compile" "$APP_DIR/cache/_db"
  chown -R www-data:www-data "$APP_ROOT"
fi

exec php-fpm
```

- [ ] **Step 2: Wire the entrypoint into the image**

Append these lines to `lab/omp-local/app/Dockerfile`:

```dockerfile
COPY php.ini /usr/local/etc/php/conf.d/zz-omp.ini
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
WORKDIR /var/www/html
ENTRYPOINT ["/entrypoint.sh"]
```

- [ ] **Step 3: Verify the app image builds cleanly**

Run: `docker compose --env-file .env.example -f lab/omp-local/docker-compose.yml build app`

Expected: `app` image finishes building successfully.

### Task 4: Add Database And Web Configuration

**Files:**
- Modify: `lab/omp-local/docker-compose.yml`
- Create: `lab/omp-local/web/default.conf`

- [ ] **Step 1: Fill in the database service**

Use this service shape in `lab/omp-local/docker-compose.yml`:

```yaml
  db:
    image: mariadb:10.5
    environment:
      MYSQL_DATABASE: ${DB_NAME}
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
    volumes:
      - db_data:/var/lib/mysql
```

- [ ] **Step 2: Fill in the app service**

Use this service shape in `lab/omp-local/docker-compose.yml`:

```yaml
  app:
    build:
      context: ./app
    environment:
      OMP_VERSION: ${OMP_VERSION}
    volumes:
      - app_data:/var/www/html
    depends_on:
      - db
```

- [ ] **Step 3: Add the web service**

Use this service shape in `lab/omp-local/docker-compose.yml`:

```yaml
  web:
    image: nginx:1.24-alpine
    ports:
      - "${OMP_HTTP_PORT}:80"
    volumes:
      - app_data:/var/www/html:ro
      - ./web/default.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - app

volumes:
  db_data:
  app_data:
```

- [ ] **Step 4: Add the Nginx vhost**

Create `lab/omp-local/web/default.conf`:

```nginx
server {
    listen 80;
    server_name _;
    root /var/www/html/home;
    index index.php index.html;

    location = / {
        return 302 /home;
    }

    location /home {
        try_files $uri $uri/ /home/index.php?$query_string;
    }

    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_pass app:9000;
    }
}
```

- [ ] **Step 5: Verify full Compose config**

Run: `docker compose --env-file .env.example -f lab/omp-local/docker-compose.yml config`

Expected: final services and volumes render without error.

### Task 5: Boot And Stabilize The Lab

**Files:**
- Modify as needed based on runtime errors in:
  - `lab/omp-local/app/Dockerfile`
  - `lab/omp-local/app/entrypoint.sh`
  - `lab/omp-local/web/default.conf`
  - `lab/omp-local/docker-compose.yml`

- [ ] **Step 1: Start the stack**

Run: `docker compose --env-file .env.example -f lab/omp-local/docker-compose.yml up -d --build`

Expected: `db`, `app`, and `web` containers reach running state.

- [ ] **Step 2: Inspect container status**

Run: `docker compose --env-file .env.example -f lab/omp-local/docker-compose.yml ps`

Expected: all three services show `running` or equivalent healthy state.

- [ ] **Step 3: Check the local route**

Run: `curl -I http://localhost:8080/home`

Expected: HTTP response from the local OMP site, not connection refused.

- [ ] **Step 4: Check the rendered homepage**

Run: `curl -s http://localhost:8080/home | grep -i "Open Monograph Press\|OMP\|generator"`

Expected: page content indicates OMP and, ideally, version `3.3.0.12`.

- [ ] **Step 5: Stabilize until the lab works end to end**

Use these commands while fixing runtime issues:

```bash
docker compose --env-file .env.example -f lab/omp-local/docker-compose.yml logs --no-color app
docker compose --env-file .env.example -f lab/omp-local/docker-compose.yml logs --no-color web
docker compose --env-file .env.example -f lab/omp-local/docker-compose.yml logs --no-color db
```

Expected: after iterative fixes, the site is reachable and stable.

### Task 6: Finish Documentation And Reset Flow

**Files:**
- Modify: `lab/omp-local/README.md`
- Modify: `.gitignore`

- [ ] **Step 1: Write the setup and run instructions**

Document these commands in `lab/omp-local/README.md`:

```bash
cp lab/omp-local/.env.example lab/omp-local/.env
docker compose --env-file lab/omp-local/.env -f lab/omp-local/docker-compose.yml up -d --build
```

- [ ] **Step 2: Document reset and teardown**

Document these commands in `lab/omp-local/README.md`:

```bash
docker compose --env-file lab/omp-local/.env -f lab/omp-local/docker-compose.yml down
docker compose --env-file lab/omp-local/.env -f lab/omp-local/docker-compose.yml down -v
```

- [ ] **Step 3: Ignore local-only runtime artifacts if created**

If the implementation adds `.env` or local state paths under `lab/omp-local`, append these lines to `.gitignore`:

```gitignore
lab/omp-local/.env
lab/omp-local/tmp/
```

- [ ] **Step 4: Re-run the verification flow**

Run:

```bash
docker compose --env-file lab/omp-local/.env -f lab/omp-local/docker-compose.yml config
docker compose --env-file lab/omp-local/.env -f lab/omp-local/docker-compose.yml ps
curl -I http://localhost:8080/home
```

Expected: the documentation matches the actual working commands.
