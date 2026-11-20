import { useTranslations } from "use-intl";
import { PREFERENCE_ANCHORS } from "@mahjong-scoring/features/settings/preference-anchors";
import {
  JANTOU_FU_SUMMARY_ROWS,
  MACHI_FU_SUMMARY_ROWS,
  MENTSU_FU_SUMMARY_ROWS,
} from "@mahjong-scoring/features/lessons/fu-summary-rows";
import {
  JANTOU_FU_EXAMPLES,
  MACHI_FU_EXAMPLES,
  MENTSU_FU_EXAMPLES,
  type JantouFuExample,
} from "@mahjong-scoring/features/lessons/fu-guide-examples";

import {
  ChapterColumn,
  PreferenceSettingsNote,
} from "../components/chapter-column";
import {
  ExampleTable,
  FuSummaryTable,
  useExampleTableColumns,
} from "../components/example-table";
import { GuideBody, GuideSection } from "../components/guide-section";
import { GuideNote, GuideParagraph } from "../components/guide-text";
import {
  CELL_TILE_SIZE,
  MachiTiles,
  MentsuSet,
  TileSet,
} from "../components/tile-row";

/** 雀頭の符計算 — 符セクション第 1 章（web の `JantouFuGuide`） */
export function JantouFuGuide() {
  const namespace = "jantouFu.learn";
  const t = useTranslations(namespace);
  const columns = useExampleTableColumns(namespace);
  const pair = ({ tiles }: JantouFuExample) => (
    <TileSet tiles={tiles} size={CELL_TILE_SIZE} />
  );

  return (
    <GuideBody>
      <GuideSection title={t("whatIsJantou")}>
        <GuideParagraph>{t("whatIsJantouBody")}</GuideParagraph>
      </GuideSection>

      <GuideSection title={t("yakuhaiTitle")}>
        <GuideParagraph>{t("yakuhaiBody")}</GuideParagraph>
        <ExampleTable
          title={t("sangenExamples")}
          columns={columns}
          rows={[
            {
              tiles: pair(JANTOU_FU_EXAMPLES.haku),
              label: t("labelHaku"),
              fu: JANTOU_FU_EXAMPLES.haku.fu,
            },
            {
              tiles: pair(JANTOU_FU_EXAMPLES.hatsu),
              label: t("labelHatsu"),
              fu: JANTOU_FU_EXAMPLES.hatsu.fu,
            },
            {
              tiles: pair(JANTOU_FU_EXAMPLES.chun),
              label: t("labelChun"),
              fu: JANTOU_FU_EXAMPLES.chun.fu,
            },
          ]}
        />
        <ExampleTable
          title={t("kazeExamples")}
          columns={columns}
          rows={[
            {
              tiles: pair(JANTOU_FU_EXAMPLES.bakaze),
              label: t("labelBakaze"),
              fu: JANTOU_FU_EXAMPLES.bakaze.fu,
            },
            {
              tiles: pair(JANTOU_FU_EXAMPLES.jikaze),
              label: t("labelJikaze"),
              fu: JANTOU_FU_EXAMPLES.jikaze.fu,
            },
          ]}
        />
      </GuideSection>

      <GuideSection title={t("noFuTitle")}>
        <GuideParagraph>{t("noFuBody")}</GuideParagraph>
        <ExampleTable
          title={t("noFuExamples")}
          columns={columns}
          rows={[
            {
              tiles: pair(JANTOU_FU_EXAMPLES.suuhaiManzu),
              label: t("labelSuuhaiManzu"),
              fu: JANTOU_FU_EXAMPLES.suuhaiManzu.fu,
            },
            {
              tiles: pair(JANTOU_FU_EXAMPLES.suuhaiPinzu),
              label: t("labelSuuhaiPinzu"),
              fu: JANTOU_FU_EXAMPLES.suuhaiPinzu.fu,
            },
            {
              tiles: pair(JANTOU_FU_EXAMPLES.otakaze),
              label: t("labelOtakaze"),
              fu: JANTOU_FU_EXAMPLES.otakaze.fu,
            },
          ]}
        />
      </GuideSection>

      {/* コラム: 連風牌 */}
      <ChapterColumn namespace={namespace}>
        <PreferenceSettingsNote
          namespace={namespace}
          anchor={PREFERENCE_ANCHORS.renfonpai}
        />
      </ChapterColumn>

      <FuSummaryTable
        title={t("summaryTitle")}
        colType={t("colType")}
        colFu={t("colFu")}
        formatFu={columns.formatFu}
        rows={JANTOU_FU_SUMMARY_ROWS.map((row) => ({
          label: t(row.key),
          fu: row.fu,
        }))}
      />
    </GuideBody>
  );
}

/** 面子の符計算 — 符セクション第 2 章（web の `MentsuFuGuide`） */
export function MentsuFuGuide() {
  const namespace = "mentsuFu.learn";
  const t = useTranslations(namespace);
  const columns = useExampleTableColumns(namespace);

  return (
    <GuideBody>
      <GuideSection title={t("whatIsMentsuFu")}>
        <GuideParagraph>{t("whatIsMentsuFuBody")}</GuideParagraph>
      </GuideSection>

      <GuideSection title={t("shuntsuTitle")}>
        <GuideParagraph>{t("shuntsuBody")}</GuideParagraph>
        <ExampleTable
          title={t("shuntsuExamples")}
          columns={columns}
          rows={[
            {
              tiles: (
                <MentsuSet
                  mentsu={MENTSU_FU_EXAMPLES.shuntsu.mentsu}
                  size={CELL_TILE_SIZE}
                />
              ),
              label: t("shuntsuLabel"),
              fu: MENTSU_FU_EXAMPLES.shuntsu.fu,
            },
          ]}
        />
      </GuideSection>

      <GuideSection title={t("koutsuTitle")}>
        <GuideParagraph>{t("koutsuBody")}</GuideParagraph>
        <ExampleTable
          title={t("koutsuExamples")}
          columns={columns}
          rows={[
            {
              tiles: (
                <MentsuSet
                  mentsu={MENTSU_FU_EXAMPLES.koutsuOpenSimple.mentsu}
                  size={CELL_TILE_SIZE}
                />
              ),
              label: t("koutsuOpenSimpleLabel"),
              fu: MENTSU_FU_EXAMPLES.koutsuOpenSimple.fu,
            },
            {
              tiles: (
                <MentsuSet
                  mentsu={MENTSU_FU_EXAMPLES.koutsuClosedSimple.mentsu}
                  size={CELL_TILE_SIZE}
                />
              ),
              label: t("koutsuClosedSimpleLabel"),
              fu: MENTSU_FU_EXAMPLES.koutsuClosedSimple.fu,
            },
            {
              tiles: (
                <MentsuSet
                  mentsu={MENTSU_FU_EXAMPLES.koutsuOpenYaochu.mentsu}
                  size={CELL_TILE_SIZE}
                />
              ),
              label: t("koutsuOpenYaochuLabel"),
              fu: MENTSU_FU_EXAMPLES.koutsuOpenYaochu.fu,
            },
            {
              tiles: (
                <MentsuSet
                  mentsu={MENTSU_FU_EXAMPLES.koutsuClosedYaochu.mentsu}
                  size={CELL_TILE_SIZE}
                />
              ),
              label: t("koutsuClosedYaochuLabel"),
              fu: MENTSU_FU_EXAMPLES.koutsuClosedYaochu.fu,
            },
          ]}
        />
      </GuideSection>

      <GuideSection title={t("kantsuTitle")}>
        <GuideParagraph>{t("kantsuBody")}</GuideParagraph>
        <ExampleTable
          title={t("kantsuExamples")}
          columns={columns}
          rows={[
            {
              tiles: (
                <MentsuSet
                  mentsu={MENTSU_FU_EXAMPLES.kantsuOpenSimple.mentsu}
                  size={CELL_TILE_SIZE}
                />
              ),
              label: t("kantsuOpenSimpleLabel"),
              fu: MENTSU_FU_EXAMPLES.kantsuOpenSimple.fu,
            },
            {
              tiles: (
                <MentsuSet
                  mentsu={MENTSU_FU_EXAMPLES.kantsuClosedSimple.mentsu}
                  size={CELL_TILE_SIZE}
                />
              ),
              label: t("kantsuClosedSimpleLabel"),
              fu: MENTSU_FU_EXAMPLES.kantsuClosedSimple.fu,
            },
            {
              tiles: (
                <MentsuSet
                  mentsu={MENTSU_FU_EXAMPLES.kantsuOpenYaochu.mentsu}
                  size={CELL_TILE_SIZE}
                />
              ),
              label: t("kantsuOpenYaochuLabel"),
              fu: MENTSU_FU_EXAMPLES.kantsuOpenYaochu.fu,
            },
            {
              tiles: (
                <MentsuSet
                  mentsu={MENTSU_FU_EXAMPLES.kantsuClosedYaochu.mentsu}
                  size={CELL_TILE_SIZE}
                />
              ),
              label: t("kantsuClosedYaochuLabel"),
              fu: MENTSU_FU_EXAMPLES.kantsuClosedYaochu.fu,
            },
          ]}
        />
      </GuideSection>

      <FuSummaryTable
        title={t("summaryTitle")}
        colType={t("colType")}
        colFu={t("colFu")}
        formatFu={columns.formatFu}
        rows={MENTSU_FU_SUMMARY_ROWS.map((row) => ({
          label: t(row.key),
          fu: row.fu,
        }))}
      />
    </GuideBody>
  );
}

/** 待ちの符計算 — 符セクション第 3 章（web の `MachiFuGuide`） */
export function MachiFuGuide() {
  const namespace = "machiFu.learn";
  const t = useTranslations(namespace);
  // 待ちは手の内と和了牌を並べるため、牌の列だけ見出しを差し替える
  const columns = useExampleTableColumns(namespace, "colMachi");

  return (
    <GuideBody>
      <GuideSection title={t("whatIsMachi")}>
        <GuideParagraph>{t("whatIsMachiBody")}</GuideParagraph>
      </GuideSection>

      <GuideSection title={t("twoFuTitle")}>
        <GuideParagraph>{t("twoFuBody")}</GuideParagraph>
        <ExampleTable
          title={t("twoFuExamples")}
          columns={columns}
          rows={[
            {
              tiles: (
                <MachiTiles
                  tiles={MACHI_FU_EXAMPLES.kanchan.tiles}
                  agariHai={MACHI_FU_EXAMPLES.kanchan.agariHai}
                  size={CELL_TILE_SIZE}
                />
              ),
              label: t("kanchanLabel"),
              fu: MACHI_FU_EXAMPLES.kanchan.fu,
            },
            {
              tiles: (
                <MachiTiles
                  tiles={MACHI_FU_EXAMPLES.penchan.tiles}
                  agariHai={MACHI_FU_EXAMPLES.penchan.agariHai}
                  size={CELL_TILE_SIZE}
                />
              ),
              label: t("penchanLabel"),
              fu: MACHI_FU_EXAMPLES.penchan.fu,
            },
            {
              tiles: (
                <MachiTiles
                  tiles={MACHI_FU_EXAMPLES.tanki.tiles}
                  agariHai={MACHI_FU_EXAMPLES.tanki.agariHai}
                  size={CELL_TILE_SIZE}
                />
              ),
              label: t("tankiLabel"),
              fu: MACHI_FU_EXAMPLES.tanki.fu,
            },
          ]}
        />
      </GuideSection>

      <GuideSection title={t("zeroFuTitle")}>
        <GuideParagraph>{t("zeroFuBody")}</GuideParagraph>
        <ExampleTable
          title={t("zeroFuExamples")}
          columns={columns}
          rows={[
            {
              tiles: (
                <MachiTiles
                  tiles={MACHI_FU_EXAMPLES.ryanmen.tiles}
                  agariHai={MACHI_FU_EXAMPLES.ryanmen.agariHai}
                  size={CELL_TILE_SIZE}
                />
              ),
              label: t("ryanmenLabel"),
              fu: MACHI_FU_EXAMPLES.ryanmen.fu,
            },
            {
              tiles: (
                <MachiTiles
                  tiles={MACHI_FU_EXAMPLES.shanpon.tiles}
                  agariHai={MACHI_FU_EXAMPLES.shanpon.agariHai}
                  size={CELL_TILE_SIZE}
                />
              ),
              label: t("shanponLabel"),
              fu: MACHI_FU_EXAMPLES.shanpon.fu,
            },
          ]}
        />
        <GuideNote>{t("nobetanNote")}</GuideNote>
      </GuideSection>

      <FuSummaryTable
        title={t("summaryTitle")}
        colType={t("colType")}
        colFu={t("colFu")}
        formatFu={columns.formatFu}
        rows={MACHI_FU_SUMMARY_ROWS.map((row) => ({
          label: t(row.key),
          fu: row.fu,
        }))}
      />
    </GuideBody>
  );
}
