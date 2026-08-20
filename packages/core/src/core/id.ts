/**
 * 問題 ID の採番関数
 * ID採番関数
 */
export type IdGenerator = () => string;

/**
 * 既定の ID 採番（`crypto.randomUUID`）
 * 既定ID採番
 *
 * ジェネレータが ID 採番という副作用を直接持つと、生成結果を値として
 * 比較できない（毎回 ID が変わる）。採番はこの型で注入可能にし、
 * 既定値としてのみ crypto に触れる。
 */
export const defaultIdGenerator: IdGenerator = () => crypto.randomUUID();
