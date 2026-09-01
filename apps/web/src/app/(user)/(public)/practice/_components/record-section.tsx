import { getTranslations } from "next-intl/server";
import type { ExpInfo } from "@mahjong-scoring/core";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import type { ScoreComparison } from "@/lib/db/score-comparison-queries";
import { ExpGainDisplay } from "./exp-gain-display";
import { ResultBlockSection } from "./result-block-section";

interface RecordSectionProps {
  /** 獲得経験値。今回の保存（grant）が無い・取得に失敗した場合は undefined */
  readonly expInfo: ExpInfo | undefined;
  /** 過去記録との比較サマリ。取得に失敗した場合は undefined */
  readonly comparison: ScoreComparison | undefined;
}

/**
 * ログイン済みユーザー向けの記録セクション
 * 記録セクション
 *
 * 結果ページで未ログインの登録 CTA（`SignUpCta`）と同じスロットに表示される。
 * 獲得経験値と、過去の自分の記録（これまでのベスト / 前回）との比較を
 * 1 つのセクションに畳んで見せる。登録 CTA の「スコアが記録されます」という
 * 約束の、ログイン済み側の実物にあたる。
 *
 * 分岐ごとの内容:
 * - 経験値行は `expInfo` があるときだけ（スコア保存に失敗した結果ページでは
 *   比較だけが出る）
 * - 過去記録が 1 件も無ければ「今回が最初の記録です」を出す
 * - 今回がこれまでのベストを上回っていれば「自己ベスト更新！」バッジを出す
 *   （描画時点で今回のスコアは保存済みのため、比較クエリ側で今回分を除外して
 *   「これまでのベスト」を求めている。`getScoreComparison` 参照）
 */
export async function RecordSection({
  expInfo,
  comparison,
}: RecordSectionProps) {
  const t = await getTranslations("challenge");
  const { currentScore, previousBestScore, previousScore } = comparison ?? {};

  const hasHistory =
    previousBestScore !== undefined || previousScore !== undefined;
  const isFirstRecord = comparison !== undefined && !hasHistory;
  const isNewBest =
    currentScore !== undefined &&
    previousBestScore !== undefined &&
    currentScore > previousBestScore;
  const diffFromLast =
    currentScore !== undefined && previousScore !== undefined
      ? currentScore - previousScore
      : undefined;

  return (
    <ResultBlockSection>
      <SectionTitle>{t("record.sectionTitle")}</SectionTitle>

      {expInfo && <ExpGainDisplay expInfo={expInfo} />}

      {isFirstRecord && (
        <p className="text-sm text-surface-600">{t("record.firstRecord")}</p>
      )}

      {hasHistory && (
        <div className="space-y-2">
          {previousBestScore !== undefined && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-surface-600">{t("record.bestLabel")}</span>
              <span className="font-semibold text-surface-900">
                {t("record.scoreUnit", { score: previousBestScore })}
              </span>
            </div>
          )}
          {previousScore !== undefined && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-surface-600">{t("record.lastLabel")}</span>
              <span className="flex items-center gap-2">
                {diffFromLast !== undefined && (
                  <DiffFromLast diff={diffFromLast} />
                )}
                <span className="font-semibold text-surface-900">
                  {t("record.scoreUnit", { score: previousScore })}
                </span>
              </span>
            </div>
          )}
        </div>
      )}

      {isNewBest && (
        <span className="inline-block rounded-full bg-primary-100 px-3 py-1 text-sm font-semibold text-primary-700">
          {t("record.newBest")}
        </span>
      )}
    </ResultBlockSection>
  );
}

/**
 * 前回との差分表示
 * 前回差分
 *
 * 今回のスコア − 前回のスコア。改善は ▲（success）、後退は ▼（destructive）、
 * 同点は ±0（グレー）。マイページの `StatsCard` の増減表示と同じ記号・配色。
 */
function DiffFromLast({ diff }: { readonly diff: number }) {
  if (diff === 0) {
    return <span className="text-xs font-semibold text-surface-500">±0</span>;
  }
  const isPositive = diff > 0;
  return (
    <span
      className={`text-xs font-semibold ${isPositive ? "text-success" : "text-destructive"}`}
    >
      {isPositive ? "▲" : "▼"}
      {Math.abs(diff)}
    </span>
  );
}
