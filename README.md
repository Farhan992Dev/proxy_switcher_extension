# Proxy Switcher

A Microsoft Edge extension that routes browser traffic through your HTTP or SOCKS5 proxy with per-site rules.

## Features

- **HTTP & SOCKS5** proxy support
- All traffic routes through proxy by default
- **Per-site rules** — add Direct rules to bypass proxy for specific sites
- Add Proxy rules to selectively route specific sites through proxy
- Wildcard patterns (`*.example.com`) and exact domain matching
- Auto-bypasses local addresses (localhost, LAN)
- Enable/disable toggle

## Installation

### From source (developer)

1. Clone this repo
2. Open `edge://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked** → select the `proxy-extension` folder

### From Edge Add-ons

Visit the [Microsoft Edge Add-ons store](https://microsoftedge.microsoft.com/addons) and search for **Proxy Switcher**.

## Usage

1. Click the extension icon in the toolbar
2. Enter your proxy address (e.g. `192.168.1.100:8080`)
3. Select protocol (HTTP or SOCKS5)
4. Toggle **Enable Proxy** on
5. Add **Direct** rules to bypass proxy for specific sites
6. Add **Proxy** rules to selectively proxy specific sites

## Permissions

- `proxy` — configure browser proxy settings
- `storage` — save user preferences
