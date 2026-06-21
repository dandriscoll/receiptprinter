import { loadConfig } from "./config.js";
import { logger } from "./logger.js";
import { createPrinter } from "./printer.js";
import { createApp } from "./server.js";

const config = loadConfig();
const printer = createPrinter(config.printerDevice);
const app = createApp({ printer, config });

const server = app.listen(config.port, () => {
  logger.info({ port: config.port, printer: printer.description }, "receiptprinter listening");
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    logger.info({ signal }, "shutting down");
    server.close(() => process.exit(0));
  });
}
