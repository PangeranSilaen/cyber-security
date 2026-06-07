# Tool Availability

| Tool | Available | Version/Path | Notes |
| --- | --- | --- | --- |
| PowerShell 7 | Yes | 7.6.1 | Default shell. |
| curl | Yes | `C:\Windows\System32\curl.exe` | HTTP baseline checks. |
| Nmap | Yes | `C:\Program Files (x86)\Nmap\nmap.exe` | Installed via winget; current shell PATH did not resolve `nmap`, so use full path or restart terminal. Requires confirmation before scanning target. |
| Docker | Yes | Docker Desktop 4.43.2 / Engine 28.3.2 | Engine is running; can be used for Nikto later if approved. |
| WSL | Yes | `C:\Windows\System32\wsl.exe` | Alternative for Linux/Kali tools. |
| OpenSSL | Yes | Laragon/Git paths detected | TLS inspection available. |
| Shodan CLI | Installed and initialized by user | `C:\Users\hi\AppData\Roaming\Python\Python313\Scripts\shodan.exe` | Installed via pip. Python user Scripts path added to User PATH. `shodan info` works, but account has 0 query credits and 0 scan credits; `host`/`search` returned 403. API key was not written to project files. |
| Python | Yes | `C:\Python313\python.exe` and others | Used for Shodan CLI install. |
| winget | Yes | `C:\Users\hi\AppData\Local\Microsoft\WindowsApps\winget.exe` | Windows package manager. |
| Git | Yes | `C:\Program Files\Git\cmd\git.exe` | Optional Git Bash utilities. |
| pipx | No | - | Not required. |
| testssl.sh | Yes (Docker) | `drwetter/testssl.sh:latest` | TLS vulnerability assessment non-destruktif. |
| Nikto | Yes (Docker) | `ghcr.io/sullo/nikto` v2.5.0 | Scan tidak selesai (~10%) karena WAF memblok pola request. |
| wafw00f | Yes (Docker) | `secsi/wafw00f` v2.4.2 | `ghcr.io/enaqx/wafw00f` denied; gunakan `secsi/wafw00f`. |
| certspotter API | Yes | `api.certspotter.com` | Subdomain enum via CT log; free tier membatasi hasil. |
| crt.sh | No (down) | - | `502 Bad Gateway` berulang saat pengujian; gunakan certspotter sebagai alternatif. |
