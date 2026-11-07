import { describe, expect, it } from "vitest";

import { messages as en } from "./en";
import { messages as ja } from "./ja";

/**
 * レジストリから組み立てて引く辞書キーが、英語の完訳の名前空間に揃っているか
 *
 * 画面はこれらのキーを文字列を組んで引く（`t(`${key}.title`)` 等）ので、型では
 * 存在を検査できない。messages パッケージはレジストリ（features・core）に依存しない
 * （依存の向きは features → messages）ため、ここではキーの一覧を写して持ち、
 * 写し元を各行のコメントに書く。レジストリにキーを足したら、ここにも足す。
 *
 * 完訳の名前空間は日本語と同じキーを持つこと自体を `en.test.ts` が検査するので、
 * 日本語にあるキーは英語にもある。ここでは、写した一覧が日本語にも英語にも
 * 実在すること（写し間違い・レジストリとのずれ）を確かめる。
 *
 * 未着手の名前空間に属するレジストリ由来のキー（`practice.practices.<messageKey>`・
 * `<namespace>.variants.<key>`）は対象外。それらの名前空間を完訳にするときに、ここへ足す。
 */
const REGISTRY_KEYS: readonly (readonly [string, readonly string[]])[] = [
  // features `reference/related-references.ts` の ReferenceKey →
  // `reference.scoreTable.title` 等（`related-references-section.tsx` が引く）
  [
    "reference",
    ["scoreTable", "yaku", "glossary"].flatMap((key) => [
      `${key}.title`,
      `${key}.description`,
    ]),
  ],
  // core `HIGH_SCORES` の nameKey（`score/tiers.ts` の表示する区分）→
  // `scoreTable.mangan` 等（`high-score-table.tsx` の `t(item.nameKey)`）
  ["scoreTable", ["mangan", "haneman", "baiman", "sanbaiman", "yakuman"]],
  // web `(user)/_components/_lib/nav-items.tsx` の labelKey → `nav.home` 等
  [
    "nav",
    [
      "home",
      "dojo",
      "practice",
      "learn",
      "scoreTable",
      "reference",
      "leaderboard",
      "settings",
    ],
  ],
  // features `notifications/message.ts` の key → `notifications.messages.planExpired` 等
  [
    "notifications",
    [
      "purchaseCompletedPass",
      "purchaseCompletedLifetime",
      "purchaseCompleted",
      "benefitGrantedUntil",
      "benefitGranted",
      "planExpired",
      "purchaseRefunded",
      "purchaseRevoked",
      "benefitGrantRevoked",
      "unknown",
    ].map((key) => `messages.${key}`),
  ],
  // features `curriculum/registry.ts` の章の i18nKey（`learnCurriculum.chapters.<camel(slug)>`）
  // → `.title` / `.description`（目次・章の見出し・前後のリンクが引く）
  [
    "learnCurriculum",
    [
      "aboutThisApp",
      "whyScoringIsHardToLearn",
      "whyScoringIsComplex",
      "manganKoRon",
      "manganKoTsumo",
      "manganOyaRon",
      "manganOyaTsumo",
      "yaku",
      "jantouFu",
      "mentsuFu",
      "machiFu",
      "tehaiFu",
      "chiitoitsuScore",
      "pinfuScore",
      "menzenMentsuScore",
      "furoScore",
      "fuDoubling",
      "ronToTsumo",
      "tsumoPayments",
      "oyaRonScores",
    ].flatMap((chapter) => [
      `chapters.${chapter}.title`,
      `chapters.${chapter}.description`,
    ]),
  ],
  // features `curriculum/registry.ts` の CURRICULUM_SECTIONS → `learnCurriculum.sections.<section>`
  [
    "learnCurriculum",
    ["introduction", "mangan", "yaku", "fu", "score", "memorization"].map(
      (section) => `sections.${section}`,
    ),
  ],
  // features `glossary/types.ts` の GLOSSARY_CATEGORIES → `glossary.categories.<category>`
  [
    "glossary",
    ["hai", "tehai", "naki", "agari", "fu", "score"].map(
      (category) => `categories.${category}`,
    ),
  ],
  // features `glossary/terms/*.ts` の slug（registry.ts の連結順: 牌・手牌・鳴き・
  // アガリ・符・点数）→ `glossary.terms.<slug>.*`（用語のページ・一覧・モーダルが引く）
  [
    "glossary",
    [
      "shuupai",
      "manzu",
      "pinzu",
      "souzu",
      "jihai",
      "kazehai",
      "otakaze",
      "sangenpai",
      "yakuhai",
      "yaochuuhai",
      "rotouhai",
      "chunchanpai",
      "dora",
      "uradora",
      "kandora",
      "tehai",
      "mentsu",
      "shuntsu",
      "koutsu",
      "kantsu",
      "toitsu",
      "jantou",
      "mentsute",
      "chiitoitsu",
      "menzen",
      "furo",
      "pon",
      "chii",
      "kan",
      "ankou",
      "minkou",
      "ankan",
      "minkan",
      "kuisagari",
      "hora",
      "ron",
      "tsumo",
      "tenpai",
      "machi",
      "ryanmen",
      "kanchan",
      "penchan",
      "shanpon",
      "tanki",
      "yaku",
      "riichi",
      "fu",
      "futei",
      "menzen-ron-kafu",
      "tsumo-fu",
      "fu-kiriage",
      "pinfu",
      "han",
      "oya",
      "ko",
      "mangan",
      "haneman",
      "baiman",
      "sanbaiman",
      "kazoe-yakuman",
      "yakuman",
      "kiriage-mangan",
      "honba",
      "bazoro",
    ].flatMap((slug) =>
      ["term", "reading", "definition", "usage", "caseStudy", "pitfall"].map(
        (field) => `terms.${slug}.${field}`,
      ),
    ),
  ],
  // features `glossary/terms/*.ts` の例の captionKey → `glossary.captions.<key>`
  [
    "glossary",
    [
      "threeSuits",
      "jihaiAll",
      "kazehaiOrder",
      "sangenpaiOrder",
      "yaochuuMix",
      "rotouhaiAll",
      "chunchanRange",
      "shuntsu",
      "koutsu",
      "kantsu",
      "shuntsuManzu",
      "koutsuPinzu",
      "minkanExample",
      "ankanExample",
      "jantouZero",
      "jantouTwo",
      "mentsuteShape",
      "chiitoitsuShape",
      "ponExample",
      "chiiExample",
      "ankouYaochu",
      "minkouChunchan",
      "ankanYaochu",
      "minkanYaochu",
      "ryanmenWait",
      "kanchanWait",
      "penchanWait",
      "shanponWait",
      "tankiWait",
    ].map((key) => `captions.${key}`),
  ],
  // features `yaku/yaku-labels.ts` の YAKU_TO_KEY の値 → `yakuNames.<key>`
  // （役一覧・役の章の鳴きの比較表が役名を引く）
  [
    "yakuNames",
    [
      "riichi",
      "ippatsu",
      "menzen_tsumo",
      "tanyao",
      "pinfu",
      "iipeiko",
      "yakuhai",
      "ton",
      "nan",
      "sha",
      "pei",
      "haku",
      "hatsu",
      "chun",
      "jikaze",
      "bakaze",
      "sanshoku_doujun",
      "itsu",
      "chanta",
      "chiitoitsu",
      "toitoi",
      "sanankou",
      "sanshoku_doukou",
      "sankantsu",
      "shosangen",
      "honroto",
      "double_riichi",
      "honitsu",
      "junchan",
      "ryanpeiko",
      "chinitsu",
      "kokushi",
      "suanko",
      "daisangen",
      "tsuiso",
      "shousushi",
      "daisushi",
      "chinroto",
      "ryuiso",
      "chuuren",
      "sukantsu",
      "tenhou",
      "chihou",
    ],
  ],
  // features `ranks/registry.ts` の RANK_SLUGS → `ranks.names.<slug>`（目次の段級位の絞り込み等）
  [
    "ranks",
    ["kyu-5", "kyu-4", "kyu-3", "kyu-2", "kyu-1", "dan-1"].map(
      (slug) => `names.${slug}`,
    ),
  ],
];

/** `a.b.c` のパスで辞書の値を引く */
function lookup(dictionary: object, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (node, segment) =>
        typeof node === "object" && node !== null
          ? Object.entries(node).find(([key]) => key === segment)?.[1]
          : undefined,
      dictionary,
    );
}

describe("レジストリ由来の辞書キー（英語の完訳の名前空間）", () => {
  it.each(REGISTRY_KEYS)("%s", (namespace, keys) => {
    for (const key of keys) {
      const path = `${namespace}.${key}`;
      expect(typeof lookup(ja, path), `ja: ${path}`).toBe("string");
      expect(typeof lookup(en, path), `en: ${path}`).toBe("string");
    }
  });
});
