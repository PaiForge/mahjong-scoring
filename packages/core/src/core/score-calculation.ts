/**
 * 子の点数を計算する
 * 子点数計算
 */
export function calculateKoScore(
  han: number,
  fu: number,
): { readonly isMangan: boolean; readonly ron: number; readonly tsumo: string } {
  const base = fu * Math.pow(2, 2 + han);
  if (base >= 2000) {
    return { isMangan: true, ron: 8000, tsumo: "2000/4000" };
  }
  const ron = Math.ceil((base * 4) / 100) * 100;
  const tsumoKo = Math.ceil((base * 1) / 100) * 100;
  const tsumoOya = Math.ceil((base * 2) / 100) * 100;
  return { isMangan: false, ron, tsumo: `${tsumoKo}/${tsumoOya}` };
}

/**
 * 親の点数を計算する
 * 親点数計算
 */
export function calculateOyaScore(
  han: number,
  fu: number,
): { readonly isMangan: boolean; readonly ron: number; readonly tsumo: string } {
  const base = fu * Math.pow(2, 2 + han);
  if (base >= 2000) {
    return { isMangan: true, ron: 12000, tsumo: "4000\u2200" };
  }
  const ron = Math.ceil((base * 6) / 100) * 100;
  const tsumo = Math.ceil((base * 2) / 100) * 100;
  return { isMangan: false, ron, tsumo: `${tsumo}\u2200` };
}

type WinType = "ron" | "tsumo";

/**
 * 無効なセル（存在しない符×翻の組み合わせ）かどうかを判定する
 * 無効セル判定
 */
export function isInvalidCell(han: number, fu: number, winType: WinType): boolean {
  return (
    (han === 1 && fu === 20) ||
    (winType === "ron" && fu === 20) ||
    (han === 1 && fu === 25) ||
    (winType === "tsumo" && han === 2 && fu === 25)
  );
}

/**
 * 満貫以上の点数データ
 * 高打点データ
 */
export const HIGH_SCORES = [
  { nameKey: "mangan", han: "5", ronKo: 8000, tsumoKo: "2000/4000", ronOya: 12000, tsumoOya: "4000" },
  { nameKey: "haneman", han: "6-7", ronKo: 12000, tsumoKo: "3000/6000", ronOya: 18000, tsumoOya: "6000" },
  { nameKey: "baiman", han: "8-10", ronKo: 16000, tsumoKo: "4000/8000", ronOya: 24000, tsumoOya: "8000" },
  { nameKey: "sanbaiman", han: "11-12", ronKo: 24000, tsumoKo: "6000/12000", ronOya: 36000, tsumoOya: "12000" },
  { nameKey: "yakuman", han: "13~", ronKo: 32000, tsumoKo: "8000/16000", ronOya: 48000, tsumoOya: "16000" },
] as const;
