import { SkeletonBar } from "@/app/_components/skeleton-bar";
interface ProblemListSkeletonProps {
  /** 出題数。結果ページでは URL の `total`、遷移中は終了時の totalCount を渡す。 */
  readonly count: number;
}

/**
 * 問題別フィードバック一覧のスケルトン
 * 問題一覧スケルトン
 *
 * 一覧本体（`ProblemListAccordion`）は sessionStorage をマウント後の効果で読むため、
 * 結果ページの初回描画時点では空になる。その間この placeholder で高さを確保し、
 * 一覧が現れたときにリーダーボードが押し下げられるのを防ぐ。
 * チャレンジ終了直後の `ResultPageSkeleton` でも同じものを使い、
 * 遷移前後で一覧の領域が一致するようにしている。
 *
 * 寸法は `ProblemListAccordion` の実装に合わせる:
 * - 外枠 `mt-8 w-full space-y-2`
 * - 見出しラベル: `text-sm` の 1 行 = 20px
 * - 各行: border 2px + `p-3` 24px + `text-base` 1 行 24px = 50px
 *
 * 点数系練習の行見出し（「親・ツモ・3翻・40符」等）は画面幅が狭いと折り返して
 * 50px を超えることがある。その場合だけ実物がわずかに高くなるが、一覧全体の
 * 高さを確保できていれば十分なため許容する。
 *
 * 各行は実物（`AccordionCard`）の `border-3 border-ink` を写さない。スケルトンは
 * 灰色の矩形だけで面を示す表現に統一しており、ここだけ苔緑の枠を持つと
 * リーダーボードや経験値の矩形から浮いて、読み込み中の画面が実物より
 * 賑やかに見える。高さは `h-[50px]`（border-box）で確保しているため、
 * 枠を外しても実物との高さは一致したまま。
 */
export function ProblemListSkeleton({ count }: ProblemListSkeletonProps) {
  if (count <= 0) return undefined;

  return (
    <div
      aria-hidden="true"
      className="mt-8 w-full space-y-2"
      data-testid="problem-list-skeleton"
    >
      <SkeletonBar className="h-5 w-24" />
      <div className="space-y-2">
        {Array.from({ length: count }, (_, index) => (
          <SkeletonBar radius="lg" key={index} className="h-[50px]" />
        ))}
      </div>
    </div>
  );
}
