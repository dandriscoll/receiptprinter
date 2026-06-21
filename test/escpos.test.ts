import { describe, expect, it } from "vitest";
import { DEFAULT_BOTTOM_PADDING_LINES, annotate, format, normalize } from "../src/escpos.js";

describe("normalize", () => {
  it("collapses windows and old-mac line endings", () => {
    expect(normalize("a\r\nb\rc")).toBe("a\nb\nc");
  });

  it("strips trailing spaces and tabs per line", () => {
    expect(normalize("a   \nb\t\t")).toBe("a\nb");
  });

  it("strips trailing blank lines", () => {
    expect(normalize("text\n\n\n")).toBe("text");
  });
});

describe("format", () => {
  const text = "Hello";

  it("starts with the printer init sequence", () => {
    const out = format(text).toString("latin1");
    expect(out.startsWith("\x1B@")).toBe(true);
  });

  it("ends with the cut sequence by default", () => {
    const out = format(text).toString("latin1");
    expect(out.endsWith("\x1DVA\x00")).toBe(true);
  });

  it("omits the cut sequence when cut is false", () => {
    const out = format(text, { cut: false }).toString("latin1");
    expect(out.includes("\x1DVA\x00")).toBe(false);
  });

  it("appends the default number of bottom padding lines", () => {
    const out = format(text).toString("latin1");
    // body newline + N padding newlines sit between text and the cut command.
    const between = out.slice("\x1B@Hello".length, out.indexOf("\x1DVA\x00"));
    expect(between).toBe("\n".repeat(DEFAULT_BOTTOM_PADDING_LINES + 1));
  });

  it("honors a custom padding count", () => {
    const out = format(text, { bottomPaddingLines: 2 }).toString("latin1");
    const between = out.slice("\x1B@Hello".length, out.indexOf("\x1DVA\x00"));
    expect(between).toBe("\n".repeat(3));
  });

  it("clamps negative padding to zero", () => {
    const out = format(text, { bottomPaddingLines: -5 }).toString("latin1");
    const between = out.slice("\x1B@Hello".length, out.indexOf("\x1DVA\x00"));
    expect(between).toBe("\n");
  });

  it("normalizes the body before printing", () => {
    const out = format("messy   \r\n\r\n").toString("latin1");
    expect(out).toBe("\x1B@messy\n\n\n\n\n\x1DVA\x00");
  });
});

describe("annotate", () => {
  it("renders control codes as readable tokens", () => {
    expect(annotate(format("Hi"))).toContain("<ESC>@Hi");
    expect(annotate(format("Hi"))).toContain("<GS>VA<0>");
  });
});
