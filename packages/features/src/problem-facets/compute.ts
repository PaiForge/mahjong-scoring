/**
 * 保存問題の属性の計算 — 盤面 1 つから、分類に使う属性の行を作る
 * 問題属性計算
 *
 * @description
 * 保存してある盤面（`practice_problems` の `kind` / `schema_version` / `payload`）を
 * 標準ルールで組み立て直し、表 `practice_problem_facet_sets` の 1 行（問題に共通の
 * 属性と計算の成否）と `practice_problem_facets` の行（和了 1 つで 1 行）にする。
 * DB にも乱数にも触れない。書き込みは web のサーバー（`lib/practice-problems/facets.ts`）。
 *
 * 使うのはサーバーだけだが、純粋な規則なので features に置く。ミューテーション
 * テストの対象（core と features の `use-*.ts` 以外）に入れて検出力を測るため
 * （本日の問題の適格判定 `daily-problem/eligibility.ts` と同じ理由）。
 *
 * 取り出しの意味（どの値をどの列に入れるか・印の比べ方）を変えるコミットは core の
 * `SCORING_VERSION` も上げる。保存済みの行は版ごとに持ち、読む側は自分のコードの版の
 * 行だけを読むので、版を上げれば古い意味の行は読まれなくなる。
 *
 * @design 属性の粒度は「和了 1 つ」= 問題 × 和了牌 × ツモ/ロン
 * 和了形は 1 行、聴牌形は待ち × 2 行（ツモ・ロン）。役・符・待ちの形は同じ和了の
 * 中でだけ組にできる（「三暗刻で 50 符」は、三暗刻の和了と 50 符の和了が別の待ちに
 * あっても成り立たない）ので、待ちやツモ/ロンをまたいで配列にまとめた値は作らない。
 * 聴牌形のロンで役が無い和了は `noYaku` の行として残す（回答では「役なし」が正解で、
 * 未計算や失敗とは別）。
 *
 * @design 属性は標準ルールの値だけを持ち、ルールで変わるかは 3 つの印で示す
 * ルール設定（連風牌の雀頭 4 符・切り上げ満貫・役満ルール）は端末ローカルで、盤面と
 * 一緒には保存していない。ルールの組み合わせ（最大 128 通り）ごとに行を持つ案は
 * 採らず、標準ルールの値に「そのルールを切り替えるとこの和了の正解か属性が変わる」
 * 印を添える。管理・統計の分類は標準ルールの値で行い、印の立つ行は「ルールで変わる」
 * と表示する。閲覧者のルールで出題する用途（将来）は、候補を「条件を満たす行 +
 * 関係する印の立つ行」に広げ、閲覧者のルールで組み立て直してから同じ条件を確かめ直す。
 *
 * チャレンジの方針（`challenge/rule-boundary.ts`。設定で正解が割れる手を出題から
 * 落とす）とは揃えない。分類は記録の土俵ではないので、境界の問題も落とさずに印を
 * 付けて残す。本日の問題の選出にも属性の表は使わない（適格判定は今のまま）。
 *
 * @design 印の比べ方（{@link computeProblemFacets} が実装する）
 * - 比べるのは点数だけでなく、その和了の全項目（翻・符・区分・支払い・役と翻・ドラ・
 *   待ちの形）と、組み立ての成否。符は切り上げ後の値で比べるので、連風牌の雀頭を
 *   持っていても 36 符と 38 符のようにどちらも 40 符になる手には印が立たない
 *   （行の値がどのルールでも同じなら、行の値で決まる分類も変わらない。解説に出る
 *   符の内訳だけが変わる）
 * - 連風牌と切り上げ満貫は 4 通り（連風牌 2 符 / 4 符 × 切り上げ無 / 有）を組み立て、
 *   **もう一方を固定した組どうし**で比べる。連風牌の印は「切り上げ無しで 2 符 / 4 符」
 *   「切り上げ有りで 2 符 / 4 符」のどちらかで違えば立つ。切り上げ満貫の印も同じ。
 *   標準ルールとの比較だけにすると、連風牌 4 符のときにだけ切り上げが効く手
 *   （標準では 3 翻 50 符、連風牌 4 符で 3 翻 60 符になる手）を落とす
 * - 役満ルールは全無効と全有効を比べる。今の役満ルールは「個別の役満を倍にする・
 *   複合を合算する」だけなので、全有効で変わらなければどの組み合わせでも変わらない。
 *   この性質は今の 5 つのフラグに限った話（core の `RuleSettings` の TSDoc）
 *
 * @design この属性では表せないもの
 * - 盤面に無い状況（一発・ダブル立直・海底など）: 出題していない。保存形式を広げないと持てない
 * - 採用されなかった解釈で成立する役: 持たない。`yaku` は採点に採用された解釈の役だけ
 * - 利用者の側の性質（苦手・解答時間）: 問題の属性ではない
 * - 人が付けるラベル: 必要になったときにタグの表を足す
 */
import {
  DEFAULT_RULE_SETTINGS,
  extractScoreFacts,
  parsePracticeProblemArchiveRequest,
  rebuildAgariQuestion,
  rebuildTenpaiQuestion,
  type HaiKindId,
  type Kazehai,
  type MachiType,
  type PracticeProblemArchiveRequest,
  type RuleSettings,
  type ScoreFacts,
  type ScoreQuestion,
  type ScoreYakuId,
} from "@mahjong-scoring/core";
import { ARCHIVE_REBUILD_ERRORS } from "@mahjong-scoring/core/problem/archive/types";

import { ruleConfigOfSettings } from "../daily-problem/question";

import type { ProblemFacetError } from "./errors";

/**
 * 問題に共通の属性と計算の成否（`practice_problem_facet_sets` の 1 行）
 * 問題属性セット
 *
 * `failed` は標準ルールで組み立てられない盤面（保存後に採点が変わった・保存形式として
 * 読めない）。行が無い「未計算」とは別の状態として残す。
 */
export type ProblemFacetSet =
  | {
      readonly status: "ok";
      readonly isOya: boolean;
      readonly isMenzen: boolean;
      readonly isRiichi: boolean;
      readonly kanCount: number;
      readonly jikaze: Kazehai;
      readonly bakaze: Kazehai;
      /** 待ちの数。聴牌形だけが持つ（和了形は null） */
      readonly waitCount: number | null;
    }
  | { readonly status: "failed"; readonly error: ProblemFacetError };

/**
 * 採点できた和了 1 つの属性
 * 和了属性（採点済み）
 */
export interface ScoredFacetRow {
  readonly agariHai: HaiKindId;
  readonly isTsumo: boolean;
  readonly result: "scored";
  readonly han: number;
  readonly fu: number;
  readonly scoreLevel: string;
  readonly yakumanMultiplier: number;
  /** 和了者の収入の合計（ロンは支払い、親ツモは 3 人分、子ツモは子 2 人分 + 親） */
  readonly points: number;
  /** 内訳に出る役 ID（採点に採用された解釈の役。ドラ・裏ドラを含まない） */
  readonly yaku: readonly ScoreYakuId[];
  readonly doraHan: number;
  readonly uraDoraHan: number;
  /** 採用された解釈の待ちの形。七対子・国士無双は null */
  readonly machi: MachiType | null;
  /** 連風牌の雀頭の符（2 / 4）を切り替えると、この和了の正解か属性が変わる */
  readonly variesByRenfonpai: boolean;
  /** 切り上げ満貫の有無を切り替えると、この和了の正解か属性が変わる */
  readonly variesByKiriage: boolean;
  /** 役満ルール（ダブル役満・複合）を切り替えると、この和了の正解か属性が変わる */
  readonly variesByYakumanRules: boolean;
}

/**
 * 役が無くロンできない和了（聴牌形のロンだけ）
 * 和了属性（役なし）
 */
export interface NoYakuFacetRow {
  readonly agariHai: HaiKindId;
  readonly isTsumo: false;
  readonly result: "noYaku";
}

/**
 * 和了 1 つの属性（`practice_problem_facets` の 1 行）
 * 和了属性
 */
export type ProblemFacetRow = ScoredFacetRow | NoYakuFacetRow;

/**
 * 盤面 1 つぶんの属性（親 1 行と、和了ごとの子の行）
 * 問題属性
 *
 * `set.status` が `failed` のとき `rows` は空。
 */
export interface ProblemFacets {
  readonly set: ProblemFacetSet;
  readonly rows: readonly ProblemFacetRow[];
}

/**
 * 属性を計算する盤面（`practice_problems` の行のうち計算に使う列）
 * 属性計算入力
 *
 * DB から読んだままの値を受けるので、種別・版・盤面の形はこの関数が検証する。
 */
export interface ProblemFacetInput {
  readonly kind: string;
  readonly schemaVersion: number;
  readonly payload: unknown;
}

/** 和了 1 つの組み立て結果。役が無くロンできない和了は `noYaku` */
interface AgariEntry {
  readonly agariHai: HaiKindId;
  readonly isTsumo: boolean;
  readonly facts: ScoreFacts | "noYaku";
}

/** あるルールで盤面を組み立てた結果 */
type RuleOutcome =
  | {
      readonly ok: true;
      readonly entries: readonly AgariEntry[];
      readonly waitCount: number | null;
    }
  | { readonly ok: false; readonly error: ProblemFacetError };

function isRebuildError(value: string): value is ProblemFacetError {
  return ARCHIVE_REBUILD_ERRORS.some((error) => error === value);
}

function ruleSettings(
  renfonpaiAs4Fu: boolean,
  kiriageMangan: boolean,
): RuleSettings {
  return { ...DEFAULT_RULE_SETTINGS, renfonpaiAs4Fu, kiriageMangan };
}

/** 役満ルールをすべて有効にした設定（連風牌・切り上げ満貫は標準のまま） */
const ALL_YAKUMAN_RULES_SETTINGS: RuleSettings = {
  ...DEFAULT_RULE_SETTINGS,
  suuankouTankiDouble: true,
  daisuushiiDouble: true,
  kokushiJuusanmenDouble: true,
  junseiChuurenDouble: true,
  fukugouYakuman: true,
};

/**
 * 和了者の収入の合計
 *
 * ロンは放銃者の支払い、親ツモは子 3 人が同額、子ツモは子 2 人 + 親。
 */
function totalPointsOf(payment: ScoreFacts["answer"]["payment"]): number {
  switch (payment.type) {
    case "ron":
      return payment.amount;
    case "oyaTsumo":
      return payment.amount * 3;
    case "koTsumo":
      return payment.amount[0] * 2 + payment.amount[1];
  }
}

/** 組み立てた問題 1 つを和了の結果にする。役 ID に写せなければ undefined */
function entryOfQuestion(question: ScoreQuestion): AgariEntry | undefined {
  const facts = extractScoreFacts(question);
  if (!facts) return undefined;
  return { agariHai: question.agariHai, isTsumo: question.isTsumo, facts };
}

/** 盤面を 1 つのルールで組み立て、和了ごとの結果にする */
function buildOutcome(
  request: PracticeProblemArchiveRequest,
  settings: RuleSettings,
): RuleOutcome {
  const ruleConfig = ruleConfigOfSettings(settings);
  if (request.kind === "agari-score") {
    const rebuilt = rebuildAgariQuestion(request.payload, ruleConfig);
    if (rebuilt.isErr()) return { ok: false, error: rebuilt.error };
    const entry = entryOfQuestion(rebuilt.value);
    if (!entry) return { ok: false, error: "unmappedYaku" };
    return { ok: true, entries: [entry], waitCount: null };
  }
  const rebuilt = rebuildTenpaiQuestion(request.payload, ruleConfig);
  if (rebuilt.isErr()) return { ok: false, error: rebuilt.error };
  const entries: AgariEntry[] = [];
  for (const wait of rebuilt.value.waits) {
    const tsumo = entryOfQuestion(wait.tsumo);
    if (!tsumo) return { ok: false, error: "unmappedYaku" };
    entries.push(tsumo);
    if (wait.ron === undefined) {
      entries.push({
        agariHai: wait.agariHai,
        isTsumo: false,
        facts: "noYaku",
      });
      continue;
    }
    const ron = entryOfQuestion(wait.ron);
    if (!ron) return { ok: false, error: "unmappedYaku" };
    entries.push(ron);
  }
  return { ok: true, entries, waitCount: rebuilt.value.waits.length };
}

/**
 * あるルールでの、和了 1 つの「見え方」を比べられる文字列にする
 *
 * 組み立てに失敗したルールでは理由を、成功したルールではその和了の正解と属性の全体を
 * 返す。正解と属性（`ScoreFacts`）は数値・文字列・配列・素のオブジェクトだけで、同じ
 * 取り出しの経路が同じキーの順で作るので JSON の文字列で比べる（`eligibility.ts` の
 * `isSameAnswer` と同じ考え方）。
 */
function signatureOf(
  outcome: RuleOutcome,
  agariHai: HaiKindId,
  isTsumo: boolean,
): string {
  if (!outcome.ok) return `failed:${outcome.error}`;
  const entry = outcome.entries.find(
    (candidate) =>
      candidate.agariHai === agariHai && candidate.isTsumo === isTsumo,
  );
  if (!entry) return "absent";
  return JSON.stringify(entry.facts);
}

/**
 * 保存してある盤面 1 つから、属性の行を計算する
 * 問題属性計算
 *
 * @description
 * 1. 保存形式として読めるか・標準ルールで組み立てられるかを確かめる
 *    （`parsePracticeProblemArchiveRequest`。保存の入口と同じ検証）。読めない盤面は
 *    `invalidPayload`、組み立てられない盤面はその理由で `failed` にする
 * 2. 標準ルールで組み立て、和了ごとに正解と属性を取り出す（和了形は core の
 *    `extractScoreFacts` を 1 回、聴牌形は待ち × ツモ/ロンのそれぞれに）
 * 3. 連風牌 × 切り上げ満貫の残り 3 通りと、役満ルール全有効で組み立て直し、
 *    和了ごとに 3 つの印を付ける（比べ方はこのモジュールの説明）
 *
 * 乱数は使わず、同じ盤面には常に同じ結果を返す（採点ロジックが変われば結果も
 * 変わりうる。その変更は `SCORING_VERSION` を上げて別の版の行にする）。
 *
 * @param input - `practice_problems` の行の `kind` / `schemaVersion` / `payload`
 * @returns 親 1 行と子の行。組み立てられない盤面は `failed` の親だけ
 */
export function computeProblemFacets(input: ProblemFacetInput): ProblemFacets {
  const parsed = parsePracticeProblemArchiveRequest({
    kind: input.kind,
    schemaVersion: input.schemaVersion,
    payload: input.payload,
  });
  if (parsed.isErr()) {
    const error = isRebuildError(parsed.error)
      ? parsed.error
      : "invalidPayload";
    return { set: { status: "failed", error }, rows: [] };
  }
  const request = parsed.value;

  const standard = buildOutcome(request, ruleSettings(false, false));
  if (!standard.ok) {
    return { set: { status: "failed", error: standard.error }, rows: [] };
  }
  const first = standard.entries.find((entry) => entry.facts !== "noYaku");
  if (first === undefined || first.facts === "noYaku") {
    // 聴牌形は待ちごとにツモの和了を必ず持つので、ここに来るのは待ちが 0 個のとき
    return { set: { status: "failed", error: "tooFewWaits" }, rows: [] };
  }

  const renfonpai = buildOutcome(request, ruleSettings(true, false));
  const kiriage = buildOutcome(request, ruleSettings(false, true));
  const both = buildOutcome(request, ruleSettings(true, true));
  const allYakuman = buildOutcome(request, ALL_YAKUMAN_RULES_SETTINGS);

  const rows = standard.entries.map((entry): ProblemFacetRow => {
    const { agariHai, isTsumo, facts } = entry;
    if (facts === "noYaku") {
      return { agariHai, isTsumo: false, result: "noYaku" };
    }
    const signature = (outcome: RuleOutcome) =>
      signatureOf(outcome, agariHai, isTsumo);
    const base = signature(standard);
    const { answer } = facts;
    return {
      agariHai,
      isTsumo,
      result: "scored",
      han: answer.han,
      fu: answer.fu,
      scoreLevel: answer.scoreLevel,
      yakumanMultiplier: answer.yakumanMultiplier,
      points: totalPointsOf(answer.payment),
      yaku: answer.yaku.map(({ id }) => id),
      doraHan: answer.doraHan,
      uraDoraHan: answer.uraDoraHan,
      machi: facts.facets.machi,
      variesByRenfonpai:
        base !== signature(renfonpai) || signature(kiriage) !== signature(both),
      variesByKiriage:
        base !== signature(kiriage) || signature(renfonpai) !== signature(both),
      variesByYakumanRules: base !== signature(allYakuman),
    };
  });

  const { facets } = first.facts;
  return {
    set: {
      status: "ok",
      isOya: facets.isOya,
      isMenzen: facets.isMenzen,
      isRiichi: facets.isRiichi,
      kanCount: facets.kanCount,
      jikaze: facets.jikaze,
      bakaze: facets.bakaze,
      waitCount: standard.waitCount,
    },
    rows,
  };
}
