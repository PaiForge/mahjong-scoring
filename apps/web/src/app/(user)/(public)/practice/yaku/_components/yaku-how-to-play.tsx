"use client";

import { useTranslations } from "next-intl";
import { HaiKind } from "@mahjong-scoring/core";
import { TehaiDisplay } from "../../_components/tehai-display";
import { buildDemoTehai } from "../../_lib/demo-tehai";
import { YakuChip } from "./yaku-chip";
import { QuestionPrompt } from "../../_components/question-prompt";

/**
 * デモ用の固定例: 断么九 + 一盃口
 * 234m 234m 345p 678s + 5s 単騎待ち（ロン）。単騎待ちのため平和は不成立。
 */
const DEMO_TEHAI = buildDemoTehai([
  HaiKind.ManZu2,
  HaiKind.ManZu3,
  HaiKind.ManZu4,
  HaiKind.ManZu2,
  HaiKind.ManZu3,
  HaiKind.ManZu4,
  HaiKind.PinZu3,
  HaiKind.PinZu4,
  HaiKind.PinZu5,
  HaiKind.SouZu6,
  HaiKind.SouZu7,
  HaiKind.SouZu8,
  HaiKind.SouZu5,
  HaiKind.SouZu5,
]);

const DEMO_CONTEXT = {
  bakaze: HaiKind.Ton,
  jikaze: HaiKind.Nan,
  agariHai: HaiKind.SouZu5,
  isTsumo: false,
} as const;

/** 選択肢の抜粋。実際の出題では全役から複数選択する。 */
const DEMO_YAKU: readonly string[] = [
  "断么九",
  "一盃口",
  "平和",
  "三色同順",
  "対々和",
];

const noop = () => {};

/**
 * 役判定練習の「問題方式」ビジュアルデモ
 * 役判定 遊び方デモ
 *
 * 実際の出題盤面（手牌の提示と役の複数選択）を、出題時（未回答）のまま
 * 静的に再現する。
 */
export function YakuHowToPlay() {
  const t = useTranslations("yaku");

  return (
    <div className="space-y-4">
      <TehaiDisplay tehai={DEMO_TEHAI} context={DEMO_CONTEXT} />

      {/* Instruction */}
      <QuestionPrompt>{t("selectYaku")}</QuestionPrompt>

      {/* Yaku chips（出題時と同じ未選択の並び） */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {DEMO_YAKU.map((name) => (
          <YakuChip
            key={name}
            yakuName={name}
            isSelected={false}
            feedbackState={undefined}
            disabled
            presentational
            onToggle={noop}
          />
        ))}
      </div>
    </div>
  );
}
