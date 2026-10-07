/**
 * 管理画面の入力欄（input / select / textarea）の class。
 *
 * 枠はユーザー向けの入力欄と同じ 1px の surface-400 で、フォーカスで
 * primary に変わる。surface-200 / 300 の枠は白地の上で欄の境界が
 * 読み取れないため使わない。幅と余白の調整だけを呼び出し側で足す。
 * 角丸は admin.css が入力欄に一律で当てている。
 */
export const ADMIN_INPUT_CLASSES =
  "rounded-lg border border-surface-400 bg-white px-3 py-2 text-sm text-surface-900 placeholder:text-surface-400 focus:border-primary-500 focus:outline-none disabled:bg-surface-100 disabled:text-surface-400";
