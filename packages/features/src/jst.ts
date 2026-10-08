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
