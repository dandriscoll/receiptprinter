/**
 * client.ts — HTTP client for a running receiptprinter service.
 *
 * Sends text to the `/print` endpoint, or runs a `--check` smoke test that
 * exercises every route and reports pass/fail. Run via `npm run client -- ...`.
 *
 * Usage:
 *   npm run client -- "Hello, receipt"          # POST text to /print
 *   npm run client -- --url http://pi:4180 "Hi" # target another host
 *   echo "piped text" | npm run client          # read text from stdin
 *   npm run client -- --check                    # smoke-test all routes
 *
 * The target URL defaults to $RECEIPT_URL, then http://localhost:4180.
 */

interface Args {
  url: string;
  text?: string;
  check: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    url: process.env.RECEIPT_URL ?? "http://localhost:4180",
    check: false,
  };
  const positional: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "--url":
        args.url = argv[++i] ?? args.url;
        break;
      case "--check":
        args.check = true;
        break;
      default:
        if (arg !== undefined) positional.push(arg);
    }
  }

  if (positional.length > 0) args.text = positional.join(" ");
  return args;
}

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) return "";
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf8");
}

const base = (url: string): string => url.replace(/\/$/, "");

async function print(url: string, text: string): Promise<Response> {
  return fetch(`${base(url)}/print`, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: text,
  });
}

/** Smoke test: hit every route and assert the expected status. */
async function check(url: string): Promise<boolean> {
  const cases: Array<{ name: string; run: () => Promise<Response>; expect: number }> = [
    { name: "GET  /healthz", run: () => fetch(`${base(url)}/healthz`), expect: 200 },
    { name: "GET  /", run: () => fetch(`${base(url)}/`), expect: 200 },
    { name: "POST /print (text)", run: () => print(url, "smoke test ✓"), expect: 200 },
    { name: "POST /print (empty)", run: () => print(url, "   "), expect: 400 },
  ];

  let ok = true;
  for (const c of cases) {
    try {
      const res = await c.run();
      const pass = res.status === c.expect;
      ok &&= pass;
      process.stdout.write(
        `${pass ? "✓" : "✗"} ${c.name} → ${res.status} (expected ${c.expect})\n`,
      );
    } catch (err) {
      ok = false;
      process.stdout.write(`✗ ${c.name} → ${err instanceof Error ? err.message : String(err)}\n`);
    }
  }
  return ok;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.check) {
    const ok = await check(args.url);
    process.stdout.write(ok ? "\nAll checks passed.\n" : "\nSome checks failed.\n");
    if (!ok) process.exitCode = 1;
    return;
  }

  const text = args.text ?? (await readStdin());
  if (text.trim() === "") {
    process.stderr.write("No text provided. Pass a string, pipe stdin, or use --check.\n");
    process.exitCode = 1;
    return;
  }

  const res = await print(args.url, text);
  const body = await res.text();
  process.stdout.write(`${res.status} ${res.statusText}\n${body}\n`);
  if (!res.ok) process.exitCode = 1;
}

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exitCode = 1;
});
