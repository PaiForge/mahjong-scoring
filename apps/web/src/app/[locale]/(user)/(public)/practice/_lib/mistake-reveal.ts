/**
 * 結果画面の「結果」節から、問題別一覧の間違えた問題を開くための受け渡し口
 * 誤答表示の受け渡し
 *
 * 「結果」節（不正解の数・試験の終わり方）はサーバーで描き、問題別一覧は
 * sessionStorage を読むクライアントで後から現れる。両者は親子ではないので、
 * 一覧が「開く処理」をここへ登録し、リンクがそれを呼ぶ。
 *
 * 一覧が出ない回（保存が別の回のもの・間違えた問題が無い）は登録が無く、
 * リンクは押せない文字のまま残る（{@link hasMistakeReveal}）。押しても
 * 何も起きないリンクを出さないため。
 *
 * 結果画面に一覧は 1 つしか無いので、登録も 1 つだけ持つ。
 */

type Listener = () => void;

let reveal: (() => void) | undefined;
const listeners = new Set<Listener>();

function notify(): void {
  for (const listener of listeners) listener();
}

/**
 * 間違えた問題を開く処理を登録する。戻り値で登録を外す
 */
export function registerMistakeReveal(handler: () => void): () => void {
  reveal = handler;
  notify();
  return () => {
    if (reveal !== handler) return;
    reveal = undefined;
    notify();
  };
}

/** 登録の有無が変わったら呼ばれる（`useSyncExternalStore` 用） */
export function subscribeMistakeReveal(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 開く処理が登録されているか */
export function hasMistakeReveal(): boolean {
  return reveal !== undefined;
}

/** 登録された処理で間違えた問題を開く。登録が無ければ何もしない */
export function revealMistakes(): void {
  reveal?.();
}
