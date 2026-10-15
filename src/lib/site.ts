import { PAPER_FUND_PUBLISHED } from "@/lib/sample-marks";

export const SITE = {
  name: "The Crude Oracle",
  domain: "www.thecrudeoracle.com",
  url: "https://www.thecrudeoracle.com",
  tagline: "Crude Oil Intelligence Without the Noise",
  description:
    "Daily crude oil, gas, energy security and investment intelligence for investors, traders and energy professionals — 100% free, presented clearly, concisely and with source-backed data.",
  price: "Free",
  priceSuffix: "",
  contactEmail: "intelligence@thecrudeoracle.com",
} as const;

// The Crude Oracle is free — the paid subscription has been retired and the
// Stripe payment integration (webhook, billing portal, subscription link) removed.
export const FREE_ANNOUNCEMENT =
  "The Crude Oracle is now 100% free. Every dashboard, daily briefing, watchlist, company note and tool — no paywall, no card, no catch.";

export const FINANCIAL_DISCLAIMER_SHORT =
  "The Crude Oracle provides market commentary, educational content and investment research for information purposes only. It is not financial advice, investment advice, tax advice or a recommendation to buy, sell or hold any security, commodity, derivative, fund or financial product. Users must conduct their own research and consult a regulated financial adviser where appropriate. Trading and investing involve risk, including loss of capital.";

export const DATA_DISCLAIMER_SHORT =
  "Data shown may be delayed, indicative, manually updated or provided via API placeholders. Verify all figures with primary sources before making any trading or investment decision.";

export interface NavItem {
  label: string;
  href: string;
  premium?: boolean;
}

const NAV_MAIN_ALL: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Daily Briefing", href: "/daily-briefing" },
  { label: "Watchlist", href: "/watchlist" },
  { label: "Company Intel", href: "/company-intelligence" },
  { label: "Tools", href: "/tools" },
  { label: "$100M Fund", href: "/portfolio" },
  { label: "Crude Prices", href: "/crude-oil-prices" },
  { label: "Gas / LNG", href: "/gas-lng" },
  { label: "OPEC / Supply Risk", href: "/opec-supply-risk" },
  { label: "UK Energy Security", href: "/uk-energy-security" },
  { label: "North Sea", href: "/north-sea" },
  { label: "Oil Truth", href: "/oil-truth" },
  { label: "Research", href: "/research-library" },
];

export const NAV_MAIN: NavItem[] = PAPER_FUND_PUBLISHED
  ? NAV_MAIN_ALL
  : NAV_MAIN_ALL.filter((item) => item.href !== "/portfolio");

export const NAV_FOOTER_LEGAL: NavItem[] = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Use", href: "/terms-of-use" },
  { label: "Financial Disclaimer", href: "/financial-disclaimer" },
  { label: "Data Disclaimer", href: "/data-disclaimer" },
  { label: "Editorial Policy", href: "/editorial-policy" },
];

export const NAV_FOOTER_COMPANY: NavItem[] = [
  { label: "About", href: "/about" },
  { label: "Advertise", href: "/advertise" },
  { label: "Free Access", href: "/subscribe" },
  { label: "Account", href: "/account" },
  { label: "Contact", href: "/contact" },
];
