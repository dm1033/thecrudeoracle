import Link from "next/link";
import { FINANCIAL_DISCLAIMER_SHORT, DATA_DISCLAIMER_SHORT } from "@/lib/site";

export default function DisclaimerBlock({ includeData = true }: { includeData?: boolean }) {
  return (
    <aside
      aria-label="Disclaimer"
      className="rounded-lg border border-ink-700 bg-ink-900 p-4 text-xs leading-relaxed text-steel-500"
    >
      <p>
        <strong className="text-steel-400">Important:</strong> {FINANCIAL_DISCLAIMER_SHORT}
      </p>
      {includeData && <p className="mt-2">{DATA_DISCLAIMER_SHORT}</p>}
      <p className="mt-2">
        See the full{" "}
        <Link href="/financial-disclaimer" className="underline hover:text-gold-400">
          Financial Disclaimer
        </Link>{" "}
        and{" "}
        <Link href="/data-disclaimer" className="underline hover:text-gold-400">
          Data Disclaimer
        </Link>
        .
      </p>
    </aside>
  );
}
