import type { DeskBotArtifact } from "@/lib/desk-bot-artifacts";

function cell(value: string | number | null): string {
  if (value == null) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** RFC 4180 CSV with source and as-of comment rows. */
export function artifactCsv(artifact: Pick<DeskBotArtifact, "sourceLine" | "asOf" | "csvColumns" | "csvRows">): string {
  const lines = [`# Source: ${artifact.sourceLine}`, `# As-Of: ${artifact.asOf}`, artifact.csvColumns.map(cell).join(",")];
  for (const row of artifact.csvRows) {
    lines.push(artifact.csvColumns.map((column) => cell(row[column] ?? null)).join(","));
  }
  return `${lines.join("\r\n")}\r\n`;
}

export function downloadText(filename: string, contents: string, type = "text/csv"): void {
  if (typeof document === "undefined") return;
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** Draws a source bar under a chart image and downloads it. */
export async function downloadWatermarkedPng(source: HTMLCanvasElement | string, filename: string, caption: string): Promise<void> {
  if (typeof document === "undefined") return;
  const image = new Image();
  const url = typeof source === "string" ? source : source.toDataURL("image/png");
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("chart image did not load"));
    image.src = url;
  });
  const bar = 56;
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height + bar;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "#090B0E";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0);
  ctx.fillStyle = "#101318";
  ctx.fillRect(0, image.height, canvas.width, bar);
  ctx.fillStyle = "#8A94A6";
  ctx.font = "12px ui-monospace, monospace";
  ctx.fillText("THE CRUDE ORACLE · THECRUDEORACLE.COM · DELAYED PUBLIC DATA · NOT INVESTMENT ADVICE", 16, image.height + 22);
  ctx.fillStyle = "#566073";
  ctx.fillText(caption.slice(0, 180), 16, image.height + 42);
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = filename;
  link.click();
}
