/**
 * 出題した問題の保存形式（保存用 DTO）
 * 問題保存形式
 *
 * 無限訓練型の練習（和了形の点数計算・聴牌形の点数計算）で出した問題を、
 * 盤面だけの構造化 JSON にして保存するための型。保存した盤面は読み戻すときに
 * 現行の採点ロジックで問題に組み立て直す（`rebuild.ts`）。
 *
 * 方針:
 * - **`ScoreQuestion` / `TenpaiScoreQuestion` をそのまま保存しない。** 正解・役・
 *   符の内訳・待ちは盤面から導ける派生値で、採点ロジックを直したらそれに
 *   追随させたい。保存した正解が古い採点のまま残ると、直した後も誤った正解を
 *   出し続ける。代わりに過去に表示した正解の監査はできない（要るなら、正解の
 *   スナップショットと採点の版を別に保存する必要がある）
 * - **MPSZ 文字列も使わない。** 現行の MPSZ パーサー（`parseTehai`）は 1.x の
 *   旧表記を拒否する。表記の改訂で保存済みの行が読めなくなるので、永続形式の
 *   互換をパーサーに任せられない。牌は牌種 ID（0〜33）の数値で持つ
 * - **ルール設定（連風牌4符・切り上げ満貫・役満ルール）は保存しない。** ルールは
 *   端末ローカルの設定で、練習は閲覧者の設定どおりに出題する。読み戻すときは
 *   閲覧者のルールで組み立て直し、そのルールで組み立てられない盤面（役満 3 個分
 *   以上になるなど）はその場で除外する。出題時のルールを保存して同一性に
 *   含める案は採らなかった — 同じ盤面がルールの組み合わせの数（最大 128）に
 *   分かれて別の行になる
 * - 版（`schemaVersion`）は形の版。形を変えたら版を上げ、旧版の読み方を残す
 */

/** 保存する問題の種別。練習の slug と同じ文字列 */
export const ARCHIVE_KINDS = ["agari-score", "tenpai-score"] as const;

/**
 * 保存する問題の種別
 * 問題保存種別
 */
export type ArchiveKind = (typeof ARCHIVE_KINDS)[number];

/** 保存形式の版。形（キー・型）を変えたら上げる */
export const ARCHIVE_SCHEMA_VERSION = 1;

/**
 * 同一性の規約の版（`identity.ts`）
 *
 * 同じ盤面を 1 行にまとめる規則の版。規約を変えると旧行と新行が別の問題として
 * 並ぶため、変えるときは旧行の移行を別に設計する
 */
export const ARCHIVE_IDENTITY_VERSION = 1;

/**
 * 鳴き元（上家・対面・下家）
 * 鳴き元
 *
 * ライブラリの `Tacha`（数値）を保存用の文字列にしたもの。点数に効かず、
 * 同一性にも含めない（`identity.ts`）が、盤面の見た目（横にする牌）なので保存する
 */
export type ArchivedFrom = "kamicha" | "toimen" | "shimocha";

/**
 * 副露・槓 1 つ
 * 保存副露
 *
 * `hais` は牌種 ID（チーは昇順 3 枚、ポンは 3 枚、槓は 4 枚）。
 * - チーは上家からしか鳴けないので `from` を持たず、鳴いた牌（`nakiHai`）を持つ
 * - ポン・槓は同種の牌なので鳴いた牌・加槓牌を持たない（`hais` と同じ牌種）
 * - 暗槓は鳴いていないので `from` を持たない
 */
export type ArchivedMeld =
  | { type: "chi"; hais: number[]; nakiHai: number }
  | { type: "pon"; hais: number[]; from: ArchivedFrom }
  | { type: "daiminkan"; hais: number[]; from: ArchivedFrom }
  | { type: "kakan"; hais: number[]; from: ArchivedFrom }
  | { type: "ankan"; hais: number[] };

/**
 * 手牌（純手牌 + 副露）
 * 保存手牌
 *
 * `closed` は理牌済みの純手牌。`exposed` は鳴いた順の副露・槓
 */
export interface ArchivedHand {
  closed: number[];
  exposed: ArchivedMeld[];
}

/**
 * リーチ
 * 保存リーチ
 *
 * リーチしていれば裏ドラ表示牌を持つ。していなければ null。リーチと
 * 裏ドラ表示牌を 1 つにして「リーチしているのに裏ドラ表示牌が無い」形を作れなくする
 */
export type ArchivedRiichi = { uraDoraMarkers: number[] } | null;

/**
 * 和了形の点数計算の問題の盤面
 * 和了形問題盤面
 */
export interface AgariProblemPayload {
  /** 14 枚相当（槓は 3 枚と数える）。和了牌を純手牌に含む */
  hand: ArchivedHand;
  agariHai: number;
  isTsumo: boolean;
  /** 自風（風牌の牌種 ID） */
  jikaze: number;
  /** 場風（風牌の牌種 ID） */
  bakaze: number;
  /** 表ドラ表示牌（盤面の順） */
  doraMarkers: number[];
  riichi: ArchivedRiichi;
}

/**
 * 聴牌形の点数計算の問題の盤面
 * 聴牌形問題盤面
 *
 * 待ち牌は聴牌形から列挙し直すので持たない
 */
export interface TenpaiProblemPayload {
  /** 13 枚相当（槓は 3 枚と数える） */
  hand: ArchivedHand;
  jikaze: number;
  bakaze: number;
  doraMarkers: number[];
  riichi: ArchivedRiichi;
}

/**
 * 問題を保存する要求（アプリ・web からサーバーへ送る本文）
 * 問題保存要求
 */
export type PracticeProblemArchiveRequest =
  | { kind: "agari-score"; schemaVersion: 1; payload: AgariProblemPayload }
  | { kind: "tenpai-score"; schemaVersion: 1; payload: TenpaiProblemPayload };

/**
 * 盤面から問題を組み立て直せない理由
 * 問題再構築エラー
 *
 * - `invalidPayload`: 牌種 ID・風が範囲外、副露の構造が不正
 * - `invalidHand`: 手牌として成り立たない（枚数・同種 5 枚以上）
 * - `agariHaiNotInHand`: 和了牌が純手牌に無い
 * - `riichiWithFuro`: 門前でない手がリーチしている
 * - `noYaku` / `unsupportedYakuman`: 和了形が採点できない（`buildScoreQuestion`）
 * - それ以外: 聴牌形の点数計算として成り立たない（`buildTenpaiScoreQuestion`）
 */
export type ArchiveRebuildError =
  | "invalidPayload"
  | "invalidHand"
  | "agariHaiNotInHand"
  | "riichiWithFuro"
  | "noYaku"
  | "unsupportedYakuman"
  | "notTenpai"
  | "tooFewWaits"
  | "invalidWait"
  | "karaWait"
  | "noYakuTsumo"
  | "riichiWithNoYakuRon"
  | "fuOutOfOptions";

/**
 * 保存の要求を受け付けない理由
 * 問題保存検証エラー
 *
 * - `malformed`: 形が違う（未知のキー・型・配列の長さ・牌種 ID・風）
 * - `unknownKind`: 種別が {@link ARCHIVE_KINDS} に無い
 * - `unsupportedSchemaVersion`: 版が {@link ARCHIVE_SCHEMA_VERSION} でない
 * - `invalidMeld`: 副露の構造が不正（チーが連番でない、ポンが同種でない等）
 * - `invalidHaiCount`: 手牌の枚数が和了形 14 枚・聴牌形 13 枚相当でない
 * - `invalidDoraMarkerCount` / `invalidUraDoraMarkerCount`: 表示牌が 1 + 槓子数でない
 * - `tooManyCopies`: 手牌・表ドラ・裏ドラの表示牌を通して同種が 5 枚以上
 * - それ以外: 標準ルールで組み立て直せない（{@link ArchiveRebuildError}）
 */
export type ArchiveValidationError =
  | "malformed"
  | "unknownKind"
  | "unsupportedSchemaVersion"
  | "invalidMeld"
  | "invalidHaiCount"
  | "invalidDoraMarkerCount"
  | "invalidUraDoraMarkerCount"
  | "tooManyCopies"
  | ArchiveRebuildError;
