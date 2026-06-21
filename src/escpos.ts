/**
 * ESC/POS rendering.
 *
 * These are the raw control sequences understood by Epson-compatible thermal
 * printers (developed against an Epson TM-T20II). Everything here is a pure
 * function of its input so it can be unit-tested and reused by the render CLI
 * without touching a real device.
 */

/** ESC (0x1B) — introduces most printer commands. */
const ESC = "\x1B";
/** GS (0x1D) — introduces "group separator" commands such as paper cut. */
const GS = "\x1D";

/** `ESC @` — initialize printer: reset formatting to a known clean state. */
const INIT = `${ESC}@`;

/**
 * `GS V A 0` — feed paper to the cut position and perform a partial cut.
 * (`A` = function 65 = "feed then cut"; the trailing `0` is the extra feed
 * amount, which we keep at zero because we add our own padding lines instead.)
 */
const CUT = `${GS}VA\x00`;

export interface FormatOptions {
  /**
   * Number of blank feed lines added after the text and before the cut. This
   * is the "fix up incoming text" behavior: callers send plain text and the
   * service guarantees there is whitespace below it so the cut never clips the
   * last line and the slip is easy to tear off.
   */
  bottomPaddingLines?: number;
  /** Whether to append the paper-cut command. Defaults to true. */
  cut?: boolean;
}

export const DEFAULT_BOTTOM_PADDING_LINES = 4;

/**
 * Normalize arbitrary incoming text into something tidy to print:
 *  - collapse Windows/old-Mac line endings to `\n`
 *  - strip trailing spaces/tabs on each line
 *  - strip any trailing blank lines (we add our own padding deliberately)
 */
export function normalize(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n+$/, "");
}

/**
 * Render text into the byte sequence to send to the printer: initialize,
 * print the normalized body, add the bottom padding, then cut.
 */
export function format(text: string, options: FormatOptions = {}): Buffer {
  const bottomPaddingLines = Math.max(
    0,
    options.bottomPaddingLines ?? DEFAULT_BOTTOM_PADDING_LINES,
  );
  const cut = options.cut ?? true;

  const body = normalize(text);
  const padding = "\n".repeat(bottomPaddingLines);
  const sequence = `${INIT}${body}\n${padding}${cut ? CUT : ""}`;

  // latin1 keeps each character as a single byte, which is what the printer's
  // control codes (0x1B, 0x1D, 0x00, ...) require.
  return Buffer.from(sequence, "latin1");
}

/**
 * Human-readable rendering of formatted bytes, with control codes shown as
 * tokens (e.g. `<ESC>@`, `<GS>VA<0>`). Used by the render CLI's inspect mode.
 */
export function annotate(data: Buffer): string {
  return data
    .toString("latin1")
    .replace(/\x1B/g, "<ESC>")
    .replace(/\x1D/g, "<GS>")
    .replace(/\x00/g, "<0>");
}
