import { DEFAULT_BOTTOM_PADDING_LINES } from "./escpos.js";

export interface Config {
  /** TCP port the HTTP server listens on. */
  port: number;
  /**
   * Path to the printer character device (e.g. `/dev/usb/lp0`). When `null`,
   * the service runs in dry-run mode and writes rendered output to stdout
   * instead of a device — handy for development and CI.
   */
  printerDevice: string | null;
  /** Blank feed lines appended below every receipt before the cut. */
  bottomPaddingLines: number;
  /** Max accepted request body size for a single print. */
  maxBodySize: string;
  /** pino log level. */
  logLevel: string;
}

function parseIntOr(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === "") return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const dryRun = env.DRY_RUN === "1" || env.DRY_RUN === "true";
  return {
    port: parseIntOr(env.PORT, 4180),
    printerDevice: dryRun ? null : (env.PRINTER_DEVICE ?? "/dev/usb/lp0"),
    bottomPaddingLines: parseIntOr(env.BOTTOM_PADDING_LINES, DEFAULT_BOTTOM_PADDING_LINES),
    maxBodySize: env.MAX_BODY_SIZE ?? "64kb",
    logLevel: env.LOG_LEVEL ?? "info",
  };
}
