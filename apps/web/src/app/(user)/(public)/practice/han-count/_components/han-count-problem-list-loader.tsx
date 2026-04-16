"use client";

import { useSessionStorageResult } from "../../_hooks/use-session-storage-result";
import { parseHanCountResults } from "../_lib/types";
import { HanCountProblemList } from "./han-count-problem-list";

interface HanCountProblemListLoaderProps {
  readonly storageKey: string;
}

/**
 * 翻数即答練習の問題別フィードバック一覧 Loader
 * 翻数問題一覧ローダー
 *
 * Client Component。`storageKey` 文字列のみを props で受け取り、
 * `parseHanCountResults` と `HanCountProblemList` はこのファイル内で
 * ハードコード import する。Server → Client 境界を越える props を
 * 「string primitive のみ」に限定することで、RSC のシリアライズ
 * 制約（関数 props 禁止）を回避する。
 */
export function HanCountProblemListLoader({ storageKey }: HanCountProblemListLoaderProps) {
  const results = useSessionStorageResult(storageKey, parseHanCountResults);
  return <HanCountProblemList results={results} />;
}
