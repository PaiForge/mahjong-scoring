/**
 * 問題を保存する要求の検証
 * 問題保存検証
 *
 * サーバーが受け付けるのは「標準ルール（全ルール無効）で採点でき、出題設定に
 * 依らない生成器の不変条件を満たす」盤面だけ。
 *
 * - 出題設定（点数帯・最小翻・役や符の指定・親子・副露の有無・ルール境界の
 *   除外）に依る条件は課さない。出題設定は保存しないので、どの設定で出した
 *   問題かをサーバーは知らず、検証できない
 * - 何も課さないと、1 面待ちの聴牌形や役なしの和了形など、盤面として想定しない
 *   問題が入る。そこで生成器が設定に関わらず守る条件（聴牌形なら待ち 2 つ以上・
 *   純カラなし・役なしロン + リーチなし、和了形なら役がある、表示牌は
 *   1 + 槓子数、同種 4 枚以下、リーチは門前だけ、符は回答の選択肢にある）を課す
 * - 検証は標準ルールで行う。どのルールで生成した問題も標準ルールで同じ条件を
 *   満たす想定で、性質テスト（全ルール無効・全ルール有効で生成した問題が通る）で
 *   確かめている。標準ルールで落ちる生成例が見つかっても検証を緩めず、
 *   生成器か検証のどちらが正しいかを決め直す
 *
 * 検証は安い順に進め、早い段で落とす: 1. 形 → 2. 手牌 → 3. 表示牌とリーチ →
 * 4. 和了形 / 5. 聴牌形の採点（ここだけ採点ロジックを動かす）。
 */
import { err, ok, type Result } from "neverthrow";
import {
  isKazehai,
  type CompletedMentsu,
  type HaiKindId,
  type RuleConfig,
  type Tehai,
} from "@pai-forge/riichi-mahjong";
import { listTehaiHais } from "../../core/hai-count";
import { isHaiKindId } from "../../core/type-guards";
import { countKantsu } from "../shared/count-kantsu";
import { finalizeTehai13, finalizeTehai14 } from "../shared/hand-skeleton";
import { fromArchivedMeld, toHaiKindIds } from "./melds";
import { rebuildAgariQuestion, rebuildTenpaiQuestion } from "./rebuild";
import {
  ARCHIVE_KINDS,
  ARCHIVE_SCHEMA_VERSION,
  type AgariProblemPayload,
  type ArchiveKind,
  type ArchiveValidationError,
  type ArchivedFrom,
  type ArchivedHand,
  type ArchivedMeld,
  type ArchivedRiichi,
  type PracticeProblemArchiveRequest,
  type TenpaiProblemPayload,
} from "./types";

/** 検証に使う標準ルール（連風牌の雀頭 2 符・切り上げ満貫なし・役満ルールすべて無効） */
const STANDARD_RULE_CONFIG: RuleConfig = {
  doubleWindJantouFu: 2,
  kiriageMangan: false,
};

/** 純手牌の枚数の上限（和了形 14 枚） */
const MAX_CLOSED = 14;
/** 副露・槓の数の上限 */
const MAX_EXPOSED = 4;
/** 副露・槓 1 つの牌の数の上限（槓 4 枚） */
const MAX_MELD_HAIS = 4;
/** 表ドラ・裏ドラの表示牌の上限（1 + 槓子 4 つ） */
const MAX_MARKERS = 5;
/** 同種の牌の枚数 */
const COPIES_PER_KIND = 4;

/** 和了形・聴牌形の手牌の枚数（槓は 3 枚と数える） */
const HAI_COUNT: Readonly<Record<ArchiveKind, number>> = {
  "agari-score": 14,
  "tenpai-score": 13,
};

const ARCHIVED_FROMS: readonly ArchivedFrom[] = [
  "kamicha",
  "toimen",
  "shimocha",
];

type UnknownRecord = Readonly<Record<string, unknown>>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUnknownArray(value: unknown): value is readonly unknown[] {
  return Array.isArray(value);
}

/** キーがちょうど `keys` だけか（欠けも余りも認めない） */
function hasExactKeys(record: UnknownRecord, keys: readonly string[]): boolean {
  const actual = Object.keys(record);
  return actual.length === keys.length && keys.every((key) => key in record);
}

function isArchiveKind(value: unknown): value is ArchiveKind {
  return ARCHIVE_KINDS.some((kind) => kind === value);
}

function parseHai(value: unknown): HaiKindId | undefined {
  return typeof value === "number" && isHaiKindId(value) ? value : undefined;
}

function parseKaze(value: unknown): number | undefined {
  const hai = parseHai(value);
  return hai !== undefined && isKazehai(hai) ? hai : undefined;
}

/** 牌種 ID の配列（長さ `max` 以下） */
function parseHais(value: unknown, max: number): number[] | undefined {
  if (!isUnknownArray(value) || value.length > max) return undefined;
  const hais: number[] = [];
  for (const element of value) {
    const hai = parseHai(element);
    if (hai === undefined) return undefined;
    hais.push(hai);
  }
  return hais;
}

function parseFrom(value: unknown): ArchivedFrom | undefined {
  return ARCHIVED_FROMS.find((from) => from === value);
}

/** 1. 副露・槓 1 つの形（構造は 2. で見る） */
function parseMeld(value: unknown): ArchivedMeld | undefined {
  if (!isRecord(value)) return undefined;
  const hais = parseHais(value.hais, MAX_MELD_HAIS);
  if (!hais) return undefined;
  switch (value.type) {
    case "chi": {
      const nakiHai = parseHai(value.nakiHai);
      if (!hasExactKeys(value, ["type", "hais", "nakiHai"])) return undefined;
      return nakiHai === undefined ? undefined : { type: "chi", hais, nakiHai };
    }
    case "pon":
    case "daiminkan":
    case "kakan": {
      const from = parseFrom(value.from);
      if (!hasExactKeys(value, ["type", "hais", "from"])) return undefined;
      return from === undefined ? undefined : { type: value.type, hais, from };
    }
    case "ankan":
      return hasExactKeys(value, ["type", "hais"])
        ? { type: "ankan", hais }
        : undefined;
    default:
      return undefined;
  }
}

/** 1. 手牌の形 */
function parseHand(value: unknown): ArchivedHand | undefined {
  if (!isRecord(value) || !hasExactKeys(value, ["closed", "exposed"])) {
    return undefined;
  }
  const closed = parseHais(value.closed, MAX_CLOSED);
  const { exposed } = value;
  if (!closed || !isUnknownArray(exposed) || exposed.length > MAX_EXPOSED) {
    return undefined;
  }
  const melds: ArchivedMeld[] = [];
  for (const element of exposed) {
    const meld = parseMeld(element);
    if (!meld) return undefined;
    melds.push(meld);
  }
  return { closed, exposed: melds };
}

/** 1. リーチの形。`undefined` は形の誤り、`null` はリーチなし */
function parseRiichi(value: unknown): ArchivedRiichi | undefined {
  if (value === null) return null;
  if (!isRecord(value) || !hasExactKeys(value, ["uraDoraMarkers"])) {
    return undefined;
  }
  const uraDoraMarkers = parseHais(value.uraDoraMarkers, MAX_MARKERS);
  return uraDoraMarkers ? { uraDoraMarkers } : undefined;
}

/** 1. 和了形・聴牌形に共通する盤面の形 */
function parseScene(value: UnknownRecord): TenpaiProblemPayload | undefined {
  const hand = parseHand(value.hand);
  const jikaze = parseKaze(value.jikaze);
  const bakaze = parseKaze(value.bakaze);
  const doraMarkers = parseHais(value.doraMarkers, MAX_MARKERS);
  const riichi = parseRiichi(value.riichi);
  if (
    !hand ||
    jikaze === undefined ||
    bakaze === undefined ||
    !doraMarkers ||
    riichi === undefined
  ) {
    return undefined;
  }
  return { hand, jikaze, bakaze, doraMarkers, riichi };
}

const TENPAI_PAYLOAD_KEYS = [
  "hand",
  "jikaze",
  "bakaze",
  "doraMarkers",
  "riichi",
] as const;
const AGARI_PAYLOAD_KEYS = [
  ...TENPAI_PAYLOAD_KEYS,
  "agariHai",
  "isTsumo",
] as const;

function parseAgariPayload(value: unknown): AgariProblemPayload | undefined {
  if (!isRecord(value) || !hasExactKeys(value, AGARI_PAYLOAD_KEYS)) {
    return undefined;
  }
  const scene = parseScene(value);
  const agariHai = parseHai(value.agariHai);
  const { isTsumo } = value;
  if (!scene || agariHai === undefined || typeof isTsumo !== "boolean") {
    return undefined;
  }
  return { ...scene, agariHai, isTsumo };
}

function parseTenpaiPayload(value: unknown): TenpaiProblemPayload | undefined {
  if (!isRecord(value) || !hasExactKeys(value, TENPAI_PAYLOAD_KEYS)) {
    return undefined;
  }
  return parseScene(value);
}

/**
 * 2・3. 手牌・表示牌・リーチの整合を見て、純手牌を理牌した盤面を返す
 * 盤面整合検証
 */
function checkScene<P extends TenpaiProblemPayload>(
  kind: ArchiveKind,
  payload: P,
): Result<P, ArchiveValidationError> {
  // 2. 手牌
  const exposed: CompletedMentsu[] = [];
  for (const meld of payload.hand.exposed) {
    const mentsu = fromArchivedMeld(meld);
    if (!mentsu) return err("invalidMeld");
    exposed.push(mentsu);
  }
  const { closed } = payload.hand;
  if (closed.length + 3 * exposed.length !== HAI_COUNT[kind]) {
    return err("invalidHaiCount");
  }
  const closedIds = toHaiKindIds(closed);
  if (!closedIds) return err("malformed");
  const tehai: Tehai | undefined =
    kind === "agari-score"
      ? finalizeTehai14(closedIds, exposed)
      : finalizeTehai13(closedIds, exposed);
  if (!tehai) return err("invalidHand");

  // 3. 表示牌とリーチ
  const markerCount = 1 + countKantsu(tehai);
  if (payload.doraMarkers.length !== markerCount) {
    return err("invalidDoraMarkerCount");
  }
  const uraDoraMarkers = payload.riichi?.uraDoraMarkers ?? [];
  if (payload.riichi && uraDoraMarkers.length !== markerCount) {
    return err("invalidUraDoraMarkerCount");
  }
  const visible = [
    ...listTehaiHais(tehai),
    ...payload.doraMarkers,
    ...uraDoraMarkers,
  ];
  const overflows = visible.some(
    (hai) => visible.filter((other) => other === hai).length > COPIES_PER_KIND,
  );
  if (overflows) return err("tooManyCopies");
  if (payload.riichi && payload.hand.exposed.some((m) => m.type !== "ankan")) {
    return err("riichiWithFuro");
  }

  return ok({
    ...payload,
    hand: { closed: [...tehai.closed], exposed: payload.hand.exposed },
  });
}

/** 4. 和了形を標準ルールで採点できるか */
function checkAgari(
  payload: AgariProblemPayload,
): Result<AgariProblemPayload, ArchiveValidationError> {
  if (!payload.hand.closed.includes(payload.agariHai)) {
    return err("agariHaiNotInHand");
  }
  // 符が回答の選択肢にあるかは再構築が見る（`fuOutOfOptions`）
  const rebuilt = rebuildAgariQuestion(payload, STANDARD_RULE_CONFIG);
  return rebuilt.isErr() ? err(rebuilt.error) : ok(payload);
}

/** 5. 聴牌形を標準ルールで組み立てられるか（条件は生成器と同じ） */
function checkTenpai(
  payload: TenpaiProblemPayload,
): Result<TenpaiProblemPayload, ArchiveValidationError> {
  const rebuilt = rebuildTenpaiQuestion(payload, STANDARD_RULE_CONFIG);
  return rebuilt.isErr() ? err(rebuilt.error) : ok(payload);
}

/**
 * 未知の入力を検証して問題を保存する要求にする
 * 問題保存要求検証
 *
 * 形・版・牌の整合・生成器の不変条件（標準ルール）まで見る（条件と理由は
 * このモジュールの頭の説明）。純手牌の並びが理牌の順でなければ拒まずに
 * 並べ直して返す。返した要求の盤面は {@link rebuildAgariQuestion} /
 * {@link rebuildTenpaiQuestion} に標準ルールで渡せば必ず組み立てられる。
 */
export function parsePracticeProblemArchiveRequest(
  input: unknown,
): Result<PracticeProblemArchiveRequest, ArchiveValidationError> {
  // 1. 形
  if (
    !isRecord(input) ||
    !hasExactKeys(input, ["kind", "schemaVersion", "payload"])
  ) {
    return err("malformed");
  }
  const { kind, schemaVersion } = input;
  if (!isArchiveKind(kind)) return err("unknownKind");
  if (schemaVersion !== ARCHIVE_SCHEMA_VERSION) {
    return err("unsupportedSchemaVersion");
  }

  if (kind === "agari-score") {
    const payload = parseAgariPayload(input.payload);
    if (!payload) return err("malformed");
    return checkScene(kind, payload)
      .andThen(checkAgari)
      .map((checked) => ({ kind, schemaVersion, payload: checked }));
  }
  const payload = parseTenpaiPayload(input.payload);
  if (!payload) return err("malformed");
  return checkScene(kind, payload)
    .andThen(checkTenpai)
    .map((checked) => ({ kind, schemaVersion, payload: checked }));
}
