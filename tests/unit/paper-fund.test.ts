import { describe, expect, it } from "vitest";
import { loadJson } from "../data/helpers";
import { payoffRatio, type FundFile } from "../../src/lib/paper-fund";

describe("paper-fund payoff ratios", () => {
  const fund = loadJson<FundFile>("virtual-portfolio.json");

  it("recomputes each published risk/reward from the stored entry, stop and target", () => {
    const styleFor = (direction: string) => {
      if (direction === "Long") return "long" as const;
      if (direction === "Short") return "short" as const;
      return "spread-short" as const;
    };
    for (const idea of fund.opportunities) {
      if (idea.entry == null || idea.stop == null || idea.target == null || idea.risk_reward_ratio == null) {
        expect(idea.risk_reward_ratio, idea.market).toBeNull();
        continue;
      }
      const ratio = payoffRatio(idea.entry, idea.stop, idea.target, styleFor(idea.direction));
      expect(ratio, idea.market).not.toBeNull();
      expect(Math.abs((ratio as number) - idea.risk_reward_ratio), idea.market).toBeLessThan(0.02);
    }
  });

  it("publishes a Brent–WTI spread that matches the frozen marks", () => {
    expect(fund.marks.brent_wti_spread).toBeCloseTo(
      (fund.marks.brent as number) - (fund.marks.wti_nov26 as number),
      2,
    );
    expect(fund.marks.ho_crack_vs_wti).toBeCloseTo((fund.marks.ho_nov26 as number) * 42 - (fund.marks.wti_nov26 as number), 2);
  });
});
