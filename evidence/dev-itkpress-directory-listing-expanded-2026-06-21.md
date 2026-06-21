# Expanded Directory Listing Evidence - dev-itkpress.itk.ac.id

Date/time: 2026-06-21 23:50-23:58 WITA
Method: HTTP-only `curl.exe` GET requests with short delay between paths. No authentication, no exploit payload, no writes.

## Summary

Directory listing is not limited to `/cache/`. Additional public directories also return `Index of` pages and disclose internal application structure, plugin inventory, and compiled template filenames.

## Confirmed Directory Listings

| Path | HTTP | Evidence marker | Notes |
| --- | --- | --- | --- |
| `/cache/` | `200 OK` | `Index of` | Previously confirmed; still active. |
| `/cache/HTML/` | `200 OK` | `Index of` | Cache subdirectory browsable. |
| `/cache/URI/` | `200 OK` | `Index of` | Cache subdirectory browsable. |
| `/cache/t_compile/` | `200 OK` | `Index of` | Large listing of compiled template PHP files. |
| `/plugins/` | `200 OK` | `Index of` | Plugin category inventory exposed. |
| `/plugins/themes/` | `200 OK` | `Index of` | Theme inventory exposed (`default/`, `pragma/`). |
| `/plugins/importexport/` | `200 OK` | `Index of` | Import/export plugin inventory exposed (`csv/`, `native/`, `onix30/`, `users/`). |
| `/plugins/paymethod/` | `200 OK` | `Index of` | Payment plugin inventory exposed (`manual/`, `paypal/`). |

## Example Exposed Entries

`/plugins/` exposed:

```text
gateways/, importexport/, metadata/, oaiMetadataFormats/, paymethod/, pubIds/, reports/, themes/, viewableFiles/
```

`/plugins/themes/` exposed:

```text
default/, pragma/
```

`/plugins/importexport/` exposed:

```text
csv/, native/, onix30/, users/
```

`/plugins/paymethod/` exposed:

```text
manual/, paypal/
```

`/cache/t_compile/` exposed compiled template-like filenames including backend/admin/author-dashboard related names, for example:

```text
...app.layoutsbackend.tpl.php
...app.adminindex.tpl.php
...app.controllerstabauthorDashb.php
...app.useruserGroups.tpl.php
...app.userrolesForm.tpl.php
```

## Non-Findings / Negative Checks

The following public paths did not show useful directory listing in this pass:

| Path | Result |
| --- | --- |
| `/files/` | `404 Not Found` |
| `/uploads/` | `404 Not Found` |
| `/submission/` | `404 Not Found` |
| `/plugins/generic/` | `404 Not Found` |

## Public Display Impact Check

Public catalog IDs matching the authenticated test submissions were checked:

```text
/home/catalog/book/175
/home/catalog/book/176
/home/catalog/book/177
```

Each returned a login page, not a public book page containing the test markers (`TEAM4`, `ITALIC123`, `created by team4`, `cybersec`). This means there is no evidence, from safe public checks, that the test account can directly alter the public catalog display without editorial/publication workflow access.

## Impact

Directory listing exposes internal structure and installed plugin/theme inventory. The `/cache/t_compile/` listing additionally leaks compiled template filenames that reveal backend/admin/author-dashboard templates and implementation structure. This helps attackers fingerprint OMP components and plan targeted attacks against the already outdated OMP version.

## Recommendation

Disable directory listing globally (`Options -Indexes` for Apache or `autoindex off` for Nginx/openresty). Block direct public access to internal directories such as `/cache/`, `/cache/t_compile/`, `/plugins/`, `/dbscripts/`, and `/docs/` unless a specific static asset is intentionally public.
