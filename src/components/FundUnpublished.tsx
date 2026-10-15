import Link from "next/link";

export default function FundUnpublished() {
  return (
    <div className="container-site py-10">
      <div className="card max-w-3xl">
        <p className="text-sm leading-relaxed text-steel-300">
          The book on file uses sample tickers and placeholder instruments. Those lines are not
          shown, and no account total is published from them. The fund appears here when every
          open line and closed trade is a real desk mark.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-steel-400">
          Any future book is virtual capital only. It is not an offer, a fund you can invest in,
          or financial advice. See the{" "}
          <Link href="/financial-disclaimer" className="text-gold-400 underline">
            financial disclaimer
          </Link>{" "}
          and the{" "}
          <Link href="/editorial-policy" className="text-gold-400 underline">
            editorial policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
