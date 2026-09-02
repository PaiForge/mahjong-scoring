import { BOARD_AREA_HEIGHT } from "../_lib/board-area-height";
import type { PlayBoardHeight } from "../_lib/board-area-height";

interface QuestionGeneratingPlaceholderProps {
  /** 生成中に出す文言（各練習が自分の "generating" を持つ） */
  readonly label: string;
  /**
   * 盤面エリアの高さ（{@link BOARD_AREA_HEIGHT} 参照）。
   *
   * 渡すと、出来上がった盤面と同じ高さの場所を確保して待つ。渡さない盤面は
   * 文言のぶんの高さしか取らないため、盤面が現れた瞬間にその差だけ画面が
   * 伸びる（実測で最小 121px・最大 687px）。
   */
  readonly boardHeight?: PlayBoardHeight;
}

/**
 * 問題生成中のプレースホルダ
 * 生成中表示
 *
 * ジェネレータが有効な問題を組み立てるまでの短い待ち時間に出す。出題は
 * クライアントの効果で作るため、盤面が現れるまでに必ず 1 フレームここを通る。
 * 成立率の低い出題（満貫以上・平和）は生成に何十回も試行するぶんさらに長い。
 *
 * `boardHeight` を渡すと `loading.tsx` のフォールバックと同じ高さで待つので、
 * スケルトン → 生成中 → 実体 のどこでも画面が動かない。
 */
export function QuestionGeneratingPlaceholder({
  label,
  boardHeight,
}: QuestionGeneratingPlaceholderProps) {
  return (
    <div
      className={`flex items-center justify-center ${
        boardHeight === undefined
          ? "py-20"
          : `${BOARD_AREA_HEIGHT[boardHeight]} mt-4`
      }`}
    >
      <div className="text-surface-500">{label}</div>
    </div>
  );
}
