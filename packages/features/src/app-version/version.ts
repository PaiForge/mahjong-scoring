/**
 * アプリのバージョン（`app.json` の `version`。`1.0.0` の形）を数の並びに読む。
 * 形が違えば undefined
 * アプリバージョン解析
 *
 * 数は 1〜3 個まで受け、足りない桁は 0 とみなす（`1.2` は `1.2.0`）。
 * プレリリースの後置（`-beta` 等）は使わないので受けない。
 */
export function parseAppVersion(
  value: string,
): readonly [number, number, number] | undefined {
  if (!/^\d{1,6}(\.\d{1,6}){0,2}$/.test(value)) return undefined;
  const [major = 0, minor = 0, patch = 0] = value.split(".").map(Number);
  return [major, minor, patch];
}

/**
 * 今のバージョンが最低バージョンを下回るか
 * 最低バージョン判定
 *
 * どちらかが読めない形なら false（止めない）。設定の誤りや古い版の
 * 読めない値で、使える版の利用者まで締め出さないため。
 */
export function isBelowMinimumVersion(
  current: string,
  minimum: string,
): boolean {
  const a = parseAppVersion(current);
  const b = parseAppVersion(minimum);
  if (a === undefined || b === undefined) return false;
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] < b[i];
  }
  return false;
}
