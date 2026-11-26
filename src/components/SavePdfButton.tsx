"use client";

export default function SavePdfButton() {
  return (
    <button type="button" className="btn-primary" onClick={() => window.print()}>
      Save one-page PDF
    </button>
  );
}
