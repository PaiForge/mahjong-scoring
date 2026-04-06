"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { YAKU_OPTIONS } from "@mahjong-scoring/core";
import { MultiSelect } from "./multi-select";

const YAKU_TO_KEY: Readonly<Record<string, string>> = {
  "立直": "riichi",
  "一発": "ippatsu",
  "門前清自摸和": "menzen_tsumo",
  "断幺九": "tanyao",
  "断変九": "tanyao",
  "平和": "pinfu",
  "一盃口": "iipeiko",
  "役牌": "yakuhai",
  "役牌 東": "bakaze_ton",
  "役牌 南": "jikaze_nan",
  "役牌 西": "jikaze_sha",
  "役牌 北": "jikaze_pei",
  "役牌 白": "haku",
  "役牌 發": "hatsu",
  "役牌 中": "chun",
  "三色同順": "sanshoku_doujun",
  "一気通貫": "itsu",
  "混全帯么九": "chanta",
  "七対子": "chitoisu",
  "対々和": "toitoi",
  "三暗刻": "sanankou",
  "三色同刻": "sanshoku_doukou",
  "三槓子": "sankantsu",
  "小三元": "shosangen",
  "混老頭": "honroto",
  "ダブル立直": "double_riichi",
  "混一色": "honitsu",
  "純全帯么九": "junchan",
  "二盃口": "ryanpeiko",
  "清一色": "chinitsu",
  "国士無双": "kokushi",
  "四暗刻": "suanko",
  "大三元": "daisangen",
  "字一色": "tsuiso",
  "小四喜": "shousushi",
  "大四喜": "daisushi",
  "清老頭": "chinroto",
  "緑一色": "ryuiso",
  "九蓮宝燈": "chuuren",
  "四槓子": "sukantsu",
  "天和": "tenhou",
  "地和": "chihou",
};

interface YakuSelectProps {
  readonly value: readonly string[];
  readonly onChange: (value: string[]) => void;
  readonly disabled?: boolean;
}

/**
 * 役選択コンポーネント
 * 役選択
 */
export function YakuSelect({ value, onChange, disabled }: YakuSelectProps) {
  const t = useTranslations("score");
  const tYaku = useTranslations("score.yaku");

  const multiSelectLabels = useMemo(() => ({
    add: t("form.multiSelect.add"),
    title: t("form.multiSelect.title"),
    done: t("form.multiSelect.done"),
  }), [t]);

  const options = useMemo(() => YAKU_OPTIONS.map((yaku) => {
    const key = YAKU_TO_KEY[yaku];
    const label = key ? tYaku(key) : yaku;
    return {
      value: yaku,
      label,
    };
  }), [tYaku]);

  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-surface-700">
        {t("form.labels.yaku")}
      </label>
      <MultiSelect
        options={options}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={t("form.placeholders.select")}
        labels={multiSelectLabels}
      />
    </div>
  );
}
