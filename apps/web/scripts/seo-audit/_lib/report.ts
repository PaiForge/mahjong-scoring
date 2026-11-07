/**
 * 監査の結果の集計と出力
 *
 * 各検査は「名前・合否・件数・失敗の明細」を 1 件として積み、最後に
 * まとめて出す。1 件でも失敗があれば終了コード 1。成果物が無い・読めない
 * 検査は skip ではなく失敗として積む（ゲートで「見なかった」を合格にしない）。
 */
import { writeFileSync } from "node:fs";

/** 検査 1 件の結果 */
export interface CheckResult {
  readonly name: string;
  readonly ok: boolean;
  /** 合格・不合格に関わらず出す要約（件数等） */
  readonly summary: string;
  /** 失敗の明細（1 行 1 件） */
  readonly failures: readonly string[];
  /** 失敗にはしないが報告する事項 */
  readonly notes: readonly string[];
}

/** 検査結果を積むもの */
export interface Report {
  /** 失敗の一覧から結果を積む（空なら合格） */
  readonly check: (
    name: string,
    summary: string,
    failures: readonly string[],
    notes?: readonly string[],
  ) => void;
  readonly results: () => readonly CheckResult[];
}

/** 空の {@link Report} を作る */
export function createReport(): Report {
  const results: CheckResult[] = [];
  return {
    check: (name, summary, failures, notes = []) => {
      results.push({
        name,
        ok: failures.length === 0,
        summary,
        failures,
        notes,
      });
    },
    results: () => results,
  };
}

/**
 * 結果の全件を JSON で書き出す（標準出力は明細を {@link MAX_LINES} 件で切るため）
 *
 * @param path - 書き出し先
 * @param report - 結果
 */
export function writeReportJson(path: string, report: Report): void {
  writeFileSync(path, `${JSON.stringify(report.results(), null, 2)}\n`);
}

/** 明細を出す上限（多すぎると要約が読めない。件数は summary に出る） */
const MAX_LINES = 40;

/**
 * 結果を標準出力に書き、全体の合否を返す
 *
 * @param title - 監査の名前
 * @param report - 結果
 * @returns すべて合格なら true
 */
export function printReport(title: string, report: Report): boolean {
  const results = report.results();
  const failed = results.filter((result) => !result.ok);
  console.log(`# ${title}`);
  for (const result of results) {
    console.log(
      `${result.ok ? "PASS" : "FAIL"} ${result.name} — ${result.summary}`,
    );
    for (const line of result.failures.slice(0, MAX_LINES)) {
      console.log(`  - ${line}`);
    }
    if (result.failures.length > MAX_LINES) {
      console.log(`  - … ほか ${result.failures.length - MAX_LINES} 件`);
    }
    for (const line of result.notes.slice(0, MAX_LINES)) {
      console.log(`  * ${line}`);
    }
    if (result.notes.length > MAX_LINES) {
      console.log(`  * … ほか ${result.notes.length - MAX_LINES} 件`);
    }
  }
  console.log(
    `\n${failed.length === 0 ? "OK" : "NG"}: ${results.length - failed.length}/${results.length} 件合格`,
  );
  return failed.length === 0;
}

/**
 * `--name value` 形式の引数を読む
 *
 * @param argv - `process.argv.slice(2)`
 * @param name - 引数名（`--` を除く）
 * @returns 値。無ければ undefined
 */
export function readArg(
  argv: readonly string[],
  name: string,
): string | undefined {
  const index = argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  return argv[index + 1];
}

/** 2 つの集合の差（`a` にあって `b` に無いもの。整列済み） */
export function difference(
  a: Iterable<string>,
  b: ReadonlySet<string>,
): string[] {
  return [...new Set(a)].filter((value) => !b.has(value)).sort();
}
