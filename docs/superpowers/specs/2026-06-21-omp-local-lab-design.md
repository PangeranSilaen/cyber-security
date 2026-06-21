# OMP Local Lab Design

## Goal

Build a local `WSL + Docker Compose` lab that is close enough to the target environment to support presentation prep and safe PoC rehearsal. The lab should prioritize stability first, while still resembling the observed target in the areas that matter for demo work: OMP version, URL shape, login/register flow, and general application behavior.

## Constraints And Decisions

- Lab path: `lab/omp-local`
- Local demo URL: `http://localhost:8080/home`
- Documentation in repo: allowed
- Initial data: prefer sample or dummy content if practical and stable
- Internet downloads: allowed
- Tradeoff rule: prefer the most stable option first, then maximize similarity
- No subagents

## Recommended Architecture

Use Docker Compose inside WSL with three services:

- `db`: MariaDB for OMP application data
- `app`: PHP-FPM running OMP `3.3.0.12`
- `web`: Nginx serving the app and exposing port `8080`

This keeps the stack simple enough to stabilize quickly while remaining close to a typical OMP deployment. It also makes reset, rebuild, and demo use straightforward.

## Similarity Targets

The lab should match or approximate the target in these areas:

- OMP version pinned to `3.3.0.12`
- Main route accessible under `/home`
- Login and registration pages reachable through the same application path shape
- MariaDB-backed installation
- Demo-friendly dummy content when practical

The lab does not need to fully replicate every production or dev detail such as exact reverse-proxy stack, TLS setup, hostnames, or non-essential infrastructure behavior.

## Implementation Shape

Create a dedicated lab folder with:

- `docker-compose.yml`
- app and web config files
- persistent volume configuration for database and app state
- setup documentation for first run, reset, and reuse

If OMP cannot be configured to natively live under `/home` with a stable setup, use the web layer to provide the `http://localhost:8080/home` entry path while keeping the application behavior consistent.

## Data Strategy

Start from a fresh install of OMP `3.3.0.12`. If sample content can be added with low complexity and good reliability, include a small amount of dummy data or provide a short documented step to create it after first boot.

## Verification

The lab is only considered complete when the following are verified end to end:

- `docker compose up -d` succeeds from a clean state
- the local site opens at `http://localhost:8080/home`
- the page identifies as OMP `3.3.0.12`
- the database-backed app remains functional across a restart
- setup and reset instructions are accurate

## Risks And Mitigations

- Old OMP dependencies may be incompatible with modern defaults
  - Mitigation: choose conservative PHP and MariaDB versions known to be friendly to 3.3.x-era apps
- `/home` path behavior may be awkward locally
  - Mitigation: solve path shaping at the web layer instead of forcing deeper app changes unless necessary
- Dummy content may add instability
  - Mitigation: keep dummy data minimal and prefer documented manual creation over brittle automation when needed

## Deliverables

- Working local lab in `lab/omp-local`
- Repo documentation explaining setup, run, reset, and what matches the target
- Verified local environment suitable for adaptation into the course deliverable
