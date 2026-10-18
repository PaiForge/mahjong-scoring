/**
 * JST の暦
 * JST暦
 *
 * アプリの日付境界（「今日」「今週」「今月」）はサーバーの TZ ではなく
 * `Asia/Tokyo` で切る。利用者は日本在住が前提で、深夜 0 時に日が変わるのが
 * 自然。Vercel のサーバーは UTC、ブラウザは JST なので、ローカル時刻
 * （`getFullYear` / `getDay` / `setHours` 等）で区切るとサーバーとクライアントが
 * 別の境界を見て、JST の 0〜9 時に「今週」「今月」の範囲が最大 9 時間ずれる。
 *
 * JST は夏時間が無く UTC+9 固定なので、`Intl` を使わず 9 時間ずらした UTC の暦を
 * そのまま JST の暦として扱える。`Intl.DateTimeFormat` で表示する箇所は
 * {@link JST_TIME_ZONE} を `timeZone` に渡す。
 *
 * 日付境界を扱うテストは TZ を複数回して書く（`describe.each` +
 * `vi.stubEnv("TZ", tz)`。`process.env.TZ =` の直書きは turbo の lint が警告する）。
 * 開発機は JST なので 1 つの TZ では再現せず、CI（UTC）か本番でだけ出る。
 * 期待値は `new Date("...+09:00")` の絶対瞬間で書く — `new Date(y, m, d)`
 * （ローカル時刻）で組むと期待値も TZ ごと一緒にずれて失敗が隠れる。
 * postgres.js は `date` 型を文字列で返すので、DB が JST で切った暦日を `Date` に
 * 組み直さない。
 *
 * このモジュールは純粋。
 */

/** `Intl.DateTimeFormat` の `timeZone` に渡す JST の識別子 */
export const JST_TIME_ZONE = "Asia/Tokyo";

/** UTC から JST へのずれ（+9 時間） */
export const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * JST で見た年月日と曜日
 * JST年月日
 */
export interface JstCalendarDate {
  readonly year: number;
  /** 1〜12 */
  readonly month: number;
  /** 1〜31 */
  readonly day: number;
  /** 0 = 日曜 〜 6 = 土曜 */
  readonly weekday: number;
}

/**
 * 瞬間を JST の年月日・曜日に分解する
 * JST年月日分解
 *
 * 暦の計算（週の月曜・月初など）はこの値で行い、境界の瞬間は
 * {@link jstStartOfDay} で組み立て直す。
 */
export function jstCalendarDate(instant: Date): JstCalendarDate {
  const shifted = new Date(instant.getTime() + JST_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    weekday: shifted.getUTCDay(),
  };
}

/**
 * JST の年月日の 0:00 を表す瞬間
 * JST日開始
 *
 * `month` は 1〜12。範囲外の `month` / `day` は `Date.UTC` と同じく繰り上がる
 * （`month` 13 は翌年 1 月、`day` 0 は前月の末日）ので、呼び出し側は
 * 月またぎ・年またぎを自分で畳まなくてよい。
 */
export function jstStartOfDay(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day) - JST_OFFSET_MS);
}

/**
 * `instant` が属する JST の月の 1 日 0:00
 * JST月初
 *
 * 月間ランキングの母集団（「今月」）の境目。JST の 1 日 0〜9 時も当月に数える。
 */
export function jstStartOfMonth(instant: Date): Date {
  const { year, month } = jstCalendarDate(instant);
  return jstStartOfDay(year, month, 1);
}

/**
 * JST での日付キー（`YYYY-MM-DD`）
 * JST日付キー
 *
 * 無料枠の DB の `day` 列・未ログインの cookie・日別集計のグループ化が
 * この文字列をキーにする。
 */
export function jstDayKey(instant: Date): string {
  return new Date(instant.getTime() + JST_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * JST の日付（`YYYY-MM-DD`）の 0:00 を、`+09:00` 付きの ISO 8601 の日時で表す
 * JST日開始日時文字列
 *
 * {@link jstDayKey} の逆向き。日付だけを持つ値（章の公開日・ヒートマップの日付
 * キー）を日時として扱うときに使う。そのまま `new Date()` に渡せるほか、
 * 外へ出す日時（OGP の `article:published_time`・JSON-LD の `datePublished`）は
 * JST のオフセットのまま見せたいので、UTC に直さない文字列で返す。
 */
export function jstDayStartIso(dayKey: string): string {
  return `${dayKey}T00:00:00+09:00`;
}

/**
 * 瞬間を JST の `<input type="datetime-local">` の値（`YYYY-MM-DDTHH:mm`）にする
 * JST日時入力値
 *
 * datetime-local の値はタイムゾーンを持たず、ブラウザは端末のローカル時刻として
 * 読み書きする（`getTimezoneOffset` で直す / `new Date("YYYY-MM-DDTHH:mm")` で
 * 読む）。それでは JST 以外の端末で開いた入力欄だけが、JST で表示する一覧と
 * 別の時刻を見せる。入力欄の値は常に JST の壁時計として扱い、瞬間との変換は
 * この関数と {@link parseJstDateTimeLocal} だけで行う。秒以下は切り捨てる。
 */
export function toJstDateTimeLocal(instant: Date): string {
  return new Date(instant.getTime() + JST_OFFSET_MS).toISOString().slice(0, 16);
}

/** datetime-local の値の形。`step` を秒単位にした入力欄は秒まで送ってくる */
const DATE_TIME_LOCAL_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;

/**
 * JST の datetime-local の値（`YYYY-MM-DDTHH:mm[:ss]`）を瞬間にする
 * JST日時入力値解析
 *
 * {@link toJstDateTimeLocal} の逆向き。実行環境のタイムゾーンに依らず JST の
 * 壁時計として読む。形が違う値・存在しない日時（2 月 30 日など）は `null`。
 */
export function parseJstDateTimeLocal(value: string): Date | null {
  if (!DATE_TIME_LOCAL_PATTERN.test(value)) return null;
  const withSeconds = value.length === 16 ? `${value}:00` : value;
  const instant = new Date(`${withSeconds}+09:00`);
  if (Number.isNaN(instant.getTime())) return null;
  // Date は 2 月 30 日を 3 月 2 日へ繰り上げて受け取るので、戻して突き合わせる
  if (toJstDateTimeLocal(instant) !== value.slice(0, 16)) return null;
  return instant;
}

const JST_DATE_TIME_FORMAT = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: JST_TIME_ZONE,
});

/**
 * 日時を JST の「2026/10/02 10:30」の形にする
 * JST日時表示
 *
 * 時刻は 24 時間表記。サーバーで描く画面とクライアントで描く画面が同じ文字列を
 * 出すよう、実行環境のタイムゾーンに依らず JST で整形する。
 */
export function formatJstDateTime(instant: Date): string {
  return JST_DATE_TIME_FORMAT.format(instant);
}

const JST_DATE_LONG_FORMAT = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: JST_TIME_ZONE,
});

/**
 * 日時を JST の「2026年10月2日」の形にする
 * JST日付長形式表示
 *
 * 曜日や時刻は出さない。{@link formatJstDateTime} と同じく、実行環境の
 * タイムゾーンに依らず JST の日付で整形する。
 */
export function formatJstDateLong(instant: Date): string {
  return JST_DATE_LONG_FORMAT.format(instant);
}

/**
 * JST の日付（`YYYY-MM-DD`）を「2026年10月2日」の形にする
 * JST日付キー長形式表示
 *
 * 日付だけを持つ値（章の公開日・ヒートマップの日付キー）向けの
 * {@link formatJstDateLong}。
 */
export function formatJstDayKeyLong(dayKey: string): string {
  return formatJstDateLong(new Date(jstDayStartIso(dayKey)));
}

/**
 * JST の日付（`YYYY-MM-DD`）を「10/2」の形にする
 * JST日付キー月日表示
 *
 * 棒グラフの軸のように幅が限られる所で使う。文字列を分解するだけで
 * ロケールにもタイムゾーンにも依らない。月日は 0 埋めしない。
 */
export function formatJstDayKeyMonthDay(dayKey: string): string {
  const [, month, day] = dayKey.split("-");
  return `${Number(month)}/${Number(day)}`;
}
