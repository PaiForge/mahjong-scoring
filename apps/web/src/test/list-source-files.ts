import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * ディレクトリ配下のソース（`.ts` / `.tsx`。テストは除く）を再帰して集める
 * ソース収集
 *
 * import の鎖や辞書の使用箇所をソースの走査で検査するテストが、同じ対象
 * （テストを除いたソース）を引くための唯一の実装。テストは本物の辞書を丸ごと
 * 渡してよいので走査しない。このモジュールはテスト専用。
 *
 * @param dir - 走査するディレクトリの絶対パス
 */
export function listSourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      files.push(...listSourceFiles(path));
    } else if (/\.(ts|tsx)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name)) {
      files.push(path);
    }
  }
  return files;
}
