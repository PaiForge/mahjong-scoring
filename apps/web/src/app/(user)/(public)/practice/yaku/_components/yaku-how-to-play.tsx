"use client";

import { useTranslations } from "next-intl";
import { HaiKind } from "@mahjong-scoring/core";
import type { Tehai14 } from "@mahjong-scoring/core";
import { TehaiDisplay } from "../../_components/tehai-display";
import { YakuChip } from "./yaku-chip";

/**
 * デモ用の固定例: 断么九 + 一盃口
 * 234m 234m 345p 678s + 5s 単騎待ち（ロン）。単騎待ちのため平和は不成立。
 */
// Tehai14 はブランド型のため、リポジトリのテスト同様 as unknown as で静的構築する
// （TehaiDisplay は closed/exposed の描画にのみ使用するため検証は不要）
const DEMO_TEHAI = {
  closed: [
    HaiKind.ManZu2, HaiKind.ManZu3, HaiKind.ManZu4,
    HaiKind.ManZu2, HaiKind.ManZu3, HaiKind.ManZu4,
    HaiKind.PinZu3, HaiKind.PinZu4, HaiKind.PinZu5,
    HaiKind.SouZu6, HaiKind.SouZu7, HaiKind.SouZu8,
    HaiKind.SouZu5, HaiKind.SouZu5,
  ],
  exposed: [],
} as unknown as Tehai14;

const DEMO_CONTEXT = {
  bakaze: HaiKind.Ton,
  jikaze: HaiKind.Nan,
  agariHai: HaiKind.SouZu5,
  isTsumo: false,
} as const;

/** 正解役（緑）＋ 不正解の選択肢（グレー）。実際の出題では全役から複数選択する。 */
const DEMO_YAKU: readonly { name: string; isCorrect: boolean }[] = [
  { name: "断么九", isCorrect: true },
  { name: "一盃口", isCorrect: true },
  { name: "平和", isCorrect: false },
  { name: "三色同順", isCorrect: false },
  { name: "対々和", isCorrect: false },
];

const noop = () => {};

/**
 * 役判定練習の「問題方式」ビジュアルデモ
 * 役判定 遊び方デモ
 *
 * 実際の出題盤面（手牌の提示と役の複数選択）を静的に再現し、
 * 成立している役をハイライトしてプレイ方法を端的に示す。
 */
export function YakuHowToPlay() {
  const t = useTranslations("yaku");

  return (
    <div className="space-y-4">
      <TehaiDisplay
        tehai={DEMO_TEHAI}
        context={DEMO_CONTEXT}
        translationNamespace="yaku"
      />

      {/* Instruction */}
      <p className="text-center text-sm font-medium text-surface-600">
        {t("selectYaku")}
      </p>

      {/* Yaku chips（正解をハイライト） */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {DEMO_YAKU.map(({ name, isCorrect }) => (
          <YakuChip
            key={name}
            yakuName={name}
            isSelected={isCorrect}
            feedbackState={isCorrect ? "correct" : undefined}
            disabled
            onToggle={noop}
          />
        ))}
      </div>

      {/* Answer note */}
      <p className="text-center text-xs leading-relaxed text-surface-500">
        {t("howToPlay.answerNote")}
      </p>
    </div>
  );
}
