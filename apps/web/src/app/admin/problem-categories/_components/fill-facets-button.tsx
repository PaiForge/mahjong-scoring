"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { adminButtonClasses } from "../../_lib/button-classes";
import { fillProblemFacets } from "../_actions/fill-problem-facets";

/**
 * 属性の不足分を埋める手動の実行ボタン
 * 属性補充ボタン
 *
 * 押すと日次の cron と同じ処理を 1 回走らせ、結果（計算した数・失敗の数・実行後の
 * 未計算の数）をボタンの横に出す。1 回で埋め切れないことがあるので、未計算が残って
 * いれば続けて押せる。未計算が 0 のときも押せる（押しても何も増えない）— 表の数は
 * ページを描いた時点のもので、その後に保存された問題があるかはここでは分からない。
 */
export function FillFacetsButton() {
  const t = useTranslations("admin.problemCategories.fill");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={pending}
        className={adminButtonClasses({ variant: "secondary" })}
        onClick={() => {
          startTransition(async () => {
            try {
              const result = await fillProblemFacets();
              setMessage(
                "error" in result
                  ? t("failed")
                  : t("done", { ...result.summary }),
              );
            } catch {
              setMessage(t("failed"));
            }
          });
        }}
      >
        {pending ? t("running") : t("button")}
      </button>
      {message && (
        <p role="status" className="text-sm text-surface-700">
          {message}
        </p>
      )}
    </div>
  );
}
