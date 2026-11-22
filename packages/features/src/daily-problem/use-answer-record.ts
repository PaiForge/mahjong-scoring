import { useCallback, useEffect, useRef, useState } from "react";

import {
  parseDailyAnswerDetail,
  type DailyAnswerDetail,
} from "./answer-detail";
import type { DailyAnswerRecordStatus } from "./save-status";

/**
 * 本日の問題の保存結果
 *
 * `failed` だけが送り直せる失敗で、預かりを残す。サーバーが詳細の版を知らない
 * （`unsupportedDetail`。デプロイの切り替え中）ときも、呼び出し側は `failed` を返す —
 * 同じ内容を後で送り直せば保存できるため。それ以外（期限切れ・認証拒否・
 * `invalidDetail` = 詳細の形が不正）は送り直しても結果が変わらないので預かりを捨てる。
 */
export type DailyAnswerSaveResult =
  "saved" | "failed" | "staleDay" | "anonymous" | "blocked" | "invalidDetail";

/**
 * 預かる最初の解答（サーバーへ送る中身一式）
 * 預かり解答
 *
 * `detail` は解答した瞬間に組み立てたもの（`build-answer-detail.ts`）。持たないのは、
 * 詳細を送らない版が端末に預けた旧形式（`{ day, isCorrect }`）だけ。
 */
export interface DailyAnswerPending {
  readonly isCorrect: boolean;
  readonly detail?: DailyAnswerDetail;
}

/**
 * 端末に預けた値を、送れる解答として読む。読めなければ undefined
 *
 * 旧形式（詳細なし）はそのまま旧記録として送る。詳細がこの版のスキーマで
 * 読めない預かり（別の版が預けたもの・壊れた値）は送らない — 中身を確かめられない
 * ものを作り直したり、詳細を外して旧記録に落としたりしない。
 */
function pendingOf(
  value: unknown,
  day: string,
): DailyAnswerPending | undefined {
  if (
    typeof value !== "object" ||
    value === null ||
    !("day" in value) ||
    value.day !== day ||
    !("isCorrect" in value) ||
    typeof value.isCorrect !== "boolean"
  )
    return undefined;
  const detail = parseDailyAnswerDetail(
    "detail" in value ? value.detail : undefined,
  );
  if (detail.kind === "legacy") return { isCorrect: value.isCorrect };
  return detail.kind === "valid"
    ? { isCorrect: value.isCorrect, detail: detail.detail }
    : undefined;
}

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
 * 解答を送る。別の利用者・日付では呼び出し側を key で作り直す。
 * 端末保存が使えないときもメモリに保持し、サーバーへの保存は試みる。
 *
 * @design 預けるのは「送る中身一式」で、再送のたびに作り直さない
 * 解答の詳細（解答の中身・回答モード・ルール設定・ビルド・入力方式）は解答した
 * 瞬間の値で固定する。再送は数時間後・別のビルドに乗り換えた後にも起きるので、
 * そのときの設定やビルドで組み直すと、解答時の条件が失われる。
 *
 * @design 詳細を組み立てられなかった解答は送らない
 * `record` に詳細が渡らなかった（端末の検証を通らない = 実装の不具合）ときは、
 * 送らずに `invalidDetail` にする。詳細を外して旧記録として送ると、詳細を送らない
 * 版の行と見分けがつかなくなり、直した後も最初の 1 件を入れ直せない。
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
  readonly send: (answer: DailyAnswerPending) => Promise<DailyAnswerSaveResult>;
  readonly answered: boolean;
}) {
  const key =
    userId === undefined ? undefined : `daily-problem-answer:${userId}:${day}`;
  const first = useRef<DailyAnswerPending | undefined>(undefined);
  // 詳細を組み立てられず、送らないと決めた（以後の record も受けない）
  const rejected = useRef(false);
  const busy = useRef(false);
  const mounted = useRef(true);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<DailyAnswerRecordStatus>(
    answered ? "saved" : "idle",
  );

  const retry = useCallback(async () => {
    if (busy.current || first.current === undefined) return;
    busy.current = true;
    setStatus("saving");
    const pending = first.current;
    if (key !== undefined) {
      try {
        await storage.setItem(key, JSON.stringify({ day, ...pending }));
      } catch {
        /* Memory still retains the first answer. */
      }
    }
    let result: DailyAnswerSaveResult;
    try {
      result = await send(pending);
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
          const pending = pendingOf(value, day);
          if (!answered && pending !== undefined) {
            first.current = pending;
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
    (isCorrect: boolean, detail: DailyAnswerDetail | undefined) => {
      if (!ready || answered || first.current !== undefined || rejected.current)
        return;
      if (detail === undefined) {
        rejected.current = true;
        setStatus("invalidDetail");
        return;
      }
      first.current = { isCorrect, detail };
      void retry();
    },
    [answered, ready, retry],
  );

  return { ready, status, record, retry };
}
