import { createCustomResultView } from "../../_lib/create-custom-result-view";
import { RESULT_STORAGE_KEY } from "../_lib/types";
import { TotalFuProblemListLoader } from "./total-fu-problem-list-loader";

/**
 * 合計符練習専用の結果画面コンポーネント
 * 合計符結果表示
 *
 * 共通 `ResultView` をラップし、問題別フィードバック一覧を children として
 * 注入する。sessionStorage 読み取りは Loader に封じ込め、factory には
 * `storageKey` 文字列のみを渡す。
 *
 * 注意: このモジュールに `"use client"` は付けない。`createCustomResultView`
 * が返す `CustomResultView` は async Server Component であり、親モジュールが
 * Client と判定されると `async Client Component` エラーになる。
 */
export const TotalFuResultView = createCustomResultView({
  ProblemListLoader: TotalFuProblemListLoader,
  storageKey: RESULT_STORAGE_KEY,
});
