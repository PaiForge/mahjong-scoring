import { LandingPage } from "./_components/landing-page";

/**
 * トップ（LP）の読み込み境界。
 *
 * 「/」はログイン済みが proxy で /dashboard へ rewrite されるため、この境界に
 * 到達するのは未ログインだけで、行き先は常に LP。LP は cookie もデータも
 * 読まない静的コンテンツなので、スケルトンで形を近似する代わりに実物を
 * そのままフォールバックにする — 実体と完全に一致するため CLS が原理的に 0 で、
 * スケルトンと実体の形を同期し続ける保守も要らない。
 *
 * 「/」自体が静的プリレンダリングされている間はこの境界はほぼ出番が無いが、
 * loading-boundaries.test.ts の規約（全ページに境界ちょうど 1 つ）を満たしつつ、
 * 万一「/」が動的化した場合の保険として置いている。
 */
export default function Loading() {
  return <LandingPage />;
}
