import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ExpInfo } from "@mahjong-scoring/core";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import {
  DELTA_TONE_CLASSES,
  formatSignedDelta,
  signedDeltaTone,
} from "@/lib/challenge/signed-delta";
import type { PracticeMenuType } from "@/lib/db/practice-menu-types";
import type { ScoreComparison } from "@/lib/db/score-comparison-queries";
import { deriveRecordView } from "../_lib/derive-record-view";
import { ExpGainDisplay } from "./exp-gain-display";
import { ResultBlockSection } from "./result-block-section";

interface RecordSectionProps {
  /** 獲得経験値。今回の保存（grant）が無い・取得に失敗した場合は undefined */
  readonly expInfo: ExpInfo | undefined;
  /** 過去記録との比較サマリ。取得に失敗した場合は undefined */
  readonly comparison: ScoreComparison | undefined;
  /** マイレコードへの導線で、この練習種別を選択した状態で開くために使う */
  readonly menuType: PracticeMenuType;
}

/**
 * ログイン済みユーザー向けの記録セクション
 * 記録セクション
 *
 * 結果ページで未ログインの登録 CTA（`SignUpCta`）と同じスロットに表示される。
 * 獲得経験値と、過去の自分の記録（前回 / これまでのベスト）との比較を
 * 1 つのセクションに畳んで見せる。登録 CTA の「スコアが記録されます」という
 * 約束の、ログイン済み側の実物にあたる。
 *
 * 意図的に固定の形にしてある — 見出し行・スコア 3 行・導線 1 行。初回の記録
 * でも自己ベスト更新でも普通の走行でも行数が変わらないため、`ResultBlockSection`
 * の最小高さがどの分岐でも当たり、スケルトンからの置換でレイアウトが動かない。
 * 「初めての記録」と「自己ベスト更新！」は行を増やさず、見出し行の右のバッジ
 * として同じ場所に出る。比較対象が無い値は「—」で、行自体は残す。
 *
 * 前回との差は「今回」の行に、それが説明している値の隣に置く（株価表示と同じ
 * 並び — 現在値のあとに増減）。差を「前回」の行に置くと「−7」が前回について
 * の事実に読めてしまう。
 *
 * 末尾にマイレコード（`/mypage/challenges`）への導線を置く。ここは
 * 「自分の記録を見た直後」で、推移・平均・全履歴を見に行く動機が最も高い
 * 場所であり、マイページを開かないと存在に気づけない機能への入口になる。
 * 見に行くだけの移動なのでボタンではなく、マイページの導線と同じ 📈 を添えた
 * 中央寄せのテキストリンクにする（同じ行き先だと分かるように記号を揃える）。
 *
 * 昇級試験の結果ページにはこのセクション自体が無い（EXP も過去記録も
 * 持たないため。`createPracticeResultPage` 参照）。
 */
export async function RecordSection({
  expInfo,
  comparison,
  menuType,
}: RecordSectionProps) {
  const t = await getTranslations("challenge");
  const view = deriveRecordView(comparison);

  const badge =
    view.status === "newBest"
      ? {
          label: t("record.newBest"),
          className: "bg-primary-100 text-primary-700",
        }
      : view.status === "first"
        ? {
            label: t("record.firstRecord"),
            className: "bg-surface-100 text-surface-600",
          }
        : undefined;

  const formatScore = (score: number | undefined) =>
    score === undefined ? "—" : t("record.scoreUnit", { score });

  return (
    <ResultBlockSection>
      <div className="flex items-center justify-between gap-3">
        <SectionTitle>{t("record.sectionTitle")}</SectionTitle>
        {badge && (
          <span
            className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
          >
            {badge.label}
          </span>
        )}
      </div>

      {expInfo && <ExpGainDisplay expInfo={expInfo} />}

      <dl className="space-y-2 text-sm">
        <RecordRow label={t("record.thisTimeLabel")}>
          {formatScore(view.currentScore)}
          <DiffFromLast diff={view.diffFromLast} />
        </RecordRow>
        <RecordRow label={t("record.lastLabel")}>
          {formatScore(view.previousLastScore)}
        </RecordRow>
        <RecordRow label={t("record.bestLabel")}>
          {formatScore(view.previousBestScore)}
        </RecordRow>
      </dl>

      <p className="text-center">
        <Link
          href={`/mypage/challenges?menu=${menuType}`}
          className={`text-sm ${TEXT_LINK_CLASSES}`}
        >
          <span aria-hidden="true">📈</span> {t("record.viewMyRecords")}
        </Link>
      </p>
    </ResultBlockSection>
  );
}

/** スコア 1 行分（左に見出し、右に値） */
function RecordRow({
  label,
  children,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-surface-600">{label}</dt>
      <dd className="flex items-center gap-2 font-semibold text-surface-900">
        {children}
      </dd>
    </div>
  );
}

/**
 * 前回との差分表示
 * 前回差分
 *
 * 今回のスコア − 前回のスコア。アプリ共通の符号付きの書き方（`+2` / `−7` /
 * `±0`）と配色で、マイレコードの統計カードと同じ形になる。三角や百分率を
 * 使わない理由は `formatSignedDelta` の TSDoc を参照。
 */
function DiffFromLast({ diff }: { readonly diff: number | undefined }) {
  if (diff === undefined) return undefined;
  return (
    <span
      className={`text-xs font-semibold ${DELTA_TONE_CLASSES[signedDeltaTone(diff)]}`}
    >
      {formatSignedDelta(diff)}
    </span>
  );
}
