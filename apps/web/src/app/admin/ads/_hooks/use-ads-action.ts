"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "react-hot-toast";

/**
 * 広告の管理画面で、その場で保存して一覧を読み直す操作の実行
 * 広告操作実行
 *
 * 失敗はエラーキー（`admin.ads` 名前空間）をトーストに出し、成功なら
 * `onSuccess` のあとに画面を読み直す。行の操作・タイトル別の一括更新・
 * トラッキング ID の保存で共通。
 */
export function useAdsAction() {
  const router = useRouter();
  const t = useTranslations("admin.ads");
  const [isPending, startTransition] = useTransition();

  const run = <TSuccess extends object>(
    action: () => Promise<{ readonly error: string } | TSuccess>,
    onSuccess?: (result: TSuccess) => void,
  ) => {
    startTransition(async () => {
      const result = await action();
      if ("error" in result) {
        toast.error(t(result.error));
        return;
      }
      onSuccess?.(result);
      router.refresh();
    });
  };

  return { isPending, run };
}
