/**
 * ページの初回ロードが落ち着いた（`load` の後、ブラウザが手すきになった）時点で
 * コールバックを呼ぶ。
 *
 * 初回の描画に要らない通信・処理（常設のリンクの先読み、未ログイン時の認証 SDK）を
 * 本文の描画と並べないために使う。すべての呼び出しで同じ 1 回の待ちを共有し、
 * 落ち着いた後に呼ばれたら次のティックで呼ぶ。ブラウザでだけ呼ぶこと。
 */
let isIdle = false;
let isScheduled = false;
const pending = new Set<() => void>();

function flush(): void {
  isIdle = true;
  for (const callback of pending) {
    callback();
  }
  pending.clear();
}

function schedule(): void {
  if (isScheduled) {
    return;
  }
  isScheduled = true;
  const onLoad = () => {
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(flush, { timeout: 2000 });
    } else {
      window.setTimeout(flush, 200);
    }
  };
  if (document.readyState === "complete") {
    onLoad();
  } else {
    window.addEventListener("load", onLoad, { once: true });
  }
}

/** 落ち着いた後かどうか */
export function isPageIdle(): boolean {
  return isIdle;
}

/**
 * 落ち着いた時点で `callback` を呼ぶ。戻り値で取り消せる。
 */
export function whenPageIdle(callback: () => void): () => void {
  if (isIdle) {
    const timer = window.setTimeout(callback, 0);
    return () => window.clearTimeout(timer);
  }
  pending.add(callback);
  schedule();
  return () => {
    pending.delete(callback);
  };
}
