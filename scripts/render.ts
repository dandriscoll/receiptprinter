/**
 * render.ts — generate printed output without a printer.
 *
 * The service renders text to ESC/POS bytes; this CLI exposes that same
 * rendering so you can eyeball receipts, save fixtures, or pipe straight to a
 * device. Run via `npm run render -- ...`.
 *
 * Usage:
 *   npm run render -- "Hello, receipt"        # raw bytes to stdout
 *   npm run render -- --inspect "Hello"       # annotated view to stderr too
 *   echo "piped text" | npm run render        # read text from stdin
 *   npm run render -- --padding 8 "Bye"       # override bottom padding
 *   npm run render -- --out receipt.escpos "Hi"
 *   npm run render -- --samples [dir]         # write a gallery of samples
 *
 * Send a rendered file to a real printer with:  cat receipt.escpos > /dev/usb/lp0
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { annotate, format } from "../src/escpos.js";

interface Args {
  text?: string;
  out?: string;
  padding?: number;
  noCut: boolean;
  inspect: boolean;
  samples: boolean;
  samplesDir: string;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { noCut: false, inspect: false, samples: false, samplesDir: "out" };
  const positional: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "--out":
        args.out = argv[++i];
        break;
      case "--padding":
        args.padding = Number.parseInt(argv[++i] ?? "", 10);
        break;
      case "--no-cut":
        args.noCut = true;
        break;
      case "--inspect":
        args.inspect = true;
        break;
      case "--samples":
        args.samples = true;
        // optional directory argument immediately after --samples
        if (argv[i + 1] && !argv[i + 1]?.startsWith("--")) args.samplesDir = argv[++i] as string;
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

const SAMPLES: Array<{ name: string; text: string }> = [
  { name: "hello", text: "Hello, receipt!" },
  { name: "shopping-list", text: "Shopping list\n- Milk\n- Eggs\n- Thermal paper" },
  {
    name: "messy-input",
    text: "trailing spaces here   \r\nwindows line ending\r\n\r\n\r\n",
  },
  { name: "long", text: Array.from({ length: 12 }, (_, i) => `line ${i + 1}`).join("\n") },
];

async function writeSamples(dir: string, padding: number | undefined): Promise<void> {
  await mkdir(dir, { recursive: true });
  for (const sample of SAMPLES) {
    const data = format(sample.text, { bottomPaddingLines: padding });
    await writeFile(join(dir, `${sample.name}.escpos`), data);
    await writeFile(join(dir, `${sample.name}.txt`), annotate(data), "utf8");
  }
  process.stderr.write(`Wrote ${SAMPLES.length} samples to ${dir}/ (.escpos + annotated .txt)\n`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.samples) {
    await writeSamples(args.samplesDir, args.padding);
    return;
  }

  const text = args.text ?? (await readStdin());
  if (text.trim() === "") {
    process.stderr.write("No text provided. Pass a string, pipe stdin, or use --samples.\n");
    process.exitCode = 1;
    return;
  }

  const data = format(text, { bottomPaddingLines: args.padding, cut: !args.noCut });

  if (args.inspect) {
    process.stderr.write(`${annotate(data)}\n--- ${data.length} bytes ---\n`);
  }

  if (args.out) {
    await writeFile(args.out, data);
    process.stderr.write(`Wrote ${data.length} bytes to ${args.out}\n`);
  } else {
    process.stdout.write(data);
  }
}

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.stack : String(err)}\n`);
  process.exitCode = 1;
});
