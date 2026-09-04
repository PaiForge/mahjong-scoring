"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Toaster, toast } from "react-hot-toast";
import { takeToastOnArrival } from "./_lib/toast-on-arrival";
import { ToastCard } from "./toast-card";

/** 表示時間。参考プロジェクト（blindfold-chess）の 3 秒に揃える */
const TOAST_DURATION_MS = 3000;

/**
 * グローバルトースト表示
 *
 * 画面下部の中央に出す。モバイルではタブバーに重なるため、
 * その分だけ持ち上げる（`--toast-bottom-offset` を globals.css で定義）。
 * 見た目は {@link ToastCard} が担い、react-hot-toast の既定の
 * 白い角丸カードは使わない。
 *
 * ルートレイアウトに置くため遷移をまたいで生き残る。これを使い、
 * {@link takeToastOnArrival} に預けられた「遷移してから出すトースト」を
 * 着地後に出す役も持つ。
 */
export function GlobalToaster() {
  const pathname = usePathname();

  // effect は新しいページが描かれた後に走るため、預かりの表示時間は
  // 遷移が終わった時点から始まる。着地先が違えば取り出しが捨てる。
  useEffect(() => {
    const message = takeToastOnArrival(pathname);
    if (message !== null) toast(message);
  }, [pathname]);

  return (
    <Toaster
      position="bottom-center"
      containerStyle={{ bottom: "var(--toast-bottom-offset)" }}
      toastOptions={{ duration: TOAST_DURATION_MS }}
    >
      {(t) => <ToastCard toast={t} />}
    </Toaster>
  );
}
