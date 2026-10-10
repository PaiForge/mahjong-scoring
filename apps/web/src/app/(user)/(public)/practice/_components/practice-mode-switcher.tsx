"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Suspense,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { TOGGLE_GROUP_CONTAINER_CLASSES } from "@/app/(user)/_components/_lib/toggle-group-classes";
import { safeLocalStorage } from "@/lib/safe-storage";
import {
  DEFAULT_PRACTICE_MODE,
  isPracticeMode,
  PRACTICE_MODES,
  type PracticeMode,
} from "@mahjong-scoring/features/practice/practice-mode";

const STORAGE_KEY = "practice-mode";
const CHANGE_EVENT = "practice-mode-change";

function readMode(): PracticeMode {
  const saved = safeLocalStorage.getItem(STORAGE_KEY);
  return isPracticeMode(saved) ? saved : DEFAULT_PRACTICE_MODE;
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

interface Props {
  readonly basic: ReactNode;
  readonly practical: ReactNode;
}

function ModeContent({
  basic,
  practical,
  mode,
}: Props & { readonly mode: PracticeMode }) {
  const t = useTranslations("practice.modes");
  return (
    <div className="space-y-6">
      <nav aria-label={t("label")} className={TOGGLE_GROUP_CONTAINER_CLASSES}>
        {PRACTICE_MODES.map((value) => (
          <Link
            key={value}
            href={`/practice?mode=${value}`}
            scroll={false}
            aria-current={mode === value ? "page" : undefined}
            className={`flex min-h-11 flex-1 items-center justify-center rounded-md px-4 text-sm font-bold transition-colors ${mode === value ? "bg-selected text-selected-foreground" : "text-surface-500 hover:bg-surface-100 hover:text-foreground"}`}
          >
            {t(value)}
          </Link>
        ))}
      </nav>
      {mode === "basic" ? basic : practical}
    </div>
  );
}

function ModeFromQuery(props: Props) {
  const params = useSearchParams();
  const saved = useSyncExternalStore(
    subscribe,
    readMode,
    () => DEFAULT_PRACTICE_MODE,
  );
  // 試験やレッスンからの絞り込みリンクは保存済みの実戦モードより優先する。
  const query = params.get("mode");
  const explicit =
    params.has("rank") || params.has("category")
      ? "basic"
      : isPracticeMode(query)
        ? query
        : undefined;
  const mode = explicit ?? saved;
  useEffect(() => {
    if (!explicit) return;
    // 保存できなくても URL による切り替えは使える
    safeLocalStorage.setItem(STORAGE_KEY, explicit);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, [explicit]);
  return <ModeContent {...props} mode={mode} />;
}

/** URL を共有でき、通常の再訪では最後に選んだ練習を開く。 */
export function PracticeModeSwitcher(props: Props) {
  return (
    <Suspense
      fallback={<ModeContent {...props} mode={DEFAULT_PRACTICE_MODE} />}
    >
      <ModeFromQuery {...props} />
    </Suspense>
  );
}
