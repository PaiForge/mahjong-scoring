/**
 * `crypto.randomUUID` の補い方
 *
 * core の問題生成は問題 ID を既定で `crypto.randomUUID()` で振る（`defaultIdGenerator`）。
 * ブラウザと Node にはあるが、React Native の JS エンジン（Hermes）には `crypto` そのものが
 * 無く、React Native も Expo も補わない。補わないと練習を始めて最初の問題を作る瞬間に
 * ReferenceError になり、リリースビルドではアプリが落ちる（web 版の画面確認では
 * ブラウザの `crypto` が使われるため表に出ない）。
 *
 * 採番関数を練習ごとに渡す案は、出題の入口がすべて features / core の中にあるため
 * 取らなかった。アプリの入口で一度だけ全体に生やす（`install-random-uuid.ts`）。
 */

/** 補う対象（`globalThis` のうち `crypto.randomUUID` だけを見る） */
export interface CryptoHost {
  crypto?: { randomUUID?: () => string };
}

/**
 * `crypto.randomUUID` が無ければ補う
 *
 * 既に関数があれば何もしない（web 版はブラウザのものを使う）。`crypto` 自体が
 * 無ければ `randomUUID` だけを持つオブジェクトを置き、`crypto` はあって
 * `randomUUID` だけ無ければそこに足す（`getRandomValues` 等を消さない）。
 *
 * @param host - 補う先（アプリでは `globalThis`）
 * @param randomUUID - UUID v4 を返す関数（アプリでは expo-crypto のもの）
 */
export function installRandomUUID(
  host: CryptoHost,
  randomUUID: () => string,
): void {
  if (typeof host.crypto?.randomUUID === "function") return;
  if (host.crypto === undefined) {
    host.crypto = { randomUUID };
    return;
  }
  host.crypto.randomUUID = randomUUID;
}
