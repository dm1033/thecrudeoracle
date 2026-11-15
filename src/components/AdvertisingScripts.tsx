import Script from "next/script";
import { adsScriptSrc } from "@/lib/advertising";

/** Loads nothing unless ads.txt would also be published. */
export default function AdvertisingScripts() {
  const src = adsScriptSrc();
  if (!src) return null;
  return <Script src={src} strategy="afterInteractive" crossOrigin="anonymous" />;
}
