import { useCallback, useEffect, useRef, useState } from "react";

/** 本日の問題の保存結果。期限切れ・認証拒否は再送しない。 */
export type DailyAnswerSaveResult =
  "saved" | "failed" | "staleDay" | "anonymous" | "blocked";

/** 端末に預ける最初の解答の保存先。利用者ごとにキーを分ける。 */
export interface DailyAnswerStorage {
  getAllKeys?(): readonly string[] | Promise<readonly string[]>;
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}

/**
 * 本日の問題の最初の解答を預け、同じ内容だけを再送する。
 * 本日の問題の保存状態
 *
 * 答え合わせと保存は独立。通信失敗でも正解は見せるが、再訪時にも最初の
 * 正誤を送る。別の利用者・日付では呼び出し側を key で作り直す。
 * 端末保存が使えないときもメモリに保持し、サーバーへの保存は試みる。
 */
export function useAnswerRecord({
  day,
  userId,
  storage,
  send,
  answered,
}: {
  readonly day: string;
  readonly userId?: string;
  readonly storage: DailyAnswerStorage;
  readonly send: (isCorrect: boolean) => Promise<DailyAnswerSaveResult>;
  readonly answered: boolean;
}) {
  const key =
    userId === undefined ? undefined : `daily-problem-answer:${userId}:${day}`;
  const first = useRef<boolean | undefined>(undefined);
  const busy = useRef(false);
  const mounted = useRef(true);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<
    DailyAnswerSaveResult | "idle" | "saving"
  >(answered ? "saved" : "idle");

  const retry = useCallback(async () => {
    if (busy.current || first.current === undefined) return;
    busy.current = true;
    setStatus("saving");
    const isCorrect = first.current;
    if (key !== undefined) {
      try {
        await storage.setItem(key, JSON.stringify({ day, isCorrect }));
      } catch {
        /* Memory still retains the first answer. */
      }
    }
    let result: DailyAnswerSaveResult;
    try {
      result = await send(isCorrect);
    } catch {
      result = "failed";
    }
    if (key !== undefined && result !== "failed") {
      try {
        await storage.removeItem(key);
      } catch {
        /* A duplicate retry is idempotent. */
      }
    }
    busy.current = false;
    if (mounted.current) setStatus(result);
  }, [day, key, send, storage]);

  useEffect(() => {
    mounted.current = true;
    let active = true;
    void (async () => {
      if (key !== undefined) {
        try {
          // 日をまたいだ預かりは記録できないので、次に開いたときに破棄する。
          const keys = (await storage.getAllKeys?.()) ?? [];
          for (const oldKey of keys) {
            if (
              /^daily-problem-answer:.+:\d{4}-\d{2}-\d{2}$/.test(oldKey) &&
              oldKey.slice(-10) < day
            )
              await storage.removeItem(oldKey);
          }
          const raw = await storage.getItem(key);
          const value: unknown = raw === null ? undefined : JSON.parse(raw);
          if (!active) return;
          if (
            !answered &&
            typeof value === "object" &&
            value !== null &&
            "day" in value &&
            value.day === day &&
            "isCorrect" in value &&
            typeof value.isCorrect === "boolean"
          ) {
            first.current = value.isCorrect;
            void retry();
          } else if (raw !== null) {
            await storage.removeItem(key);
          }
        } catch {
          /* Storage is optional; the server remains authoritative. */
        }
      }
      if (active) setReady(true);
    })();
    return () => {
      active = false;
      mounted.current = false;
    };
  }, [answered, day, key, retry, storage]);

  const record = useCallback(
    (isCorrect: boolean) => {
      if (!ready || answered || first.current !== undefined) return;
      first.current = isCorrect;
      void retry();
    },
    [answered, ready, retry],
  );

  return { ready, status, record, retry };
}
