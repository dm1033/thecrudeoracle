/**
 * Desk Bot labels the browser is allowed to ship.
 * The master system prompt stays in crude-oracle-agent.ts and is imported
 * only by the server route that calls the model.
 */

export const CRUDE_ORACLE_PROMPT_VERSION = "2026-11-14";

export const CRUDE_ORACLE_QUICK_PROMPTS: { label: string; query: string }[] = [
  { label: "Market Snapshot", query: "Give me today's crude & gas market snapshot and key drivers." },
  { label: "Latest Inventories", query: "Latest inventories: US crude and Cushing stocks, and the world balance." },
  { label: "Spreads & Cracks", query: "Show the Brent-WTI spread and the gasoline and diesel crack spreads." },
  { label: "Positioning", query: "What does the latest CFTC managed money positioning in WTI show?" },
  { label: "Supply & News", query: "OPEC spare capacity and how much news coverage Hormuz and the Red Sea are getting." },
  { label: "Gas", query: "What is the latest Henry Hub gas price?" },
];

export interface AgentChatMessage {
  role: "user" | "assistant";
  content: string;
}
