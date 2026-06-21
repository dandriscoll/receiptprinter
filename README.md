# receiptprinter

A small, modern service that turns HTTP requests into receipts on a USB thermal
printer. POST some text, and it prints — neatly normalized and padded so the
cutter never clips your last line.

Developed against an **Epson TM-T20II** connected over USB to a Raspberry Pi,
but any ESC/POS-compatible printer exposed as a character device (e.g.
`/dev/usb/lp0`) should work.

## What it does

- `GET /` — a web form to type and print text.
- `POST /print` — print the request body. The body is the text; no JSON
  envelope required.
- `GET /healthz` — health check.

The service **fixes up incoming text** before printing: it normalizes line
endings, trims trailing whitespace, and appends a configurable number of blank
feed lines at the bottom so there's clearance before the paper cut. Clients just
send their text — they no longer need to pad it themselves.

## Quick start

```bash
npm install
npm run build
npm start
# open http://localhost:4180/
```

Print from the command line:

```bash
curl -X POST http://localhost:4180/print --data "Hello, receipt!"
```

### No printer? Use dry-run

```bash
DRY_RUN=1 npm start        # renders to stdout instead of a device
```

## Sending text from the command line

The `client` CLI is an HTTP client for a running service — handy for scripting
and for smoke-testing a deployment:

```bash
# POST text to /print (defaults to http://localhost:4180)
npm run client -- "Hello, receipt"

# Target another host
npm run client -- --url http://pi.local:4180 "Hello"

# Read from stdin
echo "piped text" | npm run client

# Smoke-test every route (health, web form, print, empty-body) and report
npm run client -- --check
```

The target URL also reads from `$RECEIPT_URL`.

## Generating printed output without a printer

The `render` CLI produces the exact bytes the service would send, so you can
inspect receipts, save fixtures, or pipe straight to a device:

```bash
# Raw ESC/POS bytes to stdout
npm run render -- "Hello, receipt"

# Annotated view (control codes shown as <ESC>@, <GS>VA<0>, …)
npm run render -- --inspect "Hello"

# Read from stdin
echo "piped text" | npm run render

# Write a gallery of sample receipts to ./out (.escpos + annotated .txt)
npm run render -- --samples

# Save to a file, then send it to a real printer
npm run render -- --out receipt.escpos "Hi"
cat receipt.escpos > /dev/usb/lp0
```

## Configuration

All configuration is via environment variables (see `.env.example`):

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4180` | HTTP listen port |
| `PRINTER_DEVICE` | `/dev/usb/lp0` | Printer character device |
| `DRY_RUN` | `0` | `1` renders to stdout instead of a device |
| `BOTTOM_PADDING_LINES` | `4` | Blank feed lines added before the cut |
| `MAX_BODY_SIZE` | `64kb` | Max body size for a single print |
| `LOG_LEVEL` | `info` | pino log level |

## Deployment

### Docker

```bash
docker compose up --build
```

`docker-compose.yml` passes the USB printer device through to the container.
Remove the `devices:` block and set `DRY_RUN=1` to run without a printer.

### systemd (e.g. Raspberry Pi)

Build (`npm run build`) on the host, then install the unit in
`deploy/receiptprinter.service`:

```bash
sudo cp deploy/receiptprinter.service /etc/systemd/system/
sudo systemctl enable --now receiptprinter
```

## Development

```bash
npm run dev        # watch-mode server
npm test           # vitest
npm run typecheck  # tsc --noEmit
npm run lint       # biome
```

## How printing works

Thermal printers speak [ESC/POS](https://en.wikipedia.org/wiki/ESC/P). The
service renders each receipt as: initialize (`ESC @`), the normalized text, the
bottom padding lines, then a feed-and-cut (`GS V A`). All of that lives in
`src/escpos.ts` as pure, unit-tested functions, so the rendering is identical
whether it comes from the HTTP service or the `render` CLI.
