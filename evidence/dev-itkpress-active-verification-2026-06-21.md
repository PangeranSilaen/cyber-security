# Active Verification Notes - dev-itkpress.itk.ac.id

Date/time: 2026-06-21 23:31-23:45 WITA
Target: `https://dev-itkpress.itk.ac.id/home`
Account: authorized test account supplied by project member. Password intentionally not recorded.

## Scope And Safety

- Testing performed outside the prohibited window (Sunday night, WITA).
- Browser automation used a named session and conservative navigation.
- No destructive actions were performed.
- No new payload was submitted during this verification pass.
- Existing submission data and previously uploaded test files were inspected only.

## Session Access

Login succeeded and redirected to:

```text
https://dev-itkpress.itk.ac.id/home/submissions
```

Dashboard showed three submissions owned by the test account, all titled `Demon`.

## Stored HTML / XSS Sink Verification

### Dashboard submission list

Observed body text included stored HTML markers:

```text
177 Demon XX <i>ITALIC123</i>: <i>ITALIC123</i>
176 Demon A <b>TEAM4</b>: <b>TEAM4</b>
```

DOM inspection showed the markers are escaped in the dashboard list:

```html
<div class="listPanel__itemSubtitle"> A &lt;b&gt;TEAM4&lt;/b&gt;: &lt;b&gt;TEAM4&lt;/b&gt; </div>
<div class="listPanel__itemSubtitle"> XX &lt;i&gt;ITALIC123&lt;/i&gt;: &lt;i&gt;ITALIC123&lt;/i&gt; </div>
```

Interpretation: the HTML markers are stored and displayed, but this sink escapes them before rendering. No JavaScript execution was observed.

### Submission detail heading

Opened:

```text
https://dev-itkpress.itk.ac.id/home/authorDashboard/submission/176
```

Snapshot heading showed:

```text
176 / Demon / <b>TEAM4</b>
```

DOM inspection of the heading showed escaped HTML:

```html
<span class="pkpWorkflow__identificationTitle">
    &lt;b&gt;TEAM4&lt;/b&gt;
</span>
```

Interpretation: the workflow/detail heading also escapes the stored title/subtitle marker. No Stored XSS confirmed in this sink.

### File metadata edit form

Existing file metadata edit endpoints were fetched through the authenticated browser session. Payload-like metadata was found in input `value` attributes for uploaded files, but it was HTML-escaped.

Examples:

```html
value="XSSTEST123&quot;&gt;&lt;img src=x onerror=alert(1)&gt;"
```

```html
value="&quot;&gt;&lt;img src=x onerror=alert(document.domain)&gt;"
```

Interpretation: the payload is preserved in metadata but encoded inside the form field value. It does not break out of the attribute and did not execute during this verification.

## Uploaded File Handling

Existing uploaded files on submission `176`:

| File | submissionFileId | Observed response |
| --- | ---: | --- |
| `shell.phtml` | 309 | `200`, `Content-Type: text/x-php;charset=UTF-8`, `Content-Disposition: attachment;filename="shell.phtml"` |
| `test.html` | 310 | `200`, `Content-Type: text/plain;charset=UTF-8`, `Content-Disposition: attachment;filename="test.html"` |
| `test.svg` | 311 | `200`, `Content-Type: image/svg`, `Content-Disposition: attachment;filename="test.svg"` |
| `test.php` | 312 | `200`, `Content-Type: text/x-php;charset=UTF-8`, `Content-Disposition: attachment;filename="test.php.txt"` |
| `test.txt` | 313 | `200`, `Content-Type: text/plain;charset=UTF-8`, `Content-Disposition: attachment;filename="test.txt"` |

Download endpoint pattern:

```text
/home/$$$call$$$/api/file/file-api/download-file?submissionFileId=<id>&submissionId=176&stageId=1
```

Important observations:

- Files are served via an authenticated OMP `download-file` endpoint, not a direct public webroot path.
- `Content-Disposition: attachment` is set for the tested HTML/SVG/PHP-like files.
- `test.html` is served as `text/plain`, reducing inline HTML execution risk.
- `test.svg` is served as `image/svg` but still with `Content-Disposition: attachment`, so the tested endpoint is download-oriented rather than inline rendering.
- `test.php` is renamed to `test.php.txt` on download, but `shell.phtml` keeps the `.phtml` filename.
- The PHP payload bytes were returned as file content, not executed server-side.

Interpretation: arbitrary file upload/storage remains confirmed from prior testing, and authenticated file download is confirmed. Upload-to-XSS and upload-to-RCE were not confirmed in this pass. Current evidence suggests the OMP download endpoint mitigates inline rendering by using attachment disposition, although accepting `.phtml` remains a dangerous file-type validation gap.

## Status Updates

| Topic | Updated status |
| --- | --- |
| HTML injection in submission metadata | Confirmed stored input, but dashboard/detail sinks escaped |
| Stored XSS via title/subtitle | Not confirmed in checked sinks |
| Stored XSS via file metadata fields | Not confirmed in checked edit form sink |
| Upload-to-XSS via HTML/SVG download | Not confirmed; tested endpoint forces attachment |
| Upload-to-RCE via PHP/PHTML | Not confirmed; file bytes returned, not executed |
| Arbitrary file upload | Still confirmed from previous evidence; `.phtml`, `.html`, `.svg`, `.php`, `.txt` present |

## Recommended Next Checks

- Check whether uploaded files are ever embedded inline in reviewer/editor views, catalog publication views, or email templates.
- Check whether any generated public galley or publication asset URL can reference the uploaded file outside the `download-file` endpoint.
- Continue treating Stored XSS and Upload-to-RCE as inconclusive unless a non-destructive execution/render sink is found.
