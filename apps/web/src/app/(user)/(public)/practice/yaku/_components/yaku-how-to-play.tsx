"use client";

import { useTranslations } from "next-intl";
import { HaiKind } from "@mahjong-scoring/core";
import { TehaiDisplay } from "../../_components/tehai-display";
import { buildDemoTehai } from "../../_lib/demo-tehai";
import { QuestionPrompt } from "../../_components/question-prompt";
import { MultiSelect } from "@/app/(user)/_components/multi-select";
import { useYakuLabel } from "@/app/_hooks/use-yaku-options";

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

/** この手で成立している役。実際の出題では全役から選ぶ。 */
const DEMO_YAKU: readonly string[] = ["断么九", "一盃口"];

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
  const tPicker = useTranslations("common.yakuPicker");
  const labelOf = useYakuLabel();

  return (
    <div className="space-y-4">
      <TehaiDisplay tehai={DEMO_TEHAI} context={DEMO_CONTEXT} />

      {/* Instruction */}
      <QuestionPrompt>{t("selectYaku")}</QuestionPrompt>

      {/* 選択欄（出題時と同じ形。押せないよう disabled で静止させる） */}
      <MultiSelect
        options={DEMO_YAKU.map((name) => ({
          value: name,
          label: labelOf(name),
        }))}
        value={DEMO_YAKU}
        onChange={noop}
        disabled
        placeholder={tPicker("placeholder")}
        labels={{
          add: tPicker("add"),
          title: tPicker("title"),
          done: tPicker("done"),
        }}
      />
    </div>
  );
}
