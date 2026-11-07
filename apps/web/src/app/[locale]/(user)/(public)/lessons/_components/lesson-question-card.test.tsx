import { cleanup, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// 牌を描くので TileImageProvider で包む render を使う
import { render as renderWithTiles } from "@/test/tile-image-render";
import { lessonQuiz } from "@mahjong-scoring/features/lessons/quizzes";
import { messages as enMessages } from "@mahjong-scoring/messages/en";
import { messages as jaMessages } from "@mahjong-scoring/messages/ja";

vi.mock("next/navigation", async () => await import("@/test/navigation-mock"));

const { setPathname } = await import("@/test/navigation-mock");
const { LessonQuestionCard } = await import("./lesson-question-card");

/** 本番と同じ辞書で、その言語のページに置いたものとして描く */
function renderIn(locale: "ja" | "en", ui: ReactElement) {
  setPathname(locale === "en" ? "/en/lessons/x" : "/lessons/x");
  return renderWithTiles(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === "en" ? enMessages : jaMessages}
    >
      {ui}
    </NextIntlClientProvider>,
  );
}

/** 確認問題の 1 問目（または key の問題）を描く */
function card(
  slug: "jantou-fu" | "chiitoitsu-score" | "mangan-ko-ron" | "yaku",
  messageKey: string,
  questionKey?: string,
) {
  const { questions, choices } = lessonQuiz(slug);
  const question =
    questions.find(({ key }) => key === questionKey) ?? questions[0];
  return (
    <LessonQuestionCard
      messageKey={messageKey}
      question={question}
      choices={choices}
      selected={undefined}
      showHint={false}
      onSelect={() => undefined}
    />
  );
}

function condition(): string {
  return screen.getByTestId("lesson-condition").textContent ?? "";
}

describe("LessonQuestionCard の条件文", () => {
  beforeEach(() => {
    cleanup();
  });

  it("英語のページでは風の名前を英語の辞書から引く", () => {
    renderIn("en", card("jantou-fu", "jantouFu"));

    expect(condition()).toBe("East round, South seat: the pair");
  });

  it("日本語のページの風の名前は従来どおり（東・南）", () => {
    renderIn("ja", card("jantou-fu", "jantouFu"));

    expect(condition()).toContain("東");
    expect(condition()).toContain("南");
  });

  it("英語のページでは役を英語のつなぎ（ + ）で並べる", () => {
    renderIn("en", card("chiitoitsu-score", "chiitoitsuScore", "tanyao"));

    expect(condition()).toContain(" + ");
    expect(condition()).not.toContain("＋");
  });

  it("日本語のページでは役を「＋」でつなぐ", () => {
    renderIn("ja", card("chiitoitsu-score", "chiitoitsuScore", "tanyao"));

    expect(condition()).toContain("＋");
  });

  it("英語のページでは役名を英語の役名の辞書から引く（漢字を残さない）", () => {
    renderIn("en", card("chiitoitsu-score", "chiitoitsuScore", "tanyao"));

    expect(condition()).toBe("Non-dealer, ron, Chiitoitsu + Tanyao (3 han)");
  });

  it("日本語のページの役名は core の役名のまま（七対子＋断么九）", () => {
    renderIn("ja", card("chiitoitsu-score", "chiitoitsuScore", "tanyao"));

    expect(condition()).toContain("七対子＋断么九");
  });

  it("役の問題の英語のページでも役名を英語で出す", () => {
    renderIn("en", card("yaku", "yaku"));

    expect(condition()).not.toMatch(/[\u3040-\u30ff\u4e00-\u9fff]/u);
  });

  it("選択肢の点数はページの言語の桁区切りで出す", () => {
    renderIn("en", card("mangan-ko-ron", "manganKoRon"));

    expect(screen.getByRole("button", { name: "8,000" })).toBeTruthy();
  });
});
