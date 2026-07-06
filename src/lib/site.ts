export const SITE = {
  name: "The Crude Oracle",
  domain: "www.thecrudeoracle.com",
  url: "https://www.thecrudeoracle.com",
  tagline: "Crude Oil Intelligence Without the Noise",
  description:
    "Daily crude oil, gas, energy security and investment intelligence for investors, traders and energy professionals — presented clearly, concisely and with source-backed data.",
  price: "£299.99",
  priceSuffix: "/month",
  contactEmail: "intelligence@thecrudeoracle.com",
} as const;

// Live Stripe Payment Link for The Crude Oracle Premium (£299.99/month).
// To move to full Stripe Checkout later, see .env.example and README_DEPLOYMENT.md.
export const STRIPE_SUBSCRIPTION_LINK =
  "https://buy.stripe.com/8x2aEY2r7eCO2lfbJSgYU00";

export const STRIPE_LINK_IS_PLACEHOLDER =
  STRIPE_SUBSCRIPTION_LINK.startsWith("[");

export const FINANCIAL_DISCLAIMER_SHORT =
  "The Crude Oracle provides market commentary, educational content and investment research for information purposes only. It is not financial advice, investment advice, tax advice or a recommendation to buy, sell or hold any security, commodity, derivative, fund or financial product. Users must conduct their own research and consult a regulated financial adviser where appropriate. Trading and investing involve risk, including loss of capital.";

export const DATA_DISCLAIMER_SHORT =
  "Data shown may be delayed, indicative, manually updated or provided via API placeholders. Verify all figures with primary sources before making any trading or investment decision.";

export interface NavItem {
  label: string;
  href: string;
  premium?: boolean;
}

export const NAV_MAIN: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Premium Dashboard", href: "/premium-dashboard", premium: true },
  { label: "Daily Briefing", href: "/daily-briefing", premium: true },
  { label: "Watchlist", href: "/watchlist", premium: true },
  { label: "Company Intel", href: "/company-intelligence", premium: true },
  { label: "Tools", href: "/tools", premium: true },
  { label: "$1M Portfolio", href: "/portfolio" },
  { label: "Crude Prices", href: "/crude-oil-prices" },
  { label: "Gas / LNG", href: "/gas-lng" },
  { label: "OPEC / Supply Risk", href: "/opec-supply-risk" },
  { label: "UK Energy Security", href: "/uk-energy-security" },
  { label: "North Sea", href: "/north-sea" },
  { label: "Oil Truth", href: "/oil-truth" },
  { label: "Research", href: "/research-library" },
];

export const NAV_FOOTER_LEGAL: NavItem[] = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Use", href: "/terms-of-use" },
  { label: "Financial Disclaimer", href: "/financial-disclaimer" },
  { label: "Data Disclaimer", href: "/data-disclaimer" },
  { label: "Subscription Terms", href: "/subscription-terms" },
];

export const NAV_FOOTER_COMPANY: NavItem[] = [
  { label: "About", href: "/about" },
  { label: "Subscribe", href: "/subscribe" },
  { label: "Login", href: "/login" },
  { label: "Account", href: "/account" },
  { label: "Contact", href: "/contact" },
];
