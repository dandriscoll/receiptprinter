import { writeFile } from "node:fs/promises";

/** Anything that can accept rendered ESC/POS bytes. */
export interface Printer {
  print(data: Buffer): Promise<void>;
  readonly description: string;
}

/** Writes bytes to a printer character device such as `/dev/usb/lp0`. */
export class DevicePrinter implements Printer {
  readonly description: string;

  constructor(private readonly devicePath: string) {
    this.description = `device ${devicePath}`;
  }

  async print(data: Buffer): Promise<void> {
    await writeFile(this.devicePath, data);
  }
}

/** Dry-run sink: writes rendered bytes to stdout instead of a real printer. */
export class ConsolePrinter implements Printer {
  readonly description = "stdout (dry-run)";

  async print(data: Buffer): Promise<void> {
    process.stdout.write(data);
  }
}

export function createPrinter(printerDevice: string | null): Printer {
  return printerDevice ? new DevicePrinter(printerDevice) : new ConsolePrinter();
}
