"use client";

import { useTranslations } from "next-intl";
import { HaiKind } from "@mahjong-scoring/core";
import type { Tehai14 } from "@mahjong-scoring/core";
import { TehaiDisplay } from "../../_components/tehai-display";

/**
 * デモ用の固定例: 立直 + 門前清自摸和 + 断么九 = 3翻
 * 234m 567m 345p 555s 88s（門前ツモ・リーチ）。刻子があるため平和は不成立。
 */
// Tehai14 はブランド型のため、リポジトリのテスト同様 as unknown as で静的構築する
// （TehaiDisplay は closed/exposed の描画にのみ使用するため検証は不要）
const DEMO_TEHAI = {
  closed: [
    HaiKind.ManZu2,
    HaiKind.ManZu3,
    HaiKind.ManZu4,
    HaiKind.ManZu5,
    HaiKind.ManZu6,
    HaiKind.ManZu7,
    HaiKind.PinZu3,
    HaiKind.PinZu4,
    HaiKind.PinZu5,
    HaiKind.SouZu5,
    HaiKind.SouZu5,
    HaiKind.SouZu5,
    HaiKind.SouZu8,
    HaiKind.SouZu8,
  ],
  exposed: [],
} as unknown as Tehai14;

const DEMO_CONTEXT = {
  bakaze: HaiKind.Ton,
  jikaze: HaiKind.Nan,
  agariHai: HaiKind.SouZu8,
  isTsumo: true,
  isRiichi: true,
} as const;

const HAN_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] as const;
const DEMO_ANSWER = 3;

/**
 * 翻数即答練習の「問題方式」ビジュアルデモ
 * 翻数即答 遊び方デモ
 *
 * 実際の出題盤面（手牌の提示と翻数の選択）を静的に再現し、
 * 正解の翻数をハイライトしてプレイ方法を端的に示す。
 */
export function HanCountHowToPlay() {
  const t = useTranslations("hanCountChallenge");

  return (
    <div className="space-y-4">
      <TehaiDisplay
        tehai={DEMO_TEHAI}
        context={DEMO_CONTEXT}
        translationNamespace="hanCountChallenge"
      />

      {/* Instruction */}
      <p className="text-center text-sm font-medium text-surface-600">
        {t("selectHan")}
      </p>

      {/* Han options（正解をハイライト） */}
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
        {HAN_OPTIONS.map((han) => {
          const isCorrect = han === DEMO_ANSWER;
          return (
            <div
              key={han}
              className={`flex items-center justify-center rounded-xl border p-4 text-sm font-semibold ${
                isCorrect
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-surface-200 bg-white text-surface-400 opacity-60"
              }`}
            >
              {t("hanOption", { count: han })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
