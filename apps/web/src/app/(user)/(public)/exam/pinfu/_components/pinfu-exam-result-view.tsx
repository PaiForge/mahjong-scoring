import { createCustomResultView } from "@/app/(user)/(public)/practice/_lib/create-custom-result-view";
import { RESULT_STORAGE_KEY } from "../_lib/types";

/**
 * 昇級試験（平和の点数計算）専用の結果画面コンポーネント
 * 昇級試験結果表示
 *
 * 共通 `ResultView` をラップし、問題別フィードバック一覧を children として
 * 注入する。sessionStorage 読み取りはローダーに封じ込め、factory には
 * `storageKey` 文字列のみを渡す。
 *
 * 注意: このモジュールに `"use client"` は付けない。`createCustomResultView`
 * が返す `CustomResultView` は async Server Component であり、親モジュールが
 * Client と判定されると `async Client Component` エラーになる。
 */
export const PinfuExamResultView = createCustomResultView({
  storageKey: RESULT_STORAGE_KEY,
  translationNamespace: "pinfuExamChallenge",
});
