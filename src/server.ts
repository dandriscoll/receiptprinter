import { fileURLToPath } from "node:url";
import express, { type Express, type Request, type Response } from "express";
import { pinoHttp } from "pino-http";
import type { Config } from "./config.js";
import { format } from "./escpos.js";
import { logger } from "./logger.js";
import type { Printer } from "./printer.js";

const publicDir = fileURLToPath(new URL("../public", import.meta.url));

export interface AppDeps {
  printer: Printer;
  config: Config;
}

export function createApp({ printer, config }: AppDeps): Express {
  const app = express();

  app.use(pinoHttp({ logger }));

  // Accept the raw request body as text for any content type so callers can
  // POST a plain string without ceremony.
  app.use(express.text({ type: "*/*", limit: config.maxBodySize }));

  // Static web form (GET / and assets).
  app.use(express.static(publicDir));

  app.get("/healthz", (_req: Request, res: Response) => {
    res.json({ status: "ok", printer: printer.description });
  });

  // The one route that matters: print whatever text was posted.
  app.post("/print", async (req: Request, res: Response) => {
    const text = typeof req.body === "string" ? req.body : "";
    if (text.trim() === "") {
      res.status(400).json({ error: "empty body" });
      return;
    }

    const data = format(text, {
      bottomPaddingLines: config.bottomPaddingLines,
    });

    try {
      await printer.print(data);
      res.status(200).json({ status: "printed", bytes: data.length });
    } catch (err) {
      req.log.error({ err }, "failed to print");
      res.status(500).json({ error: "failed to print" });
    }
  });

  return app;
}
