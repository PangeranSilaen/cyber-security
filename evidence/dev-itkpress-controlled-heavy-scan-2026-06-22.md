# Controlled Heavier Scan - dev-itkpress.itk.ac.id

Date/time: 2026-06-22 00:53+ WITA
Method: WSL Ubuntu `gobuster` with OMP-specific medium wordlist. Docker local lab started for safe PoC work.

## Pre-Check

Target liveness before scan:

```text
GET /home -> code=200 size=15440 time=5.606s
```

## Scan Configuration

Custom wordlist:

```text
evidence/wordlists/omp-medium-paths.txt
```

Command:

```text
gobuster dir -u https://dev-itkpress.itk.ac.id/ \
  -w evidence/wordlists/omp-medium-paths.txt \
  -t 4 --delay 500ms -k -q \
  -o evidence/gobuster-omp-medium-2026-06-22.txt
```

This was broader than the initial check but still targeted to known OMP paths and modules, not a generic large wordlist.

## New / Strengthened Findings

The medium scan confirmed additional exposed directories beyond the earlier evidence:

| Path | Result |
| --- | --- |
| `/classes/` | `301` -> browsable; follow-up `200 OK`, `Index of` |
| `/controllers/` | `301` -> browsable; follow-up `200 OK`, `Index of` |
| `/pages/` | `301` -> browsable; follow-up `200 OK`, `Index of` |
| `/templates/` | `301` -> browsable; follow-up `200 OK`, `Index of` |
| `/tools/` | `301` -> browsable; follow-up `200 OK`, `Index of` |
| `/styles/` | `301` exposed |
| `/js/` | `301` exposed |
| `/plugins/gateways/` | `301` exposed |
| `/plugins/oaiMetadataFormats/` | `301` exposed |
| `/plugins/importexport/csv/` | `301` exposed |
| `/plugins/importexport/native/` | `301` exposed |
| `/plugins/importexport/onix30/` | `301` exposed |
| `/plugins/importexport/users/` | `301` exposed, direct follow-up returned 500 |
| `/plugins/paymethod/manual/` | `301` exposed |
| `/plugins/paymethod/paypal/` | `301` exposed |
| `/plugins/themes/default/` | `301` exposed |
| `/plugins/themes/pragma/` | `301` exposed |

Example directory entries from follow-up checks:

`/classes/`:

```text
codelist/, components/, core/, file/, handler/, i18n/, install/, log/
```

`/controllers/`:

```text
api/, grid/, modals/, statistics/, submission/, tab/
```

`/pages/`:

```text
authorDashboard/, catalog/, gateway/, index/, information/, manageCatalog/, management/, oai/
```

`/templates/`:

```text
authorDashboard/, controllers/, frontend/, images/, manageCatalog/, management/, reviewer/, submission/
```

`/tools/`:

```text
bootstrap.inc.php, cleanReviewerInterests.php, dbXMLtoSQL.php, fbvVisualResults.php, fixFilenames.php, importExport.php, install.php, jsonlint-exclusions.txt
```

## Exposed Tool Scripts

Selected direct tool script checks:

| Path | HTTP | Body |
| --- | ---: | --- |
| `/tools/install.php` | `200 OK` | `This script can only be executed from the command-line` |
| `/tools/importExport.php` | `200 OK` | `This script can only be executed from the command-line` |
| `/tools/fixFilenames.php` | `200 OK` | `This script can only be executed from the command-line` |
| `/tools/dbXMLtoSQL.php` | `500 Internal Server Error` | 1-byte/empty body |
| `/tools/bootstrap.inc.php` | `200 OK` | 1-byte/empty body |

Interpretation: the tools are web-reachable enough to disclose script existence and behavior, but direct web RCE was not confirmed because important scripts self-block with a command-line-only message.

## API Findings From Medium Scan

Public `/api/v1/*` directory paths are exposed via 301/listing. Contextual `/home/api/v1/*` paths mostly enforce API access restrictions:

| Path | Result |
| --- | --- |
| `/home/api/v1/_email` | `403` |
| `/home/api/v1/_payments` | `403` |
| `/home/api/v1/_submissions` | `403` in unauthenticated scan; `500` when authenticated earlier |
| `/home/api/v1/_uploadPublicFile` | `403` |
| `/home/api/v1/announcements` | `403` |
| `/home/api/v1/contexts` | `403` |
| `/home/api/v1/emailTemplates` | `403` |
| `/home/api/v1/site` | `403` |
| `/home/api/v1/stats` | `500` |
| `/home/api/v1/submissions` | `403` |
| `/home/api/v1/temporaryFiles` | `403` |
| `/home/api/v1/users` | `403` |
| `/home/api/v1/vocabs` | `500` |

Interpretation: API resources are discoverable and some endpoints are unstable (`500`), but no unauthorized data exposure was confirmed from these checks.

## Local Lab Readiness

Local OMP lab in `lab/omp-local` was started successfully after creating `.env` from `.env.example`:

```text
http://localhost:8080/home -> code=200 size=14856
```

Lab services running:

```text
omp-local-db-1   healthy
omp-local-app-1  up
omp-local-web-1  up, 0.0.0.0:8080->80
```

Relevant local PoCs exist:

```text
poc-user-import-admin.xml
poc-user-import-admin-from-editor.xml
poc-upload-test.php
poc-upload-test.txt
```

The lab is suitable for demonstrating dangerous CVE/user-import/admin creation flows safely, but those lab results must not be represented as direct compromise of the campus dev target.

## Decision

No direct RCE, role bypass, file download IDOR, or public defacement path was confirmed by this heavier-but-controlled scan. The strongest live target finding remains broad directory listing/internal structure exposure combined with outdated OMP 3.3.0-12 and API instability.
