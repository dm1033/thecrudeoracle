import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-site flex min-h-[60vh] items-center justify-center py-16">
      <div className="text-center">
        <p className="eyebrow">404</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Page not found</h1>
        <p className="mt-3 text-sm text-steel-400">
          This page doesn&apos;t exist. The market moved on — so should we.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="btn-primary">
            Home
          </Link>
          <Link href="/dashboard" className="btn-secondary">
            Free Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
