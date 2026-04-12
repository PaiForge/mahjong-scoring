"use client";

import type { ComponentType } from "react";
import type { PracticeResultViewProps } from "./create-practice-result-page";
import { ResultView } from "../_components/result-view";
import { useSessionStorageResult } from "../_hooks/use-session-storage-result";

/**
 * カスタム結果ビューのファクトリー設定
 * カスタム結果ビュー設定
 */
interface CreateCustomResultViewConfig<T> {
  /** sessionStorage のキー */
  readonly storageKey: string;
  /** 生文字列を型付き配列にパースする関数 */
  readonly parse: (raw: string | undefined) => readonly T[];
  /** 問題結果一覧を描画するコンポーネント */
  readonly ProblemList: ComponentType<{ readonly results: readonly T[] }>;
}

/**
 * ドリル固有の結果ビューコンポーネントを生成するファクトリー関数
 * カスタム結果ビュー生成
 *
 * 共通 ResultView をラップし、sessionStorage からの結果読み取りと
 * 問題別フィードバック一覧の注入を行うクライアントコンポーネントを返す。
 *
 * @param config - sessionStorage キー、パース関数、問題一覧コンポーネント
 * @returns PracticeResultViewProps を受け取るクライアントコンポーネント
 */
export function createCustomResultView<T>(
  config: CreateCustomResultViewConfig<T>,
): ComponentType<PracticeResultViewProps> {
  const { storageKey, parse, ProblemList } = config;

  function CustomResultView(props: PracticeResultViewProps) {
    const questionResults = useSessionStorageResult(storageKey, parse);
    const { children, ...rest } = props;

    // factory から渡される `children` には `ExpGainDisplay` が入る。
    // ここでは EXP と問題別フィードバックを Fragment で連結して
    // ResultView の children スロットに渡す。これにより EXP が消えない。
    return (
      <ResultView {...rest}>
        {children}
        <ProblemList results={questionResults} />
      </ResultView>
    );
  }

  CustomResultView.displayName = `CustomResultView(${ProblemList.displayName ?? ProblemList.name ?? "Unknown"})`;

  return CustomResultView;
}
