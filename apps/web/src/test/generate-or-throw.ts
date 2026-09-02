import { retryGenerate } from "@mahjong-scoring/core";

/**
 * 出題を生成できるまで試し、諦めたら投げるテスト用ヘルパー
 * 生成できるまで試す
 *
 * 出題ジェネレータは牌の残数不足で undefined を返しうる。テストが欲しいのは
 * 「生成できた出題」だけで、生成できなかったこと自体はテストの対象ではない
 * ため、undefined を握って以降の行を落とすより、その場で投げて失敗の理由を
 * 出す方がよい。
 *
 * `retryGenerate` は諦めたときも undefined を返す（本番コードは出題を諦めて
 * 別の条件へ切り替えられる）ので、投げる側の都合はここで足す。
 *
 * @param generator - undefined を返す可能性のある生成関数
 * @param maxAttempts - 最大試行回数（省略時は `retryGenerate` の既定値）。
 *   成立率の低い出題条件だけが上書きする
 */
export function generateOrThrow<T>(
  generator: () => T | undefined,
  maxAttempts?: number,
): T {
  const question = retryGenerate(generator, maxAttempts);
  if (!question) throw new Error("問題を生成できなかった");
  return question;
}
