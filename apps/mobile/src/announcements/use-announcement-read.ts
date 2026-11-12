import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";

import type {
  AnnouncementApiFailure,
  AnnouncementApiResult,
} from "./announcements-api";

/**
 * お知らせの読み込み状態
 *
 * - `loading` — まだ 1 度も読めていない
 * - `loaded` — 読めた。読み直している間も前の値を出し続ける
 * - `failed` — 読めなかった
 */
export type AnnouncementReadState<T> =
  | { readonly kind: "loading" }
  | { readonly kind: "loaded"; readonly value: T }
  | { readonly kind: "failed"; readonly error: AnnouncementApiFailure };

/**
 * お知らせを読み、画面を開くたびに読み直す
 * お知らせ読み込み
 *
 * 管理画面での追加・修正が、アプリを起動し直さずにホームや一覧へ戻った
 * ときに届くよう、表示のたびに読み直す。呼び出し側は `read` を
 * `useCallback` で包み、条件（slug）が変わったときだけ作り直すこと。
 */
export function useAnnouncementRead<T extends object>(
  read: () => Promise<AnnouncementApiResult<T>>,
): {
  readonly state: AnnouncementReadState<T>;
  /** 読み終えたら解決する（`usePullToRefresh` が更新の印を消す合図に使う） */
  readonly reload: () => Promise<void>;
} {
  const [state, setState] = useState<AnnouncementReadState<T>>({
    kind: "loading",
  });
  // 古い要求の結果が新しい要求の結果を上書きしないよう、最後の要求だけを採る
  const latest = useRef(0);

  const reload = useCallback(async () => {
    const request = ++latest.current;
    await read().then((result) => {
      if (request !== latest.current) return;
      setState(
        "error" in result
          ? { kind: "failed", error: result.error }
          : { kind: "loaded", value: result },
      );
    });
  }, [read]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return { state, reload };
}
