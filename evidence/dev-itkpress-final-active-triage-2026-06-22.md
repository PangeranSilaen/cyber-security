# Final Active Triage Notes - dev-itkpress.itk.ac.id

Date/time: 2026-06-22 00:40+ WITA
Method: HTTP/curl, Docker `testssl.sh`, passive CVE/advisory lookup. Browser automation not used due anti-stuck rule.

## Findings File Update

`evidence/findings-dev-itkpress.md` was updated so DITK-007 now reflects broad directory listing across internal OMP directories, not only `/cache/`. Severity was raised from Low to Medium because the exposure includes plugin inventory, core library paths, API directory listing, docs/release notes, registry, locale, dbscripts, and compiled backend/admin/author-dashboard template names.

## Source / Version / API Exposure Checks

Direct public files and listings confirmed:

```text
/dbscripts/xml/version.xml -> 200 OK, application/xml, confirms OMP 3.3.0.12
/docs/release-notes/README-3.3.0 -> 200 OK, release notes show Git tag 3_3_0-12
/api/v1/ -> 200 OK, Index of
```

Release notes exposed:

```text
OMP 3.3.0 Release Notes
Git tag: 3_3_0-12
Release date: September 20, 2022
```

`/api/v1/` exposed resource names:

```text
_email/, _payments/, _submissions/, _uploadPublicFile/, announcements/, contexts/, emailTemplates/, site/, stats/, submissions/, temporaryFiles/, users/, vocabs/
```

Direct checks of selected API resource paths under `/api/v1/...` returned `500 Internal Server Error` for both anonymous and authenticated requests. This appears to be an unstable/exposed API surface but did not expose data in this test.

Selected plugin `index.php` files returned `500 Internal Server Error` with empty body, not PHP source. Therefore direct PHP source disclosure was not confirmed.

## TLS Check via Docker testssl.sh

Command:

```text
docker run --rm drwetter/testssl.sh -U https://dev-itkpress.itk.ac.id/
```

Result summary:

| Check | Result |
| --- | --- |
| Heartbleed | not vulnerable |
| CCS | not vulnerable |
| ROBOT | not vulnerable |
| Secure renegotiation | supported |
| Client-initiated renegotiation | not vulnerable |
| CRIME TLS | not vulnerable |
| POODLE SSL | not vulnerable |
| TLS_FALLBACK_SCSV | OK, no protocol below TLS 1.2 |
| SWEET32 | not vulnerable |
| FREAK | not vulnerable |
| DROWN | not vulnerable on this host/port |
| LOGJAM | not vulnerable |
| BEAST | not vulnerable |
| RC4 | no RC4 ciphers detected |
| LUCKY13 | potentially vulnerable due obsolete CBC ciphers with TLS |

Note: `testssl.sh` could not determine HTTP service and skipped HTTP-specific checks; use this result as TLS-only evidence.

## CVE / Exploitability Triage

Target version remains OMP `3.3.0.12` (`3_3_0-12`), below multiple PKP security-fix thresholds.

High-impact CVE/advisory candidates:

| Candidate | Passive status | Active target status |
| --- | --- | --- |
| CVE-2024-56525 / User XML XXE leading to role/plugin abuse | Version affected before 3.3.0.21 / 3.4.0.8 | Requires Journal Editor/User XML plugin path; current account is author, so not reachable without role bypass/admin/editor access. Not exploited. |
| PKP below 3.3.0-18 critical issues | Target below threshold | Public advisories mention author-role exploitability in some chains, but exact OMP author-reachable path was not confirmed on target. Not exploited. |
| XSS in OJS/PKP 3.3 modules / Host Header XSS | Version family potentially relevant | Checked local target sinks: title/subtitle, workflow heading, file metadata form, download HTML/SVG. Payloads were escaped or forced attachment. Stored XSS not confirmed. |

Active role/access tests performed:

- Author direct access to management/admin pages returned authorization denied.
- Author direct access to unrelated submission IDs returned authorization denied.
- Author direct access to adjacent/wrong file IDs returned JSON authorization errors.

Conclusion: the current author account does not provide enough privilege to safely validate editor/admin/User-XML CVE chains, and no role bypass was confirmed from the sampled endpoints.

## Effort And Confidence Assessment

Estimated effort applied against direct active testing opportunities: **80-85%**.

Rationale:

- Completed passive recon, version confirmation, headers/cookie review, directory enumeration, authenticated author workflow checks, upload behavior checks, file download authorization checks, API differential testing, TLS checks, and CVE triage.
- Used multiple methods: browser earlier, HTTP/curl, WSL gobuster, Docker testssl, passive CVE lookup.
- Avoided only paths that require destructive/persistent impact or unavailable higher role access (editor/admin/User XML plugin path).

Confidence that there are no more **low-to-medium risk, author/anonymous-reachable, directly testable** vulnerabilities likely to be found with current access and without heavy fuzzing: **70-75%**.

Confidence that there are no more vulnerabilities at all: **not claimable**. Remaining uncertainty is mainly:

- editor/admin-only CVE chains not reachable from current author role;
- deeper authenticated workflows not exposed to author;
- potential sink-specific XSS in notifications/email/reviewer/editor views not reachable from current role;
- heavy fuzzing or exploit development not performed to avoid instability and because it may require broader authorization/time.

Practical assessment: current testing is close to the limit for this account/role. To go further meaningfully, one of these is needed:

1. temporary editor/manager account for controlled CVE validation;
2. local OMP 3.3.0-12 lab to reproduce dangerous CVEs safely;
3. explicit acceptance of heavier fuzzing/scanning risk against the dev/STB environment;
4. source-code review of OMP 3.3.0-12 routes/plugins to target specific endpoints instead of broad guessing.
