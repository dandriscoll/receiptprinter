import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.js";
import type { Printer } from "../src/printer.js";
import { createApp } from "../src/server.js";

class FakePrinter implements Printer {
  readonly description = "fake";
  lastData: Buffer | null = null;
  shouldFail = false;

  async print(data: Buffer): Promise<void> {
    if (this.shouldFail) throw new Error("boom");
    this.lastData = data;
  }
}

function makeApp(printer: Printer) {
  const config = loadConfig({ DRY_RUN: "1", BOTTOM_PADDING_LINES: "4" });
  return createApp({ printer, config });
}

describe("server", () => {
  let printer: FakePrinter;

  beforeEach(() => {
    printer = new FakePrinter();
  });

  it("serves the web form at /", async () => {
    const res = await request(makeApp(printer)).get("/");
    expect(res.status).toBe(200);
    expect(res.text).toContain("<textarea");
  });

  it("reports health", async () => {
    const res = await request(makeApp(printer)).get("/healthz");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "ok" });
  });

  it("prints posted text with server-side padding", async () => {
    const res = await request(makeApp(printer))
      .post("/print")
      .set("Content-Type", "text/plain")
      .send("Buy milk");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "printed" });

    const out = printer.lastData?.toString("latin1") ?? "";
    expect(out).toBe("\x1B@Buy milk\n\n\n\n\n\x1DVA\x00");
  });

  it("rejects an empty body", async () => {
    const res = await request(makeApp(printer))
      .post("/print")
      .set("Content-Type", "text/plain")
      .send("   ");
    expect(res.status).toBe(400);
    expect(printer.lastData).toBeNull();
  });

  it("returns 500 when the printer fails", async () => {
    printer.shouldFail = true;
    const res = await request(makeApp(printer))
      .post("/print")
      .set("Content-Type", "text/plain")
      .send("hello");
    expect(res.status).toBe(500);
  });
});
