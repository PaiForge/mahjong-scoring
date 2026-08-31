import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { expect } from "vitest";

const EXAM_ROOT = join(__dirname, "..", "..");
const RULE_SETTINGS_STORE = "use-rule-settings-store";

/**
 * 試験盤面がルール設定ストアを読んでいないことを検査する
 * ルール設定非依存検査
 *
 * 試験の公平性は「出題も選択肢も端末ローカルのルール設定（連風牌4符・
 * 切り上げ満貫）に依存しない」ことで成立する。`leaderboardKey` を分けずに
 * 全受験者のベストスコアを同じ土俵で比較するため、設定を変えた端末で有利にも
 * 不利にもなってはならない。この不変条件はコードの読みでは守りきれない
 * （点数計算ドリルの盤面を雛形にコピーすると `use-rule-settings-store` の
 * import ごと持ち込みやすい）ので、構造で守る。
 *
 * 検査するのは指定された級の `_components` と、盤面の実体がある共通レイヤ
 * （`exam/_components` と `exam/_lib`）。import を辿るのではなく文字列の
 * 出現で判定するため、間接的に読んでいる依存までは追わない — 狙いは
 * コピー由来の混入を落とすことにある。
 *
 * @param examKindDir - 級のディレクトリ名（例: `"mangan"`）
 */
export function expectRuleSettingsIndependence(examKindDir: string): void {
  const dirs = [
    join(EXAM_ROOT, examKindDir, "_components"),
    join(EXAM_ROOT, "_components"),
    join(EXAM_ROOT, "_lib"),
  ];

  for (const dir of dirs) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isFile()) continue;
      const source = readFileSync(join(dir, entry.name), "utf8");
      expect(
        source.includes(RULE_SETTINGS_STORE),
        `${entry.name} がルール設定ストアを import している`,
      ).toBe(false);
    }
  }
}
