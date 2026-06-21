# API Differential And File Access Control - dev-itkpress.itk.ac.id

Date/time: 2026-06-22 00:27+ WITA
Method: authenticated Windows `curl.exe` session with cookie jar. Browser automation not used.

## Scope

- Account: authorized author/test account.
- No database dump, no destructive request, no file modification.
- API checks used status, response size, and small error bodies only.
- File checks used `Range: 0-0` for owned files and full small JSON error bodies for denied non-owned/invalid IDs.

## Baseline

Target was live before testing:

```text
GET /home
HTTP/1.1 200 OK
```

Authenticated curl session was refreshed successfully:

```text
title=Submissions | ITK Press
authenticated=True
```

## `_submissions` API Differential Testing

Endpoint:

```text
/home/api/v1/_submissions
```

Tested variants:

| Query | HTTP | Size | Time |
| --- | ---: | ---: | ---: |
| no params | `500` | `1` | ~5.4s |
| `count=30&offset=0` | `500` | `1` | ~5.4s |
| `status[]=4&status[]=3&status[]=5&assignedTo=111&searchPhrase=&count=30&offset=0` | `500` | `1` | ~5.3s |
| `count=1&offset=0` | `500` | `1` | ~5.3s |
| `count=0&offset=0` | `500` | `1` | ~5.5s |
| `count=abc&offset=0` | `500` | `1` | ~5.4s |
| `count=30&offset=-1` | `500` | `1` | ~5.7s |
| `assignedTo=heavenlydemon&count=1&offset=0` | `500` | `1` | ~5.3s |
| `searchPhrase='&count=1&offset=0` | `500` | `1` | ~5.3s |

Interpretation:

- The endpoint appears to return `500 Internal Server Error` unconditionally for the author session, not only for a specific parameter or injection marker.
- No SQL error text, stack trace, or differentiated behavior was exposed in the response body.
- Status remains a confirmed backend bug/availability issue for the submission dashboard API, but no exploitable SQL injection signal was identified from these safe variants.

## `download-file` Access Control Checks

Endpoint pattern:

```text
/home/$$$call$$$/api/file/file-api/download-file?submissionFileId=<id>&submissionId=<id>&stageId=1
```

Owned files on submission `176` returned file content with attachment disposition:

| Label | IDs | HTTP | Content-Type | Content-Disposition |
| --- | --- | ---: | --- | --- |
| own shell | `submissionFileId=309&submissionId=176` | `206 Partial Content` | `text/x-php;charset=UTF-8` | `attachment;filename="shell.phtml"` |
| own HTML | `submissionFileId=310&submissionId=176` | `206 Partial Content` | `text/plain;charset=UTF-8` | `attachment;filename="test.html"` |
| own SVG | `submissionFileId=311&submissionId=176` | `206 Partial Content` | `image/svg` | `attachment;filename="test.svg"` |
| own PHP | `submissionFileId=312&submissionId=176` | `206 Partial Content` | `text/x-php;charset=UTF-8` | `attachment;filename="test.php.txt"` |

Non-owned/invalid combinations returned JSON denial messages:

| Label | IDs | HTTP | Body |
| --- | --- | ---: | --- |
| adjacent minus | `submissionFileId=308&submissionId=176` | `200` | `The current user is not authorized to access the specified submission file.` |
| adjacent plus | `submissionFileId=315&submissionId=176` | `200` | `The current user is not authorized to access the specified submission file.` |
| wrong submission | `submissionFileId=309&submissionId=175` | `200` | `The current user is not authorized to access the specified submission file.` |
| low IDs | `submissionFileId=1&submissionId=1` | `200` | `The current role does not have access to this operation.` |

Important note: range requests can return `206 Partial Content` even when the content is a JSON error body, so status alone is misleading. Response `Content-Type`, `Content-Disposition`, and body content must be checked.

Interpretation:

- File download access control worked for the sampled adjacent/wrong IDs.
- No file download IDOR was confirmed in this sample.
- The upload finding remains valid for accepting/storing risky extensions, but download authorization and attachment disposition are mitigating controls.

## Status Updates

| Topic | Status |
| --- | --- |
| `_submissions` API 500 | Confirmed, appears unconditional for tested author session |
| SQLi signal in `_submissions` variants | Not confirmed |
| File download IDOR | Not confirmed in sampled IDs |
| Own uploaded risky files downloadable | Confirmed |
| Inline render/RCE via download endpoint | Not confirmed; endpoint returns attachments / bytes |
