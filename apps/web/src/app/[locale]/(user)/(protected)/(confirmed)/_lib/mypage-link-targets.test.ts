import { describe, expect, it } from "vitest";

import { getTranslatedPublication } from "@/i18n/translated-publications";
import { notificationHref } from "@mahjong-scoring/features/notifications/link";
import { NOTIFICATION_TYPES } from "@mahjong-scoring/features/notifications/types";
import { PRACTICE_MENU_SLUGS } from "@mahjong-scoring/features/practice-menu-types";
import {
  MYPAGE_NOTIFICATIONS_PATH,
  MYPAGE_PLAN_PATH,
  MY_RECORD_PATH,
  PRACTICE_PATH,
  YAKU_ORDER_PATH,
  practiceHref,
} from "@mahjong-scoring/features/routes";

/**
 * マイページ・設定のクライアントの部品が、公開状態を読まずに同じ言語で張る
 * 行き先の検査
 *
 * クライアントの部品（マイレコードのダッシュボード・通知の行・プロフィールの
 * 保存後・アカウントの読み直し・退会後・役の並び順への行）は、公開状態の表を
 * クライアントに持ち込まないため、行き先を `localizedHref` で同じ言語の URL に
 * するだけで、その言語で出しているかを確かめない。その前提（「マイページを
 * 出している言語では、これらの行き先も出している」）が崩れると、英語の
 * マイページから 404 の英語 URL へ張ることになる。ここで英語の許可リストに
 * 載っていることを確かめる。
 */
describe("マイページ・設定から同じ言語で張る行き先は英語で出している", () => {
  const sameLanguageTargets = [
    "/",
    "/mypage",
    "/mypage/account",
    MY_RECORD_PATH,
    `${MY_RECORD_PATH}/results`,
    MYPAGE_PLAN_PATH,
    MYPAGE_NOTIFICATIONS_PATH,
    YAKU_ORDER_PATH,
    PRACTICE_PATH,
  ];

  it.each(sameLanguageTargets)("%s", (path) => {
    expect(getTranslatedPublication(path, "en")).not.toBe("unpublished");
  });

  it("通知の行き先（マイページの下位）はどれも英語で出している", () => {
    const destinations = NOTIFICATION_TYPES.map(notificationHref).filter(
      (href): href is string => href !== undefined,
    );
    expect(destinations.length).toBeGreaterThan(0);
    for (const href of destinations) {
      expect(getTranslatedPublication(href, "en"), href).not.toBe(
        "unpublished",
      );
    }
  });

  it("マイレコードの「この練習をもう一度」の行き先（練習の説明ページ）はどれも英語で出している", () => {
    for (const slug of PRACTICE_MENU_SLUGS) {
      const href = practiceHref(slug);
      expect(getTranslatedPublication(href, "en"), href).not.toBe(
        "unpublished",
      );
    }
  });
});
