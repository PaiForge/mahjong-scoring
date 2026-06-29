import { describe, it, expect } from "vitest";
import { generateYakuHanQuestion } from "./generator";
import {
  YAKU_HAN_ENTRIES,
  YAKUMAN_HAN,
  getYakuHanEntries,
  normalizeYakuHanRange,
} from "./constants";

describe("generateYakuHanQuestion", () => {
  const byName = new Map(YAKU_HAN_ENTRIES.map((e) => [e.name, e]));

  it("生成した問題は YAKU_HAN_ENTRIES に存在する役である", () => {
    for (let i = 0; i < 200; i++) {
      const q = generateYakuHanQuestion();
      expect(byName.has(q.yakuName)).toBe(true);
    }
  });

  it("正解翻数は門前/鳴きの状態に対応した値である", () => {
    for (let i = 0; i < 500; i++) {
      const q = generateYakuHanQuestion();
      const entry = byName.get(q.yakuName);
      expect(entry).toBeDefined();
      if (!entry) continue;

      // canNaki はデータ（nakiHan の有無）と一致する
      expect(q.canNaki).toBe(entry.nakiHan !== undefined);

      if (q.isMenzen) {
        expect(q.correctHan).toBe(entry.menzenHan);
      } else {
        // 鳴き状態が出るのは鳴ける役のみ
        expect(entry.nakiHan).toBeDefined();
        expect(q.correctHan).toBe(entry.nakiHan);
      }
    }
  });

  it("出題範囲を指定すると、その範囲の役のみ出題される", () => {
    const kuisagariNames = new Set(
      getYakuHanEntries("kuisagari").map((e) => e.name),
    );
    for (let i = 0; i < 300; i++) {
      const q = generateYakuHanQuestion("kuisagari");
      expect(kuisagariNames.has(q.yakuName)).toBe(true);
    }
  });

  it("門前限定役（nakiHan 未定義）は常に門前で出題される", () => {
    const menzenOnlyNames = new Set(
      YAKU_HAN_ENTRIES.filter((e) => e.nakiHan === undefined).map(
        (e) => e.name,
      ),
    );
    for (let i = 0; i < 500; i++) {
      const q = generateYakuHanQuestion();
      if (menzenOnlyNames.has(q.yakuName)) {
        expect(q.isMenzen).toBe(true);
      }
    }
  });
});

describe("getYakuHanEntries", () => {
  it("食い下がりなしは役満も食い下がり役も含まない（翻数 1〜3）", () => {
    const entries = getYakuHanEntries("no-kuisagari");
    expect(entries.length).toBeGreaterThan(0);
    for (const e of entries) {
      expect(e.menzenHan).toBeLessThan(YAKUMAN_HAN);
      // 食い下がりなし = nakiHan 未定義 or menzenHan と同じ
      expect(e.nakiHan === undefined || e.nakiHan === e.menzenHan).toBe(true);
    }
  });

  it("食い下がりありは門前と鳴きで翻数が異なる役のみ", () => {
    const entries = getYakuHanEntries("kuisagari");
    expect(entries.length).toBe(6);
    for (const e of entries) {
      expect(e.nakiHan).toBeDefined();
      expect(e.nakiHan).not.toBe(e.menzenHan);
    }
  });

  it("すべては全エントリを含む", () => {
    expect(getYakuHanEntries("all")).toHaveLength(YAKU_HAN_ENTRIES.length);
  });
});

describe("normalizeYakuHanRange", () => {
  it("妥当な値はそのまま返す", () => {
    expect(normalizeYakuHanRange("kuisagari")).toBe("kuisagari");
    expect(normalizeYakuHanRange("no-kuisagari")).toBe("no-kuisagari");
    expect(normalizeYakuHanRange("all")).toBe("all");
  });

  it("不正な値・未指定は既定値にフォールバックする", () => {
    expect(normalizeYakuHanRange(undefined)).toBe("all");
    expect(normalizeYakuHanRange("invalid")).toBe("all");
  });
});
