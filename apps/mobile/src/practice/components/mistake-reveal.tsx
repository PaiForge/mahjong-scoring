import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/** 間違えた問題を開いてそこへ送る処理 */
type Reveal = () => void;

interface MistakeRevealValue {
  readonly reveal: Reveal | undefined;
  readonly register: (handler: Reveal) => () => void;
}

const MistakeRevealContext = createContext<MistakeRevealValue | undefined>(
  undefined,
);

/**
 * 結果画面の「結果」節から、問題別一覧の間違えた問題を開くための受け渡し口
 * 誤答表示の受け渡し（web の `mistake-reveal.ts`）
 *
 * 不正解の数（`ResultScoreBar`）と問題別一覧（`ProblemListAccordion`）は
 * 練習ごとの部品の奥にあり親子ではないので、一覧が「開く処理」をここへ登録し、
 * 不正解の数がそれを呼ぶ。web はモジュールに 1 つだけ持つが、ネイティブは
 * スタックに結果画面が重なりうるので画面ごとに持つ。
 *
 * 一覧が出ない回（結果が無い・間違えた問題が無い）は登録が無く、不正解の数は
 * 押せない文字のまま残る。押しても何も起きない操作を出さないため。
 */
export function MistakeRevealProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const [reveal, setReveal] = useState<Reveal>();
  const register = useCallback((handler: Reveal) => {
    setReveal(() => handler);
    return () =>
      setReveal((current) => (current === handler ? undefined : current));
  }, []);
  const value = useMemo(() => ({ reveal, register }), [reveal, register]);

  return (
    <MistakeRevealContext.Provider value={value}>
      {children}
    </MistakeRevealContext.Provider>
  );
}

/** 登録された「間違えた問題を開く」処理。無ければ `undefined` */
export function useMistakeReveal(): Reveal | undefined {
  return useContext(MistakeRevealContext)?.reveal;
}

/**
 * 「間違えた問題を開く」処理を登録する
 *
 * `handler` は描画ごとに作り直さない（`useCallback` で包む）こと。変わるたびに
 * 登録し直す。`undefined` なら登録しない。
 */
export function useRegisterMistakeReveal(handler: Reveal | undefined): void {
  const register = useContext(MistakeRevealContext)?.register;
  useEffect(() => {
    if (register === undefined || handler === undefined) return;
    return register(handler);
  }, [register, handler]);
}
