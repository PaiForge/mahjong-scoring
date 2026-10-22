"use client";

import { useTranslations } from "next-intl";
import { allowsDoubleYakuman, getScoreLevelName } from "@mahjong-scoring/core";
import { useYakumanRules } from "@/app/_hooks/use-rule-settings-store";
import { useYakuOrder } from "@/app/_hooks/use-yaku-order-store";
import { formatHan } from "@mahjong-scoring/features/practice/score/format-answer";
import { formatScoreAnswer } from "@mahjong-scoring/features/results/format-score-answer";
import { paymentToScoreTableAnswer } from "@mahjong-scoring/features/results/payment-adapter";
import { resolveScoreResultView } from "@mahjong-scoring/features/results/score-result-view";
import { resolveYakuCheatsheetName } from "@mahjong-scoring/features/yaku/examples";
import { useYakuCheatsheetState } from "@mahjong-scoring/features/yaku/use-yaku-cheatsheet-state";
import { BreakdownPanel } from "../../_components/breakdown-panel";
import { useFuHanOrder } from "@/app/_hooks/use-display-settings-store";
import { ScoreTableModal } from "@/app/(user)/(public)/reference/score-table/_components/score-table-modal";
import { ReferenceLinkButton } from "@/app/(user)/_components/reference-link-button";
import { ResultTableFrame } from "./result-table-frame";
import { FuRow, HanRow, ScoreRow, YakuRow } from "./result-display-rows";
import { useResultBreakdownSections } from "./use-result-breakdown-sections";
import { YakuCheatsheetModal } from "./yaku-cheatsheet-modal";
import { scoreTableFocusOfQuestion } from "@mahjong-scoring/features/score-table/focus";
import { useScoreTableModal } from "@mahjong-scoring/features/score-table/use-score-table-modal";
import { TableIcon } from "@/app/(user)/_components/icons/table-icon";
import type { ResultDisplayProps } from "@mahjong-scoring/features/results/result-display-props";

/**
 * 回答結果表示コンポーネント
 * 結果表示
 *
 * `userAnswer` / `result` が無い場合は無回答の正解開示として描画する。
 * 「あなたの回答」列は落とさず各行に未回答の印を出す — 列数を変えると
 * 正解の列が中央へ動き、回答したときと開示したときで同じ値を別の場所に
 * 探すことになる。
 *
 * 翻数・符の内訳は表の行の間に挟まず、表の下の 1 つの展開エリア
 * （{@link BreakdownPanel}）にまとめる。開いたときは間違えたほうの内訳を選ぶ。
 * 内訳の答えの値（翻数の合計・符）は押すと正解のセルをハイライトした点数表を
 * 開き、内訳の下には点数の行と同じ「点数表を確認」を添える。
 */
export function ResultDisplay({
  question,
  userAnswer,
  result,
  answerSummary,
  requireYaku = false,
  requireHanFu = true,
  exactHan = false,
  requireFuForMangan = false,
  embedded = false,
}: ResultDisplayProps) {
  const t = useTranslations("agariScore");
  const tScoreTable = useTranslations("scoreTable");
  const { answer } = question;
  // ダブル役満採用時は 26 翻を役満へ丸めず「ダブル役満」と表示する
  const allowDoubleYakuman = allowsDoubleYakuman(useYakumanRules());
  // 点数表モーダル。値（点数・内訳の翻数と符）を押したときだけ正解のセルを
  // ハイライトする（表への補助リンクからは素の表を開く）。
  const scoreTable = useScoreTableModal();

  // 役の振り分け・内訳の並び・符の行の有無・判定の見せ方はモバイルと共有する
  const {
    judged,
    judgedHanFu,
    answeredYakuJudgements,
    correctYakuJudgements,
    correctYakuNames,
    showsFu,
    breakdownTabs,
    initialBreakdown,
  } = resolveScoreResultView({
    question,
    userAnswer,
    result,
    requireHanFu,
    requireFuForMangan,
    yakuOrder: useYakuOrder(),
    fuHanOrder: useFuHanOrder(),
  });

  // 役一覧モーダル。成立役の印は早見表の項目名に解決してから付ける（「役牌 白」は
  // 「役牌」のカードに印が付く）。役をタップしたときはその役へ着地させ、一覧全体を
  // 見たいときは役を渡さずに先頭から開く。
  const yakuList = useYakuCheatsheetState(correctYakuNames);
  const openYakuList = (yakuName?: string) =>
    yakuList.openAt(
      yakuName === undefined ? undefined : resolveYakuCheatsheetName(yakuName),
    );

  // 正解の支払いは共通の整形関数に寄せる（"オール" 等の表記を1箇所で管理）。
  // ロンにはユーザー回答セルと同じ「点」を付ける。
  const paymentDescription = formatScoreAnswer(
    paymentToScoreTableAnswer(answer.payment),
    (key) => t(`form.options.${key}`),
    { ronSuffix: t("result.pointSuffix") },
  );

  // 点数表モーダルに渡す「正解の位置」。満貫以上（5翻〜）では符は
  // 使われず、区分行のハイライトに解決される（resolveScoreTableFocus）。
  const scoreTableFocus = scoreTableFocusOfQuestion(question);

  const hanDisplay = (hanValue: number) =>
    formatHan(hanValue, { t, exactHan, allowDoubleYakuman });
  const scoreLevelName = exactHan
    ? getScoreLevelName(answer.scoreLevel)
    : undefined;

  const breakdownSections = useResultBreakdownSections({
    tabs: breakdownTabs,
    answer,
    hanDisplay,
    onOpenScoreTable: () => scoreTable.open(true),
    onOpenYakuList: openYakuList,
  });

  return (
    <div className="space-y-4">
      {/* 表の箱・見出し・列幅の約束は ResultTableFrame（役なしのマスの表と共有） */}
      <ResultTableFrame
        embedded={embedded}
        footer={
          breakdownSections.length > 0 ? (
            <BreakdownPanel
              title={t("result.details.toggle")}
              sections={breakdownSections}
              initialKind={initialBreakdown}
              surface="sunken"
              action={
                // 点数の行の「点数表を確認」と同じ導線。正解の位置へ着地
                // させたいときは内訳の答えの値（翻数・符）を押す
                <ReferenceLinkButton
                  icon={<TableIcon className="size-3.5 shrink-0" />}
                  label={tScoreTable("viewScoreTable")}
                  hitArea="row"
                  onClick={() => scoreTable.open(false)}
                />
              }
            />
          ) : undefined
        }
      >
        {requireYaku && (
          <YakuRow
            judged={judged}
            answeredYakuJudgements={answeredYakuJudgements}
            correctYakuJudgements={correctYakuJudgements}
            onOpenYakuList={openYakuList}
          />
        )}
        <HanRow
          judgedHanFu={judgedHanFu}
          answerSummary={answerSummary}
          correctHan={answer.han}
          scoreLevelName={scoreLevelName || undefined}
          hanDisplay={hanDisplay}
        />
        {showsFu && <FuRow judgedHanFu={judgedHanFu} correctFu={answer.fu} />}
        <ScoreRow
          judged={judged}
          paymentDescription={paymentDescription}
          onOpenScoreTable={scoreTable.open}
        />
      </ResultTableFrame>

      <ScoreTableModal
        isOpen={scoreTable.isOpen}
        onClose={scoreTable.close}
        tab={scoreTableFocus}
        highlight={scoreTable.highlighted ? scoreTableFocus : undefined}
      />

      <YakuCheatsheetModal
        isOpen={yakuList.isOpen}
        onClose={yakuList.close}
        markedYakuNames={yakuList.markedYakuNames}
        focusedYakuName={yakuList.focusedYakuName}
      />
    </div>
  );
}
