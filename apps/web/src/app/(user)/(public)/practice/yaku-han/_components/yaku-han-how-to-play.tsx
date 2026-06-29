import { YakuHanPrompt } from "./yaku-han-prompt";

/** デモ用の固定例: 三色同順（鳴き） */
const DEMO_YAKU = "三色同順";
const DEMO_IS_MENZEN = false;

/**
 * 役翻数練習の「問題方式」ビジュアルデモ
 * 役翻数 遊び方デモ
 *
 * 実際の出題（役名・門前/鳴きの状態提示）を静的に再現し、どのような問題が
 * 出るかを端的に示す。回答 UI（翻数の選択肢）は今後変更の可能性があるため
 * プレビューには含めない。
 */
export function YakuHanHowToPlay() {
  return (
    <YakuHanPrompt yakuName={DEMO_YAKU} isMenzen={DEMO_IS_MENZEN} canNaki />
  );
}
