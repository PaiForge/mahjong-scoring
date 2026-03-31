/**
 * 問題生成をリトライ付きで実行する汎用ヘルパー
 * リトライ付き問題生成
 *
 * @param generator - undefined を返す可能性のある生成関数
 * @param maxAttempts - 最大試行回数（デフォルト: 10）
 */
export function retryGenerate<T>(
  generator: () => T | undefined,
  maxAttempts = 10,
): T | undefined {
  for (let i = 0; i < maxAttempts; i++) {
    const result = generator();
    if (result !== undefined) return result;
  }
  return undefined;
}
