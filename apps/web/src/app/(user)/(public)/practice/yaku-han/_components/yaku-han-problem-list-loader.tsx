"use client";

import { useSessionStorageResult } from "../../_hooks/use-session-storage-result";
import { parseYakuHanResults } from "../_lib/types";
import { YakuHanProblemList } from "./yaku-han-problem-list";

interface YakuHanProblemListLoaderProps {
  readonly storageKey: string;
}

/**
 * 役翻数練習の問題別フィードバック一覧 Loader
 * 役翻数問題一覧ローダー
 *
 * Client Component。`storageKey` 文字列のみを props で受け取り、
 * `parseYakuHanResults` と `YakuHanProblemList` はこのファイル内で
 * ハードコード import する。Server → Client 境界を越える props を
 * 「string primitive のみ」に限定することで、RSC のシリアライズ
 * 制約（関数 props 禁止）を回避する。
 */
export function YakuHanProblemListLoader({
  storageKey,
}: YakuHanProblemListLoaderProps) {
  const results = useSessionStorageResult(storageKey, parseYakuHanResults);
  return <YakuHanProblemList results={results} />;
}
