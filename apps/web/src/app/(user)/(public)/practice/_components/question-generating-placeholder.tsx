import { BOARD_AREA_HEIGHT } from "../_lib/board-area-height";
import type { PlayBoardHeight } from "../_lib/board-area-height";

interface QuestionGeneratingPlaceholderProps {
  /** 生成中に出す文言（各練習が自分の "generating" を持つ） */
  readonly label: string;
  /**
   * 盤面エリアの高さ（{@link BOARD_AREA_HEIGHT} 参照）。
   *
   * 出来上がった盤面と同じ高さの場所を確保して待つために要る。任意にすると
   * 新しい盤面が渡し忘れたまま通ってしまい、盤面が現れた瞬間にその差だけ
   * 画面が伸びる（渡していなかった頃の実測で最小 121px・最大 687px）ため、
   * 必須にして型で強制する。
   */
  readonly boardHeight: PlayBoardHeight;
}

/**
 * 問題生成中のプレースホルダ
 * 生成中表示
 *
 * ジェネレータが有効な問題を組み立てるまでの短い待ち時間に出す。出題は
 * クライアントの効果で作るため、盤面が現れるまでに必ず 1 フレームここを通る。
 * 成立率の低い出題（満貫以上・平和）は生成に何十回も試行するぶんさらに長い。
 *
 * `loading.tsx` のフォールバックと同じ表（{@link BOARD_AREA_HEIGHT}）から高さを
 * 取るので、スケルトン → 生成中 → 実体 のどこでも画面が動かない。
 */
export function QuestionGeneratingPlaceholder({
  label,
  boardHeight,
}: QuestionGeneratingPlaceholderProps) {
  return (
    <div
      className={`mt-4 flex items-center justify-center ${BOARD_AREA_HEIGHT[boardHeight]}`}
    >
      <div className="text-surface-500">{label}</div>
    </div>
  );
}
