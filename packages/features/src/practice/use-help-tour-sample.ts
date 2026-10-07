import { useCallback, useState } from "react";

/**
 * ヘルプツアーの開閉と、スライドに使うサンプル問題
 * ヘルプツアーのサンプル問題
 *
 * サンプルは初回に開いたときに 1 度だけ生成して固定する（開き直すたびに
 * 問題が変わると、スライドの説明と見比べられない）。
 *
 * @param generate - サンプル問題を作る関数。作れなければ undefined（スライドは空のまま）
 */
export function useHelpTourSample<Q>(generate: () => Q | undefined): {
  readonly isOpen: boolean;
  readonly sample: Q | undefined;
  readonly open: () => void;
  readonly close: () => void;
} {
  const [isOpen, setIsOpen] = useState(false);
  const [sample, setSample] = useState<Q | undefined>(undefined);

  const open = useCallback(() => {
    setSample((prev) => prev ?? generate());
    setIsOpen(true);
  }, [generate]);

  const close = useCallback(() => setIsOpen(false), []);

  return { isOpen, sample, open, close };
}
