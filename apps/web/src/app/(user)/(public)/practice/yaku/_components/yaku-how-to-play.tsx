"use client";

import { useTranslations } from "next-intl";
import { HaiKind } from "@mahjong-scoring/core";
import { TehaiDisplay } from "../../_components/tehai-display";
import { buildDemoTehai } from "../../_lib/demo-tehai";
import { QuestionPrompt } from "../../_components/question-prompt";
import { YakuSelectList } from "./yaku-select-list";
import { YakuSelectedChips } from "./yaku-selected-chips";

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

/** この手で成立している役。全役の一覧の中で選択済みにして見せる */
const DEMO_SELECTED: ReadonlySet<string> = new Set(["断么九", "一盃口"]);

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

      {/* 選択欄（出題時と同じ形。押せないよう disabled で静止させる） */}
      <YakuSelectList
        selected={DEMO_SELECTED}
        disabled
        preview
        onToggle={noop}
      />

      <YakuSelectedChips selected={DEMO_SELECTED} disabled onRemove={noop} />
    </div>
  );
}
