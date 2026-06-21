# Active HTTP Testing Phase - dev-itkpress.itk.ac.id

Date/time: 2026-06-22 00:16+ WITA
Method: Windows `curl.exe`, WSL Ubuntu `gobuster`, low-rate requests. Browser automation was not used due prior timeout rule.

## Tooling

- Docker Engine verified active: client/server `28.3.2`.
- Windows tools available: `curl.exe`, Nmap, Python, OpenSSL.
- WSL Ubuntu tools available: `nmap`, `curl`, `python3`, `git`, `sqlmap`, `gobuster`.
- Kali was not registered as a WSL distro; Oracle VM Kali can be used manually if needed.

## Baseline

Target liveness check:

```text
GET https://dev-itkpress.itk.ac.id/home
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Body size: 15432 bytes
Generator: Open Monograph Press 3.3.0.12
```

## Authenticated HTTP Session

Authenticated session was created with a curl cookie jar using the provided authorized test account. Password is intentionally not recorded.

Result:

```text
csrfPresent=True
HTTP/1.1 200 OK
title=Submissions | ITK Press
authenticatedMarkers=True
```

This allowed HTTP-only checks without using `agent-browser`.

## Access Control / IDOR Checks

Author dashboard submission URLs were checked with the author account.

| Path | Result |
| --- | --- |
| `/home/authorDashboard/submission/1` | Authorization denied shell (`pkp_op_authorizationDenied`) |
| `/home/authorDashboard/submission/92` | Authorization denied shell (`pkp_op_authorizationDenied`) |
| `/home/authorDashboard/submission/175` | Own submission loaded (`Demon | A Test | ITK Press`) |
| `/home/authorDashboard/submission/176` | Own submission loaded (`Demon | A TEAM4 | ITK Press`) |
| `/home/authorDashboard/submission/177` | Own submission loaded (`Demon | XX ITALIC123 | ITK Press`) |
| `/home/authorDashboard/submission/200` | Minimal/empty response (`23` bytes) |

Interpretation: no IDOR confirmed in this sample. Unrelated existing-looking IDs returned authorization denied; owned submissions loaded as expected.

Role-boundary endpoints checked with author account:

| Path | Result |
| --- | --- |
| `/home/management/settings/context` | Authorization denied |
| `/home/management/settings/website` | Authorization denied |
| `/home/management/tools` | Authorization denied |
| `/home/admin` | Authorization denied / login-source protected |

Interpretation: no role bypass confirmed in this sample. Management/admin pages are not accessible to the author role via direct GET.

## Low-Rate Directory Enumeration

A tiny custom OMP path wordlist was used with WSL `gobuster`:

```text
gobuster dir -u https://dev-itkpress.itk.ac.id/ \
  -w evidence/wordlists/omp-small-paths.txt \
  -t 2 --delay 1500ms -k -q
```

Confirmed redirects/exposed paths included:

```text
/cache
/cache/HTML
/cache/URI
/cache/t_compile
/plugins
/plugins/themes
/plugins/importexport
/plugins/paymethod
/plugins/reports
/plugins/pubIds
/plugins/viewableFiles
/plugins/metadata
/lib
/lib/pkp
/dbscripts
/dbscripts/xml
/docs
/docs/release-notes
/locale
/registry
/public
/api
/config.inc.php (200, size 2; previously validated as not leaking config source)
```

Follow-up `curl` checks confirmed `Index of` directory listing on:

| Path | Evidence |
| --- | --- |
| `/lib/` | `200 OK`, `Index of` |
| `/lib/pkp/` | `200 OK`, `Index of` |
| `/dbscripts/` | `200 OK`, `Index of` |
| `/dbscripts/xml/` | `200 OK`, `Index of` |
| `/docs/` | `200 OK`, `Index of` |
| `/docs/release-notes/` | `200 OK`, `Index of` |
| `/locale/` | `200 OK`, `Index of` |
| `/registry/` | `200 OK`, `Index of` |
| `/api/` | `200 OK`, `Index of` |
| `/plugins/reports/` | `200 OK`, `Index of` |
| `/plugins/pubIds/` | `200 OK`, `Index of` |
| `/plugins/viewableFiles/` | `200 OK`, `Index of` |
| `/plugins/metadata/` | `200 OK`, `Index of` |

Combined with previous evidence, directory listing is broadly enabled across internal OMP directories, not only `/cache/`.

## Scanner Decision

Docker is now available, but Nikto/aggressive scanner was intentionally skipped in this phase. The controlled path enumeration already produced strong evidence, and the target is a fragile dev/STB environment. Docker can be used later for focused `testssl.sh` or constrained Nikto if specifically needed.

## Status Updates

| Topic | Status |
| --- | --- |
| Authenticated HTTP testing without browser | Confirmed working |
| Author-dashboard IDOR | Not confirmed in sampled IDs |
| Author-to-admin/management role bypass | Not confirmed in sampled endpoints |
| Directory listing | Confirmed and expanded significantly |
| Docker readiness | Confirmed |
