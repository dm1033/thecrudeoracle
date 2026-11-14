import { getCurveFeed } from "@/lib/curve";
import { getDashboardCards } from "@/lib/dashboard-cards";
import type { DeskData } from "@/lib/crude-oracle-agent";

/** Reads the public feeds the Desk Bot quotes. Never throws; anything that fails is simply absent. */
export async function getDeskData(): Promise<DeskData> {
  const [cards, curve] = await Promise.all([getDashboardCards(), getCurveFeed()]);
  return { cards, curve };
}
