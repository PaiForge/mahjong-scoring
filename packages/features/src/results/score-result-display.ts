import { judgeYakuSelection } from "@mahjong-scoring/core";
import type {
  ScoreQuestion,
  YakuSelectionJudgement,
} from "@mahjong-scoring/core";

import { orderYakuDetails } from "./order-yaku-details";

/** 内訳の 1 行（役名・符の理由と、その翻数・符） */
export interface ScoreResultDetailItem {
  readonly name: string;
  readonly value: number;
}

/** 内訳の行とその合計（切り上げ・役満への丸めの前） */
export interface ScoreResultBreakdown {
  readonly items: readonly ScoreResultDetailItem[];
  readonly total: number;
}

/** 点数計算の答え合わせに並べる値 */
export interface ScoreResultDisplay {
  /** 「あなたの回答」列の役（選んで合っていた / 余分だった）。選び忘れは含まない */
  readonly answeredYakuJudgements: readonly YakuSelectionJudgement[];
  /** 「正解」列の役（選んで合っていた / 選び忘れた）。余分に選んだ役は含まない */
  readonly correctYakuJudgements: readonly YakuSelectionJudgement[];
  /** 翻数の内訳。役の並び順の設定どおり。内訳が無い・空なら undefined */
  readonly yakuBreakdown: ScoreResultBreakdown | undefined;
  /** 符の内訳。出題が符の内訳を持たなければ undefined */
  readonly fuBreakdown: ScoreResultBreakdown | undefined;
}

/**
 * 点数計算の答え合わせに並べる値を組み立てる
 * 点数計算結果表示
 *
 * 役は「合っていた / 余分だった / 選び忘れた」を役ごとに見せる。1 つ余分な
 * だけで回答全体が赤くなると、合っていた役まで間違いに見えてしまうため。
 * 判定は {@link judgeYakuSelection} の結果を回答側・正解側の列に振り分ける
 * だけで、並び（正解の役 → 余分に選んだ役）はそのまま残す。
 *
 * 翻数の内訳は結果ページの内訳表と同じく、設定の役の並び順に載せ替える
 * （ライブラリの判定順のままだと問題ごとに同じ役の位置が変わる）。
 *
 * 内訳を出すかの境目は翻数と符で違う。翻数は行が 1 つも無ければ出さず、符は
 * 出題が内訳を持つかで決める（web・モバイルの `ResultDisplay` の約束）。
 *
 * @param question - 出題
 * @param userYakus - 選んだ役。無回答の正解開示では undefined（何も選んでいない扱い）
 * @param yakuOrder - 表示に使う役の並び（`useYakuOrder` の戻り値）
 */
export function buildScoreResultDisplay(
  question: Readonly<ScoreQuestion>,
  userYakus: readonly string[] | undefined,
  yakuOrder: readonly string[],
): ScoreResultDisplay {
  const yakuJudgements = judgeYakuSelection(question, userYakus ?? []);

  const yakuItems = orderYakuDetails(question.yakuDetails ?? [], yakuOrder).map(
    (detail) => ({ name: detail.name, value: detail.han }),
  );

  return {
    answeredYakuJudgements: yakuJudgements.filter(
      (judgement) => judgement.state !== "missed",
    ),
    correctYakuJudgements: yakuJudgements.filter(
      (judgement) => judgement.state !== "incorrect",
    ),
    yakuBreakdown:
      yakuItems.length > 0
        ? { items: yakuItems, total: sumValues(yakuItems) }
        : undefined,
    fuBreakdown:
      question.fuDetails === undefined
        ? undefined
        : buildFuItems(question.fuDetails),
  };
}

function buildFuItems(
  fuDetails: NonNullable<ScoreQuestion["fuDetails"]>,
): ScoreResultBreakdown {
  const items = fuDetails.map((detail) => ({
    name: detail.reason,
    value: detail.fu,
  }));
  return { items, total: sumValues(items) };
}

function sumValues(items: readonly ScoreResultDetailItem[]): number {
  return items.reduce((sum, item) => sum + item.value, 0);
}
