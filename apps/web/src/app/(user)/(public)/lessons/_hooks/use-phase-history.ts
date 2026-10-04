"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

/** 履歴の state に段階を書き込むキー。Next.js の内部キーと衝突しない名前にする */
const PHASE_KEY = "lessonPhase";
/** 履歴の state に、その段階を離れたときのスクロール位置を書き込むキー */
const SCROLL_KEY = "lessonScrollY";

/** 履歴の state から 1 つの値を読む。state は他者（Next.js）も書くので型を信用しない */
function readKey(state: unknown, key: string): unknown {
  if (typeof state !== "object" || state === null || !(key in state)) {
    return undefined;
  }
  return Reflect.get(state, key);
}

/** 履歴の state から段階を読む。積んでいない項目（ページを開いた時点）は undefined */
function readPhase<P extends string>(
  state: unknown,
  phases: readonly P[],
): P | undefined {
  const value = readKey(state, PHASE_KEY);
  return phases.find((phase) => phase === value);
}

function readScrollY(state: unknown): number {
  const value = readKey(state, SCROLL_KEY);
  return typeof value === "number" ? value : 0;
}

/**
 * 1 ページの中の段階を、ブラウザの履歴に 1 項目ずつ積む
 * 段階の履歴
 *
 * レッスンは URL を変えずに「説明 → 確認問題 → できたことの確認」と画面を
 * 切り替える。state だけで切り替えると履歴には 1 項目しか無く、確認問題や
 * 完了画面で「戻る」を押すと説明を飛び越えて前のページへ抜ける。段階を
 * 進めるたびに `history.pushState` で項目を積み、戻る / 進むで段階を行き来
 * させる（pjax と同じ考え方）。
 *
 * - **URL は変えない。** 段階の中身（何問目・どれを選んだか）はメモリにしか
 *   無く、URL で途中の段階を開けても再現できない。リロードや共有で開くのは
 *   常に最初の段階
 * - **Next.js の履歴と共存する。** App Router は `history.pushState` を
 *   パッチしており、渡した state に自分の内部状態（`__NA` 等）を写し足す。
 *   戻る / 進むも Next.js の `popstate` が同じ URL として扱うのでページは
 *   作り直されず、ここで持つ state もそのまま残る
 * - **スクロール位置は自分で戻す。** ブラウザの自動復元は `popstate` の
 *   直後、まだ前の段階（短い画面）が描かれている間に走り、長い画面の
 *   位置へは届かない。段階を離れるときに位置をその項目へ書き込み、
 *   戻ってきた段階を描いた後に戻す
 * - **段階は Next.js に消されても書き直す。** Server Action の再検証の後、
 *   Next.js は今の項目の state を書き直してここで書いた段階を落とす。
 *   描画のたびに今の項目へ今の段階を書き戻す（でないと完了画面から戻った
 *   後に進むで、完了画面の項目が段階の無い最初の段階として開く）
 * - **メモリに無い段階へは進ませない。** リロード後も履歴には先の項目が
 *   残る。`reachable` が偽を返す段階へ戻る / 進むで着いたら最初の段階を
 *   出す（中身の無い確認問題や完了画面を出さない）
 *
 * @param phases 段階の並び（先頭が最初の段階）
 * @param reachable その段階をいま描けるか（中身がメモリにあるか）
 * @returns 現在の段階と、次の段階へ進めて履歴に積む関数
 */
export function usePhaseHistory<P extends string>(
  phases: readonly [P, ...P[]],
  reachable: (phase: P) => boolean,
): readonly [P, (phase: P) => void] {
  const initial = phases[0];
  const [phase, setPhase] = useState<P>(initial);
  /** 次の描画の後に戻すスクロール位置。段階が変わったときだけ使う */
  const pendingScrollY = useRef<number | undefined>(undefined);
  // popstate のリスナーを張り直さずに最新の判定を使う
  const reachableRef = useRef(reachable);
  useEffect(() => {
    reachableRef.current = reachable;
  });

  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      const target = readPhase(event.state, phases) ?? initial;
      pendingScrollY.current = readScrollY(event.state);
      setPhase(reachableRef.current(target) ? target : initial);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
    // phases は呼び出し側の定数。マウント時に一度だけ張る
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 今いる項目には常に今の段階を書いておく（描画のたびに確かめる）。
  // Next.js は Server Action の再検証（`completeLesson` の revalidatePath）の
  // あと、今の項目の state を自分の内部状態だけで書き直し、ここで書いた段階を
  // 消す。その書き直しは router の useInsertionEffect で、同じコミットの
  // passive effect（ここ）はその後に走る。再検証はページのスロット（サーバーで
  // 描いた説明・関連リンク）を新しい要素で届けるので、呼び出し側もそのコミットで
  // 描き直される。リロードで途中の段階の項目に着地したとき（中身が無いので
  // 最初の段階を出す）も、ここで項目を最初の段階に直す
  useEffect(() => {
    if (readPhase(window.history.state, phases) === phase) return;
    window.history.replaceState(
      { ...window.history.state, [PHASE_KEY]: phase },
      "",
    );
  });

  useLayoutEffect(() => {
    const y = pendingScrollY.current;
    if (y === undefined) return;
    pendingScrollY.current = undefined;
    window.scrollTo(0, y);
  }, [phase]);

  const push = useCallback((next: P) => {
    // 離れる項目に今の位置を残し、戻ってきたときにそこへ戻す
    window.history.replaceState(
      { ...window.history.state, [SCROLL_KEY]: window.scrollY },
      "",
    );
    window.history.pushState({ [PHASE_KEY]: next }, "");
    // 新しい段階は先頭から読ませる
    pendingScrollY.current = 0;
    setPhase(next);
  }, []);

  return [phase, push] as const;
}
