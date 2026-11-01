"use client";

import type { ReactNode } from "react";

import { useIsClient } from "@/app/_hooks/use-is-client";
import { useRuleSettingsStore } from "@/app/_hooks/use-rule-settings-store";

interface KiriageManganSwitchProps {
  /** 切り上げ満貫ありの設定で出す中身 */
  readonly on: ReactNode;
  /** 切り上げ満貫なし（既定）で出す中身 */
  readonly off: ReactNode;
}

/**
 * 切り上げ満貫の設定で出し分ける
 * 切り上げ満貫の出し分け
 *
 * 章の本文はサーバーで描く（辞書もサーバー専用の名前空間にある）が、ルール設定は
 * 端末ローカル（localStorage）にしかない。そこで両方のルールの中身をサーバーで
 * 描いて渡し、ここでは設定に合う方を選ぶだけにする。サーバーと hydration 中は
 * 既定（なし）を描き、初期 HTML に本文を載せたまま hydration 後に設定へ追随する
 * （点数早見表の `ScoreTable` と同じ扱い）。
 */
export function KiriageManganSwitch({ on, off }: KiriageManganSwitchProps) {
  const isClient = useIsClient();
  const kiriageMangan = useRuleSettingsStore((s) => s.kiriageMangan);
  return kiriageMangan && isClient ? on : off;
}
