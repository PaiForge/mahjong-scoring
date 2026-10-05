"use client";

import { useTranslations } from "next-intl";

interface YakuHanPromptProps {
  /** 出題する役名 */
  readonly yakuName: string;
  /** 門前で出題されているか（false は鳴き） */
  readonly isMenzen: boolean;
}

/**
 * 役翻数練習の出題提示（役名と門前/鳴きバッジ）
 * 役翻数出題提示
 *
 * 出題盤面（YakuHanBoard）と遊び方デモ（YakuHanHowToPlay）で共有する、役の
 * 「見せ方」の単一実装。枠線は持たない。盤面では出題を囲む枠を盤面側が与え、
 * デモでは「問題方式」セクションの枠（HowToPlaySection）がその役目を果たす。
 * ここで枠を持つと、デモではセクションの枠と同じ角丸・同じ太さの罫線が
 * 二重になる（machi-fu / score-table の *-prompt.tsx と同じ切り分け）。
 *
 * バッジは立直・七対子・三暗刻のように鳴き状態が出題されない役でも必ず出す。
 * それらだけ省くと、出題が変わるたびに役名の位置が上下して読みにくくなるため。
 * どの役も実際に門前で出題している以上「門前」は正しく、状態が常に同じ場所に
 * ある方が読み取りも速い。
 *
 * 逆に「鳴き」が出るのは、役の面子を鳴いて作れる役だけ（core の
 * `canPromptNaki`）。ここは牌を 1 枚も見せないため、「鳴き」は手に副露が
 * あることを指しているのに役の面子を鳴いて作ったと読まれる。三暗刻は
 * その 2 つが割れるので鳴き状態を出題しない。
 */
export function YakuHanPrompt({ yakuName, isMenzen }: YakuHanPromptProps) {
  const t = useTranslations("yakuHanChallenge");

  return (
    <div className="flex flex-col items-center gap-3">
      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold ${
          isMenzen
            ? "bg-primary-50 text-primary-700"
            : "bg-amber-50 text-amber-700"
        }`}
      >
        {isMenzen ? t("menzen") : t("naki")}
      </span>
      <p className="text-3xl font-bold text-surface-900">{yakuName}</p>
    </div>
  );
}
