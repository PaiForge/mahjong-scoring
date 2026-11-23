/**
 * TOML の `[section]` 直下（`[section.sub]` ではない）にある `key` の値を読む
 * TOMLキー読み取り
 *
 * `supabase/config.toml` と、それを写したコードの食い違いを落とすテストが使う。
 * 要るのは数個の整数と文字列だけで、依存に TOML パーサーが無いため、セクションを
 * 見分ける走査で済ませる。値は右辺をそのまま返す（文字列なら引用符ごと）。
 * このモジュールはテスト専用。
 *
 * @param toml - TOML の全文
 * @param section - セクション名（`api`・`db.pooler` 等）
 * @param key - キー名
 */
export function readTomlValue(
  toml: string,
  section: string,
  key: string,
): string {
  let current: string | undefined;
  for (const raw of toml.split("\n")) {
    const line = raw.replace(/\s+#.*$|^#.*$/, "").trim();
    const header = /^\[([^\]]+)\]$/.exec(line);
    if (header) {
      current = header[1];
      continue;
    }
    if (current !== section) continue;
    const entry = new RegExp(`^${key}\\s*=\\s*(.+)$`).exec(line);
    if (entry) return entry[1].trim();
  }
  throw new Error(`supabase/config.toml の [${section}] に ${key} が無い`);
}

/**
 * {@link readTomlValue} の整数版
 * TOML整数読み取り
 *
 * @param toml - TOML の全文
 * @param section - セクション名
 * @param key - キー名
 */
export function readTomlInt(
  toml: string,
  section: string,
  key: string,
): number {
  const value = readTomlValue(toml, section, key);
  if (!/^\d+$/.test(value)) {
    throw new Error(
      `supabase/config.toml の [${section}] ${key} が整数でない: ${value}。env() に変えたなら、` +
        "読む側のテストと写しの定数を直す",
    );
  }
  return Number(value);
}
