import { describe, expect, it } from "vitest";

import {
  AD_SLOT_VALUES,
  counterpartSlot,
  kindForSlot,
  placementsForSlot,
  platformForSlot,
} from "../registry";

describe("counterpartSlot", () => {
  const mobileSlots = AD_SLOT_VALUES.filter(
    (slot) => platformForSlot(slot) === "mobile",
  );

  it("アプリのスロットはどれも web の同じ画面のスロットと対になる", () => {
    for (const slot of mobileSlots) {
      const web = counterpartSlot(slot);
      expect(web, slot).toBeDefined();
      if (web === undefined) continue;
      expect(platformForSlot(web), slot).toBe("web");
      expect(counterpartSlot(web), slot).toBe(slot);
    }
  });

  it("対のスロットは形と枠数が揃っている", () => {
    for (const slot of mobileSlots) {
      const web = counterpartSlot(slot);
      if (web === undefined) continue;
      expect(kindForSlot(slot), slot).toBe(kindForSlot(web));
      expect(placementsForSlot(slot), slot).toBe(placementsForSlot(web));
    }
  });

  it("昇級試験の結果は web とアプリで対になる", () => {
    expect(counterpartSlot("exam-result-native-ad")).toBe(
      "mobile-exam-result-native-ad",
    );
  });

  it("1 つの web のスロットに対になるアプリのスロットは 1 つまで", () => {
    const webs = mobileSlots.map(counterpartSlot);
    expect(new Set(webs).size).toBe(webs.length);
  });

  it("アプリに画面の無い web のスロットは対を持たない", () => {
    expect(counterpartSlot("leaderboard-index-native-ad")).toBeUndefined();
    expect(counterpartSlot("announcements-index-native-ad")).toBeUndefined();
  });
});
