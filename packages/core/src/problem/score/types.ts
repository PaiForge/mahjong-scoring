import type {
  HaiKindId,
  Tehai14,
  Kazehai,
  ScoreResult,
  YakumanRuleConfig,
} from "@pai-forge/riichi-mahjong";
import type { FuDetail } from "../../score/fu-calculator";
import type { RandomSource } from "../../core/random";

/**
 * 役の内訳詳細
 * 役内訳
 */
export interface YakuDetail {
  /** 役名（日本語） */
  readonly name: string;
  /** 翻数 */
  readonly han: number;
}

/**
 * 練習問題
 * 点数計算練習問題
 */
export interface ScoreQuestion {
  /** 手牌（14枚） */
  readonly tehai: Tehai14;
  /** 和了牌 */
  readonly agariHai: HaiKindId;
  /** ツモ和了かどうか */
  readonly isTsumo: boolean;
  /** 自風 */
  readonly jikaze: Kazehai;
  /** 場風 */
  readonly bakaze: Kazehai;
  /** ドラ表示牌 */
  readonly doraMarkers: readonly HaiKindId[];
  /** リーチ有無 */
  readonly isRiichi?: boolean;
  /** 裏ドラ表示牌 */
  readonly uraDoraMarkers?: readonly HaiKindId[];
  /** 正解の点数計算結果 */
  readonly answer: ScoreResult;
  /** 符計算の内訳 */
  readonly fuDetails?: readonly FuDetail[];
  /** 役の内訳 */
  readonly yakuDetails?: readonly YakuDetail[];
}

/**
 * ユーザーの回答
 * ユーザー回答
 */
export interface UserAnswer {
  /** 翻数 */
  readonly han: number;
  /** 符（満貫以上の場合は undefined） */
  readonly fu: number | undefined;
  /** 点数（ロンまたは親ツモの場合） */
  readonly score?: number;
  /** 子のツモ時: 子からの点数 */
  readonly scoreFromKo?: number;
  /** 子のツモ時: 親からの点数 */
  readonly scoreFromOya?: number;
  /** 選択された役 */
  readonly yakus: readonly string[];
}

/**
 * 役ひとつの答え合わせの状態
 * 役別判定状態
 *
 * - `correct`: 選択して正解だった役
 * - `incorrect`: 選択したが成立していない役
 * - `missed`: 成立していたが選ばなかった役
 */
export type YakuSelectionState = "correct" | "incorrect" | "missed";

/**
 * 役ひとつの答え合わせ結果
 * 役別判定
 */
export interface YakuSelectionJudgement {
  /** 役名 */
  readonly name: string;
  /** その役の答え合わせの状態 */
  readonly state: YakuSelectionState;
}

/**
 * 判定結果
 * 回答判定結果
 */
export interface JudgementResult {
  /** 正解かどうか */
  readonly isCorrect: boolean;
  /** 翻が正解かどうか */
  readonly isHanCorrect: boolean;
  /** 符が正解かどうか（満貫以上は常にtrue） */
  readonly isFuCorrect: boolean;
  /** 点数が正解かどうか */
  readonly isScoreCorrect: boolean;
  /** 役が正解かどうか */
  readonly isYakuCorrect: boolean;
}

/**
 * 問題生成オプション
 * 練習問題生成オプション
 */
/**
 * 出題する点数帯（満貫未満 / 満貫以上）
 * 点数帯
 *
 * 点数計算練習と点数表早引きで共通。URL 上の表記は別（"non" / "plus"）で、
 * 変換は web の `practice/_lib/range-params.ts` が担う。
 */
export type ScoreRange = "nonMangan" | "manganPlus";

export interface QuestionGeneratorOptions {
  /** 副露を含めるかどうか */
  readonly includeFuro?: boolean;
  /**
   * 副露している手だけを出題するか（既定 false=門前も出す）
   * 副露縛り
   *
   * `includeFuro` は「副露した手も混ぜるか」で、門前手を除く手段が無い。
   * 鳴いた手だけを扱う出題（教本の副露の章など）はこちらを立てる。
   * 生成器は門前手を作ったら捨てる方式なので、`includeFuro` が false だと
   * どの手も条件を満たさず生成に失敗する。
   */
  readonly requireFuro?: boolean;
  /** 七対子を含めるかどうか */
  readonly includeChiitoi?: boolean;
  /** 出題する点数範囲 */
  readonly allowedRanges?: readonly ScoreRange[];
  /** 親（東家）を含めるかどうか */
  readonly includeParent?: boolean;
  /** 子（散家）を含めるかどうか */
  readonly includeChild?: boolean;
  /** 連風牌の雀頭を4符として扱うか（既定 false=2符） */
  readonly renfonpaiAs4Fu?: boolean;
  /**
   * 場風＝自風の局面を出題しないか（既定 false）
   * 連風牌除外
   *
   * 連風牌の雀頭を2符とするか4符とするかはローカルルールで割れており
   * （`renfonpaiAs4Fu`）、その1点だけで符が、ひいては点数が変わる。答えを
   * 1つに定めたい出題（端末ごとのルール設定に左右されてはならない昇級試験）
   * が立てる。
   *
   * 雀頭が連風牌の手だけを弾く形にはしない。ライブラリは符が最大になる面子
   * 構成を選ぶため、「選ばれた構成の雀頭は連風牌でないが、別の解釈では
   * 連風牌の雀頭が立ち、4符ルールではそちらが選ばれる」手が残りうる。
   * 場風＝自風の局面ごと出題しなければ、どの解釈をとっても連風牌は現れない。
   */
  readonly excludeRenfonpai?: boolean;
  /** 30符4翻・60符3翻を満貫に切り上げるか（切り上げ満貫、既定 false） */
  readonly kiriageMangan?: boolean;
  /**
   * 役満ルール設定（ダブル役満の形・複合役満の合算。既定: すべて無効）
   * 役満ルール
   *
   * ライブラリの `YakumanRuleConfig` をそのまま受ける。アプリの
   * `RuleSettings` からは `toYakumanRuleConfig` で変換して渡すこと
   * （フラグの対応関係をここで再実装しない）。
   */
  readonly yakumanRules?: YakumanRuleConfig;
  /**
   * 役満ルールの採否で正解の点数が割れる手を出題しないか（既定 false）
   * 役満ルール境界除外
   *
   * 四暗刻単騎・大四喜・国士十三面・純正九蓮・複合役満は、ダブル役満系の
   * ルール設定次第で正解が役満（32000等）とダブル役満（64000等）に割れる。
   * `excludeRenfonpai` / `excludeKiriageBoundary` と同じ理由で、答えを1つに
   * 定めたい出題（端末ごとのルール設定に左右されてはならない昇級試験）が
   * 立てる。
   *
   * 形を列挙して弾くのではなく「全ルール有効時に役満2個分以上になる手」を
   * 弾く。全ルール無効時の役満手の支払いは常に役満1つ分なので、これが
   * 「有効・無効で点数が割れる手」と同値であり、将来ルールのフラグが
   * 増えても判定が漏れない。
   */
  readonly excludeYakumanRuleBoundary?: boolean;
  /**
   * 切り上げ満貫で点数が割れる手（30符4翻・60符3翻）を出題しないか（既定 false）
   * 切り上げ満貫境界除外
   *
   * この2つは標準ルールなら満貫未満、切り上げ満貫ルールなら満貫と、採用ルール
   * によって正解の点数が割れる唯一の手。`excludeRenfonpai` が符の割れる局面を
   * 落とすのと同じ理由で、答えを1つに定めたい出題（端末ごとのルール設定に
   * 左右されてはならない昇級試験）が立てる。
   *
   * 点数帯を絞る出題では要らない。満貫未満／満貫以上のどちらかに選択肢を
   * 固定すれば、切り上げた側の点数はそもそも選べないため。境界が露出するのは
   * 選択肢を全点数に開く出題（どんな手でも出す試験）だけ。
   */
  readonly excludeKiriageBoundary?: boolean;
  /**
   * 出題する役（いずれか1つでも成立していれば出題。既定: 絞り込まない）
   * 出題役の絞り込み
   *
   * 値は `yakuDetails.name` と同じ日本語表示名（役選択・判定と同じ語彙）。
   * 複数指定は OR で解釈する。AND にすると同時に成立しない組
   * （平和 + 対々和 等）でプールが即空になるため。
   *
   * 生成器は「ランダムに作って条件に合わなければ捨てる」方式なので、
   * 出現率の低い役を指定するとリトライを使い切って生成に失敗しうる。
   * UI から選ばせる場合は `SCORE_FILTERABLE_YAKU`（filterable-yaku.ts）に絞ること。
   */
  readonly requiredYaku?: readonly string[];
  /**
   * 出題する符（既定: 制約なし）
   * 出題符の絞り込み
   *
   * 符が固定される役だけを出す出題（七対子・平和の昇級試験など）が渡す。
   * `requiredYaku` だけでは足りない — 役の判定（`detectYaku`）と点数計算
   * （`calculateScoreForTehai`）は手牌の解釈を独立に選ぶため、面子の取り方が
   * 複数ある手では両者が食い違いうる。例えば 999m 111p 222p 333p + 単騎 は
   * 「順子3つ + 雀頭（平和・一盃口）」とも「暗刻3つ（単騎待ち）」とも読め、
   * 役には平和が立つのに点数は暗刻側の 50符 で出る。平和を名指しした出題の
   * 約 0.05% がこれに当たり、「平和なのに 20/30符 ではない」問題になる。
   * `allowedFu` は最終的な点数計算の符で弾くので、この食い違いごと落とせる。
   */
  readonly allowedFu?: readonly number[];
  /**
   * 出題する最小翻数（既定: 制約なし）
   * 最小翻数
   *
   * `allowedRanges: ["manganPlus"]` だけでは符由来の満貫（4翻40符等、
   * プールの約 37%）が混ざり、符を計算しないと点数が確定しない問題が出る。
   * `MANGAN_MIN_HAN` を渡すと翻数だけで点数が確定する手に限定でき、
   * 符の知識を前提にしない出題（昇級試験等）が組める。
   */
  readonly minHan?: number;
  /** 乱数供給源。既定: Math.random */
  readonly rng?: RandomSource;
}
