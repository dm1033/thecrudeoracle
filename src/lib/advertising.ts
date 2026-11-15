import advertisingFile from "../../data/advertising.json";

export interface AdvertisingConfig {
  /** Google AdSense publisher id, `pub-` plus digits. Empty until one exists. */
  adsensePublisherId: string;
  /**
   * UK PECR: ad scripts and ads.txt stay off until a consent choice is recorded.
   * There is no consent banner in this repo. Leave this false until there is one.
   */
  advertisingConsent: boolean;
}

export const ADVERTISING: AdvertisingConfig = {
  adsensePublisherId: advertisingFile.adsensePublisherId.trim(),
  advertisingConsent: advertisingFile.advertisingConsent === true,
};

const PUBLISHER_ID = /^pub-\d+$/;

/**
 * ads.txt body, or null when ads must not be offered.
 * Google's certification authority id is the published AdSense value, used only
 * after a real publisher id is set and advertising consent is on.
 */
export function adsText(config: AdvertisingConfig = ADVERTISING): string | null {
  if (!config.advertisingConsent) return null;
  const id = config.adsensePublisherId.trim();
  if (!PUBLISHER_ID.test(id)) return null;
  return `google.com, ${id}, DIRECT, f08c47fec0942fa0\n`;
}

export function adsScriptSrc(config: AdvertisingConfig = ADVERTISING): string | null {
  if (!adsText(config)) return null;
  return `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.adsensePublisherId.trim()}`;
}
