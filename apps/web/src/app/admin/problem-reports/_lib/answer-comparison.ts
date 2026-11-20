/**
 * 報告時の正解と、今の採点で組み立て直した正解を見比べる
 * 正解の比較
 *
 * @description
 * 問題の報告の詳細（管理画面）は「報告時の正解」（`problem_reports.snapshot`）と
 * 「現在の正解」（同じ盤面・同じルール設定で今の採点を通したもの）を並べ、食い違う
 * 項目に印を付ける。直したかどうかは、この 2 つが食い違っているか（採点を直した後に
 * 正解が変わったか）で読む。印を付ける項目の判定だけをここに置き、描画はしない。
 *
 * @design 支払いは構造で、役は並びを無視して比べる
 * 報告時の正解は jsonb に入っており、Postgres の jsonb はオブジェクトのキーの順を
 * 保たない。文字列化（`JSON.stringify`）して比べるとキーの順だけで食い違いが出るので、
 * 値の構造で比べる。役の内訳は表示の順が採点の改修で入れ替わっても正解は同じなので、
 * 「役の名前と翻」の組の集まりとして比べる。
 */
import type { ShownAnswer, ShownScore } from "@/lib/problem-reports/snapshot";

/** 1 つの和了の正解で見比べる項目（表示の順） */
export const SHOWN_SCORE_FIELDS = [
  "han",
  "fu",
  "scoreLevel",
  "payment",
  "yakumanMultiplier",
  "yaku",
] as const;

/** 1 つの和了の正解で見比べる項目（{@link SHOWN_SCORE_FIELDS}） */
export type ShownScoreField = (typeof SHOWN_SCORE_FIELDS)[number];

/**
 * 見比べる正解の片方
 * 比較する正解
 *
 * 報告時の正解（snapshot）と、今組み立て直した正解のどちらも入る。組み立てられ
 * なかったときは理由（今の組み立て直しは保存形式の検証の理由も返すので文字列で持つ）。
 */
export type ComparableAnswer = ShownAnswer | { readonly rebuildError: string };

/** 聴牌形の待ち 1 つの見比べ */
export interface WaitComparison {
  readonly agariHai: number;
  /** その待ちが両方にあるか、片方にしか無いか */
  readonly presence: "both" | "reportedOnly" | "currentOnly";
  /** ツモの食い違う項目（片方にしか無い待ちでは空。待ちごと食い違う） */
  readonly tsumo: readonly ShownScoreField[];
  /** ロンの食い違う項目（片方だけが「役なし」なら全項目） */
  readonly ron: readonly ShownScoreField[];
}

/**
 * 2 つの正解の見比べ
 * 正解比較結果
 *
 * - `incomparable` — どちらかが組み立てられなかった、または問題の種別が違う。
 *   両方が同じ理由で組み立てられなかったときだけ `differs` が false
 * - `agari-score` — 和了形。食い違う項目
 * - `tenpai-score` — 聴牌形。待ちごとの食い違い（報告時の待ちの順、今だけにある待ちは後ろ）
 */
export type AnswerComparison =
  | { readonly kind: "incomparable"; readonly differs: boolean }
  | { readonly kind: "agari-score"; readonly score: readonly ShownScoreField[] }
  | {
      readonly kind: "tenpai-score";
      readonly waits: readonly WaitComparison[];
    };

/** 値を構造で比べる（オブジェクトのキーの順は見ない） */
function sameStructure(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) || Array.isArray(b)) {
    return (
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((value, i) => sameStructure(value, b[i]))
    );
  }
  if (
    typeof a !== "object" ||
    typeof b !== "object" ||
    a === null ||
    b === null
  ) {
    return false;
  }
  const aEntries = Object.entries(a);
  const bMap = new Map(Object.entries(b));
  return (
    aEntries.length === bMap.size &&
    aEntries.every(
      ([key, value]) => bMap.has(key) && sameStructure(value, bMap.get(key)),
    )
  );
}

/** 役の内訳を並びに依らない形にする（「名前 + 翻」の組を並べ替えたもの） */
function yakuKeys(yaku: ShownScore["yaku"]): string[] {
  return yaku
    .map(({ name, han }) => `${name}\u0000${String(han)}`)
    .sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));
}

/** 項目 1 つが同じか */
function sameField(
  field: ShownScoreField,
  a: ShownScore,
  b: ShownScore,
): boolean {
  if (field === "yaku") {
    return sameStructure(yakuKeys(a.yaku), yakuKeys(b.yaku));
  }
  return sameStructure(a[field], b[field]);
}

/**
 * 1 つの和了の正解の食い違う項目
 * 点数の比較
 *
 * `null` は「役なし」（聴牌形のロン）。片方だけが役なしなら全項目が食い違う。
 */
export function differingScoreFields(
  reported: ShownScore | null,
  current: ShownScore | null,
): readonly ShownScoreField[] {
  if (reported === null && current === null) return [];
  if (reported === null || current === null) return SHOWN_SCORE_FIELDS;
  return SHOWN_SCORE_FIELDS.filter(
    (field) => !sameField(field, reported, current),
  );
}

/** 組み立てられなかった理由（組み立てられていれば undefined） */
function rebuildErrorOf(answer: ComparableAnswer): string | undefined {
  return "rebuildError" in answer ? answer.rebuildError : undefined;
}

/**
 * 報告時の正解と今の正解を見比べる
 * 正解比較
 *
 * @param reported - 報告時の正解（`problem_reports.snapshot.answer`）
 * @param current - 同じ盤面・同じルール設定で今組み立て直した正解
 */
export function compareShownAnswers(
  reported: ComparableAnswer,
  current: ComparableAnswer,
): AnswerComparison {
  if ("rebuildError" in reported || "rebuildError" in current) {
    return {
      kind: "incomparable",
      differs: rebuildErrorOf(reported) !== rebuildErrorOf(current),
    };
  }
  if (reported.kind === "agari-score" && current.kind === "agari-score") {
    return {
      kind: "agari-score",
      score: differingScoreFields(reported.score, current.score),
    };
  }
  if (reported.kind === "tenpai-score" && current.kind === "tenpai-score") {
    const currentByHai = new Map(
      current.waits.map((wait) => [wait.agariHai, wait]),
    );
    const reportedHais = new Set(reported.waits.map((wait) => wait.agariHai));
    const waits: WaitComparison[] = reported.waits.map((wait) => {
      const now = currentByHai.get(wait.agariHai);
      if (!now) {
        return {
          agariHai: wait.agariHai,
          presence: "reportedOnly",
          tsumo: [],
          ron: [],
        };
      }
      return {
        agariHai: wait.agariHai,
        presence: "both",
        tsumo: differingScoreFields(wait.tsumo, now.tsumo),
        ron: differingScoreFields(wait.ron, now.ron),
      };
    });
    for (const wait of current.waits) {
      if (!reportedHais.has(wait.agariHai)) {
        waits.push({
          agariHai: wait.agariHai,
          presence: "currentOnly",
          tsumo: [],
          ron: [],
        });
      }
    }
    return { kind: "tenpai-score", waits };
  }
  return { kind: "incomparable", differs: true };
}

/**
 * 見比べた結果に食い違いが 1 つでもあるか
 * 正解の食い違い判定
 */
export function answersDiffer(comparison: AnswerComparison): boolean {
  switch (comparison.kind) {
    case "incomparable":
      return comparison.differs;
    case "agari-score":
      return comparison.score.length > 0;
    case "tenpai-score":
      return comparison.waits.some(
        (wait) =>
          wait.presence !== "both" ||
          wait.tsumo.length > 0 ||
          wait.ron.length > 0,
      );
  }
}
