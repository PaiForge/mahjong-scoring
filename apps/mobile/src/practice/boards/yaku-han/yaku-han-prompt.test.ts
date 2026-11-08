import { describe, expect, it, vi } from "vitest";
import { messagesForLocale } from "@mahjong-scoring/features/i18n/messages-for-locale";
import { YakuHanPrompt } from "./yaku-han-prompt";
import { YakuHanProblemList } from "./yaku-han-problem-list";

const state = vi.hoisted(() => ({ locale: "ja" as "ja" | "en" }));
vi.mock("use-intl", async (importOriginal) => {
  const actual = await importOriginal<typeof import("use-intl")>();
  return {
    ...actual,
    useTranslations: (namespace: string) =>
      actual.createTranslator({
        locale: state.locale,
        messages: messagesForLocale(state.locale),
        namespace,
      }),
  };
});
vi.mock("react-native", () => ({
  View: "View",
  Text: "Text",
  StyleSheet: { create: <T>(styles: T) => styles },
}));
vi.mock("../../../components/chip", () => ({ Chip: "Chip" }));
vi.mock("../../components/answer-comparison", () => ({
  AnswerComparison: "AnswerComparison",
}));
vi.mock("../../components/problem-list-accordion", () => ({
  ProblemListAccordion: "ProblemListAccordion",
}));

describe("役翻数の表示名", () => {
  it.each([
    ["ja", "三色同順"],
    ["en", "Sanshoku Doujun"],
  ] as const)("%s の出題と結果で core の役名を訳す", (locale, expected) => {
    state.locale = locale;
    const prompt = YakuHanPrompt({ yakuName: "三色同順", isMenzen: true });
    expect(JSON.stringify(prompt)).toContain(expected);
    const list = YakuHanProblemList({ results: [] });
    const summary = list.props.renderSummary({
      yakuName: "三色同順",
      isMenzen: true,
    });
    expect(summary).toContain(expected);
    if (locale === "en") {
      expect(JSON.stringify(prompt)).not.toContain("三色同順");
      expect(summary).not.toContain("三色同順");
    }
  });
});
