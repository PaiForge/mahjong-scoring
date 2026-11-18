/**
 * 今日（JST）の本日の問題を読む（無ければ選んで固定する）
 * 本日の問題の選出
 *
 * @description
 * 本日の問題は全員に同じ和了形の点数計算 1 問を 1 日 1 問出す。web の画面と
 * アプリ向け API はここから今日の盤面を受け取り、閲覧者のルール設定で問題に
 * 組み立てる。盤面は `practice_problems` の行で、どの行を出すかは表
 * `daily_problems` に日付ごとに固定する。
 *
 * @design 表に固定し、その日の最初の読み取りで遅延して選ぶ
 * その日の行が無ければ候補から 1 行選び、`INSERT ... ON CONFLICT DO NOTHING` の
 * 後に読み直す。並行した要求が別の行を選んでも、先に入った行に全員が揃う。
 * 採らなかった案:
 * - cron で前もって選ぶ: cron が落ちた日に問題が出ない
 * - 日付から決まる乱数で毎回選ぶ: 保存行の増減で同じ日の問題が変わる
 *
 * 表に固定すれば全員が同じ盤面を見て、既出の除外も引ける。
 *
 * @design 候補は無作為に最大 30 行引き、適格判定を通った最初の 1 行
 * 候補の条件は `kind = 'agari-score'`・`schema_version = 1`・今日（JST）の 0:00 より
 * 前に保存・既出でない行。そこから `ORDER BY random() LIMIT 30` で引き、
 * {@link isDailyProblemEligible} を通った最初の 1 行を選ぶ。通る行が無ければ検査済みの行を除外して最大3回まで引く。
 * それでも見つからなければ「問題なし」（次の読み取りでまた選ぶ）。
 * 候補をすべて検査した場合と検査上限に達した場合は、日付と検査数をログで区別する。
 * - `practice_problems` は、ログイン済みの利用者が検証を通る手作りの盤面を直接
 *   送れる表なので、全行から素通しで選ばない
 * - 当日に保存された行を外すのは、出る直前に狙った盤面を差し込めなくするため
 * - `ORDER BY random()` は全件走査だが、行数が小さい間は問題にならない（既知の
 *   トレードオフ。実測はしていない）
 *
 * @design 選んだ行が後から検証を通らなくなっても選び直さない
 * 採点ロジックの改修で、固定済みの盤面が現行の検証（保存形式の検証と適格判定）を
 * 通らなくなることがある。そのときは `undefined`（問題なし）を返してログに残す。
 * 日の途中で問題を差し替えると、先に解いた人と後の人で問題が変わるため。
 *
 * @design 停止スイッチ（`DAILY_PROBLEM_DISABLED=1`）
 * {@link isDailyProblemDisabled} が真なら DB を読まずに「問題なし」として扱う。
 * 想定外の盤面が選ばれたとき・負荷が問題になったときに、環境変数が実行プロセスへ反映された後にカードを
 * 消せる（ホスティング側で再デプロイが必要な場合がある）。管理画面では理由付きで日単位に非公開にできる。差し替えは持たない。turbo の `build` / `dev` がこの
 * 変数を通す（`turbo.json`）。
 */
import "server-only";

import {
  ARCHIVE_SCHEMA_VERSION,
  parsePracticeProblemArchiveRequest,
  type AgariProblemPayload,
} from "@mahjong-scoring/core";
import { jstDayKey, jstDayStartIso } from "@mahjong-scoring/features/jst";
import { and, eq, lt, notInArray, sql } from "drizzle-orm";

import { dailyProblems, db, practiceProblems } from "../db";
import { logExternalError } from "../log-error";

import { isDailyProblemEligible } from "./eligibility";

/**
 * 今日の問題
 * 本日の問題
 */
export interface DailyProblem {
  /** JST の日付（`YYYY-MM-DD`。`jstDayKey`） */
  readonly day: string;
  /** 和了形の盤面（閲覧者のルール設定で問題に組み立てる） */
  readonly payload: AgariProblemPayload;
}

/** 一度に引く候補の行数 */
const CANDIDATE_LIMIT = 30;

/** 盤面の検証に要る保存行の項目 */
interface StoredProblem {
  readonly withheldReason?: string | null;
  readonly kind: string;
  readonly schemaVersion: number;
  readonly payload: unknown;
}

/**
 * 本日の問題を止めているか
 * 本日の問題停止判定
 *
 * 環境変数 `DAILY_PROBLEM_DISABLED` が `"1"` のときだけ止める（理由はモジュールの説明）。
 */
export function isDailyProblemDisabled(): boolean {
  return process.env.DAILY_PROBLEM_DISABLED === "1";
}

/**
 * 保存行を現行の検証に通し、本日の問題に出せる和了形の盤面にする
 *
 * 保存形式の検証（`parsePracticeProblemArchiveRequest`）で種別と形を確かめてから
 * 適格判定を掛ける。検証が `kind` を絞るので、聴牌形の盤面はここで落ちる。
 */
function dailyProblemPayloadOf(
  row: StoredProblem,
): AgariProblemPayload | undefined {
  if (row.withheldReason) return undefined;
  const parsed = parsePracticeProblemArchiveRequest({
    kind: row.kind,
    schemaVersion: row.schemaVersion,
    payload: row.payload,
  });
  if (parsed.isErr() || parsed.value.kind !== "agari-score") return undefined;
  const { payload } = parsed.value;
  return isDailyProblemEligible(payload) ? payload : undefined;
}

/** その日に固定した問題の保存行（無ければ undefined） */
async function readFixedProblem(
  day: string,
): Promise<StoredProblem | undefined> {
  const [row] = await db
    .select({
      withheldReason: dailyProblems.withheldReason,
      kind: practiceProblems.kind,
      schemaVersion: practiceProblems.schemaVersion,
      payload: practiceProblems.payload,
    })
    .from(dailyProblems)
    .innerJoin(
      practiceProblems,
      eq(dailyProblems.problemId, practiceProblems.id),
    )
    .where(eq(dailyProblems.day, day))
    .limit(1);
  return row;
}

/**
 * 候補から 1 行選んでその日に固定し、固定された行を読み直す
 *
 * 一意制約（日付・問題）のどちらに当たっても入れずに読み直す。日付で当たれば
 * 並行した要求が先に固定した行が返る。問題で当たる（日付の境目に別の日が同じ
 * 行を選んだ）ときは、検査済みの行を除いて限定回数だけ選び直す。
 */
async function chooseProblem(day: string): Promise<StoredProblem | undefined> {
  const examined: string[] = [];
  for (let attempt = 0; attempt < 3; attempt++) {
    const candidates = await db
      .select({
        id: practiceProblems.id,
        kind: practiceProblems.kind,
        schemaVersion: practiceProblems.schemaVersion,
        payload: practiceProblems.payload,
      })
      .from(practiceProblems)
      .where(
        and(
          examined.length === 0
            ? undefined
            : notInArray(practiceProblems.id, examined),
          eq(practiceProblems.kind, "agari-score"),
          eq(practiceProblems.schemaVersion, ARCHIVE_SCHEMA_VERSION),
          lt(practiceProblems.createdAt, new Date(jstDayStartIso(day))),
          sql`${practiceProblems.id} NOT IN (SELECT ${dailyProblems.problemId} FROM ${dailyProblems})`,
        ),
      )
      .orderBy(sql`random()`)
      .limit(CANDIDATE_LIMIT);
    examined.push(...candidates.map((row) => row.id));
    for (const chosen of candidates) {
      if (dailyProblemPayloadOf(chosen) === undefined) continue;
      await db
        .insert(dailyProblems)
        .values({ day, problemId: chosen.id })
        .onConflictDoNothing();
      const fixed = await readFixedProblem(day);
      if (fixed) return fixed;
      // 別の日に同じ問題が固定された場合は、同じ候補群の残りも試す。
    }
    const fixed = await readFixedProblem(day);
    if (fixed) return fixed;
    if (candidates.length < CANDIDATE_LIMIT) {
      logExternalError("getDailyProblem", "出題できる未出題の問題がない", {
        day,
        examined: examined.length,
      });
      return undefined;
    }
  }
  logExternalError(
    "getDailyProblem",
    "候補の検査上限に達したため選出できなかった",
    { day, examined: examined.length },
  );
  return undefined;
}

/**
 * 今日（JST）の問題を読む。無ければ選んで固定する
 * 本日の問題取得
 *
 * 選び方・固定の仕方・停止スイッチはモジュールの説明のとおり。
 *
 * @param now - 今の時刻（JST の日付に直して使う）
 * @returns 今日の問題。停止中・候補なし・固定済みの盤面が検証を通らないときは undefined
 * @throws DB の読み書きに失敗したとき（握り潰さない。呼び出し側が扱う）
 */
export async function getDailyProblem(
  now: Date,
): Promise<DailyProblem | undefined> {
  if (isDailyProblemDisabled()) return undefined;
  const day = jstDayKey(now);
  const stored = (await readFixedProblem(day)) ?? (await chooseProblem(day));
  if (!stored || stored.withheldReason) return undefined;
  const payload = dailyProblemPayloadOf(stored);
  if (!payload) {
    // 盤面はログに出さない。日付から daily_problems の行を引ける
    logExternalError(
      "getDailyProblem",
      "固定済みの本日の問題が現行の検証を通らない",
      day,
    );
    return undefined;
  }
  return { day, payload };
}
