import { SCORING_VERSION, scoreYakuIdOfName } from "@mahjong-scoring/core";
import type {
  RuleSettings,
  ScoreYakuId,
  UserAnswer,
} from "@mahjong-scoring/core";

import type { ScorePracticeModeFlags } from "../practice/score/generator-options";
import {
  resolveKoTsumoInput,
  type KoTsumoInputMode,
} from "../settings/ko-tsumo-input";
import type { ScoreInputMode } from "../settings/score-input";
import {
  dailyAnswerDetailSchema,
  type DailyAnswerDetail,
} from "./answer-detail";

/**
 * 解答の詳細を組み立てる入力（解答した瞬間の端末の状態）
 * 解答詳細の入力
 */
export interface DailyAnswerDetailInput {
  /** 利用者の解答。「わからない」で開示したときは undefined */
  readonly answer: UserAnswer | undefined;
  /** 回答フォームを組んだ回答モード（和了形の点数計算の「回答する項目」） */
  readonly mode: ScorePracticeModeFlags;
  /** 盤面を組み立てたルール設定。ストアの状態（setter を含む）をそのまま渡してよい */
  readonly ruleSettings: RuleSettings;
  /** 端末のビルド（web は公開ビルド ID、アプリは版）。分からなければ undefined */
  readonly build: string | undefined;
  /** 点数の入力方式 */
  readonly scoreInput: ScoreInputMode;
  /** 保存してある子ツモの入力方式（実際に効く方式はここで決める） */
  readonly storedKoTsumoInput: KoTsumoInputMode;
}

/** 回答の選択肢の役名を役 ID に直す。直せない名前があれば undefined */
function yakuIdsOf(names: readonly string[]): ScoreYakuId[] | undefined {
  const ids: ScoreYakuId[] = [];
  for (const name of names) {
    const id = scoreYakuIdOfName(name);
    if (id === undefined) return undefined;
    ids.push(id);
  }
  return ids;
}

/**
 * 解答した瞬間の解答と端末の条件から、サーバーへ送る詳細を組み立てる
 * 解答詳細組み立て
 *
 * @description
 * web とアプリの盤面が最初の解答（または「わからない」）のときに 1 回だけ呼び、
 * 結果を預かって再送でもそのまま送る（`use-answer-record.ts`）。再送のときに
 * 作り直さない — ビルドや設定が解答の後に変わっても、解答時の条件を残すため。
 *
 * 入力しなかった項目は持たない（`undefined` を送らない）。ルール設定は 7 つの
 * 真偽値だけを写し、ストアの setter を混ぜない。子ツモの入力方式は保存値ではなく
 * 実際に効いた方式（`resolveKoTsumoInput`）。
 *
 * 送る前に、サーバーと同じスキーマ（`dailyAnswerDetailSchema`）で検証する。
 *
 * @returns 検証を通った詳細。形が合わなければ undefined（実装の不具合でしか起きない）
 */
export function buildDailyAnswerDetail(
  input: DailyAnswerDetailInput,
): DailyAnswerDetail | undefined {
  const { answer, mode, ruleSettings, build, scoreInput } = input;
  const yaku = answer === undefined ? [] : yakuIdsOf(answer.yakus);
  if (yaku === undefined) return undefined;
  const common = {
    v: 1,
    mode: {
      requireYaku: mode.requireYaku,
      requireHanFu: mode.requireHanFu,
      exactHan: mode.exactHan,
      requireFuForMangan: mode.requireFuForMangan,
    },
    client: {
      scoringVersion: SCORING_VERSION,
      ...(build === undefined || build === "" ? {} : { build }),
      ruleSettings: {
        renfonpaiAs4Fu: ruleSettings.renfonpaiAs4Fu,
        kiriageMangan: ruleSettings.kiriageMangan,
        suuankouTankiDouble: ruleSettings.suuankouTankiDouble,
        daisuushiiDouble: ruleSettings.daisuushiiDouble,
        kokushiJuusanmenDouble: ruleSettings.kokushiJuusanmenDouble,
        junseiChuurenDouble: ruleSettings.junseiChuurenDouble,
        fukugouYakuman: ruleSettings.fukugouYakuman,
      },
      scoreInput,
      koTsumoInput: resolveKoTsumoInput(scoreInput, input.storedKoTsumoInput),
    },
  };
  const parsed = dailyAnswerDetailSchema.safeParse(
    answer === undefined
      ? { ...common, outcome: "gaveUp" }
      : {
          ...common,
          outcome: "answered",
          answer: {
            ...(answer.han === undefined ? {} : { han: answer.han }),
            ...(answer.fu === undefined ? {} : { fu: answer.fu }),
            ...(answer.score === undefined ? {} : { score: answer.score }),
            ...(answer.scoreFromKo === undefined
              ? {}
              : { scoreFromKo: answer.scoreFromKo }),
            ...(answer.scoreFromOya === undefined
              ? {}
              : { scoreFromOya: answer.scoreFromOya }),
            yaku,
          },
        },
  );
  return parsed.success ? parsed.data : undefined;
}
