import type { Metadata } from "next";
import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta(
  "Page not found",
  "This page is not on The Crude Oracle. The daily note, the EIA weekly stocks page and the rest of the site are linked from the home page.",
  "/404"
);

export default function NotFound() {
  return (
    <div className="container-site flex min-h-[60vh] items-center justify-center py-16">
      <div className="text-center">
        <BrandMark className="mx-auto h-24 w-auto" sizes="96px" />
        <p className="eyebrow mt-6">404</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Page not found</h1>
        <p className="mt-3 text-sm text-steel-400">This address is not a page on The Crude Oracle.</p>
        <p className="mt-2 text-sm font-medium text-steel-300">Not financial advice.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="btn-primary">
            Home
          </Link>
          <Link href="/daily" className="btn-secondary">
            Daily note
          </Link>
        </div>
      </div>
    </div>
  );
}