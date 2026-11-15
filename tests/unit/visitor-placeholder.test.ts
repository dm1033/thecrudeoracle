import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { buildMarketSnapshotTable } from "@/lib/crude-oracle-agent";
import { marketPrices } from "@/lib/data";

describe("visitor-facing placeholder check", () => {
  it("rejects placeholder text in the published data files", () => {
    const output = execFileSync(process.execPath, ["scripts/check-visitor-placeholders.mjs"], {
      cwd: process.cwd(),
      encoding: "utf8",
    });
    expect(output).toContain("visitor-facing data files");
  });

  it("omits placeholder rows from the desk snapshot", () => {
    const table = buildMarketSnapshotTable(marketPrices).tableMarkdown;
    expect(table.toLowerCase()).not.toContain("placeholder");
    expect(table).not.toContain("JKM*");
    expect(table).not.toContain("DXY*");
  });
});
