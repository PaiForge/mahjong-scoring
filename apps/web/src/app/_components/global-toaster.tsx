"use client";

import { Toaster } from "react-hot-toast";
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
 */
export function GlobalToaster() {
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
