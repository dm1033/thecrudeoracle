import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

export interface OgRow {
  label: string;
  value: string;
  detail: string;
}

/** Branded card. Rows are omitted when the EIA read did not return a figure. */
export function renderOgCard(input: { title: string; dateLine: string; rows: OgRow[]; footnote: string }): ImageResponse {
  const rows = input.rows.length
    ? input.rows
    : [{ label: "EIA", value: "Not loaded", detail: "No figure is shown" }];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#07090c",
          color: "#c3ccd8",
          padding: "52px 64px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", color: "#c9a038", fontSize: 22, letterSpacing: 3 }}>THE CRUDE ORACLE</div>
        <div style={{ display: "flex", marginTop: 16, color: "#ffffff", fontSize: 52, fontWeight: 700 }}>{input.title}</div>
        <div style={{ display: "flex", marginTop: 14, color: "#e9cd7e", fontSize: 28 }}>{input.dateLine}</div>
        <div style={{ display: "flex", marginTop: 36, gap: 16 }}>
          {rows.map((row) => (
            <div
              key={row.label}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                background: "#10141b",
                border: "1px solid #212936",
                borderRadius: 12,
                padding: rows.length > 3 ? "16px 14px" : "22px 24px",
              }}
            >
              <div style={{ display: "flex", color: "#8b98a9", fontSize: rows.length > 3 ? 16 : 20 }}>{row.label}</div>
              <div style={{ display: "flex", marginTop: 10, color: "#ffffff", fontSize: rows.length > 3 ? 28 : 42, fontWeight: 700 }}>
                {row.value}
              </div>
              <div style={{ display: "flex", marginTop: 8, color: "#a6b1c0", fontSize: rows.length > 3 ? 14 : 18 }}>{row.detail}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", marginTop: "auto", color: "#8b98a9", fontSize: 20 }}>{input.footnote}</div>
      </div>
    ),
    { ...OG_SIZE }
  );
}
